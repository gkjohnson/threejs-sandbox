export const LinearDepthShader = {

	vertexShader: /* glsl */`
		varying vec3 vViewPosition;
		void main() {
			#include <begin_vertex>
			#include <project_vertex>
			vViewPosition = mvPosition.xyz;
		}
	`,

	fragmentShader: /* glsl */`
		varying vec3 vViewPosition;
		void main() {
			gl_FragColor = vec4(vViewPosition.z);
		}
	`

};
