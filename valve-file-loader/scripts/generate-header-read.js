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
			switch ( type ) {

				case 'int':
					const func = unsigned ? 'getUint32' : 'getInt32';
					result.push( `var ${ name } = dataView.${ func }( i, true );` );
					result.push( `i += 4;` );
					break;

				case 'byte':
					result.push( `var ${ name } = dataView.getUint8( i, true );` );
					result.push( `i += 1;` );

				case 'float':
					result.push( `var ${ name } = dataView.getFloat32( i, true );` );
					result.push( `i += 4;` );
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
