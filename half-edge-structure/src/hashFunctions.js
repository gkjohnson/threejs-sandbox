export function hashNumber( n, tolerance ) {

	return ~~( n / tolerance ).toString();

}

export function hashVector3( v, tolerance ) {

	return `${ hashNumber( v.x, tolerance ) },${ hashNumber( v.y, tolerance ) },${ hashNumber( v.z, tolerance ) }`;

}
