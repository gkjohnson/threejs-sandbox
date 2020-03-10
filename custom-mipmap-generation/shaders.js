import { sampleFunctions } from './src/mipSampleFunctions.js';

export const mipBiasShader = {

	extensions: {

		derivatives: true,
		shaderTextureLOD: true

	},

	uniforms: {

		map: { value: null },
		level: { value: 0 },

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
		uniform sampler2D map;
		uniform float level;

		void main() {

			gl_FragColor = texture2DLodEXT( map, vUv, level );

		}
	`
};

export const customSampleShader = {

	uniforms: {

		map: { value: null },
		mapHeight: { value: 1 },
		level: { value: 0 },

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
		uniform sampler2D map;
		uniform float level;

		${ sampleFunctions }

		void main() {

			#ifdef NEAREST_FILTER

			gl_FragColor = packedTexture2DLOD( map, vUv, mod( level, 1.0 ) < 0.5 ? int( level ) : int( level ) + 1 );

			#else

			gl_FragColor = packedTexture2DLOD( map, vUv, level );

			#endif

		}
	`

}
