import { Vector2 } from '//unpkg.com/three@0.114.0/build/three.module.js';
export const CompositeShader = {

	defines: {

		BLUR_ITERATIONS: 14,
		BLUR_MODE: 0,
		AO_ONLY: 0

	},

	uniforms: {

		fullSize: { value: new Vector2() },
		aoSize: { value: new Vector2() },
		normalBuffer: { value: null },
		depthBuffer: { value: null },
		colorBuffer: { value : null },
		gtaoBuffer: { value : null },
		intensity: { value : 1.0 }

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
		uniform float intensity;

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

			// NO_BLUR
			#if BLUR_MODE == 0

			float gtao = texture2D( gtaoBuffer, vUv ).r;

			#else

			vec2 currTexel = vUv * fullSize;
			vec2 currAoTexel = vUv * aoSize;

			// aoPixels per full size ones. Should be 1/2 at
			vec2 texelRatio = aoSize / fullSize;

			// TODO: this normal and depth should be based on what's used for the GTAO buffer.
			vec3 currNormal = UnpackNormal( texture2D( normalBuffer, vUv ) );
			float currDepth = texture2D( depthBuffer, vUv ).r;

			// TODO: pull this sampling out into a function
			float gtao = 0.0;
			float totalWeight = 1e-10;
			float pixelOffset = - ( ( float( BLUR_ITERATIONS ) / 2.0 ) - 0.5 );
			vec2 offsetRatio = pixelOffset / texelRatio;

			// BOX_BLUR
			#if BLUR_MODE == 1

            #pragma unroll_loop_start
			for ( int x = 0; x < BLUR_ITERATIONS; x ++ ) {

				#pragma unroll_loop_start
				for ( int y = 0; y < BLUR_ITERATIONS; y ++ ) {

					// iterate over full res pixels
					vec2 offsetUv = currTexel + vec2( offsetRatio.x + float( x ), offsetRatio.y + float( y ) );
					offsetUv /= fullSize;

					vec2 aoUv = currAoTexel + vec2( pixelOffset + float( x ), pixelOffset + float( y ) );
					aoUv /= aoSize;

					// further more negative
					float offsetDepth = texture2D( depthBuffer, offsetUv ).r;
					if ( abs(offsetDepth - currDepth) <= 2.0 ) {

						vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
						float weight = max(0.0, dot( offsetNormal, currNormal ) );
						weight *= weight;

						float val = texture2D( gtaoBuffer, aoUv ).r;
						gtao += val * weight;
						totalWeight += weight;

					}

				}
				#pragma unroll_loop_end

			}
			#pragma unroll_loop_end

			// CROSS_BLUR
			#elif BLUR_MODE == 2

			#pragma unroll_loop_start
			for ( int i = 0; i < BLUR_ITERATIONS; i ++ ) {

				vec2 offsetUv, aoUv;
				float offsetDepth;

				// X sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( offsetRatio.x + float( i ), 0.0 );
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( pixelOffset + float( i ), 0.0 );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= 2.0 ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					float val = texture2D( gtaoBuffer, aoUv ).r;
					gtao += val * weight;
					totalWeight += weight;

				}

				// TODO: this should not be here if on the center pixel
				// Y sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( 0.0, offsetRatio.x + float( i ) );
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( 0.0, pixelOffset + float( i ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= 2.0 ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					float val = texture2D( gtaoBuffer, aoUv ).r;
					gtao += val * weight;
					totalWeight += weight;

				}

			}
			#pragma unroll_loop_end

			// DIAGONAL_BLUR
			#elif BLUR_MODE == 3

			#pragma unroll_loop_start
			for ( int i = 0; i < BLUR_ITERATIONS; i ++ ) {

				vec2 offsetUv, aoUv;
				float offsetDepth;

				// X sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( offsetRatio.x + float( i ), offsetRatio.y + float( i ) );
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( pixelOffset + float( i ), pixelOffset + float( i ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= 2.0 ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					float val = texture2D( gtaoBuffer, aoUv ).r;
					gtao += val * weight;
					totalWeight += weight;

				}

				// TODO: this should not be here if on the center pixel
				// Y sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( - offsetRatio.x - float( i ), offsetRatio.y + float( i ) );
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( - pixelOffset - float( i ), pixelOffset + float( i ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= 2.0 ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					float val = texture2D( gtaoBuffer, aoUv ).r;
					gtao += val * weight;
					totalWeight += weight;

				}

			}
			#pragma unroll_loop_end

			#endif

			gtao /= totalWeight;

			#endif

			#if AO_ONLY

			vec3 rgb = mix( vec3( 1.0 ), vec3( gtao ), intensity );
			gl_FragColor = vec4( rgb, 1.0 );

			#else

			vec3 rgb = mix( color.rgb, color.rgb * MultiBounce( gtao, color.rgb ), intensity );
			gl_FragColor = vec4( rgb, color.a );

			#endif

		}
		`

};
