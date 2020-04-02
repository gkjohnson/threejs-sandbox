/**
 * @author WestLangley / http://github.com/WestLangley
 *
 * Gamma Correction Shader
 * http://en.wikipedia.org/wiki/gamma_correction
 */

var DitheredGammaCorrectionShader = {

	defines: {

		DITHERING: ''

	},

	uniforms: {

		"tDiffuse": { value: null }

	},

	vertexShader: /* glsl */`
		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
	`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		#include <common>
		#include <dithering_pars_fragment>

		void main() {

			vec4 tex = texture2D( tDiffuse, vUv );

			gl_FragColor = LinearTosRGB( tex );
			#include <dithering_fragment>

		}
	`,

};

export { DitheredGammaCorrectionShader };
