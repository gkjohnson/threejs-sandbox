const basesRegex = /^([+-][xyz])([+-][xyz])([+-][xyz])$/;
const nameToIndex = { x: 0, y: 1, z: 2 };
const orderedVectors = [ new Vector3(), new Vector3(), new Vector3() ];

function stringToAxes( axesString ) {

    return axesString
        .match( basesRegex )
        .splice( 1, 3 )
        .forEach( str => {

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
    const toAxes = stringToAxes( from );

    for ( let i = 0; i < 3; i ++ ) {

        const fromAxis = fromAxes[ i ];
        const toAxis = toAxes[ i ];

        const toIndex = nameToIndex[ toAxis ];
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
    const l = axis0.negative ? '-' : ' ';

    const axis1 = axes[ 1 ];
    const u = axis1.negative ? ' ' : '|';
    const d = axis1.negative ? '|' : ' ';

    const axis2 = axes[ 2 ];
    const f = axis2.negative ? ' ' : '／';
    const b = axis2.negative ? '／' : ' ';

    const template =
        '       U    \n' +
        '       u   B\n' +
        '       u b  \n' +
        ' Llllll.rrrrr R\n' +
        '     f d    \n' +
        '   F   d    \n' +
        '       D    \n';

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

export { getBasisTransform, axesToString };
