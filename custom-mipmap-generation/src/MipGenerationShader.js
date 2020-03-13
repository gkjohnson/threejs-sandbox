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
		parentLevel: { value: 0 },
		mapSize: { value: new Vector2() },
		parentMapSize: { value: new Vector2() }

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
		uniform vec2 mapSize;
		uniform float parentLevel;

		${ sampleFunctions }

		void main() {

			#if X_POWER_OF_TWO && Y_POWER_OF_TWO

			vec2 pixelSize = 1.0 / mapSize;
			vec2 halfPixelSize = pixelSize / 2.0;

			vec2 baseUv = vUv;

			vec2 uv00 = baseUv;
			uv00.x -= halfPixelSize.x;
			uv00.y -= halfPixelSize.y;

			vec2 uv01 = baseUv;
			uv01.x -= halfPixelSize.x;
			uv01.y += halfPixelSize.y;

			vec2 uv10 = baseUv;
			uv10.x += halfPixelSize.x;
			uv10.y -= halfPixelSize.y;

			vec2 uv11 = baseUv;
			uv11.x += halfPixelSize.x;
			uv11.y += halfPixelSize.y;

			int level = int( parentLevel );
			vec4 sample00 = packedTexture2DLOD( map, uv00, level );
			vec4 sample01 = packedTexture2DLOD( map, uv01, level );
			vec4 sample10 = packedTexture2DLOD( map, uv10, level );
			vec4 sample11 = packedTexture2DLOD( map, uv11, level );

			<mipmap_logic>

			#elif X_POWER_OF_TWO

			#elif Y_POWER_OF_TWO

			#endif

		}
	`

};

