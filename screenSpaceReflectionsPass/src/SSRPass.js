import {
	NearestFilter,
	FloatType,
	WebGLRenderTarget,
	RGBAFormat,
	RGBFormat,
	Color,
	ShaderMaterial,
	FrontSide,
	BackSide,
	DataTexture,
	RepeatWrapping,
	LinearFilter,
	LinearMipMapLinearFilter,
	MathUtils,
} from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { Pass } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/shaders/CopyShader.js';
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
import { BlueNoiseGenerator } from '../../blue-noise-generation/src/BlueNoiseGenerator.js';
import { PackedMipMapGenerator } from '../../custom-mipmap-generation/src/PackedMipMapGenerator.js';
import { FullScreenQuad } from '../../custom-mipmap-generation/src/FullScreenQuad.js';

// Approach from
// http://jcgt.org/published/0003/04/04/paper.pdf
// https://github.com/kode80/kode80SSR

const _debugPackedMaterial = new ShaderMaterial( PackedNormalDisplayShader );
const _debugPackedQuad = new FullScreenQuad( _debugPackedMaterial );

const _debugDepthMaterial = new ShaderMaterial( LinearDepthDisplayShader );
const _debugDepthQuad = new FullScreenQuad( _debugDepthMaterial );

const _debugDepthDeltaMaterial = new ShaderMaterial( DepthDeltaShader );
const _debugDepthDeltaQuad = new FullScreenQuad( _debugDepthDeltaMaterial );

const _intersectUvMaterial = new ShaderMaterial( IntersectUvShader );
const _intersectUvQuad = new FullScreenQuad( _intersectUvMaterial );

const _intersectDistMaterial = new ShaderMaterial( IntersectDistanceShader );
const _intersectDistQuad = new FullScreenQuad( _intersectDistMaterial );

const _rendererState = new RendererState();
const _blackColor = new Color( 0 );

// Generate Blue Noise Textures
const generator = new BlueNoiseGenerator();
generator.size = 32;

const data = new Uint8Array( 32 ** 2 * 4 );
for ( let i = 0, l = 4; i < l; i ++ ) {

	const result = generator.generate();
	const bin = result.data;
	const maxValue = result.maxValue;

	for ( let j = 0, l2 = bin.length; j < l2; j ++ ) {

		const value = 255 * ( bin[ j ] / maxValue );
		data[ j * 4 + i ] = value;

	}

}
const blueNoiseTex = new DataTexture( data, generator.size, generator.size, RGBAFormat );
blueNoiseTex.wrapS = RepeatWrapping;
blueNoiseTex.wrapT = RepeatWrapping;
blueNoiseTex.minFilter = LinearFilter;

export class SSRPass extends Pass {

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
		this.roughnessCutoff = 1.0;
		this.roughnessOverride = null;
		this.glossinessMode = SSRPass.NO_GLOSSY;
		this.jitterStrategy = SSRPass.REGULAR_JITTER;
		this.glossyJitterStrategy = SSRPass.RANDOM_JITTER;

		this.useBlur = true;
		this.blurStride = 1;
		this.blurRadius = 5;

		this.scene = scene;
		this.camera = camera;
		this.debug = {
			display: SSRPass.DEFAULT
		};

		// Depth Buffers
		this._depthBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._depthBuffer.texture.name = 'SSRPass.Depth';
		this._depthReplacement = new LinearDepthPass();

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = 'SSRPass.Depth';
		this._backfaceDepthReplacement = new LinearDepthPass();
		this._backfaceDepthReplacement.invertSide = true;

		// Depth Pyramid Buffer
		this._depthBufferLod =
		new WebGLRenderTarget( 256, 256, {
			minFilter: LinearMipMapLinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat,
			type: FloatType
		} );
		this._depthBufferLodGenerator = new PackedMipMapGenerator(
			/* glsl */`
				float minVal = samples[ 0 ].r;
				for ( int i = 1; i < SAMPLES; i ++ ) {

					minVal = min( minVal, samples[ i ].r );

				}
				gl_FragColor = vec4( minVal );
			`
		);

		// Mipmapped Color Buffer
		this._colorLod = new WebGLRenderTarget( 1, 1, {
			format: RGBFormat,
			minFilter: LinearMipMapLinearFilter,
			magFilter: LinearFilter,
			generateMipmaps: true,
		} );

		// Normal Pass Material Replacement and Buffer
		this._packedReplacement = new PackedNormalPass();
		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: FloatType,
				format: RGBAFormat
			} );
		this._packedBuffer.texture.name = 'SSRPass.Packed';

		// March Results Buffer
		this._marchResultsBuffer =
			new WebGLRenderTarget( 256, 256, {
				type: FloatType,
				format: RGBAFormat
			} );
		this._marchResultsBuffer.texture.name = 'SSRPass.MarchResults';

		// Full Screen Quads
		const marchMaterial = new ShaderMaterial( MarchResultsShader );
		this._marchQuad = new FullScreenQuad( marchMaterial );

		const colorResolveMaterial = new ShaderMaterial( ColorResolveShader );
		this._colorResolveQuad = new FullScreenQuad( colorResolveMaterial );

		this._copyQuad = new FullScreenQuad( new ShaderMaterial( CopyShader ) );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();
		this._compositeQuad.dispose();

	}

	setSize( width, height ) {

		const raymarchTargetScale = this.raymarchTargetScale;
		const raymarchWidth = Math.floor( width * raymarchTargetScale );
		const raymarchHeight = Math.floor( height * raymarchTargetScale );

		this._marchResultsBuffer.setSize( raymarchWidth, raymarchHeight );

		const renderTargetScale = this.renderTargetScale;
		const renderWidth = Math.floor( width * renderTargetScale );
		const renderHeight = Math.floor( height * renderTargetScale );

		this._depthBuffer.setSize( renderWidth, renderHeight );
		this._backfaceDepthBuffer.setSize( renderWidth, renderHeight );
		this._packedBuffer.setSize( renderWidth, renderHeight );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		const scene = this.scene;
		const camera = this.camera;
		const debug = this.debug;

		// Get variables
		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const depthBuffer = this._depthBuffer;
		const packedBuffer = this._packedBuffer;
		const backfaceDepthBuffer = this._backfaceDepthBuffer;

		// we can't render use back face depth and z pyramid glossiness
		const useThickness = this.glossinessMode === SSRPass.MIP_PYRAMID_GLOSSY || this.useThickness;

		const depthReplacement = this._depthReplacement;
		const backfaceDepthReplacement = this._backfaceDepthReplacement;
		const packedReplacement = this._packedReplacement;

		// Save the previous scene state
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

		// Debug Render Normal Map
		if ( debug.display === SSRPass.NORMAL ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugPackedMaterial.uniforms.displayRoughness.value = 0.0;
			_debugPackedMaterial.uniforms.tex.value = packedBuffer.texture;
			_debugPackedQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Debug Render Roughness Map
		if ( debug.display === SSRPass.ROUGHNESS ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugPackedMaterial.uniforms.displayRoughness.value = 1.0;
			_debugPackedMaterial.uniforms.tex.value = packedBuffer.texture;
			_debugPackedQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Render Depth
		depthReplacement.replace( scene, true, false );
		renderer.setRenderTarget( depthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// Render Depth Pyramid
		if ( this.glossinessMode === SSRPass.MIP_PYRAMID_GLOSSY ) {

			// generate depth pyramid
			this._depthBufferLodGenerator.update( depthBuffer, this._depthBufferLod, renderer, false );

			// copy the color buffer to a target that can create mipmaps
			const pow2ColorSize = MathUtils.floorPowerOfTwo( readBuffer.texture.image.width, readBuffer.texture.image.height );
			this._copyQuad.material.uniforms.tDiffuse.value = readBuffer.texture;
			this._colorLod.texture.generateMipmaps = true;
			this._colorLod.setSize( pow2ColorSize, pow2ColorSize );
			renderer.setRenderTarget( this._colorLod );
			this._copyQuad.render( renderer );

		}

		// Render Debug Depth Buffer
		if ( debug.display === SSRPass.FRONT_DEPTH ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugDepthMaterial.uniforms.tex.value = this.glossinessMode === SSRPass.MIP_PYRAMID_GLOSSY ? this._depthBufferLod : depthBuffer.texture;
			_debugDepthQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Render Backface Depth
		if ( useThickness === false ) {

			// Render Backface Depth
			backfaceDepthReplacement.replace( scene, true, false );
			renderer.setRenderTarget( backfaceDepthBuffer );
			renderer.clear();
			renderer.render( scene, camera );

			// Debug Render Backface Depth
			if ( debug.display === SSRPass.BACK_DEPTH ) {

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();

				_debugDepthMaterial.uniforms.tex.value = backfaceDepthBuffer.texture;
				_debugDepthQuad.render( renderer );
				replaceOriginalValues();
				return;

			}

			// Debug Render Depth Delta
			if ( debug.display === SSRPass.DEPTH_DELTA ) {

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

		// Initialize Ray March Material
		const marchResultsBuffer = this._marchResultsBuffer;
		const marchQuad = this._marchQuad;
		const marchMaterial = marchQuad.material;
		const marchUniforms = marchMaterial.uniforms;
		marchUniforms.depthBuffer.value = depthBuffer.texture;
		marchUniforms.backfaceDepthBuffer.value = backfaceDepthBuffer.texture;
		marchUniforms.colorBuffer.value = readBuffer.texture;
		marchUniforms.packedBuffer.value = packedBuffer.texture;
		marchUniforms.invProjectionMatrix.value.copy( camera.projectionMatrix ).invert();
		marchUniforms.projMatrix.value.copy( camera.projectionMatrix );
		marchUniforms.resolution.value.set( marchResultsBuffer.width, marchResultsBuffer.height );
		marchUniforms.jitter.value = this.jitter;
		marchUniforms.thickness.value = this.thickness;
		marchUniforms.stride.value = this.stride;
		marchUniforms.blueNoiseTex.value = blueNoiseTex;
		marchUniforms.roughnessCutoff.value = this.roughnessCutoff;

		if ( this.glossinessMode === SSRPass.MIP_PYRAMID_GLOSSY ) {

			marchUniforms.colorBuffer.value = this._colorLod.texture;
			marchUniforms.depthBufferLod.value = this._depthBufferLod.texture;

		}

		if ( marchMaterial.defines.GLOSSY_MODE !== this.glossinessMode ) {

			marchMaterial.defines.GLOSSY_MODE = this.glossinessMode;
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.JITTER_STRATEGY !== this.jitterStrategy ) {

			marchMaterial.defines.JITTER_STRATEGY = this.jitterStrategy;
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.GLOSSY_JITTER_STRATEGY !== this.glossyJitterStrategy ) {

			marchMaterial.defines.GLOSSY_JITTER_STRATEGY = this.glossyJitterStrategy;
			marchMaterial.needsUpdate = true;

		}

		if ( marchMaterial.defines.ORTHOGRAPHIC_CAMERA !== Number( camera.isOrthographicCamera || false ) ) {

			marchMaterial.defines.ORTHOGRAPHIC_CAMERA = Number( camera.isOrthographicCamera || false );
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

		const needsDebug = debug.display === SSRPass.INTERSECTION_RESULTS || debug.display === SSRPass.INTERSECTION_DISTANCE;
		if ( needsDebug !== Boolean( marchMaterial.defines.ENABLE_DEBUG ) ) {

			marchMaterial.defines.ENABLE_DEBUG = needsDebug ? 1.0 : 0.0;
			marchMaterial.needsUpdate = true;

		}

		// Render Ray March Colors
		renderer.setRenderTarget( marchResultsBuffer );
		renderer.clear();
		marchQuad.render( renderer );

		// Render Debug March UV Hits
		if ( debug.display === SSRPass.INTERSECTION_RESULTS ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectUvQuad.material.uniforms.tex.value = marchResultsBuffer.texture;
			_intersectUvQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Render Debug March Distance
		if ( debug.display === SSRPass.INTERSECTION_DISTANCE ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_intersectDistQuad.material.uniforms.tex.value = marchResultsBuffer.texture;
			_intersectDistQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		// Initialize Color Resolve Material
		const resolveQuad = this._colorResolveQuad;
		const resolveMaterial = resolveQuad.material;
		const resolveUniforms = resolveMaterial.uniforms;
		const resolveDefines = resolveMaterial.defines;
		resolveUniforms.depthBuffer.value = depthBuffer.texture;
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

		if ( this.blurRadius !== resolveDefines.BLUR_RADIUS ) {

			resolveDefines.BLUR_RADIUS = this.blurRadius;
			resolveMaterial.needsUpdate = true;

		}

		const colorHitOnly = debug.display === SSRPass.INTERSECTION_COLOR;
		if ( colorHitOnly !== Boolean( resolveDefines.COLOR_HIT_ONLY ) ) {

			resolveDefines.COLOR_HIT_ONLY = colorHitOnly ? 1.0 : 0.0;
			resolveMaterial.needsUpdate = true;

		}

		// Blend Color Resolve and Final Buffer
		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		resolveQuad.render( renderer );

		// Reset Initial State
		replaceOriginalValues();

	}

}

SSRPass.DEFAULT = 0;
SSRPass.FRONT_DEPTH = 1;
SSRPass.BACK_DEPTH = 2;
SSRPass.DEPTH_DELTA = 3;
SSRPass.NORMAL = 4;
SSRPass.ROUGHNESS = 5;
SSRPass.INTERSECTION_RESULTS = 6;
SSRPass.INTERSECTION_DISTANCE = 7;
SSRPass.INTERSECTION_COLOR = 8;

SSRPass.NO_GLOSSY = 0;
SSRPass.SIMPLE_GLOSSY = 1;
SSRPass.MULTI_GLOSSY = 2;
SSRPass.MIP_PYRAMID_GLOSSY = 3;

SSRPass.REGULAR_JITTER = 0;
SSRPass.BLUENOISE_JITTER = 1;
SSRPass.RANDOM_JITTER = 2;
