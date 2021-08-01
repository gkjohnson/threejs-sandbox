import { ShaderLib, UniformsUtils, Vector2, Color } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

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
		uniform float diffuseFactor;
		uniform float dispersionFactor;
		uniform float iorRatio;
		uniform vec2 resolution;

		uniform float bandOffset;
		uniform float jitterOffset;
		uniform float jitterIntensity;

		#define DITHERING 1
		#include <packing>
		#include <common>
		#include <dithering_pars_fragment>

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		void main() {

			vec2 uv = gl_FragCoord.xy / resolution;
			vec3 normal = normalize( UnpackNormal( texture2D( normalTexture, uv ) ) );

			vec4 sampled = texture2D( absorbedTexture, uv );
			vec3 absorbedColor = sampled.rgb;
			float thickness = sampled.a;
			vec3 transmitted = max( vec3( 1.0 ) - absorbedColor, 0.0 );

			// sample based on normal ior and disperse the color bands
			// see https://github.com/gkjohnson/threejs-sandbox/blob/master/lens-effects/src/LensDistortionShader.js
			vec3 color;

			#define CHROMA_SAMPLES 1
			float index, randValue, offsetValue;
			float r, g, b, r_ior, g_ior, b_ior;
			vec3 r_refracted, g_refracted, b_refracted;
			vec4 r_sample, g_sample, b_sample;

			float y, c, v, y_ior, c_ior, v_ior;
			vec3 y_refracted, c_refracted, v_refracted;
			vec4 y_sample, c_sample, v_sample;

			float bandMultiplier = abs( 1.0 - iorRatio );
			for ( int i = 0; i < CHROMA_SAMPLES; i ++ ) {

				index = float( i );
				randValue = rand( sin( index + 1. ) * gl_FragCoord.xy + vec2( jitterOffset, - jitterOffset ) ) - 0.5;
				offsetValue = index / float( CHROMA_SAMPLES ) + randValue * jitterIntensity;

				// Paper describing functions for creating yellow, cyan, and violet bands and reforming
				// them into RGB:
				// https://web.archive.org/web/20061108181225/http://home.iitk.ac.in/~shankars/reports/dispersionraytrace.pdf
				r_ior = 1.0 + bandMultiplier * bandOffset * ( 0.0 + offsetValue );
				g_ior = 1.0 + bandMultiplier * bandOffset * ( 2.0 + offsetValue );
				b_ior = 1.0 + bandMultiplier * bandOffset * ( 4.0 + offsetValue );

				r_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / r_ior );
				g_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / g_ior );
				b_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / b_ior );

				r_sample = texture2D( backgroundTexture, uv + r_refracted.xy );
				g_sample = texture2D( backgroundTexture, uv + g_refracted.xy );
				b_sample = texture2D( backgroundTexture, uv + b_refracted.xy );

				y_ior = 1.0 + bandMultiplier * bandOffset * ( 1.0 + offsetValue );
				c_ior = 1.0 + bandMultiplier * bandOffset * ( 3.0 + offsetValue );
				v_ior = 1.0 + bandMultiplier * bandOffset * ( 5.0 + offsetValue );

				y_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / y_ior );
				c_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / c_ior );
				v_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), normal, iorRatio / v_ior );

				y_sample = texture2D( backgroundTexture, uv + y_refracted.xy );
				c_sample = texture2D( backgroundTexture, uv + c_refracted.xy );
				v_sample = texture2D( backgroundTexture, uv + v_refracted.xy );

				r = r_sample.r / 2.0;
				y = ( 2.0 * y_sample.r + 2.0 * y_sample.g - y_sample.b ) / 6.0;
				g = g_sample.g / 2.0;
				c = ( 2.0 * c_sample.g + 2.0 * c_sample.b - c_sample.r ) / 6.0;
				b = b_sample.b / 2.0;
				v = ( 2.0 * v_sample.b + 2.0 * v_sample.r - v_sample.g ) / 6.0;

				color.r += r + ( 2.0 * v + 2.0 * y - c ) / 3.0;
				color.g += g + ( 2.0 * y + 2.0 * c - v ) / 3.0;
				color.b += b + ( 2.0 * c + 2.0 * v - y ) / 3.0;

			}

			color /= float( CHROMA_SAMPLES );

			gl_FragColor = vec4( ( 1.0 - diffuseFactor ) * color * transmitted, 1.0 );

			//gl_FragColor = vec4( thickness, 0.0, 0.0, 1.0 );

		}

	`,
	defines: {},
	uniforms: {
		backgroundTexture: { value: null },
		normalTexture: { value: null },
		absorbedTexture: { value: null },
		resolution: { value: new Vector2() },
		diffuseFactor: { value: 1.0 },
		dispersionFactor: { value: 0 },
		iorRatio: { value: 1 },


		bandOffset: { value: 0.03 },
		jitterOffset: { value: 0.0 },
		jitterIntensity: { value: 1.0 },
	},
};

