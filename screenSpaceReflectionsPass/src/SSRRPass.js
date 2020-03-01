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

/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 *
 * Approach from
 * http://jcgt.org/published/0003/04/04/paper.pdf
 * https://github.com/kode80/kode80SSR
 */
export class SSRRPass extends Pass {
	constructor( scene, camera, options = {} ) {

		super();

		this.enabled = true;
		this.needsSwap = true;

		this.intensity = options.intensity || 0.5;
		this.steps = options.steps || 10;
		this.binarySearchSteps = options.binarySearchSteps || 4;
		this.stride = options.stride || 30;
		this.renderTargetScale = options.renderTargetScale || 0.5;

		this.scene = scene;
		this.camera = camera;

		this._prevClearColor = new Color();

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
		this._depthMaterial = this.createLinearDepthMaterial();

		this._backfaceDepthBuffer = this._depthBuffer.clone();
		this._backfaceDepthBuffer.texture.name = "SSRRPass.Depth";
		this._backfaceDepthMaterial = this.createLinearDepthMaterial();
		this._backfaceDepthMaterial.side = BackSide;

		this._packedBuffer =
			new WebGLRenderTarget( 256, 256, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				type: HalfFloatType,
				format: RGBAFormat
			} );
		this._packedBuffer.texture.name = "SSRRPass.Packed";
		this._packedBuffer.texture.generateMipmaps = false;

		this._compositeCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		this._compositeScene = new Scene();
		this._compositeMaterial = this.getCompositeMaterial();

		this._quad = new Mesh( new PlaneBufferGeometry( 2, 2 ), this._compositeMaterial );
		this._quad.frustumCulled = false;
		this._compositeScene.add( this._quad );

	}

	dispose() {

		this._depthBuffer.dispose();
		this._packedBuffer.dispose();

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
		this._prevClearColor.copy( renderer.getClearColor() );
		var prevClearAlpha = renderer.getClearAlpha();
		var prevAutoClear = renderer.autoClear;
		renderer.autoClear = true;
		renderer.setClearColor( new Color( 0, 0, 0 ), 0 );

		var prevOverride = this.scene.overrideMaterial;

		// Normal pass
		this.scene.overrideMaterial = this.createPackedMaterial();
		renderer.setRenderTarget( this._packedBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );

		// Render depth
		this.scene.overrideMaterial = this._depthMaterial;
		renderer.setRenderTarget( this._depthBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );

		this.scene.overrideMaterial = this._backfaceDepthMaterial;
		renderer.setRenderTarget( this._backfaceDepthBuffer );
		renderer.clear();
		renderer.render( this.scene, this.camera );
		this.scene.overrideMaterial = prevOverride;

		// Composite
		const cm = this._compositeMaterial;
		const uni = cm.uniforms;
		uni.sourceBuffer.value = readBuffer.texture;
		uni.depthBuffer.value = this._depthBuffer.texture;
		uni.backfaceDepthBuffer.value = this._backfaceDepthBuffer.texture;

		uni.packedBuffer.value = this._packedBuffer.texture;
		uni.invProjectionMatrix.value.getInverse( this.camera.projectionMatrix );
		uni.projMatrix.value.copy( this.camera.projectionMatrix );
		uni.resolution.value.set( this._packedBuffer.width, this._packedBuffer.height );

		uni.intensity.value = this.intensity;
		uni.stride.value = this.stride;

		if ( cm.defines.MAX_STEPS !== this.steps ) {

			cm.defines.MAX_STEPS = Math.floor( this.steps );
			cm.needsUpdate = true;

		}

		if ( cm.defines.BINARY_SEARCH_ITERATIONS !== this.binarySearchSteps ) {

			cm.defines.BINARY_SEARCH_ITERATIONS = Math.floor( this.binarySearchSteps );
			cm.needsUpdate = true;

		}



		this._quad.material = this._compositeMaterial;
		renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
		renderer.clear();
		renderer.render( this._compositeScene, this._compositeCamera );

		// Restore renderer settings
		renderer.setClearColor( this._prevClearColor, prevClearAlpha );
		renderer.autoClear = prevAutoClear;

	}

	createLinearDepthMaterial() {

		return new ShaderMaterial( {

			vertexShader: `
				varying vec3 vViewPosition;
				#ifndef FLAT_SHADED
					varying vec3 vNormal;
				#endif
				void main() {
					#include <beginnormal_vertex>
					#include <defaultnormal_vertex>
					#include <begin_vertex>
					#include <project_vertex>
					vViewPosition = mvPosition.xyz;
				}
			`,

			fragmentShader: `
				varying vec3 vViewPosition;
				void main() {
					gl_FragColor = vec4(vViewPosition.z);
				}
			`

		} );


	}

	createPackedMaterial() {

		return new ShaderMaterial( PackedShader );

	}

	getCompositeMaterial() {

		return new ShaderMaterial( CompositeShader );

	}

}
