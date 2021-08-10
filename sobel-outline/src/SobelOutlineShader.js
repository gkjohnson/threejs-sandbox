import { Vector2, Color } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

// https://www.vertexfragment.com/ramblings/unity-postprocessing-sobel-outline/#normal-based-outline
export const SobelOutlineShader = {

	defines: {
		OUTLINES_ONLY: 1,
	},

	uniforms: {

		resolution: { value: new Vector2() },
		outlineColor: { value: new Color() },

		mainTex: { value: null },
		normalTex: { value: null },
		depthTex: { value: null },

		depthOutlineThickness: { value: 0 },
		depthBias: { value: 0 },
		normalOutlineThickness: { value: 0 },
		normalBias: { value: 0 },

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
		#include <common>
		#include <packing>
		#define E 2.7182818

		varying vec2 vUv;
		uniform sampler2D mainTex;
		uniform sampler2D normalTex;
		uniform sampler2D depthTex;

		uniform vec2 resolution;
		uniform vec3 outlineColor;

		uniform float depthOutlineThickness;
		uniform float depthBias;
		uniform float normalOutlineThickness;
		uniform float normalBias;

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		void main() {

			vec3 offset;

			offset = vec3( depthOutlineThickness / resolution, 0.0 );
			float depth = texture2D( depthTex, vUv ).r;
			float depthUp = texture2D( depthTex, vUv + offset.zy ).r;
			float depthDn = texture2D( depthTex, vUv - offset.zy ).r;
			float depthRt = texture2D( depthTex, vUv + offset.xz ).r;
			float depthLf = texture2D( depthTex, vUv - offset.xz ).r;

			float depthResult =
				abs( depth - depthUp ) +
				abs( depth - depthDn ) +
				abs( depth - depthLf ) +
				abs( depth - depthRt ) - depthBias;

			offset = vec3( normalOutlineThickness / resolution, 0.0 );
			vec3 normal = UnpackNormal( texture2D( normalTex, vUv ) );
			vec3 normalUp = UnpackNormal( texture2D( normalTex, vUv + offset.zy ) );
			vec3 normalDn = UnpackNormal( texture2D( normalTex, vUv - offset.zy ) );
			vec3 normalRt = UnpackNormal( texture2D( normalTex, vUv + offset.xz ) );
			vec3 normalLf = UnpackNormal( texture2D( normalTex, vUv - offset.xz ) );

			vec3 normalResult =
				abs( normal - normalUp ) +
				abs( normal - normalDn ) +
				abs( normal - normalRt ) +
				abs( normal - normalLf );
			float normalScalar =
				normalResult.x +
				normalResult.y +
				normalResult.z -
				normalBias;

			// // code for scaling depth outline factor by surface normal
			// offset = vec3( depthOutlineThickness / resolution, 0.0 );
			// float depth = texture2D( depthTex, vUv ).r;
			// float depthUp = texture2D( depthTex, vUv + offset.zy ).r;
			// float depthDn = texture2D( depthTex, vUv - offset.zy ).r;
			// float depthRt = texture2D( depthTex, vUv + offset.xz ).r;
			// float depthLf = texture2D( depthTex, vUv - offset.xz ).r;

			// float biasScale = 1.0 - abs( dot( normal, vec3( 0.0, 0.0, 1.0 ) ) );
			// float depthResult =
			// 	abs( depth - depthUp ) +
			// 	abs( depth - depthDn ) +
			// 	abs( depth - depthLf ) +
			// 	abs( depth - depthRt );// - depthBias * biasScale;

			// depthResult = depthResult > abs( depthBias * biasScale + 0.01) ? 1.0 : 0.0;

			float result = saturate( max( depthResult, normalScalar ) );
			result = pow( result, 4.0 );

			#if OUTLINES_ONLY
			gl_FragColor = vec4( 1.0 - result );
			#else
			gl_FragColor = mix(
				texture2D( mainTex, vUv ),
				vec4( outlineColor, 1.0 ),
				result
			);
			#endif

		}
	`

};
