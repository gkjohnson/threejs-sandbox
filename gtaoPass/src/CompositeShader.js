import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const CompositeShader = {

	defines: {

		ENABLE_BLUR: 1,
		AO_ONLY: 0

	},

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

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		vec3 MultiBounce( float ao, vec3 albedo ) {

			vec3 x = vec3( ao );

			vec3 a = 2.0404 * albedo - vec3( 0.3324 );
			vec3 b = -4.7951 * albedo + vec3( 0.6417 );
			vec3 c = 2.7552 * albedo + vec3( 0.6903 );

			return max( x, ( ( x * a + b ) * x + c ) * x );

		}

		void main() {

			vec4 color = texture2D( colorBuffer, vUv );

			#if ENABLE_BLUR

			vec2 currTexel = vUv * fullSize;
			vec2 currAoTexel = vUv * aoSize;

			// aoPixels per full size ones. Should be 1/2 at
			vec2 ratio = aoSize / fullSize;

			// TODO: this normal and depth should be based on what's used for the GTAO buffer.
			vec3 currNormal = UnpackNormal( texture2D( normalBuffer, vUv ) );
			float currDepth = texture2D( depthBuffer, vUv ).r;

			// TODO: Try different blurs -- gaussian, cross, diagonal, box
			// TODO: pull this sampling out into a function
			float gtao = 0.0;
			float total = 1e-10;
            #pragma unroll_loop_start
			for ( int x = 0; x < 4; x ++ ) {

				#pragma unroll_loop_start
				for ( int y = 0; y < 4; y ++ ) {

					// iterate over full res pixels
					vec2 r = - 1.5 / ratio;
					vec2 offsetUv = currTexel + vec2( r.x + float( x ), r.y + float( y ) );
					offsetUv /= fullSize;

					vec2 aoUv = currAoTexel + vec2( - 1.5 + float( x ), - 1.5 + float( y ) );
					aoUv /= aoSize;

					// further more negative
					float offsetDepth = texture2D( depthBuffer, offsetUv ).r;
					if ( abs(offsetDepth - currDepth) < 0.5 ) {

						vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
						float weight = max(0.0, dot( offsetNormal, currNormal ) );
						weight *= weight;

						float val = texture2D( gtaoBuffer, aoUv ).r;
						gtao += val * weight;
						total += weight;

					}

				}
				#pragma unroll_loop_end

			}
			#pragma unroll_loop_end

			gtao /= total;

			#else

			float gtao = texture2D( gtaoBuffer, vUv ).r;

			#endif

			#if AO_ONLY

			gl_FragColor = vec4( gtao );

			#else

			gl_FragColor = vec4( color.rgb * MultiBounce( gtao, color.rgb ), color.a );

			#endif

		}
		`

};
