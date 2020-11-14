import { Triangle, Vector3, Matrix4 } from 'three';

const _vec0 = new Vector3();
const _vec1 = new Vector3();
const _vec2 = new Vector3();
const _mat = new Matrix4();

export class HalfEdgeTriangle extends Triangle {

	constructor() {

		super();
		this.index = - 1;
		this.adjacent = [ null, null, null ];

		// Cached (these could be generated as needed for dynamic meshes)
		// compute and cache the local frame from the normal and the first edge
		this.localFrame = new Matrix4();

		// compute the 2d coordinates in the local frame
		this.a2 = new Vector3();
		this.b2 = new Vector3();
		this.b2 = new Vector3();

	}

	_init() {

		const { a, b, c, a2, b2, c2, localFrame } = this;

		_vec0.subtractVectors( b, a ).normalize();
		_vec1.subtractVectors( c, a ).normalize();
		_vec2.crossVectors( _vec0, _vec1 ).normalize();
		_vec1.crossVectors( _vec0, _vec2 ).normalize();

		localFrame.makeBasis( _vec0, _vec1, _vec2 );
		localFrame.elements[ 12 ] = a.x;
		localFrame.elements[ 13 ] = a.y;
		localFrame.elements[ 14 ] = a.z;

		_mat.getInverse( localFrame );
		a2.copy( a ).applyMatrix4( _mat );
		b2.copy( b ).applyMatrix4( _mat );
		c2.copy( c ).applyMatrix4( _mat );

	}

	intersectEdge( line, target ) {

		this._init();

		// compute the edge index and position that's been intersected

	}

}
