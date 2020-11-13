import {
	DataTexture,
	LuminanceFormat,
	FloatType,
	NearestFilter,
	RepeatWrapping,
	UniformsUtils,
	RGBAFormat,
	LinearFilter,
} from '//unpkg.com/three@0.106.0/build/three.module.js';
import {
	BlueNoiseGenerator
} from '../../blue-noise-generation/src/BlueNoiseGenerator.js';

// Generate Blue Noise Textures
const generator = new BlueNoiseGenerator();
generator.size = 32;

const data = new Float32Array( 32 ** 2 * 4 );
for ( let i = 0, l = 4; i < l; i ++ ) {

	const result = generator.generate();
	const bin = result.data;
	const maxValue = result.maxValue;

	for ( let j = 0, l2 = bin.length; j < l2; j ++ ) {

		const value = ( bin[ j ] / maxValue );
		data[ j * 4 + i ] = value;

	}

}
const blueNoiseTex = new DataTexture( data, generator.size, generator.size, RGBAFormat, FloatType );
blueNoiseTex.wrapS = RepeatWrapping;
blueNoiseTex.wrapT = RepeatWrapping;
blueNoiseTex.minFilter = LinearFilter;
blueNoiseTex.minFilter = NearestFilter;
blueNoiseTex.magFilter = NearestFilter;
blueNoiseTex.anisotropy = 1;
blueNoiseTex.wrapS = RepeatWrapping;
blueNoiseTex.wrapT = RepeatWrapping;
blueNoiseTex.needsUpdate = true;

export function createDitherTexture() {

	const data = new Float32Array( 16 );
	data[ 0 ] = 0.0 / 16.0;
	data[ 1 ] = 8.0 / 16.0;
	data[ 2 ] = 2.0 / 16.0;
	data[ 3 ] = 10.0 / 16.0;

	data[ 4 ] = 12.0 / 16.0;
	data[ 5 ] = 4.0 / 16.0;
	data[ 6 ] = 14.0 / 16.0;
	data[ 7 ] = 6.0 / 16.0;

	data[ 8 ] = 3.0 / 16.0;
	data[ 9 ] = 11.0 / 16.0;
	data[ 10 ] = 1.0 / 16.0;
	data[ 11 ] = 9.0 / 16.0;

	data[ 12 ] = 15.0 / 16.0;
	data[ 13 ] = 9.0 / 16.0;
	data[ 14 ] = 13.0 / 16.0;
	data[ 15 ] = 5.0 / 16.0;

	const ditherTex = new DataTexture( data, 4, 4, LuminanceFormat, FloatType );
	ditherTex.minFilter = NearestFilter;
	ditherTex.magFilter = NearestFilter;
	ditherTex.anisotropy = 1;
	ditherTex.wrapS = RepeatWrapping;
	ditherTex.wrapT = RepeatWrapping;

	ditherTex.needsUpdate = true;

	return blueNoiseTex;

}

function cloneShader( shader, uniforms, defines ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = UniformsUtils.merge( [
		newShader.uniforms,
		uniforms
	] );
	newShader.defines = Object.assign( {}, defines );

	return newShader;

}

export function DitheredTransparencyShaderMixin( shader ) {

	const defineKeyword = 'ENABLE_DITHER_TRANSPARENCY';
 	const newShader = cloneShader(
 		shader,
 		{
 			ditherTex: { value: null },
 		},
 		{
 			[ defineKeyword ]: 1,
 		}
	);

	newShader.fragmentShader = `
		 	// adapted from https://www.shadertoy.com/view/Mlt3z8
			float bayerDither2x2( vec2 v ) {
				return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
			}

			float bayerDither4x4( vec2 v ) {
				vec2 P1 = mod( v, 2.0 );
				vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
				return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
			}


			uniform sampler2D ditherTex;
			${newShader.fragmentShader}
	`.replace(
		/main\(\) {/,
		v => `
			${v}
			#if ${defineKeyword}

			if( texture2D( ditherTex, gl_FragCoord.xy / 32.0 ).r > opacity ) discard;
			// if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= opacity ) discard;

			#endif
		`
	);

	return newShader;

}
