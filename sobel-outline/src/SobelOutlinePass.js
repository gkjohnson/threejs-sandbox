import {
	Color,
	ShaderMaterial,
	WebGLRenderTarget,
	NearestFilter,
	RGBAFormat,
	HalfFloatType,
	RGBFormat,
	Math as MathUtils,
	DataTexture,
	RepeatWrapping,
	LinearFilter,
} from '//unpkg.com/three@0.114.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';
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

		this.normalOutlineThickness = 1;
		this.normalBias = 0;

		this.depthOutlineThickness = 1;
		this.depthOutlinePosition = 0;
		this.depthBias = 0;

		this._depthReplacement = new LinearDepthPass();
		this._depthBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBFormat,
				type: HalfFloatType,
			} );

		this._normalReplacement = new NormalPass();
		this._normalBuffer =
			new WebGLRenderTarget( 1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				format: RGBAFormat
			} );

		this._compositeQuad = new Pass.FullScreenQuad( new ShaderMaterial( SobelOutlineShader ) );

	}

	render( renderer, writeBuffer, readBuffer ) {

		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const {
			scene,
			camera,

			_depthBuffer,
			_depthReplacement,

			_normalBuffer,
			_normalReplacement,

			_compositeQuad,

			normalOutlineThickness,
			normalBias,
			depthOutlineThickness,
			depthBias,
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
		renderer.setRenderTarget( _normalBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// composite final render
		// const compositeMaterial = _compositeQuad.material;
		// compositeMaterial.uniforms.normalTex.value = _normalBuffer;
		// compositeMaterial.uniforms.depthTex.value = _depthBuffer;

		// compositeMaterial.uniforms.depthOutlineThickness.value = depthOutlineThickness;
		// compositeMaterial.uniforms.depthBias.value = depthBias;
		// compositeMaterial.uniforms.normalOutlineThickness.value = normalOutlineThickness;
		// compositeMaterial.uniforms.normalBias.value = normalBias;
		// renderer.getSize( compositeMaterial.uniforms.resolution.value );
		// compositeMaterial.uniforms.resolution.value.multiplyScalar( renderer.getPixelRatio() );

		// renderer.setRenderTarget( finalBuffer );
		// _compositeQuad.render( renderer );

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

SobelOutlinePass.CENTER = 0;
SobelOutlinePass.OUTSIDE = 1;
SobelOutlinePass.INSIDE = 2;

SobelOutlinePass.DEFAULT = 0;
SobelOutlinePass.OUTLINES_ONLY = 1;
