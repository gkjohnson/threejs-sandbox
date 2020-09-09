import {
	NearestFilter,
	FloatType,
	WebGLRenderTarget,
	RGBAFormat,
	Color,
	ShaderMaterial,
	FrontSide,
	BackSide,
} from '//unpkg.com/three@0.116.1/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';
import { ColorResolveShader } from './ColorResolveShader.js';
import { MarchResultsShader } from './MarchResultsShader.js';
import {
	PackedNormalDisplayShader,
	LinearDepthDisplayShader,
	DepthDeltaShader,
	IntersectDistanceShader,
	IntersectUvShader
} from './DebugShaders.js';
import { PackedNormalPass } from './PackedNormalPass.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { LinearDepthPass } from '../../gtaoPass/src/LinearDepthPass.js';

// Approach from
// http://jcgt.org/published/0003/04/04/paper.pdf
// https://github.com/kode80/kode80SSR

const _debugPackedMaterial = new ShaderMaterial( PackedNormalDisplayShader );
const _debugPackedQuad = new Pass.FullScreenQuad( _debugPackedMaterial );

const _debugDepthMaterial = new ShaderMaterial( LinearDepthDisplayShader );
const _debugDepthQuad = new Pass.FullScreenQuad( _debugDepthMaterial );

const _debugDepthDeltaMaterial = new ShaderMaterial( DepthDeltaShader );
const _debugDepthDeltaQuad = new Pass.FullScreenQuad( _debugDepthDeltaMaterial );

const _intersectUvMaterial = new ShaderMaterial( IntersectUvShader );
const _intersectUvQuad = new Pass.FullScreenQuad( _intersectUvMaterial );

const _intersectDistMaterial = new ShaderMaterial( IntersectDistanceShader );
const _intersectDistQuad = new Pass.FullScreenQuad( _intersectDistMaterial );

const _rendererState = new RendererState();
const _blackColor = new Color( 0 );
export class SSRRPass extends Pass {
	constructor( scene, camera, options = {} ) {

		super();

		this.enabled = true;
		this.needsSwap = true;

		this.intensity = 0.5;
		this.steps = 10;
		this.binarySearchSteps = 4;
		this.stride = 30;
		this.renderTargetScale = 0.5;
		this.raymarchTargetScale = 0.5;
		this.jitter = 1;
		this.thickness = 1;
		this.useThickness = false;
		this.useNormalMaps = true;
		this.useRoughnessMaps = true;
		this.roughnessOverride = null;
		this.glossinessMode = SSRRPass.NO_GLOSSY;

		this.useBlur = true;
		this.blurStride = 1;
		this.blurIterations = 5;

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
		this._depthBuffer.texture.name = 'SSRRPass.Depth';
		this._depthReplacement = new LinearDepthPass();
		this._depthReplacement.side = FrontSide;

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = 'SSRRPass.Depth';
		this._backfaceDepthReplacement = new LinearDepthPass();
		this._backfaceDepthReplacement.side = BackSide;

		this._packedReplacement = new PackedNormalPass();

		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: FloatType,
				format: RGBAFormat
			} );
		this._packedBuffer.texture.name = 'SSRRPass.Packed';

		this._marchResultsBuffer =
			new WebGLRenderTarget( 256, 256, {
				type: FloatType,
				format: RGBAFormat
			} );
		this._marchResultsBuffer.texture.name = 'SSRRPass.MarchResults';

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

		const raymarchTargetScale = this.raymarchTargetScale;
		const raymarchWidth = width * raymarchTargetScale;
		const raymarchHeight = height * raymarchTargetScale;

		this._marchResultsBuffer.setSize( raymarchWidth, raymarchHeight );

		const renderTargetScale = this.renderTargetScale;
		const renderWidth = width * renderTargetScale;
		const renderHeight = height * renderTargetScale;

		this._depthBuffer.setSize( renderWidth, renderHeight );
		this._backfaceDepthBuffer.setSize( renderWidth, renderHeight );
		this._packedBuffer.setSize( renderWidth, renderHeight );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		const scene = this.scene;
		const camera = this.camera;
		const debug = this.debug;

		// Save the previous scene state
		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const depthBuffer = this._depthBuffer;
		const packedBuffer = this._packedBuffer;
		const backfaceDepthBuffer = this._backfaceDepthBuffer;
		const useThickness = this.useThickness;

		const depthReplacement = this._depthReplacement;
		const backfaceDepthReplacement = this._backfaceDepthReplacement;
		const packedReplacement = this._packedReplacement;

		_rendererState.copy( renderer, scene );
		const replaceOriginalValues = () => {

			_rendererState.restore( renderer, scene );
			packedReplacement.reset( scene, true );

		};

		scene.autoUpdate = false;
		renderer.shadowMap.enabled = false;
		renderer.autoClear = true;
		renderer.setClearColor( _blackColor, 0 );
		scene.background = null;

		// Roughness / Normal pass
		packedReplacement.replace( scene, true, true );
		packedReplacement.useNormalMaps = this.useNormalMaps;
		packedReplacement.useRoughnessMaps = this.useRoughnessMaps;
		packedReplacement.roughnessOverride = this.roughnessOverride;
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
		depthReplacement.replace( scene, true, false );
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
			_debugDepthQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		if ( useThickness === false ) {

			// Render Backface Depth
			backfaceDepthReplacement.replace( scene, true, false );
			renderer.setRenderTarget( backfaceDepthBuffer );
			renderer.clear();
			renderer.render( scene, camera );

			if ( debug.display === SSRRPass.BACK_DEPTH ) {

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();

				_debugDepthMaterial.uniforms.texture.value = backfaceDepthBuffer.texture;
				_debugDepthQuad.render( renderer );
				replaceOriginalValues();
				return;

			}

			if ( debug.display === SSRRPass.DEPTH_DELTA ) {

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();

				_debugDepthDeltaMaterial.uniforms.backSideTexture.value = backfaceDepthBuffer.texture;
				_debugDepthDeltaMaterial.uniforms.frontSideTexture.value = depthBuffer.texture;
				_debugDepthDeltaMaterial.uniforms.divide.value = 30.0;
				_debugDepthDeltaQuad.render( renderer );
				replaceOriginalValues();
				return;

			}

		}

		// Render march results
		const marchResultsBuffer = this._marchResultsBuffer;
		const marchQuad = this._marchQuad;
		const marchMaterial = marchQuad.material;
		const marchUniforms = marchMaterial.uniforms;
		marchUniforms.depthBuffer.value = depthBuffer.texture;
		marchUniforms.backfaceDepthBuffer.value = backfaceDepthBuffer.texture;
		marchUniforms.colorBuffer.value = readBuffer.texture;
		marchUniforms.packedBuffer.value = packedBuffer.texture;
		marchUniforms.invProjectionMatrix.value.getInverse( camera.projectionMatrix );
		marchUniforms.projMatrix.value.copy( camera.projectionMatrix );
		marchUniforms.resolution.value.set( marchResultsBuffer.width, marchResultsBuffer.height );
		marchUniforms.jitter.value = this.jitter;
		marchUniforms.thickness.value = this.thickness;
		marchUniforms.stride.value = this.stride;

		if ( marchMaterial.defines.GLOSSY_MODE !== this.glossinessMode ) {

			marchMaterial.defines.GLOSSY_MODE = this.glossinessMode;
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.ORTHOGRAPHIC_CAMERA_VALUE !== Number( camera.isOrthographicCamera ) ) {

			marchMaterial.defines.ORTHOGRAPHIC_CAMERA_VALUE = Number( camera.isOrthographicCamera );
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.MAX_STEPS !== this.steps ) {

			marchMaterial.defines.MAX_STEPS = Math.floor( this.steps );
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.BINARY_SEARCH_ITERATIONS !== this.binarySearchSteps ) {

			marchMaterial.defines.BINARY_SEARCH_ITERATIONS = Math.floor( this.binarySearchSteps );
			marchMaterial.needsUpdate = true;

		}

		if ( ( ! ! marchMaterial.defines.USE_THICKNESS ) !== useThickness ) {

			marchMaterial.defines.USE_THICKNESS = useThickness ? 1.0 : 0.0;
			marchMaterial.needsUpdate = true;

		}

		const needsDebug = debug.display === SSRRPass.INTERSECTION_RESULTS || debug.display === SSRRPass.INTERSECTION_DISTANCE;
		if ( needsDebug !== Boolean( marchMaterial.defines.ENABLE_DEBUG ) ) {

			marchMaterial.defines.ENABLE_DEBUG = needsDebug ? 1.0 : 0.0;
			marchMaterial.needsUpdate = true;

		}

		renderer.setRenderTarget( marchResultsBuffer );
		renderer.clear();
		marchQuad.render( renderer );

		if ( debug.display === SSRRPass.INTERSECTION_RESULTS ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectUvQuad.material.uniforms.texture.value = marchResultsBuffer.texture;
			_intersectUvQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		if ( debug.display === SSRRPass.INTERSECTION_DISTANCE ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectDistQuad.material.uniforms.texture.value = marchResultsBuffer.texture;
			_intersectDistQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// TODO: Raymarch in a separate buffer and keep distance and final position in the final buffer
		// TODO: use the raymarch results at full scale, read the colors, and blend. The raymarch will be
		// larger than the target pixels so you can share the ray result with neighboring pixels and
		// blend silhouette using roughness map.
		const resolveQuad = this._colorResolveQuad;
		const resolveMaterial = resolveQuad.material;
		const resolveUniforms = resolveMaterial.uniforms;
		const resolveDefines = resolveMaterial.defines;
		resolveUniforms.sourceBuffer.value = readBuffer.texture;
		resolveUniforms.packedBuffer.value = packedBuffer.texture;
		resolveUniforms.intersectBuffer.value = marchResultsBuffer.texture;
		resolveUniforms.intensity.value = this.intensity;
		resolveUniforms.renderSize.value.set( depthBuffer.width, depthBuffer.height );
		resolveUniforms.marchSize.value.set( marchResultsBuffer.width, marchResultsBuffer.height );
		resolveUniforms.blurStride.value = this.blurStride;

		if ( this.enableBlur !== Boolean( resolveDefines.ENABLE_BLUR ) ) {

			resolveDefines.ENABLE_BLUR = this.enableBlur ? 1.0 : 0.0;
			resolveMaterial.needsUpdate = true;

		}

		if ( this.blurIterations !== resolveDefines.BLUR_ITERATIONS ) {

			resolveDefines.BLUR_ITERATIONS = this.blurIterations;
			resolveMaterial.needsUpdate = true;

		}

		const colorHitOnly = debug.display === SSRRPass.INTERSECTION_COLOR;
		if ( colorHitOnly !== Boolean( resolveDefines.COLOR_HIT_ONLY ) ) {

			resolveDefines.COLOR_HIT_ONLY = colorHitOnly ? 1.0 : 0.0;
			resolveMaterial.needsUpdate = true;

		}

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		resolveQuad.render( renderer );
		replaceOriginalValues();

	}

}

SSRRPass.DEFAULT = 0;
SSRRPass.FRONT_DEPTH = 1;
SSRRPass.BACK_DEPTH = 2;
SSRRPass.DEPTH_DELTA = 3;
SSRRPass.NORMAL = 4;
SSRRPass.ROUGHNESS = 5;
SSRRPass.INTERSECTION_RESULTS = 6;
SSRRPass.INTERSECTION_DISTANCE = 7;
SSRRPass.INTERSECTION_COLOR = 8;

SSRRPass.NO_GLOSSY = 0;
SSRRPass.SIMPLE_GLOSSY = 1;
