export const CompositeShader = {

	defines: {

		SAMPLES: 30,
		JITTER_STRATEGY: 1,
		BLUENOISE_SIZE: '32.0'

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

		blueNoiseTex: {

			value: null

		}

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
			uniform sampler2D sourceBuffer;
			uniform sampler2D velocityBuffer;
			uniform float jitter;

			#if JITTER_STRATEGY == 2 // blue noise
			uniform sampler2D blueNoiseTex;
			#endif

			#include <common>
			void main() {

				vec2 vel = texture2D( velocityBuffer, vUv ).xy;

				#if JITTER_STRATEGY == 0 // Regular Jitter
				float jitterValue = mod( ( gl_FragCoord.x + gl_FragCoord.y ) * 0.25, 1.0 );
				#elif JITTER_STRATEGY == 1 // Random Jitter
				float jitterValue = rand( gl_FragCoord.xy * 0.01 );
				#elif JITTER_STRATEGY == 2 // Blue Noise Jitter
				float jitterValue = texture2D( blueNoiseTex, gl_FragCoord.xy / BLUENOISE_SIZE ).r;
				#endif

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
