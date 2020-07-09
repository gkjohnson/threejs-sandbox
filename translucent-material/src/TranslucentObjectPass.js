import { Scene, WebGLRenderTarget, DepthTexture, FrontSide, BackSide, DepthFormat } from '//unpkg.com/three@0.116.1/build/three.module.js';
import { TranslucentShader } from './TranslucentShader.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { FinalTranslucentReplacement } from './FinalTranslucentReplacement.js';

const rendererState = new RendererState();
const tempScene = new Scene();
export class TranslucentObjectPass {

	constructor( scene, camera ) {

		this.objects = [];
		this.scene = scene;
		this.camera = camera;
		this.layers = 1;
		this.translucentReplacement = new ShaderReplacement( TranslucentShader );
		this.finalTranslucentReplacement = new FinalTranslucentReplacement();

		const colorBuffer = new WebGLRenderTarget( 1, 1 );
		colorBuffer.depthTexture = new DepthTexture( DepthFormat );

		const emptyBuffer = new WebGLRenderTarget( 1, 1 );
		emptyBuffer.depthTexture = new DepthTexture( DepthFormat );

		this.colorBuffer = colorBuffer;
		this.emptyBuffer = emptyBuffer;

		console.log( this.emptyBuffer );
		// color buffer to accumulate in to
		// intermediate front depth buffer to render in to
		// intermediate back depth buffer to render in to

	}

	setSize( width, height ) {

		this.colorBuffer.setSize( width, height );
		this.emptyBuffer.setSize( width, height );

	}

	dispose() {

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// NOTE: 3d objects should not penetrate

		const {
			layers,
			objects,
			translucentReplacement,
			finalTranslucentReplacement,
			camera,
			colorBuffer,
			emptyBuffer,
			scene,
		} = this;
		translucentReplacement.replace( objects, true, true );
		rendererState.copy( renderer );

		renderer.autoClear = false;

		tempScene.children = [ ...objects ];
		tempScene.autoUpdate = false;
		tempScene.matrixAutoUpdate = false;

		scene.traverse( c => {

			if ( c.isLight ) {

				tempScene.children.push( c );

			}

		} );

		// renderer.setRenderTarget( writeBuffer );
		for ( let i = 0; i < layers; i ++ ) {

			// render front faces into depth buffer
			// manually test against rest of the scene depth
			tempScene.traverse( c => {

				const material = c.material;
				if ( material ) {

					material.uniforms.resolution.value.set(
						colorBuffer.width, colorBuffer.height,
					);
					material.uniforms.frontDepthTexture.value = null;
					material.uniforms.cameraNear.value = camera.near;
					material.uniforms.cameraFar.value = camera.far;
					material.colorWrite = false;
					material.side = FrontSide;

				}

			} );

			renderer.autoClear = true;
			renderer.setRenderTarget( emptyBuffer );
			renderer.render( tempScene, camera );

			// render backface into color of a new buffer underneath the current display
			// render dpeth into a depth buffer
			// manually test against rest of the scene depth. Use closest depth of the two
			tempScene.traverse( c => {

				const material = c.material;
				if ( material ) {

					material.uniforms.frontDepthTexture.value = emptyBuffer.depthTexture;
					material.colorWrite = true;
					material.side = BackSide;

				}

			} );

			renderer.autoClear = true;
			renderer.setRenderTarget( null );
			renderer.render( tempScene, camera );

		}

		renderer.autoClear = false;
		finalTranslucentReplacement.replace( objects, true, false );
		renderer.render( tempScene, camera );

		translucentReplacement.reset( objects, true );
		rendererState.restore( renderer );

		tempScene.children = null;

		// composite the color buffer into the read buffer
		// using the normal sample perform refraction a sample the readbuffer
		// use mipmap to simulate diffusion
		// use wavelength ior diffraction
		// render a fully translucent pass on top to emulate the surface treatment
		// render each object with depth here

		// Render back faces first to model internal reflection / gem stone qualities?

	}

}
