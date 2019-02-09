// VTF: https://developer.valvesoftware.com/wiki/Valve_Texture_Format

// TODO: The mipmap filter type needs to be updated to LinearFilter for some reason
// TODO: get cube maps, animations, volume textures
THREE.VTFLoader = function ( manager ) {

	THREE.CompressedTextureLoader.call( this, manager );

	this._parser = THREE.VTFLoader.parse;

};

THREE.VTFLoader.prototype = Object.create( THREE.CompressedTextureLoader.prototype );
THREE.VTFLoader.prototype.constructor = THREE.VTFLoader;

THREE.VTFLoader.parse = function ( buffer, loadMipmaps ) {

	function bgrToRgb( buffer, stride ) {

		for ( var i = 0, l = buffer.length; i < l; i += stride ) {

			var b = buffer[ i ];
			var r = buffer[ i + 2 ];
			buffer[ i ] = r;
			buffer[ i + 2 ] = b;

		}

	}

	function parseHeader( buffer ) {

		var dataView = new DataView( buffer );
		var i = 0;
		var signature = '';
		for ( var j = 0; j < 4; j ++ ) {

			signature += String.fromCharCode( dataView.getUint8( i, true ) );
			i ++;

		}

		var version = [ dataView.getUint32( i, true ), dataView.getUint32( i + 4, true ) ];
		i += 8;

		var headerSize = dataView.getUint32( i, true );
		i += 4;

		var width = dataView.getUint16( i, true );
		i += 2;

		var height = dataView.getUint16( i, true );
		i += 2;

		var flags = dataView.getUint32( i, true );
		i += 4;

		var frames = dataView.getUint16( i, true );
		i += 2;

		var firstFrame = dataView.getUint16( i, true );
		i += 2;

		// padding0
		i += 4;

		var reflectivity = [];
		for ( var j = 0; j < 3; j ++ ) {

			reflectivity.push( dataView.getFloat32( i, true ) );
			i += 4;

		}

		// padding1
		i += 4;

		var bumpmapScale = dataView.getFloat32( i, true );
		i += 4;

		var highResImageFormat = dataView.getUint32( i, true );
		i += 4;

		var mipmapCount = dataView.getUint8( i, true );
		i += 1;

		var lowResImageFormat = dataView.getUint32( i, true );
		i += 4;

		var lowResImageWidth = dataView.getUint8( i, true );
		i += 1;

		var lowResImageHeight = dataView.getUint8( i, true );
		i += 1;

		// 7.2+
		var depth = dataView.getUint16( i, true );
		i += 2;

		// 7.3+
		// padding2
		i += 3;

		var numResources = dataView.getUint32( i, true );
		i += 4;

		return {
			signature,
			version,
			headerSize,
			width,
			height,
			flags,
			frames,
			firstFrame,
			reflectivity,
			bumpmapScale,
			highResImageFormat,
			mipmapCount,
			lowResImageFormat,
			lowResImageWidth,
			lowResImageHeight,
			depth,
			numResources
		};

	}

	function getMipMap( buffer, offset, format, width, height ) {

		var dxtSz = Math.max( 4, width ) / 4 * Math.max( 4, height ) / 4;
		var threeFormat = null;
		var byteArray = null;

		switch ( format ) {

			case 3: // BGR888
				var dataLength = width * height * 3;
				byteArray = new Uint8Array( buffer, offset, dataLength );
				bgrToRgb( byteArray, 3 );
				threeFormat = THREE.RGBFormat;
				break;
			case 12: // BGRA8888
				var dataLength = width * height * 4;
				byteArray = new Uint8Array( buffer, offset, dataLength );
				bgrToRgb( byteArray, 4 );
				threeFormat = THREE.RGBAFormat;
				break;
			case 13: // DXT1
				var dataLength = dxtSz * 8; // 8 blockBytes
				byteArray = new Uint8Array( buffer, offset, dataLength );
				threeFormat = THREE.RGB_S3TC_DXT1_Format;
				break;
			case 14: // DXT3
				var dataLength = dxtSz * 16; // 16 blockBytes
				byteArray = new Uint8Array( buffer, offset, dataLength );
				threeFormat = THREE.RGBA_S3TC_DXT3_Format;
				break;
			case 15: // DXT5
				var dataLength = dxtSz * 16; // 16 blockBytes
				byteArray = new Uint8Array( buffer, offset, dataLength );
				threeFormat = THREE.RGBA_S3TC_DXT5_Format;
				break;
			default:
				console.error( `VTFLoader: Format variant ${ format } is unsupported.` );
				return null;

		}

		return {

			format: threeFormat,
			data: byteArray,
			width,
			height

		};

	}

	function parseMipMaps( buffer, header ) {

		var offset = 80;
		if ( header.lowResImageHeight !== 0 ) {

			const lowResMap = getMipMap( buffer, offset, header.lowResImageFormat, header.lowResImageWidth, header.lowResImageHeight );
			offset += lowResMap.data.length;

			if ( header.version[ 0 ] > 7 || header.version[ 1 ] >= 3 ) {

				offset += header.headerSize - 80;

			}

		}

		var width = header.width >> ( header.mipmapCount - 1 );
		var height = header.height >> ( header.mipmapCount - 1 );

		// smallest to largest
		var mipmaps = [];
		for ( var i = 0; i < header.mipmapCount; i ++ ) {

			var map = getMipMap( buffer, offset, header.highResImageFormat, width, height );
			mipmaps.push( map );
			offset += map.data.length;

			width = width << 1;
			height = height << 1;

		}

		mipmaps = mipmaps.reverse();

		return {

			mipmaps: mipmaps,
			width: header.width,
			height: header.height,
			format: mipmaps[ 0 ].format,
			mipmapCount: mipmaps.length

		};

	}

	var header = parseHeader( buffer );
	return parseMipMaps( buffer, header );

};

THREE.VTFLoader.prototype.load = function ( ...args ) {

	const tex = THREE.CompressedTextureLoader.prototype.load.call( this, ...args );
	tex.minFilter = THREE.LinearFilter;
	tex.magFilter = THREE.LinearFilter;
	return tex;

};
