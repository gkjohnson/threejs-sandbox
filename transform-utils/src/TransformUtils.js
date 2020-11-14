import { Matrix4, Quaternion, Vector3, Vector4 } from 'three';

const tempMat = new Matrix4();
const tempQuat = new Quaternion();
const tempQuat2 = new Quaternion();
const tempPos = new Vector3();
const tempSca = new Vector3();
const tempVec4 = new Vector4();

// A set of utility functions for transforming vectors, rotations, and matrices
// between frames.
// "fromFrame" and "toFrame" are of type Matrix4
export class TransformUtils {

	// Transforms Matrix4s between frames
	static transformFrame( fromFrame, toFrame, mat, outputMat ) {

		tempMat.getInverse( toFrame );

		outputMat.copy( mat );

		outputMat.multiply( fromFrame );
		outputMat.multiply( tempMat );

	}

	// Transforms a Vector3 as a point between frames
	static transformPoint( fromFrame, toFrame, pos, outputVec ) {

		tempMat.getInverse( toFrame );

		outputVec.copy( pos );
		outputVec.applyMatrix4( fromFrame );
		outputVec.applyMatrix4( tempMat );

	}

	// Transforms a Vector3 as a direction between frames
	static transformDirection( fromFrame, toFrame, dir, outputVec ) {

		tempMat.getInverse( toFrame );

		tempVec4.copy( dir );
		tempVec4.w = 0;
		tempVec4.applyMatrix4( fromFrame );
		tempVec4.applyMatrix4( tempMat );

		outputVec.copy( tempVec4 );

	}

	// Transforms a Quaternion between frames
	static transformQuaternion( fromFrame, toFrame, quat, outputQuat ) {

		fromFrame.decompose( tempPos, tempQuat, tempSca );
		toFrame.decompose( tempPos, tempQuat2, tempSca );
		tempQuat2.inverse();

		outputQuat.copy( quat );

		outputQuat.multiply( tempQuat );
		outputQuat.multiply( tempQuat2 );

	}

	constructor( fromFrame, toFrame ) {

		this._from = fromFrame;
		this._to = toFrame;

	}

	transformMatrix( mat, output ) {

		this.constructor.transformMatrix( this._from, this._to, mat, output );

	}

	transformPoint( pos, output ) {

		this.constructor.transformPoint( this._from, this._to, pos, output );

	}

	transformDirection( dir, output ) {

		this.constructor.transformDirection( this._from, this._to, dir, output );

	}

	transformQuaternion( quat, output ) {

		this.constructor.transformQuaternion( this._from, this._to, quat, output );

	}

}
