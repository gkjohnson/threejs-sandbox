// VMT: https://developer.valvesoftware.com/wiki/VMT

THREE.VMTLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.VMTLoader.prototype = {

	constructor: THREE.VMTLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'text' );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text, url ) );

		}, onProgress, onError );

	},

	// TODO: Fix this url use and follow the "path" pattern of other loaders
	parse: function ( string, url ) {

		let type = null;
		let root = null;
		const objects = [];
		let currData = '';
		for ( let i = 0, l = string.length; i < l; i ++ ) {

			const c = string[ i ];
			if ( c === '{' ) {

				const newObj = {};
				if ( objects.length === 0 ) {

					type += currData;

				} else {

					objects[ objects.length - 1 ][ currData.trim() ] = newObj;

				}

				objects.push( newObj );
				if ( root === null ) root = newObj;

				currData = '';

			} else if ( c === '}' ) {

				objects.pop();

			} else if ( c === '\n' ) {

				if ( objects.length === 0 ) {

					type += currData;

				} else {

					const tokens = currData.trim().split( /\s+/ );
					if ( tokens.length >= 2 ) {

						let [ name, contents ] = tokens.map( t => t.replace( /"/g, '' ) );

						if ( /^\[/.test( contents ) ) {

							contents = contents
								.replace( /[\[\]]/g, '' )
								.split( /\s+/g )
								.map( n => parseFloat( n ) );

						} else if ( /^\d*\.?\d*$/.test( contents ) ) {

							contents = parseFloat( contents );

						}

						objects[ objects.length - 1 ][ name ] = contents;


					}

				}
				currData = '';

			} else {

				currData += c;

			}

		}

		// TODO: Repeat wrapping should be handled in the VFT loads
		const urlTokens = url.split( /materials/i );
		urlTokens.pop();

		const path = `${ urlTokens.join( 'materials' ) }materials/`;
		const material = new THREE.MeshPhongMaterial();
		const vtfLoader = new THREE.VTFLoader( this.manager );
		for ( const key in root ) {

			// TODO: Use more keys
			// TODO: bump map is causing all normals to disappear here
			const field = root[ key ];
			switch ( key.toLowerCase() ) {

				case '$basetexture':
					material.map = vtfLoader.load( `${ path }${ field }.vtf` );
					material.map.wrapS = THREE.RepeatWrapping;
					material.map.wrapT = THREE.RepeatWrapping;
					break;
				case '$bumpmap':
					material.normalMap = vtfLoader.load( `${ path }${ field }.vtf` );
					material.normalMap.wrapS = THREE.RepeatWrapping;
					material.normalMap.wrapT = THREE.RepeatWrapping;
					break;
				case '$phongexponenttexture':
					// NOTE: This doesn't quite map appropriately to a specular map
					material.specularMap = vtfLoader.load( `${ path }${ field }.vtf` );
					material.specularMap.wrapS = THREE.RepeatWrapping;
					material.specularMap.wrapT = THREE.RepeatWrapping;
					break;

			}

		}

		return material;

	}

};
