function createDitherTexture() {

	const data = new Float32Array(16);
	data[0] = 1.0 / 17.0;
	data[1] = 9.0 / 17.0;
	data[2] = 3.0 / 17.0;
	data[3] = 11.0 / 17.0;

	data[4] = 13.0 / 17.0;
	data[5] = 5.0 / 17.0;
	data[6] = 15.0 / 17.0;
	data[7] = 7.0 / 17.0;

	data[8] = 4.0 / 17.0;
	data[9] = 12.0 / 17.0;
	data[10] = 2.0 / 17.0;
	data[11] = 10.0 / 17.0;

	data[12] = 16.0 / 17.0;
	data[13] = 8.0 / 17.0;
	data[14] = 14.0 / 17.0;
	data[15] = 6.0 / 17.0;


	ditherTex = new THREE.DataTexture(data, 4, 4, THREE.LuminanceFormat, THREE.FloatType);
	ditherTex.minFilter = THREE.NearestFilter;
	ditherTex.magFilter = THREE.NearestFilter;
	ditherTex.anisotropy = 1;
	ditherTex.wrapS = THREE.RepeatWrapping;
	ditherTex.wrapT = THREE.RepeatWrapping;

	ditherTex.needsUpdate = true;

	return ditherTex;
}

function cloneShader(shader, uniforms, defines) {

	const newShader = Object.assign({}, shader);
	newShader.uniforms = THREE.UniformsUtils.merge([
		newShader.uniforms,
		uniforms
	]);
	newShader.defines = Object.assign({}, defines);

	return newShader;

}

function DitheredTransparencyShaderMixin(shader) {

	const defineKeyword = 'ENABLE_DITHER_TRANSPARENCY';
 	const newShader = cloneShader(
 		shader,
 		{
 			ditherTex: { value: null },
 		},
 		{
 			[defineKeyword]: 1,
 		},
	);

	newShader.fragmentShader = `
			uniform sampler2D ditherTex;
			${newShader.fragmentShader}
		`.replace(
			/main\(\) {/,
			v => `
			${v}
			#if ${defineKeyword}
			if(texture2D(ditherTex, gl_FragCoord.xy / 4.0).r > opacity) discard;
			#endif
			`,
		);

	return newShader;

}
