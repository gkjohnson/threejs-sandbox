import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';
import { LinearDepthShader } from './LinearDepthShader.js';
import { FrontSide, DoubleSide } from '//unpkg.com/three@0.114.0/build/three.module.js';

export class LinearDepthPass extends ShaderReplacement {

	constructor() {

		super( LinearDepthShader );
		this.side = FrontSide;

	}

	updateUniforms( object, material, target ) {

		super.updateUniforms( object, material, target );
		target.side = material.side === DoubleSide ? DoubleSide : this.side;

	}


}
