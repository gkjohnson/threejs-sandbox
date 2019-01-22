const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v01 = new THREE.Vector3();
const v12 = new THREE.Vector3();
const norm = new THREE.Vector3();

function vecToString( v, multiplier ) {

	const x = ~ ~ ( v.x * multiplier );
	const y = ~ ~ ( v.y * multiplier );
	const z = ~ ~ ( v.z * multiplier );

	return `${ x },${ y },${ z }`;

}

function getDynamicShadowVolumeGeometry( geometry ) {

	const shadowGeom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	for ( const key in shadowGeom.attributes ) {

		shadowGeom.attributes[ key ] = shadowGeom.attributes[ key ].clone();

	}

	// Generate per-face normals
	const posAttr = shadowGeom.getAttribute( 'position' );
	const normArr = [];
	for ( let i = 0, l = posAttr.count; i < l; i += 3 ) {

		v0.x = posAttr.getX( i + 0 );
		v0.y = posAttr.getY( i + 0 );
		v0.z = posAttr.getZ( i + 0 );

		v1.x = posAttr.getX( i + 1 );
		v1.y = posAttr.getY( i + 1 );
		v1.z = posAttr.getZ( i + 1 );

		v2.x = posAttr.getX( i + 2 );
		v2.y = posAttr.getY( i + 2 );
		v2.z = posAttr.getZ( i + 2 );

		v01.subVectors( v0, v1 );
		v12.subVectors( v1, v2 );

		norm.crossVectors( v01, v12 ).normalize();

		normArr.push( norm.x, norm.y, norm.z );
		normArr.push( norm.x, norm.y, norm.z );
		normArr.push( norm.x, norm.y, norm.z );

	}
	const normAttr = new THREE.BufferAttribute( new Float32Array( normArr ), 3, false );
	shadowGeom.addAttribute( 'normal', normAttr );

	// generate an edge map
	const vertHash = {};
	const vertMap = {};
	for ( let i = 0, l = posAttr.count; i < l; i ++ ) {

		let str = '';
		str += posAttr.getX( i ).toFixed( 9 ) + ',';
		str += posAttr.getY( i ).toFixed( 9 ) + ',';
		str += posAttr.getZ( i ).toFixed( 9 );

		if ( str in vertHash ) {

			vertMap[ i ] = vertHash[ str ];
			vertMap[ vertHash[ str ] ] = i;

		} else {

			vertHash[ str ] = i;

		}

	}

	// generate the new index array
	const indexArr = new Array( posAttr.count ).fill().map( ( e, i ) => i );
	const edgeHash = {};
	const multiplier = 1e6;
	for ( let i = 0, l = posAttr.count; i < l; i += 3 ) {

		for ( let j = 0; j < 3; j ++ ) {

			const e00 = i + j;
			const e01 = i + ( j + 1 ) % 3;

			v0.x = posAttr.getX( e00 );
			v0.y = posAttr.getY( e00 );
			v0.z = posAttr.getZ( e00 );

			v1.x = posAttr.getX( e01 );
			v1.y = posAttr.getY( e01 );
			v1.z = posAttr.getZ( e01 );

			let str0 = vecToString( v0, multiplier );
			let str1 = vecToString( v1, multiplier );

			let hash0 = `${ str0 }|${ str1 }`;
			let hash1 = `${ str1 }|${ str0 }`;

			if ( hash0 in edgeHash || hash1 in edgeHash ) {

				const [ e10, e11 ] = edgeHash[ hash0 ];

				delete edgeHash[ hash0 ];
				delete edgeHash[ hash1 ];

				indexArr.push( e00 );
				indexArr.push( e11 );
				indexArr.push( e10 );

				indexArr.push( e00 );
				indexArr.push( e10 );
				indexArr.push( e01 );

			} else {

				edgeHash[ hash0 ] = [ e00, e01 ];
				edgeHash[ hash1 ] = [ e00, e01 ];

			}

		}

	}

	const indexAttr = new THREE.BufferAttribute( new Uint32Array( indexArr ), 1, false );
	shadowGeom.setIndex( indexAttr );

	return shadowGeom;

}

function shadowVolumeShaderMixin( shader ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = THREE.UniformsUtils.merge( [ {
		lightInfo: {
			value: new THREE.Vector4()
		},
		shadowDistance: {
			value: 1000
		},
		shadowBias: {
			value: 0.1
		}
	}, shader.uniforms ] );

	// TODO: We may need the world normal matrix for this

	newShader.vertexShader =
		`
		uniform vec4 lightInfo;
		uniform float shadowDistance;
		uniform float shadowBias;
		${ newShader.vertexShader }
		`
			.replace( /#ifdef USE_ENVMAP([\s\S]+)?#endif/, ( v, match ) => match )
			.replace( /<project_vertex>/, v =>
				`${v}
				{
					vec4 projVec;
					if (lightInfo.w == 1.0) { 		// point light
						vec3 pos = (viewMatrix * lightInfo).xyz;
						projVec.xyz = pos - mvPosition.xyz;
					} else { 						// directional light
						projVec.xyz = (viewMatrix * lightInfo).xyz;
					}

					projVec.xyz = normalize(projVec.xyz);
					projVec.w = 0.0;
					projVec = -projVec;

					float facing = dot(projVec.xyz, transformedNormal);
					float dist = step(0.0, facing) * shadowDistance + shadowBias;
					mvPosition.xyz += dist * projVec.xyz;
					gl_Position = projectionMatrix * mvPosition;
				}
			` );

	return newShader;

}

function getShadowVolumeMaterial( source = THREE.ShaderLib.basic ) {

	const shader = shadowVolumeShaderMixin( source );
	const material = new THREE.ShaderMaterial( shader );
	material.setLight = function ( light ) {

		// TODO: get position in world space
		const vec = this.uniforms.lightInfo.value;
		if ( light.isPointLight ) {

			vec.copy( light.position );
			vec.w = 1.0;

		} else {

			vec.copy( light.position ).sub( light.target.position );
			vec.w = 0.0;

		}

	};

	return material;

}

function constructVolume( geometry, renderer ) {

	const shadowGroup = new THREE.Group();

	const stencilBuffer = renderer.state.buffers.stencil;
	const gl = renderer.context;

	const tintMaterial = getShadowVolumeMaterial();
	tintMaterial.depthWrite = false;
	tintMaterial.depthTest = false;
	tintMaterial.uniforms.diffuse.value.set( 0 );
	window.tintMaterial = tintMaterial;
	tintMaterial.uniforms.opacity.value = 0.25;
	tintMaterial.transparent = true;





	const frontMaterial = getShadowVolumeMaterial();
	frontMaterial.side = THREE.FrontSide;
	frontMaterial.colorWrite = false;
	frontMaterial.depthWrite = false;
	frontMaterial.depthTest = true;

	const frontMesh = new THREE.Mesh( geometry, frontMaterial );
	frontMesh.renderOrder = 1;
	frontMesh.onBeforeRender = () => {

		stencilBuffer.setTest( true );
		stencilBuffer.setFunc( gl.ALWAYS, 0, 0xff );
		stencilBuffer.setOp( gl.KEEP, gl.KEEP, gl.DECR_WRAP );

	};
	frontMesh.onAfterRender = () =>{

		stencilBuffer.setTest( false );

	};
	shadowGroup.add( frontMesh );


	const backMaterial = getShadowVolumeMaterial();
	backMaterial.colorWrite = false;
	backMaterial.depthWrite = false;
	backMaterial.depthTest = true;
	const backMesh = new THREE.Mesh( geometry, backMaterial );
	backMesh.renderOrder = 1;

	let rendered = false;
	backMesh.onBeforeRender = () => {

		if ( rendered ) backMaterial.side = THREE.BackSide;
		rendered = true;

		stencilBuffer.setTest( true );
		stencilBuffer.setFunc( gl.ALWAYS, 0, 0xff );
		stencilBuffer.setOp( gl.KEEP, gl.KEEP, gl.INCR_WRAP );

	};
	backMesh.onAfterRender = () =>{

		stencilBuffer.setTest( false );

	};
	shadowGroup.add( backMesh );



	const tintMesh = new THREE.Mesh( geometry, tintMaterial );
	tintMesh.renderOrder = 2;
	tintMesh.onBeforeRender = () => {

		stencilBuffer.setTest( true );
		stencilBuffer.setFunc( gl.NOTEQUAL, 0, 0xff );
		stencilBuffer.setOp( gl.REPLACE, gl.REPLACE, gl.REPLACE );

	};
	tintMesh.onAfterRender = () =>{

		stencilBuffer.setTest( false );

	};
	shadowGroup.add( tintMesh );


	shadowGroup.setLight = light => {

		tintMaterial.setLight( light );
		frontMaterial.setLight( light );
		backMaterial.setLight( light );

	};

	return shadowGroup;

}
