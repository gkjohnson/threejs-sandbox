import { ShaderReplacement } from '../ShaderReplacement.js';
import { ShaderLib, BasicDepthPacking } from '//unpkg.com/three@0.114.0/build/three.module.js';

export class DepthPass extends ShaderReplacement {

	constructor() {

		super( {
			defines: {
				DEPTH_PACKING: BasicDepthPacking
			},
			uniforms: ShaderLib.depth.uniforms,
			vertexShader: ShaderLib.depth.vertexShader,
			fragmentShader: ShaderLib.depth.fragmentShader
		} );

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		// TODO: Handle alpha clip
		// TODO: Handle displacement map
		// TODO: support packing

	}

}
