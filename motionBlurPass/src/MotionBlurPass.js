/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 *  Approach from http://john-chapman-graphics.blogspot.com/2013/01/per-object-motion-blur.html
 */
import {
	Frustum,
	Color,
	WebGLRenderTarget,
	LinearFilter,
	RGBFormat,
	HalfFloatType,
	Matrix4,
	DataTexture,
	RGBAFormat,
	FloatType,
	ShaderMaterial,
	RepeatWrapping,
} from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { Pass, FullScreenQuad } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/postprocessing/Pass.js';
import { VelocityShader } from './VelocityShader.js';
import { GeometryShader } from './GeometryShader.js';
import { CompositeShader } from './CompositeShader.js';
import { BlueNoiseGenerator } from '../../blue-noise-generation/src/BlueNoiseGenerator.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { traverseVisibleMeshes } from './utils.js';

const _blackColor = new Color( 0, 0, 0 );
const _defaultOverrides = {};
const _rendererState = new RendererState();

// Generate Blue Noise Textures
const generator = new BlueNoiseGenerator();
generator.size = 32;

const data = new Uint8Array( 32 ** 2 * 4 );
for ( let i = 0, l = 1; i < l; i ++ ) {

	const result = generator.generate();
	const bin = result.data;
	const maxValue = result.maxValue;

	for ( let j = 0, l2 = bin.length; j < l2; j ++ ) {

		const value = 255 * ( bin[ j ] / maxValue );
		data[ j * 3 + i ] = value;

	}

}

// TODO: Why won't RedFormat work here?
const blueNoiseTex = new DataTexture( data, generator.size, generator.size, RGBFormat );
blueNoiseTex.wrapS = RepeatWrapping;
blueNoiseTex.wrapT = RepeatWrapping;
blueNoiseTex.minFilter = LinearFilter;

export class MotionBlurPass extends Pass {

	get enabled() {

		return this._enabled;

	}

	set enabled( val ) {

		if ( val === false ) {

			this._prevPosMap.clear();
			this._cameraMatricesNeedInitializing = true;

		}

		this._enabled = val;

	}

	constructor( scene, camera, options = {} ) {

		super();

		this.enabled = true;
		this.needsSwap = true;

		// settings
		this.samples = 'samples' in options ? options.samples : 15;
		this.expandGeometry = 'expandGeometry' in options ? options.expandGeometry : 0;
		this.interpolateGeometry = 'interpolateGeometry' in options ? options.interpolateGeometry : 1;
		this.smearIntensity = 'smearIntensity' in options ? options.smearIntensity : 1;
		this.blurTransparent = 'blurTransparent' in options ? options.blurTransparent : false;
		this.renderCameraBlur = 'renderCameraBlur' in options ? options.renderCameraBlur : true;
		this.renderTargetScale = 'renderTargetScale' in options ? options.renderTargetScale : 1;
		this.jitter = 'jitter' in options ? options.jitter : 1;
		this.jitterStrategy = 'jitterStrategy' in options ? options.jitterStrategy : MotionBlurPass.RANDOM_JITTER;

		this.debug = {

			display: MotionBlurPass.DEFAULT,
			dontUpdateState: false

		};

		this.scene = scene;
		this.camera = camera;

		// list of positions from previous frames
		this._prevPosMap = new Map();
		this._currentFrameMod = 0;
		this._frustum = new Frustum();
		this._projScreenMatrix = new Matrix4();
		this._cameraMatricesNeedInitializing = true;

		this._prevCamProjection = new Matrix4();
		this._prevCamWorldInverse = new Matrix4();

		// render targets
		this._velocityBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBAFormat,
				type: HalfFloatType
			} );
		this._velocityBuffer.texture.name = "MotionBlurPass.Velocity";
		this._velocityBuffer.texture.generateMipmaps = false;

		this._compositeMaterial = new ShaderMaterial( CompositeShader );
		this._compositeQuad = new FullScreenQuad( this._compositeMaterial );

	}

	// Pass API
	dispose() {

		this._compositeQuad.dispose();
		this._velocityBuffer.dispose();
		this._prevPosMap.clear();

	}

	setSize( width, height ) {

		const renderTargetScale = this.renderTargetScale;
		const velocityBuffer = this._velocityBuffer;
		velocityBuffer.setSize( width * renderTargetScale, height * renderTargetScale );

	}

	render( renderer, writeBuffer, readBuffer ) {

		const debug = this.debug;
		const scene = this.scene;
		const camera = this.camera;
		const compositeQuad = this._compositeQuad;
		const finalBuffer = this.renderToScreen ? null : writeBuffer;

		_rendererState.copy( renderer, scene );

		// Set the clear state
		renderer.autoClear = false;
		renderer.setClearColor( _blackColor, 0 );

		// TODO: This is getting called just to set 'currentRenderState' in the renderer
		// NOTE -- why do we need this?
		renderer.compile( scene, camera );
		this._ensurePrevCameraTransform();

		switch ( debug.display ) {

			case MotionBlurPass.GEOMETRY: {

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();
				this._drawAllMeshes( renderer, MotionBlurPass.GEOMETRY, ! debug.dontUpdateState );
				break;

			}

			case MotionBlurPass.VELOCITY: {

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();
				this._drawAllMeshes( renderer, MotionBlurPass.VELOCITY, ! debug.dontUpdateState );
				break;

			}

			case MotionBlurPass.DEFAULT: {

				const velocityBuffer = this._velocityBuffer;
				renderer.setRenderTarget( velocityBuffer );
				renderer.clear();
				this._drawAllMeshes( renderer, MotionBlurPass.VELOCITY, ! debug.dontUpdateState );

				const compositeMaterial = this._compositeMaterial;
				const uniforms = compositeMaterial.uniforms;
				uniforms.sourceBuffer.value = readBuffer.texture;
				uniforms.velocityBuffer.value = this._velocityBuffer.texture;
				uniforms.jitter.value = this.jitter;
				uniforms.blueNoiseTex.value = blueNoiseTex;

				if ( compositeMaterial.defines.SAMPLES !== this.samples ) {

					compositeMaterial.defines.SAMPLES = Math.max( 0, Math.floor( this.samples ) );
					compositeMaterial.needsUpdate = true;

				}

				if ( compositeMaterial.defines.JITTER_STRATEGY !== this.jitterStrategy ) {

					compositeMaterial.defines.JITTER_STRATEGY = this.jitterStrategy;
					compositeMaterial.needsUpdate = true;

				}

				renderer.setRenderTarget( finalBuffer );
				compositeQuad.render( renderer );

				break;

			}

		}

		// Save the camera state for the next frame
		this._prevCamWorldInverse.copy( camera.matrixWorldInverse );
		this._prevCamProjection.copy( camera.projectionMatrix );

		// Restore renderer settings
		_rendererState.restore( renderer, scene );

	}

	// Returns the set of previous frames data for object position and bone state. Creates
	// a new object this with frames state if it hasn't been created yet.
	_getPreviousFrameState( obj ) {

		const prevPosMap = this._prevPosMap;
		let data = prevPosMap.get( obj );
		if ( data === undefined ) {

			data = {

				lastUsedFrame: - 1,
				matrixWorld: obj.matrixWorld.clone(),
				geometryMaterial: new ShaderMaterial( GeometryShader ),
				velocityMaterial: new ShaderMaterial( VelocityShader ),
				boneMatrices: null,
				boneTexture: null,

			};
			prevPosMap.set( obj, data );

		}

		const isSkinned = obj.type === 'SkinnedMesh' && obj.skeleton && obj.skeleton.bones && obj.skeleton.boneMatrices;

		data.geometryMaterial.skinning = isSkinned;
		data.velocityMaterial.skinning = isSkinned;

		// copy the skeleton state into the prevBoneTexture uniform
		const skeleton = obj.skeleton;
		const boneTextureNeedsUpdate = data.boneMatrices === null || data.boneMatrices.length !== skeleton.boneMatrices.length;
		if ( isSkinned && boneTextureNeedsUpdate ) {

			const boneMatrices = new Float32Array( skeleton.boneMatrices.length );
			boneMatrices.set( skeleton.boneMatrices );
			data.boneMatrices = boneMatrices;

			const size = Math.sqrt( skeleton.boneMatrices.length / 4 );
			const boneTexture = new DataTexture( boneMatrices, size, size, RGBAFormat, FloatType );
			boneTexture.needsUpdate = true;

			data.geometryMaterial.uniforms.prevBoneTexture.value = boneTexture;
			data.velocityMaterial.uniforms.prevBoneTexture.value = boneTexture;
			data.boneTexture = boneTexture;

		}

		return data;

	}

	// saves the current state to be used next frame
	_saveCurrentObjectState( obj ) {

		const prevPosMap = this._prevPosMap;
		const data = prevPosMap.get( obj );

		if ( data.boneMatrices !== null ) {

			data.boneMatrices.set( obj.skeleton.boneMatrices );
			data.boneTexture.needsUpdate = true;

		}

		data.matrixWorld.copy( obj.matrixWorld );

	}

	// Draw all meshes in the scene and discard those that are no longer being used
	_drawAllMeshes( renderer, type, saveState ) {

		this._currentFrameMod = ( this._currentFrameMod + 1 ) % 2;
		const thisFrameId = this._currentFrameMod;
		const prevPosMap = this._prevPosMap;

		traverseVisibleMeshes( this.scene, mesh => {

			this._drawMesh( renderer, mesh, type, saveState );
			if ( prevPosMap.has( mesh ) ) {

				prevPosMap.get( mesh ).lastUsedFrame = thisFrameId;

			}

		} );

		prevPosMap.forEach( ( data, mesh ) => {

			if ( data.lastUsedFrame !== thisFrameId ) {

				data.geometryMaterial.dispose();
				data.velocityMaterial.dispose();
				if ( data.boneTexture ) {

					data.boneTexture.dispose();

				}
				prevPosMap.delete( mesh );

			}

		} );

	}


	_drawMesh( renderer, mesh, type, saveState ) {

		const overrides = mesh.motionBlur || _defaultOverrides;
		let blurTransparent = this.blurTransparent;
		let renderCameraBlur = this.renderCameraBlur;
		let expandGeometry = this.expandGeometry;
		let interpolateGeometry = this.interpolateGeometry;
		let smearIntensity = this.smearIntensity;

		blurTransparent = 'blurTransparent' in overrides ? overrides.blurTransparent : this.blurTransparent;
		renderCameraBlur = 'renderCameraBlur' in overrides ? overrides.renderCameraBlur : this.renderCameraBlur;
		expandGeometry = 'expandGeometry' in overrides ? overrides.expandGeometry : this.expandGeometry;
		interpolateGeometry = 'interpolateGeometry' in overrides ? overrides.interpolateGeometry : this.interpolateGeometry;
		smearIntensity = 'smearIntensity' in overrides ? overrides.smearIntensity : this.smearIntensity;

		const isTransparent = mesh.material.transparent || mesh.material.alpha < 1;
		const isCulled = mesh.frustumCulled && ! this._frustum.intersectsObject( mesh );
		let skip = blurTransparent === false && isTransparent || isCulled;

		if ( skip ) {

			if ( this._prevPosMap.has( mesh ) && saveState ) {

				this._saveCurrentObjectState( mesh );

			}

		} else {

			const camera = this.camera;
			const data = this._getPreviousFrameState( mesh );

			const material = type === MotionBlurPass.GEOMETRY ? data.geometryMaterial : data.velocityMaterial;
			const uniforms = material.uniforms;
			uniforms.expandGeometry.value = expandGeometry;
			uniforms.interpolateGeometry.value = interpolateGeometry;
			uniforms.smearIntensity.value = smearIntensity;

			const projMat = renderCameraBlur ? this._prevCamProjection : camera.projectionMatrix;
			const invMat = renderCameraBlur ? this._prevCamWorldInverse : camera.matrixWorldInverse;
			uniforms.prevProjectionMatrix.value.copy( projMat );
			uniforms.prevModelViewMatrix.value.multiplyMatrices( invMat, data.matrixWorld );

			renderer.renderBufferDirect( camera, null, mesh.geometry, material, mesh, null );

			if ( saveState ) {

				this._saveCurrentObjectState( mesh );

			}

		}

	}

	_ensurePrevCameraTransform() {

		const camera = this.camera;
		const projScreenMatrix = this._projScreenMatrix;

		// reinitialize the camera matrices to the current transform because if
		// the pass has been disabled then the matrices will be out of date
		if ( this._cameraMatricesNeedInitializing ) {

			this._prevCamWorldInverse.copy( camera.matrixWorldInverse );
			this._prevCamProjection.copy( camera.projectionMatrix );
			this._cameraMatricesNeedInitializing = false;

		}


		projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		this._frustum.setFromProjectionMatrix( projScreenMatrix );

	}

}

MotionBlurPass.DEFAULT = 0;
MotionBlurPass.VELOCITY = 1;
MotionBlurPass.GEOMETRY = 2;

MotionBlurPass.REGULAR_JITTER = 0;
MotionBlurPass.RANDOM_JITTER = 1;
MotionBlurPass.BLUENOISE_JITTER = 2;
