import { Vector2 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
export const ColorResolveShader = {

	defines: {
		ENABLE_BLUR: 1,
		BLUR_RADIUS: 5,
		DEPTH_THRESHOLD: '2e-3',
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
			vec3 sampleValue = vec3( 0.0 );

			#if ENABLE_BLUR

			vec2 currTexel = vUv * renderSize;
			vec2 currMarchTexel = vUv * marchSize;
			vec2 texelRatio = marchSize / renderSize;

			vec3 currNormal = UnpackNormal( texture2D( packedBuffer, vUv  ) );
			float currDepth = texture2D( depthBuffer, vUv ).r;

			float totalWeight = 1e-10;
			int blurWidth = BLUR_RADIUS * 2 + 1;

			for ( int x = - BLUR_RADIUS; x <= BLUR_RADIUS; x ++ ) {

				for ( int y = - BLUR_RADIUS; y <= BLUR_RADIUS; y ++ ) {

					// if ( x != 0 || y != 0 ) continue;

					vec2 step = vec2( float( x ), float( y ) ) * float( blurStride );

					// iterate over full res pixels
					vec2 renderUv = currTexel + step;
					renderUv /= renderSize;

					// get the associated pixel in the AO buffer
					vec2 marchUv = currMarchTexel + step * texelRatio;
					marchUv /= marchSize;

					// if the pixels are close enough in space then blur them together
					float offsetDepth = texture2D( depthBuffer, renderUv ).r;
					if ( abs( offsetDepth - currDepth ) <= 1e-1 ) {

						// Weigh the sample based on normal similarity
						vec3 offsetNormal = UnpackNormal( texture2D( packedBuffer, renderUv ) );
						float weight = max( 0.0, dot( offsetNormal, currNormal ) - 0.9 ) * 10.0;

						// gaussian distribution
						weight *= gaussian( x, blurWidth ) * gaussian( y, blurWidth );

						// accumulate
						vec4 val = texture2D( intersectBuffer, marchUv );
						sampleValue += val.rgb * weight;
						totalWeight += weight;

					}

				}

			}

			sampleValue /= totalWeight;

			#else

			sampleValue = texture2D( intersectBuffer, vUv ).rgb;

			#endif

			#if COLOR_HIT_ONLY

			gl_FragColor = vec4( sampleValue, 1.0 );

			#else

			source.rgb += sampleValue * intensity;
			gl_FragColor = source;

			#endif


		}
	`

};
