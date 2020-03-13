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

// Non Power of Two mip map generation
// https://www.nvidia.com/en-us/drivers/np2-mipmapping/
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
			vec2 pixelPos = floor( baseUv * mapSize );
			vec2 childMapSize = floor( mapSize / 2.0 );

			vec4 samples[ SAMPLES ];
			float weights[ SAMPLES ];

			#if X_POWER_OF_TWO && Y_POWER_OF_TWO

			samples[ 0 ] = packedTexture2DLOD( map, baseUv, level );
			samples[ 1 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, 0.0 ), level );
			samples[ 2 ] = packedTexture2DLOD( map, baseUv + vec2( 0.0, pixelSize.y ), level );
			samples[ 3 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, pixelSize.y ), level );

			weights[ 0 ] = 0.25;
			weights[ 1 ] = 0.25;
			weights[ 2 ] = 0.25;
			weights[ 3 ] = 0.25;

			#elif X_POWER_OF_TWO

			#elif Y_POWER_OF_TWO

			// TODO: Are these weights correct?
			// copy this to the X_POWER_OF_TWO section
			float xden = 2.0 * mapSize.x + 1.0;
			float wx0 = ( mapSize.x - x ) / xden;
			float wx1 = ( mapSize.x ) / xden;
			float wx2 = ( mapSize.x + 1.0 ) / xden;

			float wy0 = 0.5;
			float wy1 = 0.5;

			samples[ 0 ] = packedTexture2DLOD( map, baseUv, level );
			samples[ 1 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, 0.0 ), level );
			samples[ 2 ] = packedTexture2DLOD( map, baseUv + vec2( 2.0 * pixelSize.x, 0.0 ), level );

			samples[ 3 ] = packedTexture2DLOD( map, baseUv + vec2( 0.0, pixelSize.y ), level );
			samples[ 4 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, pixelSize.y ), level );
			samples[ 5 ] = packedTexture2DLOD( map, baseUv + vec2( 2.0 * pixelSize.x, pixelSize.y ), level );

			weights[ 0 ] = wx0 * wy0;
			weights[ 1 ] = wx1 * wy0;
			weights[ 2 ] = wx2 * wy0;

			weights[ 3 ] = wx0 * wy1;
			weights[ 4 ] = wx1 * wy1;
			weights[ 5 ] = wx2 * wy1;

			#else

			float xden = 2.0 * mapSize.x + 1.0;
			float wx0 = ( mapSize.x - x ) / xden;
			float wx1 = ( mapSize.x ) / xden;
			float wx2 = ( mapSize.x + 1.0 ) / xden;

			float yden = 2.0 * mapSize.y + 1.0;
			float wy0 = ( mapSize.y - y ) / yden;
			float wy1 = ( mapSize.y ) / yden;
			float wy2 = ( mapSize.y + 1.0 ) / yden;

			samples[ 0 ] = packedTexture2DLOD( map, baseUv, level );
			samples[ 1 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, 0.0 ), level );
			samples[ 2 ] = packedTexture2DLOD( map, baseUv + vec2( 2.0 * pixelSize.x, 0.0 ), level );

			samples[ 3 ] = packedTexture2DLOD( map, baseUv + vec2( 0.0, pixelSize.y ), level );
			samples[ 4 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, pixelSize.y ), level );
			samples[ 5 ] = packedTexture2DLOD( map, baseUv + vec2( 2.0 * pixelSize.x, pixelSize.y ), level );

			samples[ 6 ] = packedTexture2DLOD( map, baseUv + vec2( 0.0, 2.0 * pixelSize.y ), level );
			samples[ 7 ] = packedTexture2DLOD( map, baseUv + vec2( pixelSize.x, 2.0 * pixelSize.y ), level );
			samples[ 8 ] = packedTexture2DLOD( map, baseUv + vec2( 2.0 * pixelSize.x, 2.0 * pixelSize.y ), level );

			weights[ 0 ] = wx0 * wy0;
			weights[ 1 ] = wx1 * wy0;
			weights[ 2 ] = wx2 * wy0;

			weights[ 3 ] = wx0 * wy1;
			weights[ 4 ] = wx1 * wy1;
			weights[ 5 ] = wx2 * wy1;

			weights[ 6 ] = wx0 * wy2;
			weights[ 7 ] = wx1 * wy2;
			weights[ 8 ] = wx2 * wy2;

			#endif

			<mipmap_logic>

		}
	`

};

