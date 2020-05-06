import { Scene, MeshBasicMaterial, Color } from '//unpkg.com/three@0.116.1/build/three.module.js';
import { LineMaterial } from '//unpkg.com/three@0.116.1/examples/jsm/lines/LineMaterial.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { Pass } from '//unpkg.com/three@0.114.0/examples/jsm/postprocessing/Pass.js';

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
		const color = colorMap.get( object );

		target.side = material.side;
		if ( color instanceof Color ) {

			target.color.copy( color );

		} else {

			target.color.set( color );

		}

		if ( target instanceof LineMaterial ) {

			target.uniforms.linewidth = material.uniforms.linewidth;

		}

	}

}

export class SSRRPass extends Pass {
	constructor( camera ) {

		super();

		const scene = new Scene();
		scene.autoUpdate = false;

		const quad = new Pass.ScreenSpaceQuad();

		this.renderTarget = new WebGLRenderTarget( 1, 1,  {
			minFilter: NearestFilter,
			magFilter: NearestFilter,
			format: RGBAFormat
		} );
		this.quad = quad;
		this.replacer = new BasicShaderReplacement();
		this.colorMap = new Map();
		this.objects = [];
		this.scene = scene;
		this.camera = camera;
		this.needsSwap = true;

		this.thickness = 1;

	}

	setOutline( color, objects ) {

		const colors = this.colorMap;
		const objects = this.objects;
		for ( let i = 0, l = objects.length; i < l; i ++ ) {

			const o = objects[ i ];
			colors.set( o, color );
			objects.push( o );

		}

	}

	removeOutline( objects ) {

		const colors = this.colorMap;
		const objects = this.objects;
		for ( let i = 0, l = objects.length; i < l; i ++ ) {

			const o = objects[ i ];
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
		const scene = this.scene;
		const camera = this.camera;
		const renderTarget = this.renderTarget;
		const quad = this.quad;

		scene.children = objects;

		const originalClearColor = renderer.getClearColor();
		const originalClearAlpha = renderer.getClearAlpha();
		replacer.colorMap = colorMap;
		replacer.replace( scene, true, true );

		renderer.setRenderTarget( renderTarget );
		renderer.clear();
		renderer.render( scene, camera );

		renderer.setRenderTarget( writeBuffer );
		quad.material.uniforms.mainTex.value = readBuffer;
		quad.material.uniforms.outlineTex.value = renderTarget;
		quad.material.uniforms.thickness.value = this.thickness;
		quad.render( renderer );

		renderer.setClearColor( originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );
		replacer.reset( scene, true );

	}

}

