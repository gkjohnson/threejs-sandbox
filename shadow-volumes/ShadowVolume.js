const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v01 = new THREE.Vector3();
const v12 = new THREE.Vector3();
const norm = new THREE.Vector3();

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
	for ( let i = 0, l = posAttr.count / 3; i < l; i += 3 ) {

		for ( let j = 0; j < 3; j ++ ) {

			const e00 = i + j;
			const e01 = ( i + j ) % 3;
			const e10 = vertMap[ e00 ];
			const e11 = vertMap[ e01 ];

			indexArr.push( e00 );
			indexArr.push( e10 );
			indexArr.push( e11 );

			indexArr.push( e00 );
			indexArr.push( e01 );
			indexArr.push( e11 );

		}

	}

	const indexAttr = new THREE.BufferAttribute( new Uint32Array( indexArr ), 1, false );
	shadowGeom.setIndex( indexAttr );

	return shadowGeom;

}

function shadowVolumeShaderMixin( shader ) {

	const newShader = Object.assign( shader );
	newShader.uniforms = THREE.UniformsUtils.merge( [ {
		lightInfo: {
			value: new THREE.Vector4()
		},
		shadowDistance: {
			value: 1
		}
	}, shader.uniforms ] );

	// TODO: We may need the world normal matrix for this

	newShader.vertexShader =
		`
		uniform vec4 lightInfo;
		uniform float shadowDistance;
		${ newShader.vertexShader }
		`
			.replace( /#ifdef USE_ENVMAP([\s\S]+)?#endif/, ( v, match ) => match )
			.replace( /<project_vertex>/, v =>
				`${v}
				{
					vec3 projVec;
					if (lightInfo.w == 0.0) { 		// point light
						vec3 pos = lightInfo.xyz;
						projVec = mvPosition.xyz - pos;
					} else { 						// directional light
						projVec = lightInfo.xyz;
					}
					// projVec = normalize(projVec);

					float facing = dot(projVec, transformedNormal);
					float dist = step(0.0, facing) * shadowDistance;
					// mvPosition.xyz += dist * projVec;
					mvPosition.xyz += transformedNormal * 5.0;
					gl_Position = projectionMatrix * mvPosition;
				}
			` );

	console.log(newShader)

	return newShader;

}

function getShadowVolumeMaterial() {

	const shader = shadowVolumeShaderMixin( THREE.ShaderLib.phong );
	const material = new THREE.ShaderMaterial( shader );
	material.lights = true;
	return material;

}
