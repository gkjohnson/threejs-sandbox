export const LinearDepthShader = {

	vertexShader: `
		varying vec3 vViewPosition;
		#ifndef FLAT_SHADED
			varying vec3 vNormal;
		#endif
		void main() {
			#include <beginnormal_vertex>
			#include <defaultnormal_vertex>
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
