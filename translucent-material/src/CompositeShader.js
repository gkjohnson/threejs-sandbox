import { Vector2, Color } from '//cdn.skypack.dev/three@0.116.1/build/three.module.js';

// need to unpack depth backt to world space to get thickness
// https://stackoverflow.com/questions/44121266/compute-3d-point-from-mouse-position-and-depth-map
export const CompositeShader = {
	extensions: {
		fragDepth: true,
	},
	vertexShader: `

		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}

	`,
	fragmentShader: `

		uniform sampler2D readTexture;
		uniform sampler2D absorbedTexture;
		varying vec2 vUv;

		void main() {

			vec3 readColor = texture2D( readTexture, vUv ).rgb;
			vec3 absorbedColor = texture2D( absorbedTexture, vUv ).rgb;

			vec3 transmitted = vec3( 1.0 ) - absorbedColor;
			gl_FragColor = vec4( readColor * transmitted, 1.0 );

		}

	`,
	defines: {},
	uniforms: {
		absorbedTexture: { value: null },
		readTexture: { value: null },
	}
};

