import {
	NearestFilter,
	FloatType,
	BackSide,
	WebGLRenderTarget,
	RGBAFormat,
	Color,
	ShaderMaterial,
} from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { CompositeShader } from './CompositeShader.js';
import { PackedShader } from './PackedShader.js';
import { LinearDepthShader } from './LinearDepthShader.js';
import { PackedNormalDisplayShader, LinearDepthDisplayShader } from './DebugShaders.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';

/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 * Approach from
 * http://jcgt.org/published/0003/04/04/paper.pdf
 * https://github.com/kode80/kode80SSR
 */

const _debugPackedMaterial = new ShaderMaterial( PackedNormalDisplayShader );
const _debugPackedQuad = new Pass.FullScreenQuad( _debugPackedMaterial );

const _debugDepthMaterial = new ShaderMaterial( LinearDepthDisplayShader );
const _debugDepthQuad = new Pass.FullScreenQuad( _debugDepthMaterial );

const _prevClearColor = new Color();
export class SSRRPass extends Pass {
	constructor( scene, camera, options = {} ) {

		super();

		this.enabled = true;
		this.needsSwap = true;

		this.intensity = 'intensity' in options ? options.intensity : 0.5;
		this.steps = 'steps' in options ? options.steps : 10;
		this.binarySearchSteps = 'binarySearchSteps' in options ? options.binarySearchSteps : 4;
		this.stride = 'stride' in options ? options.stride : 30;
		this.renderTargetScale = 'renderTargetScale' in options ? options.renderTargetScale : 0.5;

		this.scene = scene;
		this.camera = camera;
		this.debug = {
			display: SSRRPass.DEFAULT
		};

		// render targets
		this._depthBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._depthBuffer.texture.name = "SSRRPass.Depth";
		this._depthBuffer.texture.generateMipmaps = false;
		this._depthReplacement = new ShaderReplacement( LinearDepthShader );

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = "SSRRPass.Depth";
		this._backfaceDepthReplacement = new ShaderReplacement( LinearDepthShader );
		this._backfaceDepthReplacement._replacementMaterial.side = BackSide;

		// TODO: Handle normal maps, roughness maps here
		this._packedReplacement = new ShaderReplacement( PackedShader );
		this._packedReplacement.updateUniforms = function( object, material, target ) {

			this.constructor.prototype.updateUniforms.apply( this, arguments );

			target.defines.USE_UV = '';

			// TODO: Why is the roughness map not showing up?
			let originalDefine;
			originalDefine = target.defines.USE_ROUGHNESSMAP;
			if ( target.uniforms.roughnessMap.value ) {

				target.defines.USE_ROUGHNESSMAP = '';

			} else {

				delete target.defines.USE_ROUGHNESSMAP;

			}

			if ( originalDefine !== target.defines.USE_ROUGHNESSMAP ) {

				target.needsUpdate = true;
			}

			// TODO: Why does enabling normal map cause the model to turn black?
			originalDefine = target.defines.USE_NORMALMAP;
			if ( target.uniforms.normalMap.value ) {

				// target.defines.USE_NORMALMAP = '';
				// target.defines.TANGENTSPACE_NORMALMAP = '';

			} else {

				delete target.defines.USE_NORMALMAP;
				delete target.defines.TANGENTSPACE_NORMALMAP;

			}

			if ( originalDefine !== target.defines.USE_NORMALMAP ) {

				target.needsUpdate = true;
			}

		}

		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: FloatType,
				format: RGBAFormat
			} );
		this._packedBuffer.texture.name = "SSRRPass.Packed";
		this._packedBuffer.texture.generateMipmaps = false;

		const compositeMaterial = new ShaderMaterial( CompositeShader );
		this._compositeQuad = new Pass.FullScreenQuad( compositeMaterial );
		this._compositeMaterial = compositeMaterial;

	}

	dispose() {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();
		this._compositeQuad.dispose();

	}

	setSize( width, height ) {

		width *= this.renderTargetScale;
		height *= this.renderTargetScale;

		this._depthBuffer.setSize( width, height );
		this._backfaceDepthBuffer.setSize( width, height );
		this._packedBuffer.setSize( width, height );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// console.time('TEST')
		const scene = this.scene;
		const camera = this.camera;
		const debug = this.debug;

		// Save the previous scene state
		const prevClearAlpha = renderer.getClearAlpha();
		const prevAutoClear = renderer.autoClear;
		const prevOverride = this.scene.overrideMaterial;
		const prevAutoUpdate = scene.autoUpdate;
		const prevRenderTarget = renderer.getRenderTarget();
		const pevShadowEnabled = renderer.shadowMap.enabled;
		_prevClearColor.copy( renderer.getClearColor() );

		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const depthBuffer = this._depthBuffer;
		const packedBuffer = this._packedBuffer;
		const backfaceDepthBuffer = this._backfaceDepthBuffer;

		const depthReplacement = this._depthReplacement;
		const backfaceDepthReplacement = this._backfaceDepthReplacement;
		const packedReplacement = this._packedReplacement;

		const replaceOriginalValues = () => {

			// Restore renderer settings
			scene.overrideMaterial = prevOverride;
			renderer.setRenderTarget( prevRenderTarget );
			renderer.setClearColor( this._prevClearColor, prevClearAlpha );
			renderer.autoClear = prevAutoClear;
			renderer.shadowMap.enabled = pevShadowEnabled;
			scene.autoUpdate = prevAutoUpdate;
			packedReplacement.reset( scene, true )

		}

		scene.autoUpdate = false;
		renderer.shadowMap.enabled = false;
		renderer.autoClear = true;
		renderer.setClearColor( new Color( 0, 0, 0 ), 0 );

		// Roughness / Normal pass
		// TODO: Write a manual "material override" function that will automatically
		// make new materials and map their uniforms to it so we can get correct surface results.
		packedReplacement.replace( scene, true, true );
		renderer.setRenderTarget( packedBuffer );
		renderer.clear();
		renderer.render( scene, camera );
		if ( debug.display === SSRRPass.NORMAL ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugPackedMaterial.uniforms.displayRoughness.value = 0.0;
			_debugPackedMaterial.uniforms.texture.value = packedBuffer.texture;
			_debugPackedQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		if ( debug.display === SSRRPass.ROUGHNESS ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugPackedMaterial.uniforms.displayRoughness.value = 1.0;
			_debugPackedMaterial.uniforms.texture.value = packedBuffer.texture;
			_debugPackedQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Render depth
		depthReplacement.replace( scene, true );
		renderer.setRenderTarget( depthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// TODO: Use a depth texture with 1 value rather than 4 (Luminance, depth texture type?)
		// TODO: Depth looks banded right now -- instead of using float and storing the large values maybe
		// scale from zero to one and unpack in the raymarching code
		// TODO: Separate depth buffer resolution from final and march resolution
		if ( debug.display === SSRRPass.FRONT_DEPTH ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugDepthMaterial.uniforms.texture.value = depthBuffer.texture;
			_debugDepthMaterial.uniforms.divide.value = camera.far;
			_debugDepthQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Render Backface Depth
		backfaceDepthReplacement.replace( scene, true );
		renderer.setRenderTarget( backfaceDepthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		if ( debug.display === SSRRPass.BACK_DEPTH ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugDepthMaterial.uniforms.texture.value = backfaceDepthBuffer.texture;
			_debugDepthMaterial.uniforms.divide.value = camera.far;
			_debugDepthQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// TODO: Raymarch in a separate buffer and keep distance and final position in the final buffer
		// TODO: use the raymarch results at full scale, read the colors, and blend. The raymarch will be
		// larger than the target pixels so you can share the ray result with neighboring pixels and
		// blend silhouette using roughness map.
		// TODO: Jitter marching
		// TODO: Add z fade towards the camera
		// TODO: Add fade based on ray distance / closeness to end of steps

		// Composite
		const compositeMaterial = this._compositeMaterial;
		const uniforms = compositeMaterial.uniforms;
		uniforms.sourceBuffer.value = readBuffer.texture;
		uniforms.depthBuffer.value = depthBuffer.texture;
		uniforms.backfaceDepthBuffer.value = backfaceDepthBuffer.texture;

		uniforms.packedBuffer.value = packedBuffer.texture;
		uniforms.invProjectionMatrix.value.getInverse( camera.projectionMatrix );
		uniforms.projMatrix.value.copy( camera.projectionMatrix );
		uniforms.resolution.value.set( packedBuffer.width, packedBuffer.height );

		uniforms.intensity.value = this.intensity;
		uniforms.stride.value = this.stride;

		if ( compositeMaterial.defines.MAX_STEPS !== this.steps ) {

			compositeMaterial.defines.MAX_STEPS = Math.floor( this.steps );
			compositeMaterial.needsUpdate = true;

		}

		if ( compositeMaterial.defines.BINARY_SEARCH_ITERATIONS !== this.binarySearchSteps ) {

			compositeMaterial.defines.BINARY_SEARCH_ITERATIONS = Math.floor( this.binarySearchSteps );
			compositeMaterial.needsUpdate = true;

		}

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		this._compositeQuad.render( renderer );

		replaceOriginalValues();
		// console.timeEnd('TEST');

	}

}

SSRRPass.DEFAULT = 0;
SSRRPass.FRONT_DEPTH = 1;
SSRRPass.BACK_DEPTH = 2;
SSRRPass.NORMAL = 3;
SSRRPass.ROUGHNESS = 4;
SSRRPass.INTERSECTION_RESULTS = 5;
SSRRPass.INTERSECTION_COLORS = 6;
