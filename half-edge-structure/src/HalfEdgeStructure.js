import { Triangle, Vector3, Plane, Line3 } from 'three';
import { createEdgeMap } from './utils';

const _tempVec0 = new Vector3();
const _line = new Line3();
const _dir = new Vector3();
export class HalfEdgeStructure {

	constructor( geometry, tolerance = 1e-5 ) {

		// the list of triangles representing the half edge data structure
		this.list = createEdgeMap( geometry, tolerance );

		// the original geometry
		this.geometry = geometry;

	}

	movePoint( halfEdgePoint, dir, halfEdgeTarget ) {

		const { list } = this;
		const startTri = list[ halfEdgePoint.index ];

		// get the direction along the triangle plane
		startTri.projectToPlane( _tempVec0.copy( dir ) ).normalize().multiplyScalar( distance );

		// get the start point on the triangle plane
		_line.start.copy( halfEdgePoint.point );
		startTri.projectToPlane( _line.start );

		// get the end point on the triangle plane
		_line.end.copy( halfEdgePoint.point ).add( _tempVec0 );

		let length = dir.length();
		let nextIndex = index;
		while ( length > 0 ) {

			const face = list[ nextIndex ];
			const originalIndex = nextIndex;
			nextIndex = face.intersectEdge( _line, halfEdgeTarget.point );

			if ( nextIndex === - 1 ) {

				halfEdgeTarget.point.copy( _line.end );
				length = 0;
				break;

			} else {

				_dir.subVectors( halfEdgeTarget.point, _line.end );
				const couldRotate = face.rotateOntoAdjacent( _dir, nextIndex );
				if ( couldRotate ) {

					_line.start.copy( halfEdgeTarget.point );
					_line.end.copy( _line.start ).add( _dir );
					length = _line.start.distanceTo( _line.end );

				} else {

					length = 0;
					nextIndex = originalIndex;
					break;

				}

			}

		}

		return nextIndex;

	}

}
