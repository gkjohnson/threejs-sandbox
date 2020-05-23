export const CompositeShader = {

	uniforms: {

		colorBuffer: { value : null },
		gtaoBuffer: { value : null },

	},

	vertexShader:
		/* glsl */`
		varying vec2 vUv;
		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
	`,

	fragmentShader:
		/* glsl */`
		varying vec2 vUv;
		uniform sampler2D colorBuffer;
		uniform sampler2D gtaoBuffer;

		vec3 MultiBounce( float ao, vec3 albedo ) {

			vec3 x = vec3( ao );

			vec3 a = 2.0404 * albedo - vec3( 0.3324 );
			vec3 b = -4.7951 * albedo + vec3( 0.6417 );
			vec3 c = 2.7552 * albedo + vec3( 0.6903 );

			return max( x, ( ( x * a + b ) * x + c ) * x );

		}

		void main() {

			vec4 color = texture2D( colorBuffer, vUv );
			float gtao = texture2D( gtaoBuffer, vUv ).r;
			gl_FragColor = vec4( color.rgb * MultiBounce( gtao, color.rgb ), color.a );

		}
		`

};
