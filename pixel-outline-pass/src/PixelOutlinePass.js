import {
	Scene,
	MeshBasicMaterial,
	Color,
	ShaderMaterial,
	Vector2,
	WebGLRenderTarget,
	LinearFilter,
	RGBAFormat
} from '//unpkg.com/three@0.116.1/build/three.module.js';
import { LineMaterial } from '//unpkg.com/three@0.116.1/examples/jsm/lines/LineMaterial.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { Pass } from '//unpkg.com/three@0.116.1/examples/jsm/postprocessing/Pass.js';

const compositeShader = {

	uniforms: {

		opacity: { value: 1 },
		thickness: { value: 1 },
		resolution: { value: new Vector2() },
		mainTex: { value: null },
		outlineTex: { value: null },

	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}
	`,
	fragmentShader: /* glsl */`
		varying vec2 vUv;
		uniform sampler2D mainTex;
		uniform sampler2D outlineTex;
		uniform float thickness;
		uniform float opacity;
		uniform vec2 resolution;
		void main() {

			vec2 resMult = 1.0 / resolution;
			vec2 offset1 = vec2( 0.0, 1.0 ) * thickness * resMult;
			vec2 offset2 = vec2( 0.0, -1.0 ) * thickness * resMult;
			vec2 offset3 = vec2( 1.0, 0.0 ) * thickness * resMult;
			vec2 offset4 = vec2( -1.0, 0.0 ) * thickness * resMult;

			vec4 pix = texture2D( outlineTex, vUv );
			vec4 pix1 = texture2D( outlineTex, vUv + offset1 );
			vec4 pix2 = texture2D( outlineTex, vUv + offset2 );
			vec4 pix3 = texture2D( outlineTex, vUv + offset3 );
			vec4 pix4 = texture2D( outlineTex, vUv + offset4 );

			bool onBorder =
				pix.a != 0.0 &&
				(
					pix.rgb != pix1.rgb ||
					pix.rgb != pix2.rgb ||
					pix.rgb != pix3.rgb ||
					pix.rgb != pix4.rgb
				);

			float weights = pix1.a + pix2.a + pix3.a + pix4.a;
			vec3 color = pix1.rgb * pix1.a + pix2.rgb * pix2.a + pix3.rgb * pix3.a + pix4.rgb * pix4.a;
			color /= weights;
			color = clamp( color, 0.0, 1.0 );

			float alpha = onBorder || weights != 0.0 && pix.a == 0.0 ? opacity : 0.0;
			vec4 main = texture2D( mainTex, vUv );
			gl_FragColor = mix( main, vec4( color, 1.0 ), alpha );

		}
	`,

};

class BasicShaderReplacement extends ShaderReplacement {

	constructor() {

		super();
		this.colorMap = new WeakMap();

	}

	createMaterial( object ) {

		if ( object.isLine2 ) {

			return new LineMaterial();

		} else {

			return new MeshBasicMaterial();

		}

	}

	updateUniforms( object, material, target ) {

		const colorMap = this.colorMap;
		let color = 0;
		let opacity = 0;
		if ( colorMap.has( object ) ) {

			color = colorMap.get( object );
			opacity = 1;

		}

		target.side = material.side;
		target.opacity = opacity;
		if ( color instanceof Color ) {

			target.color.copy( color );

		} else {

			target.color.set( color );

		}

		if ( target instanceof LineMaterial ) {

			target.linewidth = material.linewidth;
			target.resolution.copy( material.resolution );

		}

	}

}

export class PixelOutlinePass extends Pass {

	constructor( camera ) {

		super();

		const auxScene = new Scene();
		auxScene.autoUpdate = false;

		this.renderTarget = new WebGLRenderTarget( 1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat
		} );
		this.quad = new Pass.FullScreenQuad( new ShaderMaterial( compositeShader ) );
		this.replacer = new BasicShaderReplacement();
		this.colorMap = new Map();
		this.objects = [];
		this.auxScene = auxScene;
		this.camera = camera;
		this.needsSwap = true;

		this.scene = null;
		this.renderDepth = false;
		this.thickness = 1;
		this.opacity = 1;

		window.outlinePass = this;

	}

	setOutline( color, newObjects ) {

		const colors = this.colorMap;
		const objects = this.objects;
		for ( let i = 0, l = newObjects.length; i < l; i ++ ) {

			const o = newObjects[ i ];
			if ( ! colors.has( o ) ) {

				objects.push( o );

			}

			colors.set( o, color );

		}

	}

	removeOutline( removeObjects ) {

		const colors = this.colorMap;
		const objects = this.objects;
		for ( let i = 0, l = removeObjects.length; i < l; i ++ ) {

			const o = removeObjects[ i ];
			colors.delete( o );

			const index = objects.indexOf( o );
			objects.splice( index, 1 );

		}

	}

	clearOutlines() {

		this.colorMap.clear();
		this.objects.length = 0;

	}

	dispose() {

		this.clearOutlines();
		this.replacer.dispose();
		this.renderTarget.dispose();

	}

	setSize( w, h ) {

		this.renderTarget.setSize( w, h );
		this.quad.material.uniforms.resolution.value.set( w, h );

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		const colorMap = this.colorMap;
		const objects = this.objects;
		const replacer = this.replacer;
		const camera = this.camera;
		const renderTarget = this.renderTarget;
		const quad = this.quad;

		let scene = null;
		if ( this.renderDepth ) {

			scene = this.scene;

		} else {

			scene = this.auxScene;
			scene.children = objects;

		}

		const originalSceneBackground = scene.background;
		const originalClearColor = renderer.getClearColor();
		const originalClearAlpha = renderer.getClearAlpha();
		scene.background = null;
		renderer.setClearColor( 0 );
		renderer.setClearAlpha( 0 );
		replacer.colorMap = colorMap;
		replacer.replace( scene, true, true );

		renderer.setRenderTarget( renderTarget );
		renderer.clear();
		renderer.render( scene, camera );

		renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
		quad.material.uniforms.mainTex.value = readBuffer.texture;
		quad.material.uniforms.outlineTex.value = renderTarget.texture;
		quad.material.uniforms.thickness.value = this.thickness;
		quad.material.uniforms.opacity.value = this.opacity;
		quad.render( renderer );

		scene.background = originalSceneBackground;
		renderer.setClearColor( originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );
		replacer.reset( scene, true );

	}

}

