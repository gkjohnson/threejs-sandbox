// VVD: https://developer.valvesoftware.com/wiki/VVD

THREE.VVDLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.VVDLoader.prototype = {

	constructor: THREE.VVDLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );

	},

	parse: function ( buffer ) {

		// https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/sp/src/public/studio.h#L398
		const MAX_NUM_LODS = 8;
		const MAX_NUM_BONES_PER_VERT = 3;

		// struct vertexFileHeader_t
		function parseHeader( buffer ) {

			var dataView = new DataView( buffer );
			var i = 0;

			// int
			var id = dataView.getInt32( i, true );
			i += 4;

			// int
			var version = dataView.getInt32( i, true );
			i += 4;

			// long
			var checksum = dataView.getInt32( i, true );
			i += 4;

			// int
			var numLODs = dataView.getUint32( i, true );
			i += 4;

			// int
			var numLODVertexes = [];
			for ( var j = 0; j < MAX_NUM_LODS; j ++ ) {

				numLODVertexes.push( dataView.getInt32( i, true ) );
				i += 4;

			}

			// int
			var numFixups = dataView.getInt32( i, true );
			i += 4;

			// int
			var fixupTableStart = dataView.getInt32( i, true );
			i += 4;

			// int
			var vertexDataStart = dataView.getInt32( i, true );
			i += 4;

			// int
			var tangentDataStart = dataView.getInt32( i, true );
			i += 4;

			return {
				id,
				version,
				checksum,
				numLODs,
				numLODVertexes,
				numFixups,
				fixupTableStart,
				vertexDataStart,
				tangentDataStart,
				buffer
			};

		}

		function parseFixups( buffer, numFixups, fixupTableStart ) {

			var dataView = new DataView( buffer );
			var offset = fixupTableStart;
			var res = [];
			for ( var i = 0; i < numFixups; i ++ ) {

				var fixup = {};
				fixup.lod = dataView.getInt32( offset + 0, true );
				fixup.sourceVertexID = dataView.getInt32( offset + 4, true );
				fixup.numVertexes = dataView.getInt32( offset + 8, true );
				offset += 12;

				res.push( fixup );

			}

			return res;

		}

		function getBufferAttribute( buffer, header ) {

			var len = header.tangentDataStart - header.vertexDataStart;
			var interleavedFloat32Array = new Float32Array( buffer, header.vertexDataStart, len / 4 );
			var interleavedFloat32Buffer = new THREE.InterleavedBuffer( interleavedFloat32Array, 48 / 4 );
			var interleavedUint8Array = new Uint8Array( buffer, header.vertexDataStart, len );
			var interleavedUint8Buffer = new THREE.InterleavedBuffer( interleavedUint8Array, 48 );

			return {

				skinWeight: new THREE.InterleavedBufferAttribute( interleavedFloat32Buffer, 3, 0, false ),
				skinIndex: new THREE.InterleavedBufferAttribute( interleavedUint8Buffer, 3, 12, false ),
				numBones: new THREE.InterleavedBufferAttribute( interleavedUint8Buffer, 1, 15, false ),

				position: new THREE.InterleavedBufferAttribute( interleavedFloat32Buffer, 3, 4, false ),
				normal: new THREE.InterleavedBufferAttribute( interleavedFloat32Buffer, 3, 7, false ),
				uv: new THREE.InterleavedBufferAttribute( interleavedFloat32Buffer, 2, 10, false ),

			};

		}

		var header = parseHeader( buffer );
		var fixups = parseFixups( buffer, header.numFixups, header.fixupTableStart );
		var attributes = getBufferAttribute( buffer, header );

		return { header, fixups, attributes, buffer };

	}

};
