// https://www.shadertoy.com/view/4t2fRz

export const LensDistortionShader = {

	defines: {

		// 0: NONE, 1: RGB, 2: RYGCBV
		BAND_MODE: 2,

	},

	uniforms: {

		tDiffuse: { value: null },
		intensity: { value: 0.075 },
		bandOffset: { value: 0.0 },

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;
		varying vec3 viewDir;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			viewDir = normalize( ( modelViewMatrix * vec4( position, 1.0 ) ).xyz );

		}

	`,

	fragmentShader: /* glsl */`

		varying vec2 vUv;
		varying vec3 viewDir;
		uniform float intensity;
		uniform float bandOffset;
		uniform sampler2D tDiffuse;

		void main() {

			vec3 normal = viewDir.xyz;
			normal.z = 1.0;
			normal = normalize( normal );

			vec3 color;

			// if NO BANDS
			#if BAND_MODE == 0

			vec3 refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity );
			color = texture2D( tDiffuse, vUv + normal.xy - refracted.xy ).rgb;

			// if RGB or RYGCBV BANDS
			#else

			// Paper describing functions for creating yellow, cyan, and violet bands and reforming
			// them into RGB:
			// https://web.archive.org/web/20061108181225/http://home.iitk.ac.in/~shankars/reports/dispersionraytrace.pdf
			vec3 r_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 0.0 );
			vec3 g_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 2.0 );
			vec3 b_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 4.0 );

			vec4 r_sample = texture2D( tDiffuse, vUv + normal.xy - r_refracted.xy );
			vec4 g_sample = texture2D( tDiffuse, vUv + normal.xy - g_refracted.xy );
			vec4 b_sample = texture2D( tDiffuse, vUv + normal.xy - b_refracted.xy );

			#if BAND_MODE == 2
			vec3 y_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 1.0 );
			vec3 c_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 3.0 );
			vec3 v_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 5.0 );

			vec4 y_sample = texture2D( tDiffuse, vUv + normal.xy - y_refracted.xy );
			vec4 c_sample = texture2D( tDiffuse, vUv + normal.xy - c_refracted.xy );
			vec4 v_sample = texture2D( tDiffuse, vUv + normal.xy - v_refracted.xy );

			float r = r_sample.r / 2.0;
			float y = ( 2.0 * y_sample.r + 2.0 * y_sample.g - y_sample.b ) / 6.0;
			float g = g_sample.g / 2.0;
			float c = ( 2.0 * c_sample.g + 2.0 * c_sample.b - c_sample.r ) / 6.0;
			float b = b_sample.b / 2.0;
			float v = ( 2.0 * v_sample.b + 2.0 * v_sample.r - v_sample.g ) / 6.0;

			color.r = r + ( 2.0 * v + 2.0 * y - c ) / 3.0;
			color.g = g + ( 2.0 * y + 2.0 * c - v ) / 3.0;
			color.b = b + ( 2.0 * c + 2.0 * v - y ) / 3.0;
			#else
			color.r = r_sample.r;
			color.g = g_sample.g;
			color.b = b_sample.b;
			#endif

			#endif

			gl_FragColor = vec4( color, 1.0 );

		}

	`,

};
