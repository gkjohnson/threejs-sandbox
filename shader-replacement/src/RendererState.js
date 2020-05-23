import { Color, LinearEncoding } from '//unpkg.com/three@0.116.1/build/three.module.js';

export class RendererState {

	constructor() {
		this.clearAlpha = 0;
		this.clearColor = new Color();
		this.renderTarget = null;

		this.autoClear = true;
		this.autoClearColor = true;
		this.autoClearDepth = true;
		this.autoClearStencil = true;

		this.background = null;
		this.autoUpdate = true;
	}

	copy( renderer, scene ) {

		if ( renderer ) {

			this.clearAlpha = renderer.getClearAlpha();
			this.clearColor = renderer.getClearColor();
			this.renderTarget = renderer.getRenderTarget();

			this.autoClear = renderer.autoClear;
			this.autoClearColor = renderer.autoClearColor;
			this.autoClearDepth = renderer.autoClearDepth;
			this.autoClearStencil = renderer.autoClearStencil;

		}

		if ( scene ) {

			this.background = scene.background;
			this.autoUpdate = scene.autoUpdate;

		}

	}

	apply( renderer, scene ) {

		if ( renderer ) {

			renderer.setClearAlpha( this.clearAlpha );
			renderer.setClearColor( this.clearColor );
			renderer.setRenderTarget( this.renderTarget );

			renderer.autoClear = this.autoClear;
			renderer.autoClearColor = this.autoClearColor;
			renderer.autoClearDepth = this.autoClearDepth;
			renderer.autoClearStencil = this.autoClearStencil;

		}

		if ( scene ) {

			scene.background = this.background;
			scene.autoUpdate = this.autoUpdate;

		}

	}

}
