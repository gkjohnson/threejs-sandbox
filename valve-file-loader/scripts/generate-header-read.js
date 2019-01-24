const fs = require( 'fs' );
const fields = [];
const lines =
	fs.readFileSync( './header.txt', { encoding: 'utf8' } )
		.replace( /\/\*[\s\S]*?\*\//g, '' )
		.replace( /\/\/.*?[\n]/g, '\n' )
		.split( /\n/g )
		.map( l => l.trim() )
		.filter( l => ! ! l )
		.map( l => {

			const tokens = /(unsigned)?\s*(\S+)\s+(\w+)/.exec( l );
			const unsigned = tokens[ 1 ] || null;
			const type = tokens[ 2 ];
			const name = tokens[ 3 ].replace( /_(\w)/g, ( match, c ) => c.toUpperCase() );

			const result = [ `// ${ type }` ];
			let func;
			switch ( type ) {

				case 'int':
					func = unsigned ? 'getUint32' : 'getInt32';
					result.push( `var ${ name } = dataView.${ func }( i, true );` );
					result.push( `i += 4;` );
					break;

				case 'char':
				case 'byte':
					func = ( unsigned || type === 'byte' ) ? 'getUint8' : 'getInt8';
					result.push( `var ${ name } = dataView.${ func }( i, true );` );
					result.push( `i += 1;` );
					break;

				case 'float':
					result.push( `var ${ name } = dataView.getFloat32( i, true );` );
					result.push( `i += 4;` );
					break;

				case 'short':
					func = unsigned ? 'getUint16' : 'getInt16';
					result.push( `var ${ name } = dataView.${ func }( i, true );` );
					result.push( `i += 2;` );
					break;

				case 'long':
					result.push( `var ${ name } = dataView.getBigInt64( i, true );` );
					result.push( `i += 8;` );
					break;

				case 'Vector':
					result.push( `var ${ name } = new THREE.Vector3();` );
					result.push( `${ name }.x = dataView.getFloat32( i + 0, true );` );
					result.push( `${ name }.y = dataView.getFloat32( i + 4, true );` );
					result.push( `${ name }.z = dataView.getFloat32( i + 8, true );` );
					result.push( `i += 12;` );
					break;

				default:
					result.push( `var ${ name } = UNHANDLED;` );

			}

			fields.push( name );

			return result.join( '\n' );

		} );

lines.push(
	`return {\n${
		fields
			.map( n => `    ${ n }` )
			.join( ',\n' )
	}\n};`
);
console.log( lines.join( '\n\n' ) );
