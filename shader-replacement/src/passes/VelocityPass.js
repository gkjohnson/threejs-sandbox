import { ShaderReplacement } from '../ShaderReplacement.js';
import { Matrix4 } from '//unpkg.com/three@0.114.0/build/three.module.js';
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

	}

	replace( ...args ) {

		this.lastFrame ++;

		const camera = this.camera;
		if ( ! this.initialized || ! this.includeCameraVelocity ) {

			this.prevProjectionMatrix.copy( camera.projectionMatrix );
			this.prevViewMatrix.copy( camera.matrixWorldInverse );
			this.initialized = true;

		}

		super.replace( ...args );

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

				info.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );

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
		const camera = this.camera;
		let info;
		if ( ! prevInfo.has( object ) ) {

			info = {

				lastFrame: this.lastFrame,
				modelViewMatrix: new Matrix4().multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld ),
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
