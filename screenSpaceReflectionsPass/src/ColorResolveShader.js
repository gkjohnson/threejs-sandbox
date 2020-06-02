import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const ColorResolveShader = {

	defines: {
		ENABLE_BLUR: 1,
		BLUR_ITERATIONS: 5,
		EDGE_FADE: 0.3,
		DEPTH_THRESHOLD: '2e-1',
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

		varying vec2 vUv;
		uniform sampler2D intersectBuffer;
		uniform sampler2D sourceBuffer;
		uniform sampler2D packedBuffer;
		uniform sampler2D depthBuffer;

		uniform vec2 renderSize;
		uniform vec2 marchSize;
		uniform float blurStride;

		uniform float intensity;

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

			vec3 currNormal = UnpackNormal( texture2D( packedBuffer, vUv ) );
			float currDepth = texture2D( depthBuffer, vUv ).r;

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


					// if the pixels are close enough in space then blur them together
					float offsetDepth = texture2D( depthBuffer, offsetUv ).r;

					if ( abs( offsetDepth - currDepth ) <= DEPTH_THRESHOLD ) {

						vec4 intersect = texture2D( intersectBuffer, marchUv );
						float intersected = intersect.a;
						vec2 hitUV = intersect.xy;

						// Weigh the sample based on normal similarity
						vec3 offsetNormal = UnpackNormal( texture2D( packedBuffer, offsetUv ) );
						float weight = max( 0.0, dot( offsetNormal, currNormal ) );

						// square the weight to give pixels with a closer normal even higher priority
						weight *= weight;
						totalWeight += weight;

						if ( intersected > 0.5  ) {

							vec4 val = texture2D( sourceBuffer, hitUV );
							sample += val.rgb * weight;

						}

					}

				}

			}

			sample /= totalWeight;
			source.rgb += sample * intensity;

			#else

			vec4 intersect = texture2D( intersectBuffer, vUv );
			float intersected = intersect.a;
			vec2 hitUV = intersect.xy;
			float stepRatio = intersect.z;

			if ( intersected > 0.5 ) {

				sample = texture2D( sourceBuffer, hitUV, 10.0 ).rgb;

				// TODO: the buffer should come in with colors already -- we don't need a condition here...

				vec2 ndc = abs( hitUV * 2.0 - 1.0 );
				float maxndc = max( abs( ndc.x ), abs( ndc.y ) ); // [ -1.0, 1.0 ]
				float rayLengthFade = 1.0 - stepRatio;
				float ndcFade = 1.0 - ( max( 0.0, maxndc - EDGE_FADE ) / ( 1.0 - EDGE_FADE )  );
				float fadeVal = min( rayLengthFade, ndcFade );

				// source += sample * intensity * ( 1.0 - roughness ) * fadeVal;
				source.rgb += sample * intensity * fadeVal;

			}

			#endif


			gl_FragColor = source;

		}
	`

}
