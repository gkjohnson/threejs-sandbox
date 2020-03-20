import { WebGLRenderer } from '//unpkg.com/three@0.114.0/build/three.module.js';

const VISIBLE_SYMBOL = Symbol();
const MATERIAL_SYMBOL = Symbol();

function render( scene, camera ) {

	const debugMaterial = this.debugMaterial;
	let found = false;
	if ( this.enableDebug ) {

		scene.traverse( c => {

			if ( c.material ) {

				found = found || c.material === debugMaterial || c.material === debugMaterial.targetMaterial;

			}

		} );

	}

	if ( found && debugMaterial ) {

		scene.traverse( c => {

			if ( c.material ) {

				c[ VISIBLE_SYMBOL ] = c.visible;
				c[ MATERIAL_SYMBOL ] = c.material;

				if ( c.material === debugMaterial || c.material === debugMaterial.targetMaterial ) {

					c.material = debugMaterial;

				} else {

					c.visible = false;

				}

			}

		} );

		this._render( scene, camera );

		scene.traverse( c => {

			if ( c.material ) {

				c.visible = c[ VISIBLE_SYMBOL ];
				c.material = c[ MATERIAL_SYMBOL ];

				delete c[ VISIBLE_SYMBOL ];
				delete c[ MATERIAL_SYMBOL ];

			}

		} );

	} else {

		this._render( scene, camera );

	}

}

export class ShaderDebugRenderer extends WebGLRenderer {

	constructor( ...args ) {

		super( ...args );
		this.enableDebug = false;
		this.debugMaterial = null;
		this._render = this.render;
		this.render = render;

	}

	readPixel( pos, type ) {

	}


}
