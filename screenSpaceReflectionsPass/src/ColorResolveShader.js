import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const ColorResolveShader = {

	defines: {
		ENABLE_BLUR: 1,
		BLUR_ITERATIONS: 5,
		EDGE_FADE: 0.3,
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

		uniform sampler2D renderSize;
		uniform sampler2D marchSize;
		uniform sampler2D blurStride;

		uniform float intensity;
		void main() {

			// Found, blending
			vec4 source = texture2D( sourceBuffer, vUv );
			vec4 intersect = texture2D( intersectBuffer, vUv );
			vec2 hitUV = intersect.xy;
			float stepRatio = intersect.z;
			float intersected = intersect.a;

			#if ENABLE_BLUR
			#else

			// TODO: the buffer should come in with colors already -- we don't need a condition here...
			if ( intersected > 0.5 ) {

				vec4 col = texture2D( sourceBuffer, hitUV, 10.0 );
				vec2 ndc = abs( hitUV * 2.0 - 1.0 );
				float maxndc = max( abs( ndc.x ), abs( ndc.y ) ); // [ -1.0, 1.0 ]
				float rayLengthFade = 1.0 - stepRatio;
				float ndcFade = 1.0 - ( max( 0.0, maxndc - EDGE_FADE ) / ( 1.0 - EDGE_FADE )  );
				float fadeVal = min( rayLengthFade, ndcFade );

				// source += col * intensity * ( 1.0 - roughness ) * fadeVal;
				source += col * intensity * fadeVal;

			}

			#endif

			gl_FragColor = source;

		}
	`

}
