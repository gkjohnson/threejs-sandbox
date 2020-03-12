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
import { ColorResolveShader } from './ColorResolveShader.js';
import { PackedShader } from './PackedShader.js';
import { LinearDepthShader } from './LinearDepthShader.js';
import { MarchResultsShader } from './MarchResultsShader.js';
import {
	PackedNormalDisplayShader,
	LinearDepthDisplayShader,
	IntersectDistanceShader,
	IntersectUvShader,
	IntersectColorShader
} from './DebugShaders.js';
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

const _intersectUvMaterial = new ShaderMaterial( IntersectUvShader );
const _intersectUvQuad = new Pass.FullScreenQuad( _intersectUvMaterial );

const _intersectDistMaterial = new ShaderMaterial( IntersectDistanceShader );
const _intersectDistQuad = new Pass.FullScreenQuad( _intersectDistMaterial );

const _intersectColorMaterial = new ShaderMaterial( IntersectColorShader );
const _intersectColorQuad = new Pass.FullScreenQuad( _intersectColorMaterial );

const _prevClearColor = new Color();
const _blackColor = new Color( 0 );
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
		this.jitter = 'jitter' in options ? options.jitter : 1;

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
		this._depthReplacement = new ShaderReplacement( LinearDepthShader );

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = "SSRRPass.Depth";
		this._backfaceDepthReplacement = new ShaderReplacement( LinearDepthShader );
		this._backfaceDepthReplacement._replacementMaterial.side = BackSide;

		this._packedReplacement = new ShaderReplacement( PackedShader );
		this._packedReplacement.updateUniforms = function( object, material, target ) {

			this.constructor.prototype.updateUniforms.apply( this, arguments );

			target.defines.USE_UV = '';

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

			originalDefine = target.defines.USE_NORMALMAP;
			if ( target.uniforms.normalMap.value ) {

				target.defines.USE_NORMALMAP = '';
				target.defines.TANGENTSPACE_NORMALMAP = '';

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

		this._marchResultsBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: FloatType,
				format: RGBAFormat
			} );
		this._marchResultsBuffer.texture.name = "SSRRPass.MarchResults";

		const marchMaterial = new ShaderMaterial( MarchResultsShader );
		this._marchQuad = new Pass.FullScreenQuad( marchMaterial );

		const colorResolveMaterial = new ShaderMaterial( ColorResolveShader );
		this._colorResolveQuad = new Pass.FullScreenQuad( colorResolveMaterial );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();
		this._compositeQuad.dispose();

	}

	setSize( width, height ) {

		this._marchResultsBuffer.setSize( width, height );

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
		const prevSceneBackground = scene.background;
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
			packedReplacement.reset( scene, true );
			scene.background = prevSceneBackground;

		};

		scene.autoUpdate = false;
		renderer.shadowMap.enabled = false;
		renderer.autoClear = true;
		renderer.setClearColor( _blackColor, 0 );
		scene.background = null;

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

		// Render march results
		const marchQuad = this._marchQuad;
		const marchMaterial = marchQuad.material;
		const marchUniforms = marchMaterial.uniforms;
		marchUniforms.depthBuffer.value = depthBuffer.texture;
		marchUniforms.backfaceDepthBuffer.value = backfaceDepthBuffer.texture;

		marchUniforms.packedBuffer.value = packedBuffer.texture;
		marchUniforms.invProjectionMatrix.value.getInverse( camera.projectionMatrix );
		marchUniforms.projMatrix.value.copy( camera.projectionMatrix );
		marchUniforms.resolution.value.set( packedBuffer.width, packedBuffer.height );
		marchUniforms.jitter.value = this.jitter;

		marchUniforms.stride.value = this.stride;

		if ( marchMaterial.defines.MAX_STEPS !== this.steps ) {

			marchMaterial.defines.MAX_STEPS = Math.floor( this.steps );
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.BINARY_SEARCH_ITERATIONS !== this.binarySearchSteps ) {

			marchMaterial.defines.BINARY_SEARCH_ITERATIONS = Math.floor( this.binarySearchSteps );
			marchMaterial.needsUpdate = true;

		}

		renderer.setRenderTarget( this._marchResultsBuffer );
		renderer.clear();
		marchQuad.render( renderer );

		if ( debug.display === SSRRPass.INTERSECTION_RESULTS ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectUvQuad.material.uniforms.texture.value = this._marchResultsBuffer.texture;
			_intersectUvQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		if ( debug.display === SSRRPass.INTERSECTION_DISTANCE ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectDistQuad.material.uniforms.texture.value = this._marchResultsBuffer.texture;
			_intersectDistQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		if ( debug.display === SSRRPass.INTERSECTION_COLOR ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectColorQuad.material.uniforms.sourceBuffer.value = readBuffer.texture;
			_intersectColorQuad.material.uniforms.packedBuffer.value = packedBuffer.texture;
			_intersectColorQuad.material.uniforms.intersectBuffer.value = this._marchResultsBuffer.texture;

			_intersectColorQuad.render( renderer );
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

		const resolveQuad = this._colorResolveQuad;
		const resolveMaterial = resolveQuad.material;
		const resolveUniforms = resolveMaterial.uniforms;
		resolveUniforms.sourceBuffer.value = readBuffer.texture;
		resolveUniforms.packedBuffer.value = packedBuffer.texture;
		resolveUniforms.intersectBuffer.value = this._marchResultsBuffer.texture;
		resolveUniforms.intensity.value = this.intensity;

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		resolveQuad.render( renderer );
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
SSRRPass.INTERSECTION_DISTANCE = 6;
SSRRPass.INTERSECTION_COLOR = 7;
