import { ShaderMaterial, Scene, WebGLRenderTarget, DepthTexture, FrontSide, BackSide, DepthFormat, GreaterDepth } from '//unpkg.com/three@0.116.1/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';
import { TranslucentShader } from './TranslucentShader.js';
import { CompositeShader } from './CompositeShader.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { FinalTranslucentReplacement } from './FinalTranslucentReplacement.js';

const rendererState = new RendererState();
const tempScene = new Scene();
export class TranslucentObjectPass extends Pass {

	constructor( scene, camera ) {

		super();

		this.objects = [];
		this.scene = scene;
		this.camera = camera;
		this.layers = 1;
		this.compositeQuad = new Pass.FullScreenQuad( new ShaderMaterial( CompositeShader ) );;
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

		window.renderer = renderer;
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
			compositeQuad,
		} = this;
		translucentReplacement.replace( objects, true, true );
		rendererState.copy( renderer );

		tempScene.children = [ ...objects ];
		tempScene.autoUpdate = false;
		tempScene.matrixAutoUpdate = false;

		scene.traverse( c => {

			if ( c.isLight ) {

				tempScene.children.push( c );

			}

		} );

		// TODO: Reference paper here for more info on depth peeling algorithm:
		// http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.18.9286&rep=rep1&type=pdf
		// We may need a third buffer so we can render to depth twice for front and back faces
		// We must cull pixels manually to get the appropriate layer. Front must read from back and
		// vice versa.
		// https://gamedev.stackexchange.com/questions/116066/depth-peeling-implementation-problem-how-to-render-the-next-layer-opengl

		// renderer.state.buffers.depth.setClear( 0 );
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
					// material.depthFunc = GreaterDepth;
					material.side = FrontSide;

				}

			} );

			renderer.autoClear = i === 0;
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

			renderer.autoClear = i === 0;
			renderer.setRenderTarget( colorBuffer );
			renderer.render( tempScene, camera );

		}
		// renderer.state.buffers.depth.setClear( 1 );


		renderer.autoClear = true;
		renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
		compositeQuad.material.uniforms.absorbedTexture.value = colorBuffer.texture;
		compositeQuad.material.uniforms.readTexture.value = readBuffer.texture;
		compositeQuad.depthWrite = false;
		compositeQuad.render( renderer );

		renderer.autoClear = false;
		renderer.clearDepth();
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
