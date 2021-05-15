import { Triangle, Vector3, Matrix4, Ray } from 'three';

const _vec0 = new Vector3();
const _vec1 = new Vector3();
const _vec2 = new Vector3();
const _axisVector = new Vector3();
const _ray = new Ray();
const _tempVec = new Vector3();
const _normal = new Vector3();

export class HalfEdgeTriangle extends Triangle {

	constructor() {

		super();

		// the index associated with this triangle
		this.index = - 1;

		// the adjacent triangles. Adjacent triangles listed in a->b, b->c, c->a order
		this.adjacent = [ null, null, null ];

		// cached info

		// TODO: store right hand rule rotation vectors so points can be
		// rotated about them into the new triangle frames. Angles can
		// be derived from normals, which we can also cache?
		this.rotationAngles = [ 0, 0, 0 ];
		this.vertices = [ this.a, this.b, this.c ];

		// Cached (these could be generated as needed for dynamic meshes)
		// compute and cache the local frame from the normal and the first edge
		this.localToWorld = new Matrix4();
		this.worldToLocal = new Matrix4();

		// compute the 2d coordinates in the local frame
		this.aLocal = new Vector3();
		this.bLocal = new Vector3();
		this.cLocal = new Vector3();

		this.normal = new Vector3();

	}

	_init() {

		const { a, b, c, aLocal, bLocal, cLocal, localToWorld, worldToLocal, adjacent, rotationAngles, normal } = this;

		_vec0.subtractVectors( b, a ).normalize();
		_vec1.subtractVectors( c, a ).normalize();
		_vec2.crossVectors( _vec0, _vec1 ).normalize();
		_vec1.crossVectors( _vec0, _vec2 ).normalize();

		localToWorld.makeBasis( _vec0, _vec1, _vec2 );
		localToWorld.elements[ 12 ] = a.x;
		localToWorld.elements[ 13 ] = a.y;
		localToWorld.elements[ 14 ] = a.z;

		worldToLocal.getInverse( localToWorld );
		aLocal.copy( a ).applyMatrix4( worldToLocal );
		bLocal.copy( b ).applyMatrix4( worldToLocal );
		cLocal.copy( c ).applyMatrix4( worldToLocal );

		this.getNormal( normal );

		for ( let i = 0; i < 3; i ++ ) {

			const tri = adjacent[ i ];
			if ( tri ) {

				// TODO: need to get the signed angle here
				tri.getNormal( _normal );
				rotationAngles[ i ] = normal.angleTo( _normal );

			}

		}

	}

	projectToPlane( target ) {

		this._init();

		const { localToWorld, worldToLocal } = this;
		target.applyMatrix4( worldToLocal );
		target.z = 0;
		target.applyMatrix4( localToWorld );
		return target;

	}

	rotateOntoAdjacent( dir, adjacentIndex ) {

		this._init();

		const { adjacent, rotationAngles, normal, dir } = this;
		if ( ! adjacent[ adjacentIndex ] ) {

			return false;

		}

		const angle = rotationAngles[ adjacentIndex ];
		_axisVector.crossVectors( normal, dir ).normalize();
		dir.applyAxisAngle( _axisVector, angle );

		return true;

	}

	intersectEdge( line, target ) {

		this._init();

		const { vertices } = this;
		let closestDist = Infinity;
		let intersectedEdge = - 1;
		for ( let i = 0; i < 3; i ++ ) {

			const inext = ( i + 1 ) % 3;
			_ray.origin.copy( vertices[ i ] );
			_ray.direction.subVectors( vertices[ inext ], vertices[ i ] );

			const dist = _ray.distanceSqToSegment( line.start, line.end, null, _tempVec );
			if ( dist <= Number.EPSILON ) {

				const length = _tempVec.distanceToSquared( line.start );
				if ( length < closestDist ) {

					closestDist = length;
					intersectedEdge = i;
					target.copy( _tempVec );

				}

			}

		}

		return intersectedEdge;

	}

}
