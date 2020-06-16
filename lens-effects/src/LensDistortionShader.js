// https://www.shadertoy.com/view/4t2fRz

export const LensDistortionShader = {

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

			vec3 r_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity );
			vec3 g_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset );
			vec3 b_refracted = refract( vec3( 0.0, 0.0, - 1.0 ), - normal, intensity + intensity * bandOffset * 2.0 );

			vec4 r_sample = texture2D( tDiffuse, vUv + normal.xy - r_refracted.xy );
			vec4 g_sample = texture2D( tDiffuse, vUv + normal.xy - g_refracted.xy );
			vec4 b_sample = texture2D( tDiffuse, vUv + normal.xy - b_refracted.xy );

			// vec2 deltaUv = normal.xy - refracted.xy;
			// vec4 color = texture2D( tDiffuse, vUv + deltaUv );
			vec4 color = vec4( r_sample.r, g_sample.g, b_sample.b, 1.0 );

			gl_FragColor = color;
			// gl_FragColor = vec4( deltaUv, 0.0, 1.0 );
			// gl_FragColor = vec4( refracted, 1.0 );

		}

	`,

};
