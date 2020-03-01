import {
	NearestFilter,
	FloatType,
	BackSide,
	WebGLRenderTarget,
	HalfFloatType,
	RGBAFormat,
	OrthographicCamera,
	Scene,
	Mesh,
	PlaneBufferGeometry,
	Color,
	ShaderMaterial
} from '//unpkg.com/three@0.112.0/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.112.0/examples/jsm/postprocessing/Pass.js';
import { CompositeShader } from './CompositeShader.js';
import { PackedShader } from './PackedShader.js';
import { LinearDepthShader } from './LinearDepthShader.js';

/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 * Approach from
 * http://jcgt.org/published/0003/04/04/paper.pdf
 * https://github.com/kode80/kode80SSR
 */

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
		this._depthMaterial = new ShaderMaterial( LinearDepthShader );

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = "SSRRPass.Depth";
		this._backfaceDepthMaterial = new ShaderMaterial( LinearDepthShader );
		this._backfaceDepthMaterial.side = BackSide;

		this._packedMaterial = new ShaderMaterial( PackedShader );

		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: HalfFloatType,
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

		// Set the clear state
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		var prevOverride = this.scene.overrideMaterial;
		const prevRenderTarget = renderer.getRenderTarget();
		_prevClearColor.copy( renderer.getClearColor() );

		const scene = this.scene;
		const camera = this.camera;
		const finalBuffer = this.renderToScreen ? null : writeBuffer;

		const depthBuffer = this._depthBuffer;
		const packedBuffer = this._packedBuffer;
		const backfaceDepthBuffer = this._backfaceDepthBuffer;

		const depthMaterial = this._depthMaterial;
		const packedMaterial = this._packedMaterial;
		const backfaceDepthMaterial = this._backfaceDepthMaterial;

		renderer.autoClear = true;
		renderer.setClearColor( new Color( 0, 0, 0 ), 0 );

		// Normal pass
		scene.overrideMaterial = packedMaterial;
		renderer.setRenderTarget( packedBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		// Render depth
		scene.overrideMaterial = depthMaterial;
		renderer.setRenderTarget( depthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

		scene.overrideMaterial = backfaceDepthMaterial;
		renderer.setRenderTarget( backfaceDepthBuffer );
		renderer.clear();
		renderer.render( scene, camera );

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

		// Restore renderer settings
		scene.overrideMaterial = prevOverride;
		renderer.setRenderTarget( prevRenderTarget );
		renderer.setClearColor( this._prevClearColor, prevClearAlpha );
		renderer.autoClear = prevAutoClear;

	}

}
