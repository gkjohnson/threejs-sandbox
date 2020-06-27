import { HalfEdgeTriangle } from './HalfEdgeTriangle.js';
import { hashVector3 } from './hashFunctions.js';
import { Vector3 } from 'three';

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const vertArr = [v0, v1, v2];
export function createEdgeMap( geometry, tolerance ) {

	const position = geometry.attributes.position;
	const triCount = position.count / 3;

	const list = new Array( triCount );
	const map = {};

	for ( let i = 0; i < triCount; i ++ ) {

		const halfEdgeTri = new HalfEdgeTriangle();
		halfEdgeTri.index = i;

		const vertOffset = i * 3;
		v0.fromBufferAttribute( position, vertOffset + 0 );
		v1.fromBufferAttribute( position, vertOffset + 1 );
		v2.fromBufferAttribute( position, vertOffset + 2 );

		list.push( halfEdgeTri );
		for ( let j = 0; j < 3; j ++ ) {

			const i0 = j;
			const i1 = ( j + 1 ) % 3;

			const h0 = hashVector3( vertArr[ i0 ], tolerance );
			const h1 = hashVector3( vertArr[ i1 ], tolerance );

			const hash = `${ h0 }_${ h1 }`;
			const reverseHash = `${ h1 }_${ h0 }`;
			if ( reverseHash in map ) {

				const { edgeId, triangle } = map[ reverseHash ];
				delete map[ reverseHash ];

				triangle.adjacent[ edgeId ] = halfEdgeTri;
				halfEdgeTri.adjacent[ j ] = triangle;

			} else {

				map[ hash ] = {

					edgeId: j,
					triangle: halfEdgeTri,

				};

			}

		}

	}

	return list;

}
