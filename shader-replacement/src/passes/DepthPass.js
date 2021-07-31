import { ShaderReplacement } from '../ShaderReplacement.js';
import { ShaderLib, BasicDepthPacking } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export class DepthPass extends ShaderReplacement {

	constructor() {

		super( {
			defines: {
				DEPTH_PACKING: BasicDepthPacking
			},
			uniforms: {
				...ShaderLib.depth.uniforms,
				alphaMap: { value: null },
				alphaTest: { value: 0 },
				map: { value: null },
				opacity: { value: 1.0 }
			},
			vertexShader: ShaderLib.depth.vertexShader,
			fragmentShader: ShaderLib.depth.fragmentShader
		} );

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		// TODO: Handle displacement map
		// TODO: support packing

		target.setDefine( 'USE_UV', '' );

		target.setDefine( 'ALPHATEST', target.uniforms.alphaTest.value ? target.uniforms.alphaTest.value : undefined );

		target.setDefine( 'USE_ALPHAMAP', ( target.defines.ALPHATEST === 0 || ! target.uniforms.alphaMap.value ) ? undefined : '' );

		target.setDefine( 'USE_MAP', ( target.defines.ALPHATEST === 0 || ! target.uniforms.map.value ) ? undefined : '' );

	}

}
