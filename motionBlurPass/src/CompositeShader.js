export const CompositeShader = {

	defines: {

		SAMPLES: 30

	},

	uniforms: {

		sourceBuffer: {

			value: null

		},

		velocityBuffer: {

			value: null

		}

	},

	vertexShader:
		`
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		`,

	fragmentShader:
		`
			varying vec2 vUv;
			uniform sampler2D sourceBuffer;
			uniform sampler2D velocityBuffer;
			void main() {

				vec2 vel = texture2D(velocityBuffer, vUv).xy;
				vec4 result = texture2D(sourceBuffer, vUv);

				for(int i = 1; i <= SAMPLES; i ++) {

					vec2 offset = vel * (float(i - 1) / float(SAMPLES) - 0.5);
					result += texture2D(sourceBuffer, vUv + offset);

				}

				result /= float(SAMPLES + 1);

				gl_FragColor = result;

			}
		`

};
