import {
	ShaderMaterial,
} from '//unpkg.com/three@0.120.1/build/three.module.js';
import {
	LUTShader,
} from './shaders/LUTShader.js';

export class LUTMaterial extends ShaderMaterial {

	set lut( v ) {

		console.log('UT HERE', v)
		if ( v !== this.lut ) {

			this.uniforms.lut.value = v;

			if ( v ) {

				const is3dTextureDefine = v.isDataTexture3D ? 1 : 0;
				if ( is3dTextureDefine !== this.defines.USE_3DTEXTURE ) {

					this.defines.USE_3DTEXTURE = is3dTextureDefine;
					this.needsUpdate = true;

				}

				if ( ! v.isDataTexture3D ) {

					this.uniforms.lutSize.value = v.image.width;

				}

			}

			console.log(this.uniforms.lut.value);

		}

	}

	get lut() {

		return this.uniforms.lut.value;

	}

	set intensity( v ) {

		this.uniforms.intensity.value = v;

	}

	get intensity() {

		return this.uniforms.intensity.value;

	}

	constructor( options = {} ) {

		super( LUTShader );
		this.lut = options.lut || null;
		this.intensity = 'intensity' in options ? options.intensity : 1;

	}

}
