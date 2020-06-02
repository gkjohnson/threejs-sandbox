import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const ColorResolveShader = {

	defines: {
		ENABLE_BLUR: 1,
		BLUR_ITERATIONS: 5,
		DEPTH_THRESHOLD: '2e-1',
		COLOR_HIT_ONLY: 0,
	},

	uniforms: {

		intersectBuffer: { value: null },
		sourceBuffer: { value: null },
		packedBuffer: { value: null },
		depthBuffer: { value: null },

		intensity: { value: 0.5 },

		renderSize: { value: new Vector2() },
		marchSize: { value: new Vector2() },
		blurStride: { value: 1 },

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
		#include <common>
		#include <packing>
		#define E 2.7182818

		varying vec2 vUv;
		uniform sampler2D intersectBuffer;
		uniform sampler2D sourceBuffer;
		uniform sampler2D packedBuffer;
		uniform sampler2D depthBuffer;

		uniform vec2 renderSize;
		uniform vec2 marchSize;
		uniform float blurStride;

		uniform float intensity;

		// https://danielilett.com/2019-05-08-tut1-3-smo-blur/
		// One-dimensional Gaussian curve function.
		float gaussian( int x, int spread) {

			float sigmaSqu = float( spread * spread );
			return ( 1.0 / sqrt( 2.0 * PI * sigmaSqu ) ) * pow( E, - float( x * x ) / ( 2.0 * sigmaSqu ) );

		}

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		void main() {

			// Found, blending
			vec4 source = texture2D( sourceBuffer, vUv );
			vec3 sample = vec3( 0.0 );

			#if ENABLE_BLUR

			vec2 currTexel = vUv * renderSize;
			vec2 currMarchTexel = vUv * marchSize;
			vec2 texelRatio = marchSize / renderSize;

			vec3 currNormal = UnpackNormal( texture2D( packedBuffer, currMarchTexel ) );
			float currDepth = texture2D( depthBuffer, currMarchTexel ).r;

			float totalWeight = 1e-10;
			float pixelOffset = - float( BLUR_ITERATIONS ) / 2.0;
			pixelOffset += mod( float( BLUR_ITERATIONS ), 2.0 ) == 0.0 ? 0.0 : 0.5;
			pixelOffset *= float( blurStride );

			for ( int x = 0; x < BLUR_ITERATIONS; x ++ ) {

				for ( int y = 0; y < BLUR_ITERATIONS; y ++ ) {

					vec2 step = vec2( float( x ), float( y ) ) * float( blurStride );

					// iterate over full res pixels
					vec2 offsetUv = currTexel + ( pixelOffset + step ) / texelRatio;
					offsetUv /= renderSize;

					// get the associated pixel in the AO buffer
					vec2 marchUv = currMarchTexel + pixelOffset + step;
					marchUv /= marchSize;


					// TODO: we need to be able to compare the depth normal used for raymarching to the current
					// fragment. Above the sample is pulled from vUv, which is the current render fragment instead.

					// if the pixels are close enough in space then blur them together
					float offsetDepth = texture2D( depthBuffer, offsetUv ).r;
					if ( abs( offsetDepth - currDepth ) <= DEPTH_THRESHOLD ) {

						// Weigh the sample based on normal similarity
						vec3 offsetNormal = UnpackNormal( texture2D( packedBuffer, offsetUv ) );
						float weight = max( 0.0, dot( offsetNormal, currNormal ) );

						// square the weight to give pixels with a closer normal even higher priority
						weight *= weight;

						// gaussian distribution
						weight *= gaussian( x, BLUR_ITERATIONS ) * gaussian( y, BLUR_ITERATIONS );

						totalWeight += weight;

						// accumulate
						vec4 val = texture2D( intersectBuffer, marchUv );
						sample += val.rgb * weight;
						totalWeight += weight;

					}

				}

			}

			sample /= totalWeight;

			#else

			sample = texture2D( intersectBuffer, vUv ).rgb;
			// source += sample * intensity * ( 1.0 - roughness );

			#endif


			#if COLOR_HIT_ONLY

			gl_FragColor = vec4( sample, 1.0 );

			#else

			source.rgb += sample * intensity;
			gl_FragColor = source;

			#endif


		}
	`

}
