import { Triangle, Vector3, Plane } from 'three';
import { createEdgeMap } from './utils';

const _triangle = new Triangle();
const _barycentric0 = new Vector3();
const _barycentric1 = new Vector3();
const _tempVec0 = new Vector3();
const _tempVec1 = new Vector3();
const _tempVec2 = new Vector3();
const _plane = new Plane();
export class HalfEdgeStructure {

	constructor( geometry, tolerance = 1e-5 ) {

		if ( geometry.index ) {

			geometry = geometry.toNonIndexed();
			console.warn( `HalfEdgeStructure: Only non indexed buffer geometry supported.` );

		}

		this.data = createEdgeMap( geometry, tolerance );
		this.geometry = geometry;

	}

	movePoint( info, dir, out ) {

		const { data, geometry } = this;
		const currFace = data[ info.index ];

		// get the triangle and plane
		currFace.getTriangleFromBufferAttribute( geometry.attribute.positions, _triangle );
		_triangle.getPlane( _plane );

		// get the projected point and direction
		_plane.projectPoint( info.point, _tempVec0 );
		_plane.projectPoint( dir, _tempVec2 );

		// get the projected end point
		_tempVec1.addVectors( _tempVec0, _tempVec2 );

		// get the barycentric coord of both
		_triangle.getBaryCoord( _tempVec0, _barycentric0 );
		_triangle.getBaryCoord( _tempVec1, _barycentric1 );

		// TODO
		// maybe don't need bary centric coords
		// check if the point is outside the triangle
		// if so check which edge it crossed first and find the intersection point
		// move the point into that face and call movePoint again on that face with a truncated direction vector

	}

}
