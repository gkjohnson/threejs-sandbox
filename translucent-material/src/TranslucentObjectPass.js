import {
	LessEqualDepth,
	ShaderMaterial,
	Scene,
	WebGLRenderTarget,
	DepthTexture,
	FrontSide,
	BackSide,
	DepthFormat,
	AdditiveBlending,
	FloatType,
} from '//unpkg.com/three@0.116.1/build/three.module.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';
import { TranslucentShader } from './TranslucentShader.js';
import { LayerShader } from './LayerShader.js';
import { CompositeShader } from './CompositeShader.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { RendererState } from '../../shader-replacement/src/RendererState.js';
import { NormalPass } from '../../shader-replacement/src/passes/NormalPass.js';
import { FinalTranslucentReplacement } from './FinalTranslucentReplacement.js';
import { DepthDebugShader } from './DepthDebugShader.js';

const depthQuad = new Pass.FullScreenQuad( new ShaderMaterial( DepthDebugShader ) );

const rendererState = new RendererState();
const tempScene = new Scene();
export class TranslucentObjectPass extends Pass {

	constructor( scene, camera ) {

		super();

		this.objects = [];
		this.scene = scene;
		this.camera = camera;
		this.layers = 1;
		this.compositeQuad = new Pass.FullScreenQuad( new ShaderMaterial( CompositeShader ) );
		this.translucentReplacement = new ShaderReplacement( TranslucentShader );
		this.layerReplacement = new ShaderReplacement( LayerShader );
		this.normalReplacement = new NormalPass();
		this.finalTranslucentReplacement = new FinalTranslucentReplacement();

		const colorBuffer = new WebGLRenderTarget( 1, 1 );

		const emptyBufferFront = new WebGLRenderTarget( 1, 1 );
		emptyBufferFront.depthTexture = new DepthTexture( DepthFormat );

		const emptyBufferBack = new WebGLRenderTarget( 1, 1 );
		emptyBufferBack.depthTexture = new DepthTexture( DepthFormat );

		this.colorBuffer = colorBuffer;
		this.emptyBufferFront = emptyBufferFront;
		this.emptyBufferBack = emptyBufferBack;

		// color buffer to accumulate in to
		// intermediate front depth buffer to render in to
		// intermediate back depth buffer to render in to

	}

	setSize( width, height ) {

		this.colorBuffer.setSize( width, height );
		this.emptyBufferFront.setSize( width, height );
		this.emptyBufferBack.setSize( width, height );

	}

	dispose() {

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		window.renderer = renderer;
		// NOTE: 3d objects should not penetrate

		const finalBuffer = this.renderToScreen ? null : writeBuffer;
		const {
			layers,
			objects,
			layerReplacement,
			translucentReplacement,
			normalReplacement,
			finalTranslucentReplacement,
			camera,
			colorBuffer,
			emptyBufferFront,
			emptyBufferBack,
			scene,
			compositeQuad,
		} = this;
		layerReplacement.replace( objects, true, true );
		rendererState.copy( renderer );
		renderer.setClearColor( 0 );

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

		for ( let i = 0; i < layers; i ++ ) {

			// render front faces into depth buffer
			// discard faces from the back layer that are closer than the new fragments
			// TODO: manually test against rest of the scene depth
			layerReplacement.replace( objects, true, false );
			tempScene.traverse( c => {

				const material = c.material;
				if ( material ) {

					material.uniforms.doCompare.value = i === 0.0 ? 0.0 : 1.0;
					material.uniforms.compareDepthTexture.value = emptyBufferBack.depthTexture;
					material.colorWrite = false;
					material.side = FrontSide;
					material.uniforms.resolution.value.set(
						colorBuffer.width, colorBuffer.height,
					);

				}

			} );

			renderer.autoClear = true;
			renderer.setRenderTarget( emptyBufferFront );
			renderer.render( tempScene, camera );

			if ( i === 0 ) {

				renderer.setRenderTarget( colorBuffer );
				renderer.render( tempScene, camera );

			}


			// Render back face buffer
			tempScene.traverse( c => {

				const material = c.material;
				if ( material ) {

					material.uniforms.compareDepthTexture.value = emptyBufferFront.depthTexture;
					material.colorWrite = false;
					material.side = BackSide;

				}

			} );

			renderer.autoClear = true;
			renderer.setRenderTarget( emptyBufferBack );
			renderer.render( tempScene, camera );

			// Render translucent layer
			translucentReplacement.replace( objects, true, false );
			tempScene.traverse( c => {

				const material = c.material;
				if ( material ) {

					material.uniforms.frontLayerTexture.value = emptyBufferFront.depthTexture;
					material.uniforms.backLayerTexture.value = emptyBufferBack.depthTexture;

					material.uniforms.cameraNear.value = camera.near;
					material.uniforms.cameraFar.value = camera.far;
					material.uniforms.resolution.value.set(
						colorBuffer.width, colorBuffer.height,
					);
					material.side = FrontSide;
					material.depthFunc = LessEqualDepth;
					material.blending = AdditiveBlending;

					if ( typeof material.uniforms.absorptionFactor.value !== 'number' ) {

						material.uniforms.absorptionFactor.value = 1.0;

					}

				}

			} );

			renderer.autoClear = false;
			renderer.setRenderTarget( colorBuffer );
			renderer.render( tempScene, camera );

		}

		// render normal buffer
		renderer.autoClear = true;
		normalReplacement.replace( tempScene, true, false );
		renderer.setRenderTarget( emptyBufferFront );
		renderer.render( tempScene, camera );

		// render the thickness to the final buffer
		renderer.autoClear = true;
		renderer.setRenderTarget( finalBuffer );
		compositeQuad.material.uniforms.absorbedTexture.value = colorBuffer.texture;
		compositeQuad.material.uniforms.readTexture.value = readBuffer.texture;
		compositeQuad.depthWrite = false;
		compositeQuad.render( renderer );

		// render the depth prepass so sheen does not overlap
		layerReplacement.replace( objects, true, false );
		tempScene.traverse( c => {

			const material = c.material;
			if ( material ) {

				material.uniforms.doCompare.value = 0;
				material.uniforms.compareDepthTexture.value = null;
				material.colorWrite = false;
				material.side = FrontSide;

			}

		} );

		renderer.autoClear = false;
		renderer.setRenderTarget( finalBuffer );
		renderer.clearDepth();
		renderer.render( tempScene, camera );

		// TODO: render the thickness value to emptyBufferFront
		// TODO: Create a transmission replacement that blurs, disperse, and refracts based on lower layer
		// TODO: Render it to the final buffer including

		// render the surface sheen
		tempScene.environment = scene.environment;
		finalTranslucentReplacement.replace( objects, true, false );
		renderer.render( tempScene, camera );

		// reset
		layerReplacement.reset( objects, true );
		rendererState.restore( renderer );

		tempScene.children = null;
		tempScene.environment = null;

		// composite the color buffer into the read buffer
		// using the normal sample perform refraction a sample the readbuffer
		// use mipmap to simulate diffusion
		// use wavelength ior diffraction
		// render a fully translucent pass on top to emulate the surface treatment
		// render each object with depth here

		// Render back faces first to model internal reflection / gem stone qualities?

	}

}
