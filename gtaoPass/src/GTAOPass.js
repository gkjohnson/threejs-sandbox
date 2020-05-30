import {
	Color,
	ShaderMaterial,
	WebGLRenderTarget,
	NearestFilter,
	RGBAFormat,
	FloatType,
	HalfFloatType,
	RGBFormat,
	Math as MathUtils,
	UnsignedByteType,
} from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { CopyShader } from '//unpkg.com/three@0.114.0/examples/jsm/shaders/CopyShader.js';
// import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
// import { LinearDepthShader } from '../../screenSpaceReflectionsPass/src/LinearDepthShader.js';
// import { PackedShader } from '../../screenSpaceReflectionsPass/src/PackedShader.js';
import { NormalPass } from '../../shader-replacement/src/passes/NormalPass.js';
import { LinearDepthPass } from './LinearDepthPass.js';
import { LinearDepthDisplayShader } from './DebugShaders.js';
import { PackedNormalDisplayShader } from '../../screenSpaceReflectionsPass/src/DebugShaders.js';
import { GTAOShader } from './GTAOShader.js';
import { CompositeShader } from './CompositeShader.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';

const rendererState = new RendererState();
const blackColor = new Color( 0 );
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
		};
		this.sampleIndex = 0;

		this.renderTargetScale = 1.0;
		this.fixedSample = false;
		this.enableJitter = true;
		this.enableRadiusJitter = true;
		this.enableRotationJitter = true;
		this.blurIterations = 4;
		this.numSteps = 8;
		this.numDirections = 8;
		this.intensity = 1.0;
		this.radius = 2.0;
		this.blurMode = GTAOPass.BOX_BLUR;
		this.enableFalloff = true;
		this.falloffStart = 0.4;
		this.falloffEnd = 2.0;
		this.ambientColor = new Color();
		this.ambientIntensity = 0;

		this.colorBounceIntensity = 1;

		this._gtaoBuffer =
			new WebGLRenderTarget( 1, 1, {
				// minFilter: NearestFilter,
				// magFilter: NearestFilter,
				format: RGBAFormat,
			} );

		this._depthBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBFormat,
				type: HalfFloatType,
			} );

		// this._depthReplacement = new ShaderReplacement( LinearDepthShader );
		this._depthReplacement = new LinearDepthPass();
		// this._depthPyramidGenerator = new PackedMipMapGenerator(
		// 	/* glsl */`
		// 	float depth = 0.0;

		// 	#pragma unroll_loop_start
		// 	for ( int i = 0; i < SAMPLES; i ++ ) {

		// 		float sample = samples[ i ].r;
		// 		if ( sample != 0.0 ) {

		// 			depth =
		// 				depth == 0.0 ?
		// 					sample :
		// 					max( sample, depth );

		// 		}

		// 	}
		// 	#pragma unroll_loop_end

		// 	gl_FragColor = vec4( depth );

		// 	`
		// );


		this._normalBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat
			} );
		// this._normalReplacement = new ShaderReplacement( PackedShader );
		this._normalReplacement = new NormalPass();

		// quads
		this.gtaoQuad = new Pass.FullScreenQuad( new ShaderMaterial( GTAOShader ) );
		this.debugPackedQuad = new Pass.FullScreenQuad( new ShaderMaterial( PackedNormalDisplayShader ) );
		this.debugDepthQuad = new Pass.FullScreenQuad( new ShaderMaterial( LinearDepthDisplayShader ) );
		this.compositeQuad = new Pass.FullScreenQuad( new ShaderMaterial( CompositeShader ) );
		// this.copyQuad = new Pass.FullScreenQuad( new ShaderMaterial( CopyShader ) );

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

		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const {
			sampleIndex,
			scene,
			camera,
			debug,

			debugPackedQuad,
			debugDepthQuad,
			compositeQuad,
			gtaoQuad,
		} = this;

		const gtaoMaterial = gtaoQuad.material;

		rendererState.copy( renderer, scene );
		const restoreOriginalValues = () => {

			rendererState.restore( renderer, scene );
			depthReplacement.reset( scene, true );

		};

		// draw depth pyramid
		const depthReplacement = this._depthReplacement;
		const depthBuffer = this._depthBuffer;
		scene.background = null;
		depthReplacement.replace( scene, true, true );
		renderer.setRenderTarget( depthBuffer );
		renderer.setClearColor( blackColor, 0.0 );
		renderer.clear();
		renderer.render( scene, camera );

		if ( debug.display === GTAOPass.DEPTH ) {

			renderer.setRenderTarget( finalBuffer );

			debugDepthQuad.material.uniforms.texture.value = depthBuffer.texture;
			debugDepthQuad.render( renderer );

			// copy the pyramid at the target level to the screen
			restoreOriginalValues();
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

			debugPackedQuad.material.uniforms.displayRoughness.value = 0.0;
			debugPackedQuad.material.uniforms.texture.value = packedBuffer.texture;
			debugPackedQuad.render( renderer );
			restoreOriginalValues();
			return;

		}

		// Run the GTAO sampling
		if ( this.numSteps !== gtaoMaterial.defines.NUM_STEPS ) {

			gtaoMaterial.defines.NUM_STEPS = this.numSteps;
			gtaoMaterial.needsUpdate = true;

		}

		if ( this.numDirections !== gtaoMaterial.defines.NUM_DIRECTIONS ) {

			gtaoMaterial.defines.NUM_DIRECTIONS = this.numDirections;
			gtaoMaterial.needsUpdate = true;

		}

		if ( this.radius.toFixed( 16 ) !== gtaoMaterial.defines.RADIUS ) {

			gtaoMaterial.defines.RADIUS = this.radius.toFixed( 16 );
			gtaoMaterial.needsUpdate = true;

		}

		if (
			Math.pow( this.falloffStart, 2.0 ).toFixed( 16 ) !== gtaoMaterial.defines.FALLOFF_START2 ||
			Math.pow( this.falloffEnd, 2.0 ).toFixed( 16 ) !== gtaoMaterial.defines.FALLOFF_END2 ||
			this.enableFalloff !== Boolean( gtaoMaterial.defines.ENABLE_FALLOFF )
		) {

			gtaoMaterial.defines.FALLOFF_START2 = Math.pow( this.falloffStart, 2.0 ).toFixed( 16 );
			gtaoMaterial.defines.FALLOFF_END2 = Math.pow( this.falloffEnd, 2.0 ).toFixed( 16 );
			gtaoMaterial.defines.ENABLE_FALLOFF = this.enableFalloff ? 1 : 0;
			gtaoMaterial.needsUpdate = true;

		}

		if ( this.enableRotationJitter !== Boolean( gtaoMaterial.defines.ENABLE_ROTATION_JITTER ) ) {

			gtaoMaterial.defines.ENABLE_ROTATION_JITTER = this.enableRotationJitter ? 1 : 0;
			gtaoMaterial.needsUpdate = true;

		}

		if ( this.enableRadiusJitter !== Boolean( gtaoMaterial.defines.ENABLE_RADIUS_JITTER ) ) {

			gtaoMaterial.defines.ENABLE_RADIUS_JITTER = this.enableRadiusJitter ? 1 : 0;
			gtaoMaterial.needsUpdate = true;

		}

		// gtao
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
		gtaoMaterial.uniforms.normalBuffer.value = packedBuffer.texture;
		gtaoMaterial.uniforms.depthBuffer.value = depthBuffer.texture;
		gtaoMaterial.uniforms.colorBuffer.value = readBuffer.texture;
		gtaoMaterial.uniforms.colorBounceIntensity.value = this.colorBounceIntensity;

		gtaoMaterial.uniforms.renderSize.value.set(
			Math.floor( gtaoBuffer.texture.image.width ),
			Math.floor( gtaoBuffer.texture.image.height )
		);

		renderer.setRenderTarget( gtaoBuffer );
		renderer.clear();
		gtaoQuad.render( renderer );

		// blur and composite
		const compositeMaterial = compositeQuad.material;
		compositeMaterial.uniforms.depthBuffer.value = depthBuffer.texture;
		compositeMaterial.uniforms.normalBuffer.value = packedBuffer.texture;
		compositeMaterial.uniforms.colorBuffer.value = readBuffer.texture;
		compositeMaterial.uniforms.gtaoBuffer.value = gtaoBuffer.texture;
		compositeMaterial.uniforms.intensity.value = this.intensity;
		compositeMaterial.uniforms.aoSize.value.set( gtaoBuffer.width, gtaoBuffer.height );
		compositeMaterial.uniforms.fullSize.value.set( readBuffer.width, readBuffer.height );

		compositeMaterial.uniforms.ambientColor.value.copy( this.ambientColor );
		compositeMaterial.uniforms.ambientIntensity.value = this.ambientIntensity;
		if ( this.blurIterations !== compositeMaterial.defines.BLUR_ITERATIONS ) {

			compositeMaterial.defines.BLUR_ITERATIONS = this.blurIterations;
			compositeMaterial.needsUpdate = true;

		}

		if ( this.blurMode !== compositeMaterial.defines.BLUR_MODE ) {

			compositeMaterial.defines.BLUR_MODE = this.blurMode;
			compositeMaterial.needsUpdate = true;

		}

		if ( debug.display === GTAOPass.AO_SAMPLE ) {

			if ( compositeMaterial.defines.AO_ONLY !== 1 ) {

				compositeMaterial.defines.AO_ONLY = 1;
				compositeMaterial.needsUpdate = true;

			}

		} else {

			if ( compositeMaterial.defines.AO_ONLY !== 0 ) {

				compositeMaterial.defines.AO_ONLY = 0;
				compositeMaterial.needsUpdate = true;

			}

		}

		if ( debug.display === GTAOPass.COLOR_SAMPLE ) {

			if ( compositeMaterial.defines.COLOR_ONLY !== 1 ) {

				compositeMaterial.defines.COLOR_ONLY = 1;
				compositeMaterial.needsUpdate = true;

			}

		} else {

			if ( compositeMaterial.defines.COLOR_ONLY !== 0 ) {

				compositeMaterial.defines.COLOR_ONLY = 0;
				compositeMaterial.needsUpdate = true;

			}

		}

		renderer.setRenderTarget( finalBuffer );
		renderer.clear();
		compositeQuad.render( renderer );

		restoreOriginalValues();

	}

}

GTAOPass.DEFAULT = 0;
GTAOPass.DEPTH = 1;
GTAOPass.NORMAL = 2;
GTAOPass.AO_SAMPLE = 3;
GTAOPass.COLOR_SAMPLE = 4;

GTAOPass.NO_BLUR = 0;
GTAOPass.BOX_BLUR = 1;
GTAOPass.CROSS_BLUR = 2;
GTAOPass.DIAGONAL_BLUR = 3;
