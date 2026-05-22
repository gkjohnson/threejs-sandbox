import { MeshPhongMaterial, Color } from 'three';

export class ColoredShadowMaterial extends MeshPhongMaterial {

	constructor( parameters = {} ) {

		super( parameters );
		this.shadowColor = new Color( parameters.shadowColor ?? 0xff0000 );

	}

	onBeforeCompile( shader ) {

		shader.uniforms.shadowColor = { value: this.shadowColor };
		shader.fragmentShader = 'uniform vec3 shadowColor;\n' + shader.fragmentShader;
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <dithering_fragment>',
			`#include <dithering_fragment>
			gl_FragColor.rgb = mix( shadowColor.rgb, diffuse, min( gl_FragColor.r, 1.0 ) );`
		);

	}

	customProgramCacheKey() {

		return 'ColoredShadowMaterial';

	}

}
