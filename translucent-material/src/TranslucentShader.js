import { ShaderLib, UniformsUtils, Vector2, Color } from '//unpkg.com/three@0.116.1/build/three.module.js';

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
		uniform sampler2D frontLayerTexture;
		uniform sampler2D backLayerTexture;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform vec3 color;
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

			float frontDepth = texture2D( frontLayerTexture, gl_FragCoord.xy / resolution ).r;
			float backDepth = texture2D( backLayerTexture, gl_FragCoord.xy / resolution ).r;
			float thickness = convertDepth( frontDepth ) - convertDepth( backDepth );

			vec3 absorbed = vec3( 1.0 ) - clamp( color, 0.0, 1.0 );
			vec3 val = dithering( - absorbed * thickness * 1000.0 );
			gl_FragColor.rgb = val;
			gl_FragColor.a = 1.0;

		}

	`,
	defines: {},
	uniforms: UniformsUtils.merge([
		{
			frontLayerTexture: { value: null },
			backLayerTexture: { value: null },

			color: { value: new Color() },
			cameraNear: { value: 0.0 },
			cameraFar: { value: 0.0 },
			resolution: { value: new Vector2() },
		},
		UniformsUtils.clone( ShaderLib.physical.uniforms )
	]),
};

