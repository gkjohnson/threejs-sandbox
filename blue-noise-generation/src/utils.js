export function shuffleArray( array, random = Math.random ) {

	for ( let i = array.length - 1, l = 0; i > 0; i -- ) {
		
		const replaceIndex = ~ ~ ( ( random() - 1e-6 ) * i );
		const tmp = array[ i ];
		array[ i ] = array[ replaceIndex ];
		array[ replaceIndex ] = tmp;
		
	}

}

export function fillWithOnes( array, count ) {

	for ( let i = 0, l = array.length; i < l; i ++ ) {
	
		array[ i ] = i < count ? 1 : 0;
		
	}
	
}
