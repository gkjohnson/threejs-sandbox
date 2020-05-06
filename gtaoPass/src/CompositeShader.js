import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const CompositeShader = {

	uniforms: {

		fullSize: { value: new Vector2() },
		aoSize: { value: new Vector2() },
		normalBuffer: { value: null },
		depthBuffer: { value: null },
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

		uniform vec2 aoSize;
		uniform vec2 fullSize;
		uniform sampler2D colorBuffer;
		uniform sampler2D depthBuffer;
		uniform sampler2D normalBuffer;
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

			vec2 texelSize = 1.0 / fullSize;
			vec2 aoTexelSize = 1.0 / aoSize;
			vec2 currTexel = vUv * fullSize + texelSize / 2.0;
			vec2 currAoTexel = vUv * aoSize + aoTexelSize / 2.0;
			vec2 ratio = aoSize / fullSize;

			vec3 currNormal = texture2D( normalBuffer, vUv ).rgb;
			float currDepth = texture2D( depthBuffer, vUv ).r;

			float gtao = 0.0;
			float total = 0.0;
			// #pragma unroll_loop_start
			for ( int i = 0; i < 5; i ++ ) {

				vec2 xAoUv = currAoTexel + vec2( - 2.0 + float( i ), 0.0 );
				vec2 yAoUv = currAoTexel + vec2( 0.0, - 2.0 + float( i ) );

				vec2 r = - 2.0 / ratio;
				vec2 xUv = currTexel + vec2( r.x + float( i ), 0.0 );
				vec2 yUv = currTexel + vec2( 0.0, r.y + float( i ) );

				float xTexelDepth = texture2D( depthBuffer, xUv ).r;
				if ( abs( currDepth - xTexelDepth ) < 0.1 ) {

					gtao += texture2D( gtaoBuffer, xAoUv / aoSize ).r;
					total ++;

				}


				if ( i != 0 ) {

					float yTexelDepth = texture2D( depthBuffer, yUv ).r;
					if ( abs( currDepth - yTexelDepth ) < 0.1 ) {

						gtao += texture2D( gtaoBuffer, yAoUv / aoSize ).r;
						total ++;

					}

				}

			}
			// #pragma unroll_loop_end

			gtao /= total;


			// float gtao = texture2D( gtaoBuffer, vUv ).r;
			gl_FragColor = vec4( color.rgb * MultiBounce( gtao, color.rgb ), color.a );

		}
		`

};
