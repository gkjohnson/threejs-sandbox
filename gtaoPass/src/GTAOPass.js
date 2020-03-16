import { Color, ShaderMaterial, WebGLRenderTarget, NearestFilter, RGBAFormat, FloatType } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from '//unpkg.com/three@0.114.0/examples/jsm/shaders/CopyShader.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { PackedMipMapGenerator } from '../../custom-mipmap-generation/src/PackedMipMapGenerator.js';
import { LinearDepthShader } from '../../screenSpaceReflectionsPass/src/LinearDepthShader.js';
import { PackedShader } from '../../screenSpaceReflectionsPass/src/PackedShader.js';
import { LinearDepthDisplayShader, LinearMipDepthDisplayShader } from './DebugShaders.js';
import { PackedNormalDisplayShader } from '../../screenSpaceReflectionsPass/src/DebugShaders.js';
import { GTAOShader } from './GTAOShader.js';

const _gtaoMaterial = new ShaderMaterial( GTAOShader );
const _gtaoQuad = new Pass.FullScreenQuad( _gtaoMaterial );

const _debugPackedMaterial = new ShaderMaterial( PackedNormalDisplayShader );
const _debugPackedQuad = new Pass.FullScreenQuad( _debugPackedMaterial );

const _copyMaterial = new ShaderMaterial( CopyShader );
const _copyQuad = new Pass.FullScreenQuad( _copyMaterial );

const _debugDepthMaterial = new ShaderMaterial( LinearDepthDisplayShader );
const _debugDepthQuad = new Pass.FullScreenQuad( _debugDepthMaterial );

const _debugMipDepthMaterial = new ShaderMaterial( LinearMipDepthDisplayShader );
const _debugMipDepthQuad = new Pass.FullScreenQuad( _debugMipDepthMaterial );

const _blackColor = new Color( 0 );
const offsets = [ 0.0, 0.5, 0.25, 0.75 ];
const rotations = [ 60.0, 300.0, 180.0, 240.0, 120.0, 0.0 ];

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
		this.drawIndex = 0;

		this.renderTargetScale = 'renderTargetScale' in options ? options.renderTargetScale : 1.0;
		this.noiseIntensity = 'noiseIntensity' in options ? options.noiseIntensity : 1.0;

		this._gtaoBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );

		this._depthBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._depthPyramidBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat,
				type: FloatType
			} );
		this._depthReplacement = new ShaderReplacement( LinearDepthShader );
		this._depthPyramidGenerator = new PackedMipMapGenerator(
			/* glsl */`
			float depth = 0.0;

			#pragma unroll_loop
			for ( int i = 0; i < SAMPLES; i ++ ) {

				float sample = samples[ i ].r;
				if ( sample != 0.0 ) {

					depth =
						depth == 0.0 ?
							sample :
							max( sample, depth );

				}

			}

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
		const renderWidth = width * renderTargetScale;
		const renderHeight = height * renderTargetScale;

		this._depthBuffer.setSize( renderWidth, renderHeight );
		this._normalBuffer.setSize( renderWidth, renderHeight );
		this._gtaoBuffer.setSize( renderWidth, renderHeight );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		const drawIndex = this.drawIndex;
		this.drawIndex = ( drawIndex + 1 ) % 6;

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
				_debugDepthMaterial.uniforms.divide.value = camera.far;
				_debugDepthQuad.render( renderer );

			} else {

				_debugMipDepthMaterial.uniforms.originalSize.value.set(
					Math.floor( depthBuffer.texture.image.width ),
					Math.floor( depthBuffer.texture.image.height )
				);
				_debugMipDepthMaterial.uniforms.level.value = level;
				_debugMipDepthMaterial.uniforms.texture.value = depthPyramidBuffer.texture;
				_debugMipDepthMaterial.uniforms.divide.value = camera.far;
				_debugMipDepthQuad.render( renderer );

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

		// Run the GTAO sampling
		const gtaoBuffer = this._gtaoBuffer;
		const width = Math.floor( gtaoBuffer.texture.image.width );
		const height = Math.floor( gtaoBuffer.texture.image.height );
		const gtaoMaterial = _gtaoMaterial;
		const gtaoQuad = _gtaoQuad;
		const projection = camera.projectionMatrix;
		gtaoMaterial.uniforms.params.value.set(
			rotations[ drawIndex % 6 ] / 360.0,
			offsets[ ( drawIndex / 6 ) % 4 ]
		);
		gtaoMaterial.uniforms.projInfo.value.set(
			2.0 / ( width * projection.elements[ 4 * 1 + 1 ] ),
			2.0 / ( height * projection.elements[ 4 * 2 + 2 ] ),
			- 1.0 / ( projection.elements[ 4 * 1 + 1 ] ),
			- 1.0 / ( width * projection.elements[ 4 * 2 + 2 ] )
		);
		gtaoMaterial.uniforms.clipInfo.value.set(
			camera.near,
			camera.far,
			0.5 * ( height / ( 2.0 * Math.tan( camera.fov * 0.5 ) ) )
		);
		gtaoMaterial.uniforms.noiseIntensity.value = this.noiseIntensity;
		gtaoMaterial.uniforms.normalBuffer.value = packedBuffer.texture;
		gtaoMaterial.uniforms.depthPyramid.value = depthPyramidBuffer.texture;
		gtaoMaterial.uniforms.depthPyramidSize.value.set(
			Math.floor( depthBuffer.texture.image.width ),
			Math.floor( depthBuffer.texture.image.height )
		);

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		gtaoQuad.render( renderer );

		// TODO spatial denoise via blur

		// TODO temporal reproject denoise and accumulate

		// renderer.setRenderTarget( finalBuffer );
		// _copyMaterial.uniforms.tDiffuse.value = readBuffer.texture;
		// _copyQuad.render( renderer );

		replaceOriginalValues();

	}

}

GTAOPass.DEFAULT = 0;
GTAOPass.DEPTH_PYRAMID = 1;
GTAOPass.NORMAL = 2;
