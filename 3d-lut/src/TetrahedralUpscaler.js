import { Triangle, Plane, Vector3 } from 'three';

const _triangle = new Triangle();
const _plane = new Plane();
const P0 = new Vector3();
const P1 = new Vector3();
const P2 = new Vector3();
const P3 = new Vector3();
const P = new Vector3();

function calculateTetrahedronVolume( a, b, c, d ) {
	
	_triangle.a.copy( a );
	_triangle.b.copy( b );
	_triangle.c.copy( c );
	
	_plane.setFromCoplanarPoints( a, b, c );
	
	const height = _plane.distanceToPoint( d );
	
	return height * _triangle.getArea() / 3;
	
}

function sample( dataTexture, x, y, z, target ) {

	const { width, height, depth, array } = dataTexture.image;
	const index = x + y * width + z * width * height;
	const divisor = array instanceof Float32Array ? 1 : ( 1 << ( array.BYTES_PER_ELEMENT * 8 ) );
    
	target[ 0 ] = array[ 3 * index + 0 ] / divisor;
	target[ 1 ] = array[ 3 * index + 1 ] / divisor;
	target[ 2 ] = array[ 3 * index + 2 ] / divisor;

}

// http://www.ijetch.org/papers/318-T860.pdf
function tetrahedralSample( dataTexture, u, v, w ) {

	const { width, depth, height } = dataTexture.image;
    
	let points;
	if ( u > v && v > w ) {
        
		// T1
		points = [
			[ 0, 0, 0 ],
			[ 1, 0, 0 ],
			[ 1, 1, 0 ],
			[ 1, 1, 1 ],
		];
		
	} else if ( u > w && w > v ) {
    
		// T2
		points = [
			[ 0, 0, 0 ],
			[ 1, 0, 0 ],
			[ 1, 0, 1 ],
			[ 1, 1, 1 ],
		];
        
	} else if ( w > u && u > v ) { 

		// T3
		points = [
			[ 0, 0, 0 ],
			[ 0, 0, 1 ],
			[ 1, 0, 1 ],
			[ 1, 1, 1 ],
		];
        
	} else if ( v > u && u > w ) { 
        
		// T4
		points = [
			[ 0, 0, 0 ],
			[ 0, 1, 0 ],
			[ 1, 1, 0 ],
			[ 1, 1, 1 ],
		];
        
	} else if ( v > w && w > u ) {
    
		// T5
		points = [
			[ 0, 0, 0 ],
			[ 0, 1, 0 ],
			[ 0, 1, 1 ],
			[ 1, 1, 1 ],
		];
        
	} else if ( w > v && v > u ) {
        
		// T6
		points = [
			[ 0, 0, 0 ],
			[ 0, 0, 1 ],
			[ 0, 1, 1 ],
			[ 1, 1, 1 ],
		];

	}

	// TODO calculate the volume of the three prisms formed by the given points and the point to interpolate.
	P0.set( ...points[ 0 ] );
	P1.set( ...points[ 1 ] );
	P2.set( ...points[ 2 ] );
	P3.set( ...points[ 3 ] );
	P.set( u, v, w );
	
	const V = calculateTetrahedronVolume( P0, P1, P2, P3 );
	const V0 = calculateTetrahedronVolume( P1, P2, P3, P );
	const V1 = calculateTetrahedronVolume( P0, P2, P3, P );
	const V2 = calculateTetrahedronVolume( P0, P1, P3, P );

}
