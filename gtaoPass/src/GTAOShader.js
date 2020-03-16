import { Vector2, Vector4 } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { sampleFunctions } from '../../custom-mipmap-generation/src/mipSampleFunctions.js';

export const GTAOShader = {

	uniforms: {

		normalBuffer: { value: null },
		depthPyramid: { value: null },
		depthPyramidSize: { value: new Vector2() },

		clipInfo: { value: new Vector4 },
		projInfo: { value: new Vector4() },
		params: { value: new Vector2() },

	},

	vertexShader:
		/* glsl */`
		varying vec2 vUv;
		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
	`,

	fragmentShader:
		/* glsl */`
		#define PREFETCH_CACHE_SIZE 8
		#define NUM_MIP_LEVELS 5
		#define NUM_STEPS		8
		#define RADIUS			2.0		// in world space

		// #define PI				3.1415926535897932
		#define TWO_PI			6.2831853071795864
		#define HALF_PI			1.5707963267948966
		#define ONE_OVER_PI		0.3183098861837906

		#include <common>
		#include <packing>
		varying vec2 vUv;

		uniform sampler2D normalBuffer;
		uniform sampler2D depthPyramid;
		uniform vec2 depthPyramidSize;

		uniform vec4 clipInfo;
		uniform vec4 projInfo;
		uniform vec2 params;

		${ sampleFunctions }

		float round( float f ) {

			return f < 0.5 ? floor( f ) : ceil( f );

		}

		vec2 round( vec2 v ) {

			v.x = round( v.x );
			v.y = round( v.y );
			return v;

		}

		vec4 GetViewPosition( vec2 uv, float currStep ) {

			int miplevel = int(
				clamp(
					floor(
						log2(
							currStep / float( PREFETCH_CACHE_SIZE )
						)
					),
					0.0,
					float( NUM_MIP_LEVELS - 1 )
				)
			);

			vec2 mipcoord = uv / depthPyramidSize;

			// d is expected to be [ 0.0, 1.0 ]
			float d = packedTexture2DLOD( depthPyramid, mipcoord, miplevel, depthPyramidSize ).r;
			d = ( abs( d ) - clipInfo.x ) / ( clipInfo.y - clipInfo.x );

			vec4 ret = vec4( 0.0 );
			ret.w = d;
			ret.z = clipInfo.x + d * ( clipInfo.y - clipInfo.x );
			ret.xy = ( uv * projInfo.xy + projInfo.zw ) * ret.z;

			return ret;

		}

		float Falloff( float dist2, float cosh ) {
			#define FALLOFF_START2	0.16
			#define FALLOFF_END2	4.0

			return 2.0 * clamp(
				( dist2 - FALLOFF_START2 ) / ( FALLOFF_END2 - FALLOFF_START2 ),
				0.0,
				1.0
			);

		}

		void main() {

			vec2 uv = vUv;

			vec2 screenCoord = gl_FragCoord.xy;// depthPyramidSize * uv;
			vec2 loc = screenCoord;// depthPyramidSize * uv;
			vec4 vpos = GetViewPosition( loc, 1.0 );

			if ( vpos.w == 1.0 ) {

				gl_FragColor = vec4( 1.0 );
				return;

			}

			vec4 s;
			vec3 vnorm	= texture2D( normalBuffer, vUv ).rgb;
			vec3 vdir	= normalize( - vpos.xyz );
			vec3 dir, ws;

			// calculation uses left handed system
			vnorm.z = - vnorm.z;

			// TODO: use a noise function o texture here. Halton? Poisson?
			vec2 noises	= vec2( 0.0 ); // texelFetch( noise, mod( loc, 4.0 ), 0.0 ).rg;
			vec2 offset;
			vec2 horizons = vec2( - 1.0, - 1.0 );

			float radius = ( RADIUS * clipInfo.z ) / vpos.z;
			radius = max( float( NUM_STEPS ), radius );

			float stepsize	= radius / float( NUM_STEPS );
			float phi		= ( params.x + noises.x ) * PI;
			float ao		= 0.0;
			float division	= noises.y * stepsize;
			float currstep	= 1.0 + division + 0.25 * stepsize * params.y;
			float dist2, invdist, falloff, cosh;

			dir = vec3( cos( phi ), sin( phi ), 0.0 );
			horizons = vec2( - 1.0 );

			// calculate horizon angles
			for ( int j = 0; j < NUM_STEPS; ++ j ) {

				offset = round( dir.xy * currstep );

				// h1
				s = GetViewPosition( screenCoord + offset, currstep );
				ws = s.xyz - vpos.xyz;

				dist2 = dot( ws, ws );
				invdist = inversesqrt( dist2 );
				cosh = invdist * dot( ws, vdir );

				falloff = Falloff( dist2, cosh );
				horizons.x = max( horizons.x, cosh - falloff );

				// h2
				s = GetViewPosition( screenCoord - offset, currstep );
				ws = s.xyz - vpos.xyz;

				dist2 = dot( ws, ws );
				invdist = inversesqrt( dist2 );
				cosh = invdist * dot( ws, vdir );

				falloff = Falloff( dist2, cosh );
				horizons.y = max( horizons.y, cosh - falloff );

				// increment
				currstep += stepsize;

			}

			horizons = acos( horizons );

			// calculate gamma
			vec3 bitangent	= normalize( cross( dir, vdir ) );
			vec3 tangent	= cross( vdir, bitangent );
			vec3 nx			= vnorm - bitangent * dot( vnorm, bitangent );

			float nnx		= length( nx );
			float invnnx	= 1.0 / ( nnx + 1e-6 );			// to avoid division with zero
			float cosxi		= dot( nx, tangent ) * invnnx;	// xi = gamma + HALF_PI
			float gamma		= acos( cosxi ) - HALF_PI;
			float cosgamma	= dot( nx, vdir ) * invnnx;
			float singamma2	= -2.0 * cosxi;					// cos(x + HALF_PI) = -sin(x)

			// clamp to normal hemisphere
			horizons.x = gamma + max( - horizons.x - gamma, - HALF_PI );
			horizons.y = gamma + min( horizons.y - gamma, HALF_PI );

			// Riemann integral is additive
			ao += nnx * 0.25 * (
				( horizons.x * singamma2 + cosgamma - cos( 2.0 * horizons.x - gamma ) ) +
				( horizons.y * singamma2 + cosgamma - cos( 2.0 * horizons.y - gamma ) ) );

			gl_FragColor = vec4( ao );

		}
	`

}
