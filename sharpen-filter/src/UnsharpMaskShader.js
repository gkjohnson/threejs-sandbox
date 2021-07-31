import { Vector2 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export const UnsharpMaskShader = {

	defines: {

		GAUSSIAN_BLUR: 1,
		BOX_BLUR: 0,
		CROSS_BLUR: 0,
		DIAGONAL_BLUR: 0,

	},

	uniforms: {

		tDiffuse: { value: null },
		resolution: { value: new Vector2() },

		intensity: { value: 1 },
		size: { value: 1 },

	},

	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}
	`,

	fragmentShader: /* glsl */`
		varying vec2 vUv;
		uniform sampler2D tDiffuse;

		uniform vec2 resolution;
		uniform float intensity;
		uniform float size;

		void main() {

			vec2 res = resolution * size;
			vec4 curr = texture2D( tDiffuse, vUv );

			#if GAUSSIAN_BLUR || BOX_BLUR || CROSS_BLUR

			// cross samples
			vec4 s1 = texture2D( tDiffuse, vUv + vec2( res.x, 0.0 ) );
			vec4 s2 = texture2D( tDiffuse, vUv + vec2( - res.x, 0.0 ) );
			vec4 s3 = texture2D( tDiffuse, vUv + vec2( 0.0, res.y ) );
			vec4 s4 = texture2D( tDiffuse, vUv + vec2( 0.0, - res.y ) );

			#endif

			#if GAUSSIAN_BLUR || BOX_BLUR || DIAGONAL_BLUR

			// corner samples
			vec4 s5 = texture2D( tDiffuse, vUv + vec2( res.x, res.y ) );
			vec4 s6 = texture2D( tDiffuse, vUv + vec2( - res.x, res.y ) );
			vec4 s7 = texture2D( tDiffuse, vUv + vec2( - res.x, - res.y ) );
			vec4 s8 = texture2D( tDiffuse, vUv + vec2( res.x, - res.y ) );

			#endif

			vec4 blurred;

			#if CROSS_BLUR

			blurred = s1 + s2 + s3 + s4 + curr;
			blurred /= 5.0;

			#elif DIAGONAL_BLUR

			blurred = s5 + s6 + s7 + s8 + curr;
			blurred /= 5.0;

			#elif BOX_BLUR

			blurred = s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + curr;
			blurred /= 9.0;

			#elif GAUSSIAN_BLUR

			// weights from
			// https://gist.github.com/xnoreq/6325f5c4e9d92ea2528cd6a5c2dfea6c

			// gaussian blur filter
			// [ 1, 2 , 1 ]
			// [ 2, 4 , 2 ]
			// [ 1, 2 , 1 ]

			blurred =
				( s5 + s6 + s7 + s8 ) * 1.0 +
				( s1 + s2 + s3 + s4 ) * 2.0 +
				curr * 4.0;
			blurred /= 16.0;

			#endif

			gl_FragColor = vec4( intensity, 0.0, 0.0, 1.0 );
			gl_FragColor = curr * ( 1.0 + intensity ) - blurred * intensity;

		}
	`,

};
