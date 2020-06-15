// http://download.autodesk.com/us/systemdocs/help/2011/lustre/index.html?url=./files/WSc4e151a45a3b785a24c3d9a411df9298473-7ffd.htm,topicNumber=d0e9492

import {
	Loader,
	FileLoader,
	Vector3,
	DataTexture,
	RGBFormat,
	UnsignedByteType,
	ClampToEdgeWrapping,
	LinearFilter,
} from '//unpkg.com/three@0.116.1/build/three.module.js';

export class LUT3dlLoader extends Loader {

	load( url, onLoad, onProgress, onError ) {

		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'text' );
		loader.load( url, text => {

			try {

				onLoad( this.parse( text ) );

			} catch( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	}

	parse( str ) {

		// TODO: b grows first, then g, then r

		str = str
			.replace( /^#.*?(\n|\r)/gm, '' )
			.replace( /^\s*?(\n|\r)/gm, '')
			.trim();

		const lines = str.split( /[\n\r]+/g );
		const gridLines = lines[ 0 ].trim().split( /\s+/g ).map( e => parseFloat( e ) );
		const gridWidth = gridLines[ 1 ] - gridLines[ 0 ];

		for ( let i = 1, l = gridLines.length; i < l; i ++ ) {

			if ( gridWidth !== ( gridLines[ i ] - gridLines[ i - 1 ] ) ) {

				throw new Error( 'LUT3dlLoader: Inconsistent grid size no supported.' );

			}

		}

		let size = gridLines.length;
		let maxOutputValue = 0.0;
		const domainMin = new Vector3( 0, 0, 0 );
		const domainMax = new Vector3( 1, 1, 1 );

		const dataArray = new Array( size * size * size * 3 );
		let index = 0;
		for ( let i = 1, l = lines.length; i < l; i ++ ) {

			const line = lines[ i ].trim();
			const split = line.split( /\s/g );

			const r = parseFloat( split[ 0 ] );
			const g = parseFloat( split[ 1 ] );
			const b = parseFloat( split[ 2 ] );
			maxOutputValue = Math.max( maxOutputValue, r, g, b );

			const bLayer = index % size;
			const gLayer = Math.floor( index / size ) % size;
			const rLayer = Math.floor( index / ( size * size ) ) % size;

			const pixelIndex = bLayer * size * size + gLayer * size + rLayer;
			dataArray[ 3 * pixelIndex + 0 ] = r;
			dataArray[ 3 * pixelIndex + 1 ] = g;
			dataArray[ 3 * pixelIndex + 2 ] = b;
			index += 1;

		}

		const bits = Math.ceil( Math.log2( maxOutputValue ) );
		const maxBitValue = Math.pow( 2.0, bits );
		for ( let i = 1, l = dataArray.length; i < l; i ++ ) {

			const val = dataArray[ i ];
			dataArray[ i ] = 255 * val / maxBitValue;

		}

		const data = new Uint8Array( dataArray );
		const texture = new DataTexture();
		texture.image.data = data;
		texture.image.width = size;
		texture.image.height = size * size;
		texture.format = RGBFormat;
		texture.type = UnsignedByteType;
		texture.magFilter = LinearFilter;
		texture.generateMipmaps = false;
		// texture.flipY = true;
		texture.needsUpdate = true;

		return {
			size,
			domainMin,
			domainMax,
			texture,
			lut: {
				texture,
				size,
			}
		};

	}

}
