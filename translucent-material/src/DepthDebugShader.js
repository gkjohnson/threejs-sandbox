import { ShaderLib, UniformsUtils, Vector2, Color } from '//unpkg.com/three@0.116.1/build/three.module.js';

// need to unpack depth backt to world space to get thickness
// https://stackoverflow.com/questions/44121266/compute-3d-point-from-mouse-position-and-depth-map
export const DepthDebugShader = {
	vertexShader: `
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}
	`,
	fragmentShader: `
		uniform sampler2D depthTexture;
		varying vec2 vUv;

		void main() {

			float d = texture2D( depthTexture, vUv ).r;
			gl_FragColor = vec4( mod( d * 1000.0, 1.0 ) );

		}

	`,
	defines: {},
	uniforms: UniformsUtils.merge( [
		{
			depthTexture: { value: null },
		},
	] ),
};

