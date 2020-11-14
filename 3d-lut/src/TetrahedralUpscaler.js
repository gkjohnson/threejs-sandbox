import { Triangle, Plane, Vector3, Color, DataTexture3D } from '//unpkg.com/three@0.120.1/build/three.module.js';

// TODO: improve performance
const _triangle = new Triangle();
const _plane = new Plane();
const P = new Vector3();
const C0 = new Color();
const C1 = new Color();
const C2 = new Color();
const C3 = new Color();

const V = 1 / 6;

const min = new Vector3();
const max = new Vector3();
const tempVector = new Vector3();
const tempColor = new Color();

const T1 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 1, 0, 0 ),
	new Vector3( 1, 1, 0 ),
	new Vector3( 1, 1, 1 ),
];

const T2 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 1, 0, 0 ),
	new Vector3( 1, 0, 1 ),
	new Vector3( 1, 1, 1 ),
];

const T3 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 0, 0, 1 ),
	new Vector3( 1, 0, 1 ),
	new Vector3( 1, 1, 1 ),
];

const T4 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 0, 1, 0 ),
	new Vector3( 1, 1, 0 ),
	new Vector3( 1, 1, 1 ),
];

const T5 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 0, 1, 0 ),
	new Vector3( 0, 1, 1 ),
	new Vector3( 1, 1, 1 ),
];

const T6 = [
	new Vector3( 0, 0, 0 ),
	new Vector3( 0, 0, 1 ),
	new Vector3( 0, 1, 1 ),
	new Vector3( 1, 1, 1 ),
];

function calculateTetrahedronVolume( a, b, c, d ) {

	_triangle.a.copy( a );
	_triangle.b.copy( b );
	_triangle.c.copy( c );

	_plane.setFromCoplanarPoints( a, b, c );

	const height = Math.abs( _plane.distanceToPoint( d ) );

	return height * _triangle.getArea() / 3;

}

function sample( dataTexture, x, y, z, target ) {

	const { width, height, data } = dataTexture.image;
	const index = x + y * width + z * width * height;

	const i3 = 3 * index;

	target.r = data[ i3 + 0 ];
	target.g = data[ i3 + 1 ];
	target.b = data[ i3 + 2 ];

}

// http://www.ijetch.org/papers/318-T860.pdf
function tetrahedralSample( dataTexture, u, v, w, target ) {

	const { width, depth, height } = dataTexture.image;

	const px = u * ( width - 1 );
	const py = v * ( height - 1 );
	const pz = w * ( depth - 1 );

	min.x = Math.floor( px );
	min.y = Math.floor( py );
	min.z = Math.floor( pz );

	max.x = Math.ceil( px );
	max.y = Math.ceil( py );
	max.z = Math.ceil( pz );

	let points;
	if ( min.x === px && min.y === py && min.z === pz ) {

		sample( dataTexture, px, py, pz, target );
		return;

	} else if ( min.x === px && min.y === py ) {

		sample( dataTexture, px, py, min.z, target );
		sample( dataTexture, px, py, max.z, C0 );
		target.lerp( C0, pz - min.z );
		return;

	} else if ( min.x === px && min.z === pz ) {

		sample( dataTexture, px, min.y, pz, target );
		sample( dataTexture, px, max.y, pz, C0 );
		target.lerp( C0, py - min.y );
		return;

	} else if ( min.y === py && min.z === pz ) {

		sample( dataTexture, min.x, py, pz, target );
		sample( dataTexture, max.x, py, pz, C0 );
		target.lerp( C0, px - min.x );
		return;

	}

	if ( u >= v && v >= w ) {

		points = T1;

	} else if ( u >= w && w >= v ) {

		points = T2;

	} else if ( w >= u && u >= v ) {

		points = T3;

	} else if ( v >= u && u >= w ) {

		points = T4;

	} else if ( v >= w && w >= u ) {

		points = T5;

	} else if ( w >= v && v >= u ) {

		points = T6;

	}

	const [ P0, P1, P2, P3 ] = points;
	P.set( u, v, w );

	tempVector.copy( max ).sub( min ).multiply( P0 ).add( min );
	sample( dataTexture, tempVector.x, tempVector.y, tempVector.z, C0 );

	tempVector.copy( max ).sub( min ).multiply( P1 ).add( min );
	sample( dataTexture, tempVector.x, tempVector.y, tempVector.z, C1 );

	tempVector.copy( max ).sub( min ).multiply( P2 ).add( min );
	sample( dataTexture, tempVector.x, tempVector.y, tempVector.z, C2 );

	tempVector.copy( max ).sub( min ).multiply( P3 ).add( min );
	sample( dataTexture, tempVector.x, tempVector.y, tempVector.z, C3 );

	const V0 = calculateTetrahedronVolume( P1, P2, P3, P );
	const V1 = calculateTetrahedronVolume( P0, P2, P3, P );
	const V2 = calculateTetrahedronVolume( P0, P1, P3, P );
	const V3 = calculateTetrahedronVolume( P0, P1, P2, P );

	C0.multiplyScalar( V0 / V );
	C1.multiplyScalar( V1 / V );
	C2.multiplyScalar( V2 / V );
	C3.multiplyScalar( V3 / V );

	target.set( 0, 0, 0 ).add( C0 ).add( C1 ).add( C2 ).add( C3 );

}

class TetrahedralUpscaler {

	generate( dataTexture, size ) {

		const array = new dataTexture.image.data.constructor( 3 * ( size ** 3 ) );
		for ( let z = 0; z < size; z ++ ) {

			for ( let y = 0; y < size; y ++ ) {

				for ( let x = 0; x < size; x ++ ) {

					const u = x / ( size - 1 );
					const v = y / ( size - 1 );
					const w = z / ( size - 1 );
					const index = x + y * size + z * size * size;

					tetrahedralSample( dataTexture, u, v, w, tempColor );
					array[ index * 3 + 0 ] = tempColor.r;
					array[ index * 3 + 1 ] = tempColor.g;
					array[ index * 3 + 2 ] = tempColor.b;

				}

			}

		}

		const result = new DataTexture3D( array, size, size, size );
		result.copy( dataTexture );

		result.image = {

			width: size,
			height: size,
			depth: size,
			data: array,

		};

		return result;

	}

}

export { TetrahedralUpscaler };
