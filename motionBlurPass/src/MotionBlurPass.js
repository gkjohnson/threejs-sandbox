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
	OrthographicCamera,
	Scene,
	Mesh,
	PlaneBufferGeometry,
	DataTexture,
	RGBAFormat,
	FloatType,
	ShaderMaterial
} from '//unpkg.com/three@0.112.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.112.0/examples/jsm/postprocessing/Pass.js';
import { VelocityShader } from './VelocityShader.js';
import { GeometryShader } from './GeometryShader.js';
import { CompositeShader } from './CompositeShader.js';

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

		options = Object.assign( {

			samples: 15,
			expandGeometry: 0,
			interpolateGeometry: 1,
			smearIntensity: 1,
			blurTransparent: false,
			renderCameraBlur: true,
			renderTargetScale: 1

		}, options );

		this.enabled = true;
		this.needsSwap = true;

		// settings
		this.samples = options.samples;
		this.expandGeometry = options.expandGeometry;
		this.interpolateGeometry = options.interpolateGeometry;
		this.smearIntensity = options.smearIntensity;
		this.blurTransparent = options.blurTransparent;
		this.renderCameraBlur = options.renderCameraBlur;
		this.renderTargetScale = options.renderTargetScale;

		this.scene = scene;
		this.camera = camera;

		this.debug = {

			display: MotionBlurPass.DEFAULT,
			dontUpdateState: false

		};

		// list of positions from previous frames
		this._prevPosMap = new Map();
		this._frustum = new Frustum();
		this._projScreenMatrix = new Matrix4();
		this._cameraMatricesNeedInitializing = true;
		this._prevClearColor = new Color();
		this._clearColor = new Color( 0, 0, 0 );

		// render targets
		this._velocityBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBFormat,
				type: HalfFloatType
			} );
		this._velocityBuffer.texture.name = "MotionBlurPass.Velocity";
		this._velocityBuffer.texture.generateMipmaps = false;

		this._prevCamProjection = new Matrix4();
		this._prevCamWorldInverse = new Matrix4();

		this._velocityMaterial = this.getVelocityMaterial();
		this._geomMaterial = this.getGeometryMaterial();
		this._compositeMaterial = this.getCompositeMaterial();

		this._compositeCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		this._compositeScene = new Scene();

		this._quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
		this._quad.frustumCulled = false;
		this._compositeScene.add( this._quad );

	}

	dispose() {

		this._velocityBuffer.dispose();
		this._prevPosMap.clear();

	}

	setSize( width, height ) {

		this._velocityBuffer.setSize( width * this.renderTargetScale, height * this.renderTargetScale );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// Set the clear state
		this._prevClearColor.copy( renderer.getClearColor() );
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;
		renderer.setClearColor( this._clearColor, 0 );

		// Traversal function for iterating down and rendering the scene
		var self = this;
		var newMap = new Map();
		function recurse( obj ) {

			if ( obj.visible === false ) return;

			if ( obj.isMesh || obj.isSkinnedMesh ) {

				self._drawMesh( renderer, obj );

				// Recreate the map of drawn geometry so we can
				// drop references to removed meshes
				if ( self._prevPosMap.has( obj ) ) {

					newMap.set( obj, self._prevPosMap.get( obj ) );

				}

			}

			for ( var i = 0, l = obj.children.length; i < l; i ++ ) {

				recurse( obj.children[ i ] );

			}

		}

		// TODO: This is getting called just to set 'currentRenderState' in the renderer
		renderer.compile( this.scene, this.camera );

		// If we're rendering the blurred view, then we need to render
		// to the velocity buffer, otherwise we can render a debug view
		if ( this.debug.display === MotionBlurPass.DEFAULT ) {

			renderer.setRenderTarget( this._velocityBuffer );

		} else {

			renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );

		}

		// reinitialize the camera matrices to the current pos becaues if
		// the pass has been disabeled then the matrices will be out of date
		if ( this._cameraMatricesNeedInitializing ) {

			this._prevCamWorldInverse.copy( this.camera.matrixWorldInverse );
			this._prevCamProjection.copy( this.camera.projectionMatrix );
			this._cameraMatricesNeedInitializing = false;

		}

		this._projScreenMatrix.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
		this._frustum.setFromMatrix( this._projScreenMatrix );
		renderer.clear();
		recurse( this.scene );

		// replace the old map with a new one storing only
		// the most recently traversed meshes
		this._prevPosMap.clear();
		this._prevPosMap = newMap;

		this._prevCamWorldInverse.copy( this.camera.matrixWorldInverse );
		this._prevCamProjection.copy( this.camera.projectionMatrix );

		// compose the final blurred frame
		if ( this.debug.display === MotionBlurPass.DEFAULT ) {

			var cmat = this._compositeMaterial;
			cmat.uniforms.sourceBuffer.value = readBuffer.texture;
			cmat.uniforms.velocityBuffer.value = this._velocityBuffer.texture;

			if ( cmat.defines.SAMPLES !== this.samples ) {

				cmat.defines.SAMPLES = Math.max( 0, Math.floor( this.samples ) );
				cmat.needsUpdate = true;

			}

			renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
			renderer.render( this._compositeScene, this._compositeCamera );
			renderer.setRenderTarget( null );

		}

		// Restore renderer settings
		renderer.setClearColor( this._prevClearColor, prevClearAlpha );
		renderer.autoClear = prevAutoClear;

	}

	_getMaterialState( obj ) {

		var data = this._prevPosMap.get( obj );
		if ( data === undefined ) {

			data = {

				matrixWorld: obj.matrixWorld.clone(),
				geometryMaterial: this._geomMaterial.clone(),
				velocityMaterial: this._velocityMaterial.clone(),
				boneMatrices: null,
				boneTexture: null,

			};
			this._prevPosMap.set( obj, data );

		}

		var isSkinned = obj.type === 'SkinnedMesh' && obj.skeleton && obj.skeleton.bones && obj.skeleton.boneMatrices;

		data.geometryMaterial.skinning = isSkinned;
		data.velocityMaterial.skinning = isSkinned;

		// copy the skeleton state into the prevBoneTexture uniform
		var skeleton = obj.skeleton;
		if ( isSkinned && ( data.boneMatrices === null || data.boneMatrices.length !== skeleton.boneMatrices.length ) ) {

			var boneMatrices = new Float32Array( skeleton.boneMatrices.length );
			boneMatrices.set( skeleton.boneMatrices );
			data.boneMatrices = boneMatrices;

			var size = Math.sqrt( skeleton.boneMatrices.length / 4 );
			var boneTexture = new DataTexture( boneMatrices, size, size, RGBAFormat, FloatType );
			boneTexture.needsUpdate = true;

			data.geometryMaterial.uniforms.prevBoneTexture.value = boneTexture;
			data.velocityMaterial.uniforms.prevBoneTexture.value = boneTexture;
			data.boneTexture = boneTexture;

		}

		return data;

	}

	_saveMaterialState( obj ) {

		var data = this._prevPosMap.get( obj );

		if ( data.boneMatrices !== null ) {

			data.boneMatrices.set( obj.skeleton.boneMatrices );
			data.boneTexture.needsUpdate = true;

		}

		data.matrixWorld.copy( obj.matrixWorld );

	}

	_drawMesh( renderer, obj ) {

		var blurTransparent = this.blurTransparent;
		var renderCameraBlur = this.renderCameraBlur;
		var expandGeometry = this.expandGeometry;
		var interpolateGeometry = this.interpolateGeometry;
		var smearIntensity = this.smearIntensity;
		var overrides = obj.motionBlur;
		if ( overrides ) {

			if ( 'blurTransparent' in overrides ) blurTransparent = overrides.blurTransparent;
			if ( 'renderCameraBlur' in overrides ) renderCameraBlur = overrides.renderCameraBlur;
			if ( 'expandGeometry' in overrides ) expandGeometry = overrides.expandGeometry;
			if ( 'interpolateGeometry' in overrides ) interpolateGeometry = overrides.interpolateGeometry;
			if ( 'smearIntensity' in overrides ) smearIntensity = overrides.smearIntensity;

		}

		var skip = blurTransparent === false && ( obj.material.transparent || obj.material.alpha < 1 );
		skip = skip || obj.frustumCulled && ! this._frustum.intersectsObject( obj );
		if ( skip ) {

			if ( this._prevPosMap.has( obj ) && this.debug.dontUpdateState === false ) {

				this._saveMaterialState( obj );

			}
			return;

		}

		var data = this._getMaterialState( obj );
		var mat = this.debug.display === MotionBlurPass.GEOMETRY ? data.geometryMaterial : data.velocityMaterial;
		mat.uniforms.expandGeometry.value = expandGeometry;
		mat.uniforms.interpolateGeometry.value = Math.min( 1, Math.max( 0, interpolateGeometry ) );
		mat.uniforms.smearIntensity.value = smearIntensity;

		var projMat = renderCameraBlur ? this._prevCamProjection : this.camera.projectionMatrix;
		var invMat = renderCameraBlur ? this._prevCamWorldInverse : this.camera.matrixWorldInverse;
		mat.uniforms.prevProjectionMatrix.value.copy( projMat );
		mat.uniforms.prevModelViewMatrix.value.multiplyMatrices( invMat, data.matrixWorld );

		renderer.renderBufferDirect( this.camera, null, obj.geometry, mat, obj, null );

		if ( this.debug.dontUpdateState === false ) {

			this._saveMaterialState( obj );

		}

	}

	// Shaders
	getVelocityMaterial() {

		return new ShaderMaterial( VelocityShader );

	}

	getGeometryMaterial() {

		return new ShaderMaterial( GeometryShader );

	}

	getCompositeMaterial() {

		return new ShaderMaterial( CompositeShader );

	}

}

MotionBlurPass.DEFAULT = 0;
MotionBlurPass.VELOCITY = 1;
MotionBlurPass.GEOMETRY = 2;
