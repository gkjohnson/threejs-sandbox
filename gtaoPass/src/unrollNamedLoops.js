let tempDefines = null;
function loopReplacer( match, varName, start, end, snippet ) {

	const loopStart = parseInt( start in tempDefines ? tempDefines[ start ] : start );
	const loopEnd = parseInt( end in tempDefines ? tempDefines[ end ] : end );

	let string = '';
	const varRegexp = new RegExp( ` ${ varName }( |;)`, 'g' );
	for ( let i = loopStart; i < loopEnd; i ++ ) {

		string += ' { ';
		string += snippet
			.replace( varRegexp, ` ${ i }$1` );
		string += ' } '

	}

	return string;

}

export function unrollNamedLoops( string, defines ) {

	const matches = string.match( /#pragma unroll_named_loop_start ([a-zA-Z_]+)/g );
	if ( ! matches ) return string;

	tempDefines = defines;

	const names = matches.map( m => m.split( / +/g ).pop() ).reverse();

	let res = string;
	for ( const key in names ) {

		const name = names[ key ];
		const re = new RegExp(
			`#pragma unroll_named_loop_start ${ name }[\\s]+?for \\( int (\\w) \\= (\\d+)\\; \\w < ([0-9A-Za-z_]+)\\; \\w \\+\\+ \\) \\{([\\s\\S]+?)(?=\\})\\}[\\s]+?#pragma unroll_named_loop_end ${ name }`, 'g' );

		res = res.replace( re, loopReplacer );

	}

	tempDefines = null;
	return res;

}
