import { ShaderLib, UniformsUtils, Vector2, Color } from '//unpkg.com/three@0.116.1/build/three.module.js';

// need to unpack depth backt to world space to get thickness
// https://stackoverflow.com/questions/44121266/compute-3d-point-from-mouse-position-and-depth-map
export const LayerShader = {
	extensions: {
		// fragDepth: true,
	},
	vertexShader: `
		void main() {

			#include <begin_vertex>
			#include <project_vertex>

		}
	`,
	fragmentShader: `
		uniform sampler2D compareDepthTexture;
		uniform float doCompare;
		uniform vec2 resolution;

		void main() {

			vec2 uv = gl_FragCoord.xy / resolution;
			float compareDepth = texture2D( compareDepthTexture, uv ).r;

			if ( doCompare == 1.0 && gl_FragCoord.z < compareDepth ) {

				gl_FragColor = vec4(0.0, mod( gl_FragCoord.z * 1000.0, 1.0 ), 0.0, 0.0);
				discard;
				return;

			}

			gl_FragColor = vec4( 0.0 );
			// gl_FragColor = vec4( 1.0 );
			// gl_FragColor = vec4( 0.0, mod( gl_FragCoord.z * 1000.0, 1.0 ), 0.0, 0.0 );

		}

	`,
	defines: {},
	uniforms: UniformsUtils.merge([
		{
			doCompare: { value: 1.0 },
			compareDepthTexture: { value: null },
			resolution: { value: new Vector2() },
		},
		UniformsUtils.clone( ShaderLib.physical.uniforms )
	]),
};

