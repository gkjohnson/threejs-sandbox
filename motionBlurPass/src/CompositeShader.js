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

		},

		jitter: {

			value: 1

		},

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
			uniform float jitter;

			#include <common>
			void main() {

				vec2 vel = texture2D( velocityBuffer, vUv ).xy;
				float jitterValue = rand( gl_FragCoord.xy * 0.01 );
				vec2 jitterOffset = jitter * vel * vec2( jitterValue ) / float( SAMPLES );
				vec4 result;

				vec2 startUv = clamp( vUv - vel * 0.5 + jitterOffset, 0.0, 1.0 );
				vec2 endUv = clamp( vUv + vel * 0.5 + jitterOffset, 0.0, 1.0 );
				for( int i = 0; i < SAMPLES; i ++ ) {

					vec2 sampleUv = mix( startUv, endUv, float( i ) / float( SAMPLES ) );
					result += texture2D( sourceBuffer, sampleUv );

				}

				result /= float( SAMPLES );

				gl_FragColor = result;

			}
		`

};
