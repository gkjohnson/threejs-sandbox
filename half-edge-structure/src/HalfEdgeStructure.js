import { Triangle, Vector3, Plane } from 'three';
import { createEdgeMap } from './utils';

const _triangle = new Triangle();
const _barycentric0 = new Vector3();
const _barycentric1 = new Vector3();
const _tempVec0 = new Vector3();
const _tempVec1 = new Vector3();
const _tempVec2 = new Vector3();
const _plane = new Plane();
const _line = new Line3();
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
		while ( length ) {

			// TODO: transform into the local frame of the triangle

			const face = list[ nextIndex ];
			nextIndex = face.intersectEdge( _line, target );

			const nextFace = face.adjacent[ nextIndex ];

			length = Math.max( 0.0, length - _line.start.distanceTo( target ) );

			_line.start.copy( target );

			// TODO: transform the direction into the new local frame and set it to end
			// - rotate 

		}

		return nextIndex;

	}

}
