import {
	Color,
	ShaderMaterial,
	WebGLRenderTarget,
	NearestFilter,
	RGBAFormat,
	FloatType,
	RGBFormat,
	Math as MathUtils,
	DataTexture,
	UnsignedByteType,
} from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from '//unpkg.com/three@0.114.0/examples/jsm/shaders/CopyShader.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { PackedMipMapGenerator } from '../../custom-mipmap-generation/src/PackedMipMapGenerator.js';
import { LinearDepthShader } from '../../screenSpaceReflectionsPass/src/LinearDepthShader.js';
import { PackedShader } from '../../screenSpaceReflectionsPass/src/PackedShader.js';
import { LinearDepthDisplayShader, LinearMipDepthDisplayShader } from './DebugShaders.js';
import { PackedNormalDisplayShader } from '../../screenSpaceReflectionsPass/src/DebugShaders.js';
import { GTAOShader } from './GTAOShader.js';
import { SinglePassGTAOShader } from './SinglePassGTAOShader.js';
import { CompositeShader } from './CompositeShader.js';
// import { DepthAwareUpscaleBlurShader } from './DepthAwareUpscaleBlurShader.js';

const _gtaoMaterial = new ShaderMaterial( GTAOShader );
const _gtaoQuad = new Pass.FullScreenQuad( _gtaoMaterial );

const _singlePassGtaoMaterial = new ShaderMaterial( SinglePassGTAOShader );
const _singlePassGtaoQuad = new Pass.FullScreenQuad( _singlePassGtaoMaterial );

const _debugPackedMaterial = new ShaderMaterial( PackedNormalDisplayShader );
const _debugPackedQuad = new Pass.FullScreenQuad( _debugPackedMaterial );

const _debugDepthMaterial = new ShaderMaterial( LinearDepthDisplayShader );
const _debugDepthQuad = new Pass.FullScreenQuad( _debugDepthMaterial );

const _debugMipDepthMaterial = new ShaderMaterial( LinearMipDepthDisplayShader );
const _debugMipDepthQuad = new Pass.FullScreenQuad( _debugMipDepthMaterial );

const _compositeMaterial = new ShaderMaterial( CompositeShader );
const _compositeQuad = new Pass.FullScreenQuad( _compositeMaterial );

// const _upscaleMaterial = new ShaderMaterial( DepthAwareUpscaleBlurShader );
// const _upscaleQuad = new Pass.FullScreenQuad( _upscaleMaterial );

const _copyMaterial = new ShaderMaterial( CopyShader );
const _copyQuad = new Pass.FullScreenQuad( _copyMaterial );

const _blackColor = new Color( 0 );
const offsets = [ 0.0, 0.5, 0.25, 0.75 ];
const rotations = [ 60.0, 300.0, 180.0, 240.0, 120.0, 0.0 ];

const data = new Uint8Array( 16 * 4 );
for (let i = 0; i < 4; ++i) {
	for (let j = 0; j < 4; ++j) {
		let dirnoise = 0.0625 * ((((i + j) & 0x3) << 2) + (i & 0x3));
		let offnoise = 0.25 * ((j - i) & 0x3);

		data[(i * 4 + j) * 4 + 0] = dirnoise * 255.0;
		data[(i * 4 + j) * 4 + 1] = offnoise * 255.0;
	}
}

const noiseTexture = new DataTexture( data, 4, 4, RGBAFormat, UnsignedByteType );

export class GTAOPass extends Pass {

	constructor( scene, camera, options = {} ) {

		super();

		this.enabled = true;
		this.needsSwap = true;

		this.scene = scene;
		this.camera = camera;
		this.debug = {
			display: GTAOPass.DEFAULT,
			depthLevel: - 1,
		};
		this.sampleIndex = 0;

		this.renderTargetScale = 'renderTargetScale' in options ? options.renderTargetScale : 1.0;
		this.noiseIntensity = 'noiseIntensity' in options ? options.noiseIntensity : 1.0;
		this.fixedSample = 'fixedSample' in options ? options.fixedSample : false;
		this.enableJitter = 'enableJitter' in options ? options.enableJitter : true;

		this._gtaoBuffer =
			new WebGLRenderTarget( 256, 256, {
				// minFilter: NearestFilter,
				// magFilter: NearestFilter,
				format: RGBFormat,
			} );

		this._depthBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBFormat,
				type: FloatType
			} );
		this._depthPyramidBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBFormat,
				type: FloatType
			} );
		this._depthReplacement = new ShaderReplacement( LinearDepthShader );
		this._depthPyramidGenerator = new PackedMipMapGenerator(
			/* glsl */`
			float depth = 0.0;

			#pragma unroll_loop_start
			for ( int i = 0; i < SAMPLES; i ++ ) {

				float sample = samples[ i ].r;
				if ( sample != 0.0 ) {

					depth =
						depth == 0.0 ?
							sample :
							max( sample, depth );

				}

			}
			#pragma unroll_loop_end

			gl_FragColor = vec4( depth );

			`
		);


		this._normalBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._normalReplacement = new ShaderReplacement( PackedShader );

	}

	dispose() {

	}

	setSize( width, height ) {

		const renderTargetScale = this.renderTargetScale;
		const renderWidth = Math.floor( width * renderTargetScale );
		const renderHeight = Math.floor( height * renderTargetScale );

		this._depthBuffer.setSize( width, height );
		this._normalBuffer.setSize( width, height );
		this._gtaoBuffer.setSize( renderWidth, renderHeight );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		if ( ! this.fixedSample ) {

			this.sampleIndex = ( this.sampleIndex + 1 ) % 6;

		} else {

			this.sampleIndex = this.sampleIndex % 6;

		}

		const sampleIndex = this.sampleIndex;
		const scene = this.scene;
		const camera = this.camera;
		const debug = this.debug;
		const finalBuffer = this.renderToScreen ? null : writeBuffer;

		const _prevClearColor = new Color();

		// Save the previous scene state
		const prevClearAlpha = renderer.getClearAlpha();
		const prevAutoClear = renderer.autoClear;
		const prevOverride = scene.overrideMaterial;
		const prevAutoUpdate = scene.autoUpdate;
		const prevRenderTarget = renderer.getRenderTarget();
		const pevShadowEnabled = renderer.shadowMap.enabled;
		const prevSceneBackground = scene.background;
		_prevClearColor.copy( renderer.getClearColor() );

		const replaceOriginalValues = () => {

			// Restore renderer settings
			scene.overrideMaterial = prevOverride;
			renderer.setRenderTarget( prevRenderTarget );
			renderer.setClearColor( this._prevClearColor, prevClearAlpha );
			renderer.autoClear = prevAutoClear;
			renderer.shadowMap.enabled = pevShadowEnabled;
			scene.autoUpdate = prevAutoUpdate;
			scene.background = prevSceneBackground;
			depthReplacement.reset( scene, true );

		};

		// draw depth pyramid
		const depthPyramidGenerator = this._depthPyramidGenerator;
		const depthReplacement = this._depthReplacement;
		const depthBuffer = this._depthBuffer;
		const depthPyramidBuffer = this._depthPyramidBuffer;
		depthReplacement.replace( scene, true, true );
		renderer.setRenderTarget( depthBuffer );
		renderer.setClearColor( _blackColor, 0.0 );
		renderer.clear();
		renderer.render( scene, camera );

		depthPyramidGenerator.update( depthBuffer, depthPyramidBuffer, renderer, false );

		if ( debug.display === GTAOPass.DEPTH_PYRAMID ) {

			renderer.setRenderTarget( finalBuffer );

			const level = debug.depthLevel;
			if ( level < 0 ) {

				_debugDepthMaterial.uniforms.texture.value = depthPyramidBuffer.texture;
				_debugDepthQuad.render( renderer );

			} else {

				_debugMipDepthMaterial.uniforms.originalSize.value.set(
					Math.floor( depthBuffer.texture.image.width ),
					Math.floor( depthBuffer.texture.image.height )
				);
				_debugMipDepthMaterial.uniforms.level.value = level;
				_debugMipDepthMaterial.uniforms.texture.value = depthPyramidBuffer.texture;

				renderer.setRenderTarget( this._gtaoBuffer );
				renderer.clear();
				_debugMipDepthQuad.render( renderer );

				renderer.setRenderTarget( finalBuffer );
				renderer.clear();
				_copyMaterial.uniforms.tDiffuse.value = this._gtaoBuffer.texture;
				_copyQuad.render( renderer );

			}

			// copy the pyramid at the target level to the screen
			replaceOriginalValues();
			return;

		}

		// Roughness / Normal pass
		const packedReplacement = this._normalReplacement;
		const packedBuffer = this._normalBuffer;
		packedReplacement.replace( scene, true, false );
		renderer.setRenderTarget( packedBuffer );
		renderer.clear();
		renderer.render( scene, camera );
		if ( debug.display === GTAOPass.NORMAL ) {

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();

			_debugPackedMaterial.uniforms.displayRoughness.value = 0.0;
			_debugPackedMaterial.uniforms.texture.value = packedBuffer.texture;
			_debugPackedQuad.render( renderer );
			replaceOriginalValues();
			return;

		}

		window.gtaoPass = this;

		// Run the GTAO sampling
		let gtaoMaterial, gtaoQuad;
		if ( this.singlePass ) {

			gtaoMaterial = _singlePassGtaoMaterial;
			gtaoQuad = _singlePassGtaoQuad;

		} else {

			gtaoMaterial = _gtaoMaterial;
			gtaoQuad = _gtaoQuad;

		}
		const gtaoBuffer = this._gtaoBuffer;
		const width = Math.floor( gtaoBuffer.texture.image.width );
		const height = Math.floor( gtaoBuffer.texture.image.height );
		const projection = camera.projectionMatrix;
		const fovRadians = MathUtils.DEG2RAD * camera.fov;
		gtaoMaterial.uniforms.params.value.set(
			rotations[ sampleIndex % 6 ] / 360.0,
			offsets[ sampleIndex % 4 ]
		);

		gtaoMaterial.uniforms.projInfo.value.set(
			2.0 / ( width * projection.elements[ 4 * 0 + 0 ] ),
			2.0 / ( height * projection.elements[ 4 * 1 + 1 ] ),
			- 1.0 / projection.elements[ 4 * 0 + 0 ],
			- 1.0 / projection.elements[ 4 * 1 + 1 ]
		);
		gtaoMaterial.uniforms.clipInfo.value.set(
			camera.near,
			camera.far,
			0.5 * ( height / ( 2.0 * Math.tan( fovRadians * 0.5 ) ) ),
			0.0
		);
		gtaoMaterial.uniforms.noiseIntensity.value = this.noiseIntensity;
		gtaoMaterial.uniforms.normalBuffer.value = packedBuffer.texture;
		gtaoMaterial.uniforms.depthPyramid.value = depthPyramidBuffer.texture;
		gtaoMaterial.uniforms.depthPyramidSize.value.set(
			Math.floor( depthBuffer.texture.image.width ),
			Math.floor( depthBuffer.texture.image.height )
		);
		gtaoMaterial.uniforms.renderSize.value.set(
			Math.floor( gtaoBuffer.texture.image.width ),
			Math.floor( gtaoBuffer.texture.image.height )
		);
		gtaoMaterial.uniforms.noiseTexture.value = this.enableJitter ? noiseTexture : null;

		if ( debug.display === GTAOPass.AO_SAMPLE ) {

			renderer.setRenderTarget( gtaoBuffer );
			renderer.clear();
			gtaoQuad.render( renderer );

			renderer.setRenderTarget( finalBuffer );
			renderer.clear();
			_copyMaterial.uniforms.tDiffuse.value = gtaoBuffer.texture;
			_copyQuad.render( renderer );

			replaceOriginalValues();
			return;

		} else {

			renderer.setRenderTarget( gtaoBuffer );
			renderer.clear();
			gtaoQuad.render( renderer );

		}

		if ( ! this.singlePass ) {

			// TODO spatial denoise via blur

			// TODO temporal reproject denoise and accumulate

		}

		_compositeMaterial.uniforms.colorBuffer.value = readBuffer.texture;
		_compositeMaterial.uniforms.gtaoBuffer.value = gtaoBuffer.texture;
		_compositeMaterial.uniforms.aoSize.value.set( gtaoBuffer.width, gtaoBuffer.height );
		_compositeMaterial.uniforms.fullSize.value.set( readBuffer.width, readBuffer.height );


		if ( debug.display === GTAOPass.AO_BLUR ) {

			if ( _compositeMaterial.defines.AO_ONLY !== 1 ) {

				_compositeMaterial.defines.AO_ONLY = 1;
				_compositeMaterial.needsUpdate = true;

			}

		} else {

			if ( _compositeMaterial.defines.AO_ONLY !== 0 ) {

				_compositeMaterial.defines.AO_ONLY = 0;
				_compositeMaterial.needsUpdate = true;

			}

		}

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		_compositeQuad.render( renderer );


		// renderer.setRenderTarget( finalBuffer );
		// _copyMaterial.uniforms.tDiffuse.value = readBuffer.texture;
		// _copyQuad.render( renderer );

		replaceOriginalValues();

	}

}

GTAOPass.DEFAULT = 0;
GTAOPass.DEPTH_PYRAMID = 1;
GTAOPass.NORMAL = 2;
GTAOPass.AO_SAMPLE = 3;
GTAOPass.AO_BLUR = 4;
