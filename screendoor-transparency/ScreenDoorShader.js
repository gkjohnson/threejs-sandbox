function createDitherTexture() {

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


	ditherTex = new THREE.DataTexture( data, 4, 4, THREE.LuminanceFormat, THREE.FloatType );
	ditherTex.minFilter = THREE.NearestFilter;
	ditherTex.magFilter = THREE.NearestFilter;
	ditherTex.anisotropy = 1;
	ditherTex.wrapS = THREE.RepeatWrapping;
	ditherTex.wrapT = THREE.RepeatWrapping;

	ditherTex.needsUpdate = true;

	return ditherTex;

}

function cloneShader( shader, uniforms, defines ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = THREE.UniformsUtils.merge( [
		newShader.uniforms,
		uniforms
	] );
	newShader.defines = Object.assign( {}, defines );

	return newShader;

}

function DitheredTransparencyShaderMixin( shader ) {

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
			//if( texture2D( ditherTex, gl_FragCoord.xy / 4.0 ).r > opacity ) discard;
			if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= opacity ) discard;

			#endif
		`
	);

	return newShader;

}
