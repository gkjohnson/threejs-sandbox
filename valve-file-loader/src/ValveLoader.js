THREE.ValveLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.ValveLoader.prototype = {

	constructor: THREE.ValveLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		function toGeometryInfo( buffer, strip, stripGroup ) {

			const dataView = new DataView( buffer );
			const indexCount = strip.numIndices ? strip.numIndices : strip.numVerts;
			const indexArray = new Uint16Array( indexCount );

			for ( let i = 0; i < indexCount; i ++ ) {

				let index = i;
				if ( strip.numIndices ) {

					index = dataView.getUint16( stripGroup.indexDataStart + ( strip.indexOffset + index ) * 2, true );

				}

				// TODO: What do we do with vert offset?
				// const offset = stripGroup.vertexDataStart + ( strip.vertOffset + index ) * 9;
				const offset = stripGroup.vertexDataStart + ( index ) * 9;
				const origMeshVertID = dataView.getUint16( offset + 4, true );
				indexArray[ i ] = origMeshVertID;

			}


			return new THREE.BufferAttribute( indexArray, 1, false );

		}

		const mdlpr = new Promise( ( resolve, reject ) => {

			new THREE.MDLLoader( this.manager ).load( `${ url }.mdl`, resolve, undefined, reject );

		} );

		const vvdpr = new Promise( ( resolve, reject ) => {

			new THREE.VVDLoader( this.manager ).load( `${ url }.vvd`, resolve, undefined, reject );

		} );

		const vtxpr = new Promise( ( resolve, reject ) => {

			new THREE.VTXLoader( this.manager ).load( `${ url }.dx90.vtx`, resolve, undefined, reject );

		} );

		Promise
			.all( [ mdlpr, vvdpr, vtxpr ] )
			.then( ( [ mdl, vvd, vtx ] ) => {

				if ( mdl.header.checksum !== vvd.header.checksum || mdl.header.checksum !== vtx.header.checksum ) {

					console.warn( 'ValveLoader: File checksums do not match' );

				}
				console.log( mdl, vvd, vtx )

				const group = new THREE.Group();

				vtx.bodyParts.forEach( bp => {

					bp.models.forEach( model => {

						model.lods.forEach( lod => {

							lod.meshes.forEach( mesh => {

								mesh.stripGroups.forEach( sg => {

									const obj = new THREE.Object3D();

									sg.strips.forEach( s => {

										// if ( s.indexOffset !== 0 || s.numIndices === 0 ) return;
										console.log( s.flags, s );

										// TODO: for some reason the indices seem to be garbage?
										// Probably because we're not using the strip index and vert offsets
										var geometry = new THREE.BufferGeometry();
										// geometry.setIndex( sg.indexAttribute );
										geometry.setIndex( toGeometryInfo( vtx.buffer, s, sg ) );
										geometry.addAttribute( 'position', vvd.attributes.position );
										geometry.addAttribute( 'uv', vvd.attributes.uv );
										geometry.addAttribute( 'normal', vvd.attributes.normal );

										// geometry.addGroup( s.numIndices, s.indexOffset, 0 );

										// var mesh = new THREE.Points( geometry, new THREE.PointsMaterial( { size: .1 } ) );//, new THREE.MeshPhongMaterial() );
										var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) );
										// if ( s.flags & 2  ) mesh.drawMode = THREE.TriangleStripDrawMode;

										// console.log(mesh)
										obj.add( mesh );

									} );

									group.add( obj );

								} );

							} );

						} );

					} );

				} );

				onLoad( group );


			} );

	}

};
