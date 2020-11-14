import {
	ShaderPass
} from '//unpkg.com/three@0.120.1/examples/jsm/postprocessing/ShaderPass.js';
import {
	LUTShader,
} from './shaders/LUTShader.js';

export class LUTPass extends ShaderPass {

	set lut( v ) {

		const material = this.material;
		if ( v !== this.lut ) {

			material.uniforms.lut3d.value = null;
			material.uniforms.lut.value = null;

			if ( v ) {

				const is3dTextureDefine = v.isDataTexture3D ? 1 : 0;
				if ( is3dTextureDefine !== material.defines.USE_3DTEXTURE ) {

					material.defines.USE_3DTEXTURE = is3dTextureDefine;
					material.needsUpdate = true;

				}

				if ( v.isDataTexture3D ) {

					material.uniforms.lut3d.value = v;

				} else {

					material.uniforms.lut.value = v;
					material.uniforms.lutSize.value = v.image.width;

				}

			}

		}

	}

	get lut() {

		return this.material.uniforms.lut.value || this.material.uniforms.lut3d.value;

	}

	set intensity( v ) {

		this.material.uniforms.intensity.value = v;

	}

	get intensity() {

		return this.material.uniforms.intensity.value;

	}

	constructor( options = {} ) {

		super( LUTShader );
		this.lut = options.lut || null;
		this.intensity = 'intensity' in options ? options.intensity : 1;

	}

}
