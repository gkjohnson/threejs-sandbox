export const CopyWithDepthShader = {

	extensions: {
		fragDepth: true,
	},
	uniforms: {
		tDiffuse: { value: null },
		tDepth: { value: null },
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
		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tDepth;
		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragDepthEXT = texture2D( tDepth, vUv ).r;

		}
	`,
};
