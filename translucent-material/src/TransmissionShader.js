import { ShaderLib, UniformsUtils, Vector2, Color } from '//unpkg.com/three@0.116.1/build/three.module.js';

export const TransmissionShader = {
	vertexShader: `
		void main() {

			#include <begin_vertex>
			#include <project_vertex>

		}
	`,
	fragmentShader: `
		uniform sampler2D backgroundTexture;
		uniform sampler2D normalTexture;
		uniform sampler2D absorbedTexture;
		uniform float diffusionFactor;
		uniform float dispersionFactor;
		uniform float iorRatio;
		uniform vec2 resolution;

		#define DITHERING 1
		#include <packing>
		#include <common>
		#include <dithering_pars_fragment>

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		void main() {

			vec2 uv = ( gl_FragCoord.xy + vec2( 0.5 ) ) / resolution;
			vec3 normal = normalize( UnpackNormal( texture2D( normalTexture, uv ) ) );

			vec3 absorbedColor = texture2D( absorbedTexture, uv ).rgb;
			vec3 transmitted = vec3( 1.0 ) - absorbedColor;

			// gl_FragColor = vec4( readColor * transmitted, 1.0 );



			vec3 refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio );
			vec3 background = texture2D( backgroundTexture, uv + refracted.xy ).rgb;

			// sample based on normal ior
			// see https://github.com/gkjohnson/threejs-sandbox/blob/master/lens-effects/src/LensDistortionShader.js
			// vec3 background = texture2D( backgroundTexture, uv, diffusionFactor * 10.0 ).rgb;


			gl_FragColor = vec4( background * transmitted, 1.0 );

		}

	`,
	defines: {},
	uniforms: {
		backgroundTexture: { value: null },
		normalTexture: { value: null },
		absorbedTexture: { value: null },
		resolution: { value: new Vector2() },
		diffusionFactor: { value: 1.0 },
		dispersionFactor: { value: 0 },
		iorRatio: { value: 1 },
	},
};

