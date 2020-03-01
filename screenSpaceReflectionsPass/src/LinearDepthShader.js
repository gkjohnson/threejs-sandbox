export const LinearDepthShader = {

	vertexShader: `
		varying vec3 vViewPosition;
		void main() {
			#include <begin_vertex>
			#include <project_vertex>
			vViewPosition = mvPosition.xyz;
		}
	`,

	fragmentShader: `
		varying vec3 vViewPosition;
		void main() {
			gl_FragColor = vec4(vViewPosition.z);
		}
	`

};
