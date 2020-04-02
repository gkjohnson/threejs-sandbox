import { ShaderReplacement } from '../ShaderReplacement.js';
import { ShaderLib, BasicDepthPacking } from '//unpkg.com/three@0.114.0/build/three.module.js';

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

		target.defines.USE_UV = true;

		let originalDefine;

		// alphatest
		originalDefine = target.defines.ALPHATEST;
		if ( target.uniforms.alphaTest.value === 0 ) {

			delete target.defines.ALPHATEST;

		} else {

			target.defines.ALPHATEST = target.uniforms.alphaTest.value;

		}

		if ( originalDefine !== target.defines.ALPHATEST ) {

			target.needsUpdate = true;

		}

		// alphamap
		originalDefine = target.defines.USE_ALPHAMAP;
		if ( target.defines.ALPHATEST === 0 || ! target.uniforms.alphaMap.value ) {

			delete target.defines.USE_ALPHAMAP;

		} else {

			target.defines.USE_ALPHAMAP = '';

		}

		if ( originalDefine !== target.defines.USE_ALPHAMAP ) {

			target.needsUpdate = true;
		}

		// map
		originalDefine = target.defines.USE_MAP;
		if ( target.defines.ALPHATEST === 0 || ! target.uniforms.map.value ) {

			delete target.defines.USE_MAP;

		} else {

			target.defines.USE_MAP = '';

		}

		if ( originalDefine !== target.defines.USE_MAP ) {

			target.needsUpdate = true;
		}

	}

}
