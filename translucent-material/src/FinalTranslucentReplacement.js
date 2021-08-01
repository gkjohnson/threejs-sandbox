import { MeshPhysicalMaterial, LessEqualDepth, AdditiveBlending } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { ShaderReplacement } from '../../shader-replacement/src/ShaderReplacement.js';

export class FinalTranslucentReplacement extends ShaderReplacement {

	createMaterial( object ) {

		return new MeshPhysicalMaterial();

	}

	updateUniforms( object, material, target ) {

		// TODO: we shouldn't handle diffuseFactor here, just surface
		target.color.copy( material.color ).multiplyScalar( material.diffuseFactor );
		target.depthWrite = false;
		target.transparent = true;
		target.blending = AdditiveBlending;
		target.premultipliedAlpha = true;
		target.roughness = material.roughness;
		target.metalness = material.metalness;
		target.depthFunc = LessEqualDepth;
		target.dithering = true;

	}

}
