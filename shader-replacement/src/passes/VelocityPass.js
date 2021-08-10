import { ShaderReplacement } from '../ShaderReplacement.js';
import { Matrix4 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { VelocityShader } from './VelocityShader.js';
export class VelocityPass extends ShaderReplacement {

	constructor() {

		super( VelocityShader );

		this.initialized = false;
		this.includeCameraVelocity = true;
		this.includeObjectVelocity = true;
		this.prevProjectionMatrix = new Matrix4();
		this.prevViewMatrix = new Matrix4();
		this.prevInfo = new Map();
		this.lastFrame = 0;
		this.autoUpdate = true;

	}

	replace( ...args ) {

		// NOTE: As it is this can only really be used for one scene because of how this frame
		// index works. Instead we'll need a different frame id per scene.
		this.lastFrame ++;

		if ( ! this.initialized || ! this.includeCameraVelocity ) {

			const camera = this.camera;
			this.prevProjectionMatrix.copy( camera.projectionMatrix );
			this.prevViewMatrix.copy( camera.matrixWorldInverse );
			this.initialized = true;

		}

		super.replace( ...args );

	}

	reset( ...args ) {

		super.reset( ...args );

		// NOTE: We expect that the camera and object transforms are all up to date here so we can cache them for the next frame.
		if ( this.autoUpdate ) {

			this.updateTransforms();

		}

	}

	updateTransforms() {

		const camera = this.camera;
		this.prevProjectionMatrix.copy( camera.projectionMatrix );
		this.prevViewMatrix.copy( camera.matrixWorldInverse );

		const lastFrame = this.lastFrame;
		const prevInfo = this.prevInfo;
		prevInfo.forEach( ( info, object ) => {

			if ( info.lastFrame !== lastFrame ) {

				if ( info.boneTexture ) {

					info.boneTexture.dispose();

				}
				prevInfo.delete( object );

			} else {

				info.modelViewMatrix.multiplyMatrices( this.prevViewMatrix, object.matrixWorld );

				if ( info.boneMatrices ) {

					info.boneMatrices.set( object.skeleton.boneMatrices );
					info.boneTexture.needsUpdate = true;

				}

			}

		} );

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		// TODO: Handle alpha clip
		// TODO: Handle displacement map

		const prevInfo = this.prevInfo;
		let info;
		if ( ! prevInfo.has( object ) ) {

			info = {

				lastFrame: this.lastFrame,
				modelViewMatrix: new Matrix4().multiplyMatrices( this.prevViewMatrix, object.matrixWorld ),
				boneMatrices: null,
				boneTexture: null,

			};

			prevInfo.set( object, info );

		} else {

			info = prevInfo.get( object );

		}

		if ( material.skinned ) {

			const skeleton = object.skeleton;
			const boneTextureNeedsUpdate = info.boneMatrices === null || info.boneMatrices.length !== skeleton.boneMatrices.length;
			if ( isSkinned && boneTextureNeedsUpdate ) {

				const boneMatrices = new Float32Array( skeleton.boneMatrices.length );
				boneMatrices.set( skeleton.boneMatrices );
				info.boneMatrices = boneMatrices;

				const size = Math.sqrt( skeleton.boneMatrices.length / 4 );
				const boneTexture = new DataTexture( boneMatrices, size, size, RGBAFormat, FloatType );
				boneTexture.needsUpdate = true;

				target.uniforms.prevBoneTexture.value = boneTexture;
				info.boneTexture = boneTexture;

			}

		}

		info.lastFrame = this.lastFrame;
		target.uniforms.prevProjectionMatrix.value.copy( this.prevProjectionMatrix );
		target.uniforms.prevModelViewMatrix.value.copy( info.modelViewMatrix );

	}

	dispose() {

		this.initialized = false;

		const prevInfo = this.prevInfo;
		prevInfo.forEach( ( info, object ) => {

			if ( info.boneTexture ) {

				info.boneTexture.dispose();

			}
			prevInfo.delete( object );

		} );

	}

}
