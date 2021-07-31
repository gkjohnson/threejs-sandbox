import { Vector2, Vector4 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

// https://github.com/asylum2010/Asylum_Tutorials/blob/master/ShaderTutors/54_GTAO/
export const GTAOShader = {

	defines: {

		NUM_DIRECTIONS: 32,
		NUM_STEPS: 16,
		RADIUS: '2.0', // in world space

		ENABLE_FALLOFF: 1,
		FALLOFF_START2: '0.16',
		FALLOFF_END2: '4.0',

		ENABLE_ROTATION_JITTER: 1,
		ENABLE_RADIUS_JITTER: 1,
		ENABLE_COLOR_BOUNCE: 1,

		JITTER_TYPE: 0,

	},

	uniforms: {

		colorBuffer: { value: null },
		normalBuffer: { value: null },
		depthBuffer: { value: null },
		renderSize: { value: new Vector2() },

		blueNoiseTex: { value: null },
		blueNoiseSize: { value: 1 },

		clipInfo: { value: new Vector4() },
		projInfo: { value: new Vector4() },
		params: { value: new Vector2() },

		lightBounceIntensity: { value: 1.0 },

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
		#define TWO_PI			6.2831853071795864
		#define HALF_PI			1.5707963267948966
		#define ONE_OVER_PI		0.3183098861837906

		#include <common>
		#include <packing>
		varying vec2 vUv;

		uniform sampler2D noiseTexture;
		uniform sampler2D normalBuffer;
		uniform sampler2D depthBuffer;
		uniform sampler2D colorBuffer;
		uniform vec2 renderSize;

		uniform vec4 projInfo;
		uniform vec4 clipInfo;
		uniform vec4 params;
		uniform float lightBounceIntensity;

		#if ENABLE_ROTATION_JITTER == 2 || ENABLE_RADIUS_JITTER == 2
		uniform float blueNoiseSize;
		uniform sampler2D blueNoiseTex;
		#endif

		float round( float f ) {

			return f < 0.5 ? floor( f ) : ceil( f );

		}

		vec2 round( vec2 v ) {

			v.x = round( v.x );
			v.y = round( v.y );
			return v;

		}

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		vec4 GetViewPosition( vec2 uv ) {

			float near = clipInfo.x;
			float far = clipInfo.y;

			vec2 basesize = renderSize;
			vec2 coord = ( uv / basesize );

			// d is expected to be [ 0.0, 1.0 ]
			float d = texture2D( depthBuffer, coord ).r;
			d = d == 0.0 ? far : d;
			d = ( abs( d ) - near ) / ( far - near );

			vec4 ret = vec4( 0.0 );
			ret.w = d;
			ret.z = near + d * ( far - near );
			ret.xy = ( uv * projInfo.xy + projInfo.zw ) * ret.z;

			return ret;

		}

		float Falloff( float dist2 ) {

			return 2.0 * clamp(
				( dist2 - FALLOFF_START2 ) / ( FALLOFF_END2 - FALLOFF_START2 ),
				0.0,
				1.0
			);

		}

		void main() {

			vec2 screenCoord = gl_FragCoord.xy;
			vec4 vpos = GetViewPosition( renderSize * vUv );

			// if it's the background
			if ( vpos.w == 1.0 ) {

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0);
				return;

			}

			vec4 s;
			vec3 vnorm	= UnpackNormal( texture2D( normalBuffer, vUv ) );
			vec3 vdir	= normalize( - vpos.xyz );
			vec3 dir, ws;

			// calculation uses left handed system
			vnorm.z = - vnorm.z;

			vec2 noises	= vec2( 0.0 );
			vec2 offset;
			vec2 horizons = vec2( - 1.0, - 1.0 );

			// scale the search radius by the depth and camera FOV
			float radius = ( RADIUS * clipInfo.z ) / vpos.z;
			radius = max( float( NUM_STEPS ), radius );

			float stepSize	= radius / float( NUM_STEPS );
			float phi		= 0.0;
			float ao		= 0.0;
			float division	= noises.y * stepSize;
			float currStep	= 1.0 + division + 0.25 * stepSize * params.y;
			float dist2, invdist, falloff, cosh;

			#if ENABLE_COLOR_BOUNCE
			vec3 color = vec3( 0.0 );
			#endif

			#if ENABLE_ROTATION_JITTER == 1

			// Rotation jitter approach from
			// https://github.com/MaxwellGengYF/Unity-Ground-Truth-Ambient-Occlusion/blob/9cc30e0f31eb950a994c71866d79b2798d1c508e/Shaders/GTAO_Common.cginc#L152-L155
			float rotJitterOffset = PI * fract( 52.9829189 * fract( dot( screenCoord, vec2( 0.06711056, 0.00583715 ) ) ) );

			#elif ENABLE_ROTATION_JITTER == 2

			float rotJitterOffset = PI * texture2D( blueNoiseTex, gl_FragCoord.xy / blueNoiseSize ).r;

			#endif

			#if ENABLE_RADIUS_JITTER == 1

			float jitterMod = ( gl_FragCoord.x + gl_FragCoord.y ) * 0.25;
			float radiusJitterOffset = mod( jitterMod, 1.0 ) * stepSize * 0.25;

			#elif ENABLE_RADIUS_JITTER == 2

			float radiusJitterOffset = PI * texture2D( blueNoiseTex, gl_FragCoord.xy / blueNoiseSize ).g;

			#endif

			#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIRECTIONS; i ++ ) {

				phi = float( i ) * ( PI / float( NUM_DIRECTIONS ) ) + params.x * PI;

				#if ENABLE_ROTATION_JITTER != 0

				phi += rotJitterOffset;

				#endif

				currStep = 1.0 + 0.25 * stepSize * params.y;


				#if ENABLE_RADIUS_JITTER != 0

				currStep += radiusJitterOffset;

				#endif

				dir = vec3( cos( phi ), sin( phi ), 0.0 );
				horizons = vec2( - 1.0 );

				// calculate horizon angles
				for ( int j = 0; j < NUM_STEPS; ++ j ) {

					offset = round( dir.xy * currStep );

					// h1
					s = GetViewPosition( screenCoord + offset );
					ws = s.xyz - vpos.xyz;

					dist2 = dot( ws, ws );
					invdist = inversesqrt( dist2 );
					cosh = invdist * dot( ws, vdir );

					#if ENABLE_FALLOFF

					falloff = Falloff( dist2 );

					#endif

					horizons.x = max( horizons.x, cosh - falloff );

					#if ENABLE_COLOR_BOUNCE

					vec3 ptColor, ptDir;
					float alpha;
					ptColor = texture2D( colorBuffer, ( screenCoord + offset ) / renderSize ).rgb;
					ptDir = normalize( ws );
					alpha = saturate( length( ws ) / float( RADIUS ) );
					color += ptColor * saturate( dot( ptDir, vnorm ) ) * pow( ( 1.0 - alpha ), 2.0 );

					#endif

					// h2
					s = GetViewPosition( screenCoord - offset );
					ws = s.xyz - vpos.xyz;

					dist2 = dot( ws, ws );
					invdist = inversesqrt( dist2 );
					cosh = invdist * dot( ws, vdir );

					#if ENABLE_FALLOFF

					falloff = Falloff( dist2 );

					#endif

					horizons.y = max( horizons.y, cosh - falloff );

					// increment
					currStep += stepSize;

					#if ENABLE_COLOR_BOUNCE

					ptColor = texture2D( colorBuffer, ( screenCoord - offset ) / renderSize ).rgb;
					ptDir = normalize( ws );
					alpha = saturate( length( ws ) / float( RADIUS ) );
					color += ptColor * saturate( dot( ptDir, vnorm ) ) * pow( ( 1.0 - alpha ), 2.0 );

					#endif

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
				float singamma2	= - 2.0 * cosxi;					// cos(x + HALF_PI) = -sin(x)

				// clamp to normal hemisphere
				horizons.x = gamma + max( - horizons.x - gamma, - HALF_PI );
				horizons.y = gamma + min( horizons.y - gamma, HALF_PI );

				// Riemann integral is additive
				ao += nnx * 0.25 * (
					( horizons.x * singamma2 + cosgamma - cos( 2.0 * horizons.x - gamma ) ) +
					( horizons.y * singamma2 + cosgamma - cos( 2.0 * horizons.y - gamma ) ) );

			}
			#pragma unroll_loop_end

			// PDF = 1 / pi and must normalize with pi because of Lambert
			ao = ao / float( NUM_DIRECTIONS );

			#if ENABLE_COLOR_BOUNCE

			color /= float( NUM_STEPS * NUM_DIRECTIONS ) * 2.0 / lightBounceIntensity;
			gl_FragColor = vec4( color, ao );

			#else

			gl_FragColor = vec4( 0.0, 0.0, 0.0, ao );

			#endif
		}

	`

};
