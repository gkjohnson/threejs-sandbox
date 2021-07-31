import { Vector2, Color } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
export const CompositeShader = {

	defines: {

		BLUR_ITERATIONS: 5,
		BLUR_MODE: 0,
		AO_ONLY: 0,
		COLOR_ONLY: 0,
		DEPTH_THRESHOLD: '5e-1',

	},

	uniforms: {

		fullSize: { value: new Vector2() },
		aoSize: { value: new Vector2() },
		normalBuffer: { value: null },
		depthBuffer: { value: null },
		colorBuffer: { value: null },
		gtaoBuffer: { value: null },
		intensity: { value: 1.0 },
		blurStride: { value: 1.0 },

		ambientColor: { value: new Color() },
		ambientIntensity: { value: 0 },

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

		uniform vec3 ambientColor;
		uniform float ambientIntensity;

		uniform vec2 aoSize;
		uniform vec2 fullSize;
		uniform sampler2D colorBuffer;
		uniform sampler2D depthBuffer;
		uniform sampler2D normalBuffer;
		uniform sampler2D gtaoBuffer;
		uniform float intensity;
		uniform int blurStride;

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

			vec4 accumSample = texture2D( gtaoBuffer, vUv );

			#else

			vec2 currTexel = vUv * fullSize;
			vec2 currAoTexel = vUv * aoSize;

			// aoPixels per full size ones. Should be 1/2 at
			vec2 texelRatio = aoSize / fullSize;

			vec3 currNormal = UnpackNormal( texture2D( normalBuffer, vUv ) );
			float currDepth = texture2D( depthBuffer, vUv ).r;

			// TODO: pull this sampling out into a function
			vec4 accumSample = vec4( 0.0 );
			float totalWeight = 1e-10;
			float pixelOffset = - float( BLUR_ITERATIONS ) / 2.0;
			pixelOffset += mod( float( BLUR_ITERATIONS ), 2.0 ) == 0.0 ? 0.0 : 0.5;
			pixelOffset *= float( blurStride );

			// BOX_BLUR
			#if BLUR_MODE == 1

			#pragma unroll_loop_start
			for ( int x = 0; x < BLUR_ITERATIONS; x ++ ) {

				#pragma unroll_loop_start
				for ( int y = 0; y < BLUR_ITERATIONS; y ++ ) {

					vec2 step = vec2( float( x ), float( y ) ) * float( blurStride );

					// iterate over full res pixels
					vec2 offsetUv = currTexel + ( pixelOffset + step ) / texelRatio;
					offsetUv /= fullSize;

					// get the associated pixel in the AO buffer
					vec2 aoUv = currAoTexel + pixelOffset + step;
					aoUv /= aoSize;

					// if the pixels are close enough in space then blur them together
					float offsetDepth = texture2D( depthBuffer, offsetUv ).r;
					if ( abs( offsetDepth - currDepth ) <= DEPTH_THRESHOLD ) {

						// Weigh the sample based on normal similarity
						vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
						float weight = max( 0.0, dot( offsetNormal, currNormal ) );

						// square the weight to give pixels with a closer normal even higher priority
						weight *= weight;

						// accumulate
						vec4 val = texture2D( gtaoBuffer, aoUv );
						accumSample += val * weight;
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
				offsetUv = currTexel + vec2( pixelOffset + float( i * blurStride ), 0.0 ) / texelRatio;
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( pixelOffset + float( i * blurStride ), 0.0 );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= DEPTH_THRESHOLD ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					vec4 val = texture2D( gtaoBuffer, aoUv );
					accumSample += val * weight;
					totalWeight += weight;

				}

				// TODO: this should not be here if on the center pixel
				// Y sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( 0.0, pixelOffset + float( i * blurStride ) ) / texelRatio;
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( 0.0, pixelOffset + float( i * blurStride ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= DEPTH_THRESHOLD ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					vec4 val = texture2D( gtaoBuffer, aoUv );
					accumSample += val * weight;
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
				offsetUv = currTexel + vec2( pixelOffset + float( i * blurStride ), pixelOffset + float( i * blurStride ) ) / texelRatio;
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( pixelOffset + float( i * blurStride ), pixelOffset + float( i * blurStride ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= DEPTH_THRESHOLD ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					vec4 val = texture2D( gtaoBuffer, aoUv );
					accumSample += val * weight;
					totalWeight += weight;

				}

				// TODO: this should not be here if on the center pixel
				// Y sample
				// iterate over full res pixels
				offsetUv = currTexel + vec2( - pixelOffset - float( i * blurStride ), pixelOffset + float( i * blurStride ) ) / texelRatio;
				offsetUv /= fullSize;

				aoUv = currAoTexel + vec2( - pixelOffset - float( i * blurStride ), pixelOffset + float( i * blurStride ) );
				aoUv /= aoSize;

				// further more negative
				offsetDepth = texture2D( depthBuffer, offsetUv ).r;
				if ( abs(offsetDepth - currDepth) <= DEPTH_THRESHOLD ) {

					vec3 offsetNormal = UnpackNormal( texture2D( normalBuffer, offsetUv ) );
					float weight = max(0.0, dot( offsetNormal, currNormal ) );
					weight *= weight;

					vec4 val = texture2D( gtaoBuffer, aoUv );
					accumSample += val * weight;
					totalWeight += weight;

				}

			}
			#pragma unroll_loop_end

			#endif

			accumSample /= totalWeight;

			#endif

			float gtao = accumSample.a;

			#if COLOR_ONLY

			gl_FragColor = vec4( accumSample.rgb, 1.0 );

			#elif AO_ONLY

			vec3 rgb = mix( vec3( 1.0 ), vec3( accumSample.a ), intensity );
			gl_FragColor = vec4( rgb, 1.0 );

			#else

			vec3 rgb = mix( color.rgb, color.rgb * MultiBounce( gtao, color.rgb ), intensity );
			vec3 delta = color.rgb - rgb;
			vec3 ambient = ambientColor * delta * ambientIntensity;

			float colorFade = ( 1.0 - pow( 1.0 - gtao, 2.0 ) );
			gl_FragColor = vec4( rgb + ambient + accumSample.rgb * ( 0.75 + colorFade * 0.25 ), color.a );

			#endif

		}
		`

};
