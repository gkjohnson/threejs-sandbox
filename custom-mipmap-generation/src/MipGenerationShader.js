import { UniformsUtils, Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { sampleFunctions } from './mipSampleFunctions.js';

export function clone( shader ) {

	const newShader = { ...shader };
	if ( 'defines' in shader ) {

		newShader.defines = { ...shader.defines };

	}

	if ( 'uniforms' in shader ) {

		newShader.uniforms = UniformsUtils.clone( shader.uniforms );

	}

	return newShader;

}

export const MipGenerationShader = {

	defines: {

		X_POWER_OF_TWO: 1,
		Y_POWER_OF_TWO: 1,

	},

	uniforms: {

		map: { value: null },
		mapSize: { value: new Vector2() },
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
		uniform int level;
		uniform vec2 mapSize;

		${ sampleFunctions }

		#if X_POWER_OF_TWO && Y_POWER_OF_TWO

		#define SAMPLES 4
		#define WIDTH 2
		#define HEIGHT 2

		#elif X_POWER_OF_TWO

		#define SAMPLES 6
		#define WIDTH 2
		#define HEIGHT 3

		#elif Y_POWER_OF_TWO

		#define SAMPLES 6
		#define WIDTH 3
		#define HEIGHT 2

		#else

		#define SAMPLES 9
		#define WIDTH 3
		#define HEIGHT 3

		#endif
		void main() {

			vec2 pixelSize = 1.0 / mapSize;
			vec2 halfPixelSize = pixelSize / 2.0;
			vec2 baseUv = vUv - vec2( halfPixelSize );


			#if X_POWER_OF_TWO && Y_POWER_OF_TWO

			vec2 uv00 = baseUv;
			vec2 uv01 = baseUv;
			uv01.y += pixelSize.y;

			vec2 uv10 = baseUv;
			uv10.x += pixelSize.x;

			vec2 uv11 = baseUv;
			uv11.x += pixelSize.x;
			uv11.y += pixelSize.y;

			vec4 samples[ 4 ];
			samples[ 0 ] = packedTexture2DLOD( map, uv00, level );
			samples[ 1 ] = packedTexture2DLOD( map, uv01, level );
			samples[ 2 ] = packedTexture2DLOD( map, uv10, level );
			samples[ 3 ] = packedTexture2DLOD( map, uv11, level );

			float weights[ 4 ];
			weights[ 0 ] = 1.0;
			weights[ 1 ] = 1.0;
			weights[ 2 ] = 1.0;
			weights[ 3 ] = 1.0;

			<mipmap_logic>

			#elif X_POWER_OF_TWO

			vec4 samples[ 6 ];

			float weights[ 6 ];

			#elif Y_POWER_OF_TWO

			vec4 samples[ 6 ];

			float weights[ 6 ];

			#else

			vec4 samples[ 9 ];

			float weights[ 9 ];

			#endif

		}
	`

};

