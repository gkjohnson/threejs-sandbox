import {
	Color,
	ShaderMaterial,
	WebGLRenderTarget,
	RGBAFormat,
	HalfFloatType,
	RGBFormat,
	LinearFilter,
} from '//cdn.skypack.dev/three@0.114.0/build/three.module.js';
import { Pass } from '//cdn.skypack.dev/three@0.114.0/examples/jsm/postprocessing/Pass.js';
import { NormalPass } from '../../shader-replacement/src/passes/NormalPass.js';
import { LinearDepthPass } from '../../gtaoPass/src/LinearDepthPass.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { SobelOutlineShader } from './SobelOutlineShader.js';

const rendererState = new RendererState();
const blackColor = new Color( 0 );

export class SobelOutlinePass extends Pass {

	constructor( scene, camera ) {

		super();
		this.enabled = true;
		this.swap = true;

		this.scene = scene;
		this.camera = camera;
		this.outlinesOnly = false;
		this.useNormalMaps = true;

		this.normalOutlineThickness = 1;
		this.normalBias = 1;

		this.depthOutlineThickness = 1;
		this.depthBias = 1;
		this.color = new Color( 0 );

		this._depthReplacement = new LinearDepthPass();
		this._depthBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBFormat,
				type: HalfFloatType,
			} );

		this._normalReplacement = new NormalPass();
		this._normalBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBAFormat
			} );

		this._compositeQuad = new Pass.FullScreenQuad( new ShaderMaterial( SobelOutlineShader ) );

	}

	render( renderer, writeBuffer, readBuffer ) {

		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const {
			scene,
			camera,
			outlinesOnly,

			_depthBuffer,
			_depthReplacement,

			_normalBuffer,
			_normalReplacement,

			_compositeQuad,

			normalOutlineThickness,
			normalBias,
			depthOutlineThickness,
			depthBias,
			color,
			useNormalMaps,
		} = this;

		rendererState.copy( renderer, scene );
		const restoreOriginalValues = () => {

			rendererState.restore( renderer, scene );
			_depthReplacement.reset( scene, true );

		};

		scene.background = blackColor;

		// render depth
		_depthReplacement.replace( scene, true, true );
		renderer.setRenderTarget( _depthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// render normals
		_normalReplacement.replace( scene, true, false );
		_normalReplacement.useNormalMaps = useNormalMaps;
		renderer.setRenderTarget( _normalBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// composite final render
		const compositeMaterial = _compositeQuad.material;
		compositeMaterial.uniforms.normalTex.value = _normalBuffer.texture;
		compositeMaterial.uniforms.depthTex.value = _depthBuffer.texture;
		compositeMaterial.uniforms.mainTex.value = readBuffer.texture;

		compositeMaterial.uniforms.depthOutlineThickness.value = depthOutlineThickness;
		compositeMaterial.uniforms.depthBias.value = depthBias;
		compositeMaterial.uniforms.normalOutlineThickness.value = normalOutlineThickness;
		compositeMaterial.uniforms.normalBias.value = normalBias;
		compositeMaterial.uniforms.outlineColor.value.copy( color );
		renderer.getSize( compositeMaterial.uniforms.resolution.value );
		compositeMaterial.uniforms.resolution.value.multiplyScalar( renderer.getPixelRatio() );

		if ( compositeMaterial.defines.OUTLINES_ONLY !== Number( outlinesOnly ) ) {

			compositeMaterial.defines.OUTLINES_ONLY = Number( outlinesOnly );
			compositeMaterial.needsUpdate = true;

		}

		renderer.setRenderTarget( finalBuffer );
		_compositeQuad.render( renderer );

		restoreOriginalValues();

	}

	setSize( width, height ) {

		this._depthBuffer.setSize( width, height );
		this._normalBuffer.setSize( width, height );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._normalBuffer.dispose();

	}

}

SobelOutlinePass.DEFAULT = 0;
SobelOutlinePass.OUTLINES_ONLY = 1;
