import { Vector3 } from '//unpkg.com/three@0.112.0/build/three.module.js';

const basesRegex = /^([+-][xyz])([+-][xyz])([+-][xyz])$/i;
const nameToIndex = { x: 0, y: 1, z: 2 };
const orderedVectors = [ new Vector3(), new Vector3(), new Vector3() ];

function stringToAxes( axesString ) {

    if ( ! basesRegex.test( axesString ) ) {

		return null;

	}

	axesString = axesString.toLowerCase();
    return axesString
        .match( basesRegex )
        .splice( 1, 3 )
        .map( str => {

            const negative = str[ 0 ] === '-';
            const name = str[ 1 ];
            return { negative, name };

        } );

}

function getBasisTransform( from, to, targetMatrix ) {

    if ( ! basesRegex.test( from ) ) {

        return null;

    }

    if ( ! basesRegex.test( to ) ) {

        return null;

    }

    const fromAxes = stringToAxes( from );
    const toAxes = stringToAxes( to );

    for ( let i = 0; i < 3; i ++ ) {

        const fromAxis = fromAxes[ i ];
        const toAxis = toAxes[ i ];

        const toIndex = nameToIndex[ toAxis.name ];
        const equalNegative = fromAxis.negative === toAxis.negative;

        const vector = orderedVectors[ toIndex ];
        vector.set( 0, 0, 0 );
        vector[ fromAxis.name ] = equalNegative ? 1 : - 1;

	}

    targetMatrix.makeBasis( orderedVectors[ 0 ], orderedVectors[ 1 ], orderedVectors[ 2 ] );

}

function axesToString( str ) {

    const axes = stringToAxes( str );
    const axis0 = axes[ 0 ];
	const r = axis0.negative ? ' ' : '-';
	const R = axis0.negative ? ' ' : axis0.name.toUpperCase();
    const l = axis0.negative ? '-' : ' ';
	const L = axis0.negative ? axis0.name.toUpperCase() : ' ';

    const axis1 = axes[ 1 ];
    const u = axis1.negative ? ' ' : '|';
	const U = axis1.negative ? ' ' : axis1.name.toUpperCase();
    const d = axis1.negative ? '|' : ' ';
	const D = axis1.negative ? axis1.name.toUpperCase() : ' ';

    const axis2 = axes[ 2 ];
    const f = axis2.negative ? ' ' : '/';
	const F = axis2.negative ? ' ' : axis2.name.toUpperCase();
    const b = axis2.negative ? '/' : ' ';
	const B = axis2.negative ? axis2.name.toUpperCase() : ' ';

    const template =
        '      U    \n' +
        '      u   B\n' +
        '      u b  \n' +
        'Llllll.rrrrr R\n' +
        '     fd    \n' +
        '   F  d    \n' +
        '      D    ';

    return template
        // right
        .replace( /R/g, R )
        .replace( /r/g, r )

        // left
        .replace( /L/g, L )
        .replace( /l/g, l )

        // up
        .replace( /U/g, U )
        .replace( /u/g, u )

        // down
        .replace( /D/g, D )
        .replace( /d/g, d )

        // forward
        .replace( /F/g, F )
        .replace( /f/g, f )

        // back
        .replace( /B/g, B )
        .replace( /b/g, b );

}

export { getBasisTransform, axesToString, stringToAxes };
