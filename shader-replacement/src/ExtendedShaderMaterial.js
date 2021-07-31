import { ShaderMaterial } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export class ExtendedShaderMaterial extends ShaderMaterial {

	constructor( ...args ) {

		super( ...args );
		[
			'opacity',
			'map',
			'emissiveMap',
			'roughnessMap',
			'metalnessMap',
		].forEach( key => {

			Object.defineProperty( this, key, {

				get() {

					if ( ! ( key in this.uniforms ) ) return undefined;
					return this.uniforms[ key ].value;

				},

				set( v ) {

					if ( ! ( key in this.uniforms ) ) return;
					this.uniforms[ key ].value = v;

				}

			} );


		} );

	}

}
