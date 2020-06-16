// https://www.shadertoy.com/view/4t2fRz

export const FilmGrainShader = {

	uniforms: {

		intensity: { value: 0.075 }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}

	`,

	fragmenShader: /* glsl */`

		#define SHOW_NOISE 0
		#define SRGB 0

		// 0: Addition, 1: Screen, 2: Overlay, 3: Soft Light, 4: Lighten-Only
		#define BLEND_MODE 0
		#define SPEED 2.0
		#define INTENSITY 0.075

		// What gray level noise should tend to.
		#define MEAN 0.0

		// Controls the contrast/variance of noise.
		#define VARIANCE 0.5

		varying vec2 vUv;

		vec3 channel_mix( vec3 a, vec3 b, vec3 w ) {

			return vec3(
				mix( a.r, b.r, w.r ),
				mix( a.g, b.g, w.g ),
				mix( a.b, b.b, w.b )
			);

		}

		float gaussian( float z, float u, float o ) {

			return (
				1.0 / ( o * sqrt( 2.0 * 3.1415 ) ) ) * exp( - ( ( ( z - u ) * ( z - u ) ) / ( 2.0 * ( o * o ) ) )
			);

		}

		vec3 madd( vec3 a, vec3 b, float w ) {

			return a + a * b * w;

		}

		vec3 screen( vec3 a, vec3 b, float w ) {

			return mix(
				a,
				vec3( 1.0 ) - ( vec3( 1.0 ) - a ) * ( vec3( 1.0 ) - b ),
				w
			);

		}

		vec3 overlay( vec3 a, vec3 b, float w ) {

			return mix(
				a,
				channel_mix(
					2.0 * a * b,
					vec3( 1.0 ) - 2.0 * ( vec3( 1.0 ) - a ) * ( vec3( 1.0 ) - b ),
					step( vec3( 0.5 ), a )
				),
				w
			);

		}

		vec3 soft_light( vec3 a, vec3 b, float w ) {

			return mix(
				a,
				pow(
					a,
					pow( vec3( 2.0 ), 2.0 * ( vec3( 0.5 ) - b) )
				),
				w
			);

		}

		void main() {

			vec4 color;
			vec2 coord = vUv;

			vec2 ps = vec2( 1.0 ) / iResolution.xy;
			vec2 uv = coord * ps;
			color = texture( iChannel0, uv );

			#if SRGB
			color = pow( color, vec4( 2.2 ) );
			#endif

			float t = iTime * float( SPEED );
			float seed = dot( uv, vec2( 12.9898, 78.233 ) );
			float noise = fract( sin( seed ) * 43758.5453 + t );
			noise = gaussian( noise, float( MEAN ), float( VARIANCE ) * float( VARIANCE ) );

			#if SHOW_NOISE
			color = vec4(noise);
			#else

			// Ignore these mouse stuff if you're porting this
			// and just use an arbitrary intensity value.
			float w = float( INTENSITY );
			vec3 grain = vec3( noise ) * ( 1.0 - color.rgb );

			// addition
			#if BLEND_MODE == 0
			color.rgb += grain * w;

			// screen
			#elif BLEND_MODE == 1
			color.rgb = screen(color.rgb, grain, w);

			// overlay
			#elif BLEND_MODE == 2
			color.rgb = overlay(color.rgb, grain, w);

			// soft light
			#elif BLEND_MODE == 3
			color.rgb = soft_light(color.rgb, grain, w);

			// lighten only
			#elif BLEND_MODE == 4
			color.rgb = max(color.rgb, grain * w);
			#endif

			#if SRGB
			color = pow(color, vec4(1.0 / 2.2));
			#endif
			#endif

			gl_FragColor = color;

		}

	`,

};
