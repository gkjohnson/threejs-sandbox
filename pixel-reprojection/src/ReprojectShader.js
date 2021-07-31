import { Matrix4, Vector2 } from '//cdn.skypack.dev/three@0.114/build/three.module.js';

export const ReprojectShader = {

	extensions: {

		fragDepth: true

	},

	uniforms: {

		blendOpacity: { value: 1 },
		baseOpacity: { value: 1 },
		velocityBuffer: { value: null },

		prevColorBuffer: { value: null },
		currColorBuffer: { value: null },

		prevDepthBuffer: { value: null },
		currDepthBuffer: { value: null },

		// prevInvProjectionMatrix: { value: new Matrix4() },
		// prevInvCameraMatrix: { value: new Matrix4() },

		// currProjectionMatrix: { value: new Matrix4() },
		// currCameraMatrix: { value: new Matrix4() },

		prevProjectionMatrix: { value: new Matrix4() },
		prevCameraMatrix: { value: new Matrix4() },

		currInvProjectionMatrix: { value: new Matrix4() },
		currInvCameraMatrix: { value: new Matrix4() },

		resolution: { value: new Vector2() },

	},
	vertexShader: `
		varying vec2 vUv;
		void main() {

			#include <begin_vertex>
			#include <project_vertex>
			vUv = uv;

		}
	`,
	fragmentShader: `
		#include <common>

		varying vec2 vUv;
		uniform sampler2D velocityBuffer;

		uniform sampler2D currColorBuffer;
		uniform sampler2D prevColorBuffer;

		uniform sampler2D prevDepthBuffer;
		uniform sampler2D currDepthBuffer;

		// uniform mat4 prevInvProjectionMatrix;
		// uniform mat4 prevInvCameraMatrix;

		// uniform mat4 currProjectionMatrix;
		// uniform mat4 currCameraMatrix;

		uniform mat4 prevProjectionMatrix;
		uniform mat4 prevCameraMatrix;

		uniform mat4 currInvProjectionMatrix;
		uniform mat4 currInvCameraMatrix;

		uniform float blendOpacity;
		uniform float baseOpacity;
		uniform vec2 resolution;

		void main() {

			vec2 offset = rand( gl_FragCoord.xy ) / resolution / 2.0;
			offset = vec2( 0.0 );

			vec2 velocity = texture2D( velocityBuffer, vUv ).xy;
			vec2 prevUv = vUv - velocity;
			vec2 currUv = vUv;

			vec4 currSample = texture2D( currColorBuffer, vUv );
			vec4 prevSample = texture2D( prevColorBuffer, prevUv + offset );

			float currDepth = texture2D( currDepthBuffer, vUv ).r;
			float prevDepth = texture2D( prevDepthBuffer, prevUv ).r;

			float alpha = 1.0;
			if (
				currDepth >= 1.0 ||
				currDepth <= 0.0 ||
				prevDepth >= 1.0 ||
				prevDepth <= 0.0 ||
				prevUv.x > 1.0 || prevUv.x < 0.0 ||
				prevUv.y > 1.0 || prevUv.y < 0.0
			) {

				// gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );
				// return;
				alpha = 0.0;

			}

			// vec4 prevNdc = vec4(
			// 	( prevUv.x - 0.5 ) * 2.0,
			// 	( prevUv.y - 0.5 ) * 2.0,
			// 	( prevDepth - 0.5 ) * 2.0,
			// 	1.0
			// );
			// prevNdc = prevInvProjectionMatrix * prevNdc;
			// prevNdc /= prevNdc.w;

			// prevNdc = prevInvCameraMatrix * prevNdc;
			// prevNdc = currCameraMatrix * prevNdc;

			// prevNdc = currProjectionMatrix * prevNdc;
			// prevNdc /= prevNdc.w;

			// float reprojectedPrevDepth = ( prevNdc.z / 2.0 ) + 0.5;

			// float t = abs( reprojectedPrevDepth - currDepth ) < 1e-4 ? 1.0 : 0.0;

			vec4 currNdc = vec4(
				( currUv.x - 0.5 ) * 2.0,
				( currUv.y - 0.5 ) * 2.0,
				( currDepth - 0.5 ) * 2.0,
				1.0
			);
			currNdc = currInvProjectionMatrix * currNdc;
			currNdc /= currNdc.w;

			currNdc = currInvCameraMatrix * currNdc;
			currNdc = prevCameraMatrix * currNdc;

			currNdc = prevProjectionMatrix * currNdc;
			currNdc /= currNdc.w;

			float reprojectedCurrDepth = ( currNdc.z / 2.0 ) + 0.5;

			float t = reprojectedCurrDepth < prevDepth + 2e-5 ? 1.0 : 0.0;

			gl_FragColor = mix( currSample * baseOpacity, prevSample , t * alpha * blendOpacity );
			gl_FragDepthEXT = currDepth;

			// gl_FragColor = vec4(
			// 	reprojectedPrevDepth < 0.99 ? 1.0 : 0.0,
			// 	0.0,
			// 	currDepth < 0.99 ? 1.0 : 0.0,
			// 	1.0 );

		}
	`,

};
