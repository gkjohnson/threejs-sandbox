import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { PackedShader } from './PackedShader.js';

export class PackedNormalPass extends ShaderReplacement {

	constructor() {

		super( PackedShader );
		this.useNormalMaps = false;

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );

		target.setDefine( 'USE_ROUGHNESSMAP', target.uniforms.roughnessMap.value ? '' : undefined );

		target.setDefine( 'USE_NORMALMAP', this.useNormalMaps && target.uniforms.normalMap.value ? '' : undefined );
		target.setDefine( 'TANGENTSPACE_NORMALMAP', this.useNormalMaps && target.uniforms.normalMap.value ? '' : undefined );

		target.setDefine( 'ALPHATEST', target.uniforms.alphaTest.value === 0 ? undefined : target.uniforms.alphaTest.value );

		target.setDefine( 'USE_ALPHAMAP', ( ! target.uniforms.alphaMap.value ) ? undefined : '' );

		target.setDefine( 'USE_MAP', ( ! target.uniforms.map.value ) ? undefined : '' );

		target.setDefine( 'USE_UV', ( 'USE_ALPHAMAP' in target.defines || 'USE_MAP' in target.defines ) ? '' : undefined );

	}

}
