
// Splice a new string into the target string
function splice( str, start, delCount, newSubStr ) {

	return str.slice( 0, start ) + newSubStr + str.slice( start + delCount );

}

// Parse the global variables with the given prefix out
function parseGlobals( prefix, text ) {

	// Find the declarations
	const result = [];
	const regex = new RegExp( `${ prefix }\s+(.*)?\s+(.*)?\s*;`, 'g' );
	let lastResult = null;
	while ( lastResult = regex.exec( text ) ) {

		const wholeMatch = lastResult[ 0 ];
		const beginning = text.match( new RegExp( `^.*${ wholeMatch }` ) );

		const lines = beginning.split( /\n/g );
		const line = lines.length - 1;
		const column = lines[ lines.length - 1 ].length;

		const type = lastResult[ 1 ];
		const name = lastResult[ 2 ];
		result.push( {

			line,
			column,
			type,
			name,

		} );

	}

	return result;

}

// Find the local variables of main
function parseLocalVariables( text ) {

	const result = [];
	const mainRegex = /void\s*main\s*\(.*?\)[\s\S]*\{/;
	const startIndex = mainRegex.exec( text ).index;

	const braceRegex = /[{}]/g;
	braceRegex.index = startIndex;

	let lastResult = null;
	let braceIndices = [ startIndex ];
	while ( lastResult = braceRegex.exec( text ) && braceIndices.length !== 0 ) {

		const brace = lastResult[ 0 ];
		if ( brace === '{' ) {

			braceIndices.push( lastResult.index );

		} else {

			const startIndex = braceIndices.pop();
			const endIndex = lastResult.index;

			result.push( ...parseDeclarations( text, startIndex, endIndex ) );
			for ( let i = 0, l = result.length; i < l; i ++ ) {

				result[ i ].scope = braceIndices.length;

			}

			const content = text.substr( startIndex, endIndex );
			const replaced = content.replace( /[^\n]/g, ' ' );
			text = splice( text, startIndex, endIndex - startIndex, replaced );

		}

	}

	// Sort the variables to be in line first order, character order next
	result.sort( ( a, b ) => {

		if ( a.line !== b.line ) {

			return a.line - b.line;

		} else {

			return a.column - b.column;

		}

	} );

	// Find any local variables tha didn't have types found
	for ( let i = 0, l = result.length; i < l; i ++ ) {

		const item = result[ i ];
		if ( item.type === null ) {

			const name = item.name;
			for ( let j = i; j >= 0; j -- ) {

				const otherItem = result[ j ];
				if ( otherItem.scope <= item.scope && otherItem.name === name && otherItem.type ) {

					item.type = otherItem.type;
					break;

				}

			}

		}

	}

	return result;

}

function parseDeclarations( body, startIndex, endIndex ) {

	body = body.substr( 0, endIndex );

	const result = [];
	const declarationRegex = /(vec[1234]|float|int|bool).+?;/g;
	declarationRegex.index = startIndex;
	let lastResult = null;
	while ( lastResult = declarationRegex.exec( body ) ) {

		const line = lastResult[ 0 ];
		const type = lastResult[ 1 ];
		const index = lastResult.index;

		const beginning = body.substr( 0, index );
		const lines = beginning.split( /\n/g );
		const lineCount = lines.length;
		const column = lines[ lines.length - 1 ].length;

		const splits = line.split( ',' );
		for( let i = 0, l = splits.length; i < l; i ++ ) {

			const item = splits[ i ];
			let name;
			if ( /=/.test( item ) ) {

				name = item.split( '=' )[ 0 ].trim();

			} else {

				name = item.trim();

			}

			result.push( {

				line: lineCount,
				column,
				type,
				name

			} );

		}

		const replaced = line.replace( /[^\n]/g, ' ' );
		body = splice( body, index - line.length, line.length, replaced );

	}

	const semiRegexp = /;/g;
	const setRegexp = /(\w+?)\s*=\s*\w+?(;|,)/g;
	setRegexp.index = startIndex;
	while ( lastResult = setRegexp.exec( body ) ) {

		const name = lastResult[ 1 ];

		semiRegexp.index = lastResult.index;
		semiRegexp.exec( body );
		const index = semiRegexp.index;

		const beginning = body.substr( 0, index );
		const lines = beginning.split( /\n/g );
		const lineCount = lines.length;
		const column = lines[ lines.length - 1 ].length;

		result.push( {

			line: lineCount,
			column,
			type: null,
			name,

		} );

	}

	// TODO: remove duplicates?

	return result;

}

// Collect the uniforms, attributes, varyings, and locals used in a given shader main function
function getVariables( text ) {

	// If there's no main function lets bail
	const mainRegex = /void\s*main\s*\(.*?\)[\s\S]*\{([\s\S]*)\}/;
	const matches = text.match( mainRegex );
	if ( ! matches ) {

		return null;

	}

	// Get the globals
	const varyings = parseGlobals( 'varying', text );
	const uniforms = parseGlobals( 'uniform', text );
	const attributes = parseGlobals( 'attribute', text );

	// Get the locals
	const localVariables = parseLocalVariables( text );

	return {

		varyings,
		uniforms,
		attributes,
		localVariables

	};

}
