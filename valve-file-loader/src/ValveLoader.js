THREE.ValveLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.ValveLoader.prototype = {

	constructor: THREE.ValveLoader,

	load: function ( url, onLoad, onProgress, onError ) {

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

				const group = new THREE.Group();

				vtx.bodyParts.forEach( bp => {

					bp.models.forEach( model => {

						model.lods.forEach( lod => {

							lod.meshes.forEach( mesh => {

								mesh.stripGroups.forEach( sg => {

									const obj = new THREE.Object3D();

									sg.strips.forEach( s => {

										// TODO: for some reason the indices seem to be garbage?
										var geometry = new THREE.BufferGeometry();
										geometry.setIndex( sg.indexAttribute );
										geometry.addAttribute( 'position', vvd.attributes.position );
										geometry.addAttribute( 'uv', vvd.attributes.uv );
										geometry.addAttribute( 'normal', vvd.attributes.normal );

										geometry.addGroup( s.numIndices, s.indexOffset, 0 );

										// var mesh = new THREE.Points( geometry, new THREE.PointsMaterial( { size: .1 } ) );//, new THREE.MeshPhongMaterial() );
										var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { flatShading: true, side: THREE.DoubleSide } ) );
										if ( s.flags & 2 ) mesh.drawMode = THREE.TriangleStripDrawMode;

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
