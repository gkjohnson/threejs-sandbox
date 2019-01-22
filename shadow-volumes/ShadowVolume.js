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

					#ifdef FLIP_SIDED
						transformedNormal *= -1.0;
					#endif

					float facing = dot(projVec.xyz, transformedNormal);
					float dist = step(0.0, facing) * shadowDistance + shadowBias;
					mvPosition.xyz += dist * projVec.xyz;
					gl_Position = projectionMatrix * mvPosition;
				}
			` );

	return newShader;

}

class ShadowVolumeMaterial extends THREE.ShaderMaterial {

	constructor( source = THREE.ShaderLib.basic ) {

		super( shadowVolumeShaderMixin( source ) );

	}

	setLight( light ) {

		// TODO: get position in world space
		const vec = this.uniforms.lightInfo.value;
		if ( light.isPointLight ) {

			vec.copy( light.position );
			vec.w = 1.0;

		} else {

			vec.copy( light.position ).sub( light.target.position );
			vec.w = 0.0;

		}

	}

	setShadowDistance( dist ) {

		this.uniforms.shadowDistance.value = dist;

	}

	setShadowBias( bias ) {

		this.uniforms.shadowBias.value = bias;

	}

	clone() {

		const newMat = new ShadowVolumeMaterial();
		newMat.copy( this );
		return newMat;

	}

}

class ShadowVolumeMesh extends THREE.Group {

	get shadowGeometry() {

		return this.children[ 0 ].geometry;

	}

	constructor( target, geometry, renderer ) {

		super();

		function incrFunc() {

			if ( ! target.isSkinnedMesh ) this.matrixWorld.copy( target.matrixWorld );
			stencilBuffer.setTest( true );
			stencilBuffer.setFunc( gl.ALWAYS, 0, 0xff );
			stencilBuffer.setOp( gl.KEEP, gl.KEEP, gl.INCR_WRAP );

		}

		function decrFunc() {

			if ( ! target.isSkinnedMesh ) this.matrixWorld.copy( target.matrixWorld );
			stencilBuffer.setTest( true );
			stencilBuffer.setFunc( gl.ALWAYS, 0, 0xff );
			stencilBuffer.setOp( gl.KEEP, gl.KEEP, gl.DECR_WRAP );

		}

		function noteqFunc() {

			if ( ! target.isSkinnedMesh ) this.matrixWorld.copy( target.matrixWorld );
			stencilBuffer.setTest( true );
			stencilBuffer.setFunc( gl.NOTEQUAL, 0, 0xff );
			stencilBuffer.setOp( gl.REPLACE, gl.REPLACE, gl.REPLACE );

		}

		function disableFunc() {

			stencilBuffer.setTest( false );

		}

		const stencilBuffer = renderer.state.buffers.stencil;
		const gl = renderer.context;
		const shadowVolumeGeometry = getDynamicShadowVolumeGeometry( geometry );

		// Materials
		const frontMaterial = new ShadowVolumeMaterial();
		frontMaterial.side = THREE.FrontSide;
		frontMaterial.colorWrite = false;
		frontMaterial.depthWrite = false;
		frontMaterial.depthTest = true;
		frontMaterial.depthFunc = THREE.LessDepth;
		frontMaterial.skinning = target.isSkinnedMesh;

		const backMaterial = new ShadowVolumeMaterial();
		frontMaterial.side = THREE.BackSide;
		backMaterial.colorWrite = false;
		backMaterial.depthWrite = false;
		backMaterial.depthTest = true;
		backMaterial.depthFunc = THREE.LessDepth;
		backMaterial.skinning = target.isSkinnedMesh;

		const tintMaterial = new ShadowVolumeMaterial();
		tintMaterial.side = THREE.BackSide;
		tintMaterial.depthWrite = false;
		tintMaterial.depthTest = false;
		tintMaterial.uniforms.diffuse.value.set( 0 );
		tintMaterial.uniforms.opacity.value = 0.25;
		tintMaterial.transparent = true;
		tintMaterial.skinning = target.isSkinnedMesh;

		// Meshes
		const frontMesh = new target.constructor( shadowVolumeGeometry, frontMaterial );
		frontMesh.renderOrder = 1;
		frontMesh.onBeforeRender = incrFunc;
		frontMesh.onAfterRender = disableFunc;
		frontMesh.autoUpdateMatrixWorld = false;
		frontMesh.skeleton = target.skeleton;

		const backMesh = new target.constructor( shadowVolumeGeometry, backMaterial );
		backMesh.renderOrder = 1;
		backMesh.onBeforeRender = decrFunc;
		backMesh.onAfterRender = disableFunc;
		backMesh.autoUpdateMatrixWorld = false;
		backMesh.skeleton = target.skeleton;

		const tintMesh = new target.constructor( shadowVolumeGeometry, tintMaterial );
		tintMesh.renderOrder = 2;
		tintMesh.onBeforeRender = noteqFunc;
		tintMesh.onAfterRender = disableFunc;
		tintMesh.autoUpdateMatrixWorld = false;
		tintMesh.skeleton = target.skeleton;

		// Add meshes to group
		this.add( frontMesh );
		this.add( backMesh );
		this.add( tintMesh );

		// Intersect Cap
		const frontMaterial2 = frontMaterial.clone();
		frontMaterial2.depthTest = false;

		const backMaterial2 = backMaterial.clone();
		backMaterial2.depthTest = false;

		const frontMesh2 = new target.constructor( shadowVolumeGeometry, frontMaterial2 );
		frontMesh2.renderOrder = 1;
		frontMesh2.onBeforeRender = decrFunc;
		frontMesh2.onAfterRender = disableFunc;
		frontMesh2.autoUpdateMatrixWorld = false;
		frontMesh2.skeleton = target.skeleton;

		const backMesh2 = new target.constructor( shadowVolumeGeometry, backMaterial2 );
		backMesh2.renderOrder = 1;
		backMesh2.onBeforeRender = incrFunc;
		backMesh2.onAfterRender = disableFunc;
		backMesh2.autoUpdateMatrixWorld = false;
		backMesh2.skeleton = target.skeleton;

		this.add( frontMesh2 );
		this.add( backMesh2 );

	}

	setLight( light ) {

		this.children.forEach( c => c.material.setLight( light ) );

	}

	setShadowDistance( distance ) {

		this.children.forEach( c => c.material.setShadowDistance( distance ) );

	}

	setShadowBias( bias ) {

		this.children.forEach( c => c.material.setShadowBias( bias ) );

	}

	setIntensity( intensity ) {

		this.children[ 2 ].material.uniforms.opacity.value = intensity;

	}

}
