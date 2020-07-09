import { ShaderLib, UniformsUtils, Vector2 } from '//unpkg.com/three@0.116.1/build/three.module.js';

// need to unpack depth backt to world space to get thickness
// https://stackoverflow.com/questions/44121266/compute-3d-point-from-mouse-position-and-depth-map
export const TranslucentShader = {
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
		uniform sampler2D frontDepthTexture;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#define DITHERING 1
		#include <packing>
		#include <common>
		#include <dithering_pars_fragment>

		float convertDepth( float fragCoordZ ) {

			float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
			return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

		}

		void main() {

			float frontDepth = texture2D( frontDepthTexture, gl_FragCoord.xy / resolution ).r;
			float thickness = convertDepth( gl_FragCoord.z ) - convertDepth( frontDepth );
			gl_FragColor = vec4( thickness );

			gl_FragColor.rgb = dithering( gl_FragColor.rgb );

		}

	`,
	defines: {},
	uniforms: UniformsUtils.merge([
		{
			cameraNear: { value: 0.0 },
			cameraFar: { value: 0.0 },
			resolution: { value: new Vector2() },
			frontDepthTexture: { value: null },
		},
		UniformsUtils.clone( ShaderLib.physical.uniforms )
	]),
};

