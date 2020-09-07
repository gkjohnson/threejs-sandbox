function shuffleArray( array, random = Math.random ) {

	for ( let i = array.length - 1, l = 0; i > 0; i -- ) {
		
		const replaceIndex = ~ ~ ( ( random() - 1e-6 ) * i );
		const tmp = array[ i ];
		array[ i ] = array[ replaceIndex ];
		array[ replaceIndex ] = tmp;
		
	}

}
