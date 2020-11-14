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

		if ( geometry.index ) {

			geometry = geometry.toNonIndexed();
			console.warn( `HalfEdgeStructure: Only non indexed buffer geometry supported.` );

		}

		this.data = createEdgeMap( geometry, tolerance );
		this.geometry = geometry;

	}

	movePoint( index, point, dir, target ) {

		const { data } = this;

		_line.start.copy( point );
		_line.end.copy( point ).add( dir );

		// TODO: project the points onto the local frame for stepping

		let length = dir.length();
		let nextIndex = index;
		while ( length ) {

			// TODO: transform into the local frame of the triangle

			const face = data[ nextIndex ];
			nextIndex = face.adjacent[ face.intersectEdge( _line, target ) ];

			length = Math.max( 0.0, length - _line.start.distanceTo( target ) );

			_line.start.copy( target );

			// TODO: transform the direction into the local frame and set it to end

		}

		return nextIndex;

	}

}
