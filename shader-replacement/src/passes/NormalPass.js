import { ShaderReplacement } from '../ShaderReplacement.js';
import { ShaderLib } from '//unpkg.com/three@0.114.0/build/three.module.js';

export class NormalPass extends ShaderReplacement {

	constructor() {

		super( {
			extensions: {
				derivatives: true
			},
			defines: {
				// USE_NORMALMAP : '',
				// TANGENTSPACE_NORMALMAP : '',
				USE_UV : ''
			},
			uniforms: ShaderLib.normal.uniforms,
			vertexShader: ShaderLib.normal.vertexShader,
			fragmentShader: ShaderLib.normal.fragmentShader
		} );

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		// TODO: Handle alpha clip
		// TODO: Handle object space normal map
		// TODO: Handle displacement map
		const ogValue = target.defines.USE_NORMALMAP;
		if ( ! target.uniforms.map.value ) {

			delete target.defines.USE_NORMALMAP;
			delete target.defines.TANGENTSPACE_NORMALMAP;

		} else {

			target.defines.TANGENTSPACE_NORMALMAP = '';
			target.defines.USE_NORMALMAP = '';

		}

		if ( ogValue !== target.defines.USE_NORMALMAP ) {

			target.needsUpdate = true;

		}

	}

}
