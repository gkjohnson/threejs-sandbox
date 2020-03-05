import { Matrix4, Vector2 } from '//unpkg.com/three@0.112.0/build/three.module.js';

export const CompositeShader = {

	defines: {

		MAX_STEPS: 10,
		BINARY_SEARCH_ITERATIONS: 4,
		PYRAMID_DEPTH: 1

	},

	uniforms: {

		sourceBuffer: { value: null },
		packedBuffer: { value: null },
		depthBuffer: { value: null },
		backfaceDepthBuffer: { value: null },
		invProjectionMatrix: { value: new Matrix4() },
		projMatrix: { value: new Matrix4() },

		intensity: { value: 0.5 },
		stride: { value: 20 },
		resolution: { value: new Vector2() },
		thickness: { value: 1 },
		jitter: { value: 1 },
		maxDistance: { value: 100 }

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
		varying vec2 vUv;
		uniform sampler2D sourceBuffer;
		uniform sampler2D packedBuffer;
		uniform sampler2D depthBuffer;
		uniform sampler2D backfaceDepthBuffer;
		uniform mat4 invProjectionMatrix;
		uniform mat4 projMatrix;
		uniform vec2 resolution;

		uniform float thickness;
		uniform float stride;
		uniform float jitter;
		uniform float maxDistance;
		uniform float intensity;

		vec3 Deproject(vec3 p) {
			vec4 res = invProjectionMatrix * vec4(p, 1);
			return res.xyz / res.w;
		}

		vec3 Project(vec3 p) {
			vec4 res = projMatrix * vec4(p, 1);
			return res.xyz / res.w;
		}

		vec3 UnpackNormal(vec4 d) {
			return d.xyz * 2.0 - 1.0;
		}

		bool doesIntersect(float rayzmax, float rayzmin, vec2 uv) {

			float sceneZMax = texture2D(backfaceDepthBuffer, uv).r;
			float sceneZMin = texture2D(depthBuffer, uv).r;

			return rayzmin >= sceneZMax && rayzmax <= sceneZMin;

		}

		float distanceSquared(vec2 a, vec2 b) { a -= b; return dot(a, a); }

		// NOTE: "further" is actually "more negative"
		void swapIfBigger(inout float a, inout float b) {
			if (a > b) {
				float t = a;
				a = b;
				b = t;
			}
		}

		bool isOutsideUvBounds(float x) { return x < 0.0 || x > 1.0; }
		bool isOutsideUvBounds(vec2 uv) { return isOutsideUvBounds(uv.x) || isOutsideUvBounds(uv.y); }

		void main() {

			// Screen position information
			vec2 screenCoord = vUv * 2.0 - vec2(1, 1);
			float nearClip = Deproject(vec3(0, 0, -1)).z;
			vec3 ray = Deproject(vec3(screenCoord, -1));
			ray /= ray.z;

			// Samples
			vec4 dataSample = texture2D(packedBuffer, vUv);
			float depthSample = texture2D(depthBuffer, vUv).r;

			// View space information
			vec3 vpos =  depthSample * ray;
			vec3 vnorm = UnpackNormal(dataSample);
			vec3 dir = normalize(reflect(normalize(vpos), normalize(vnorm)));

			// Define view space values
			float maxDist = maxDistance;
			float rayLength = (vpos.z + dir.z * maxDist) > nearClip ? (nearClip - vpos.z) / dir.z : maxDist;
			vec3 csOrig = vpos;
			vec3 csEndPoint = csOrig + dir * rayLength;

			vec4 H0 = projMatrix * vec4(csOrig, 1.0);
			vec4 H1 = projMatrix * vec4(csEndPoint, 1.0);

			float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;

			vec3 Q0 = csOrig.xyz * k0, Q1 = csEndPoint.xyz * k1;

			vec2 P0 = H0.xy * k0, P1 = H1.xy * k1;
			P0 = P0 * 0.5 + vec2(0.5), P1 = P1 * 0.5 + vec2(0.5);
			P0 *= resolution, P1 *= resolution;

			P1 += vec2((distanceSquared(P0, P1) < 0.0001) ? 0.01 : 0.0);
			vec2 delta = P1 - P0;

			// TODO: Try to get rid of this permute
			bool permute = false;
			if (abs(delta.x) < abs(delta.y)) {
				permute = true; delta = delta.yx; P0 = P0.yx; P1 = P1.yx;
			}

			float stepDir = sign(delta.x);
			float invdx = stepDir / delta.x;

			// Derivatives
			vec3 dQ = (Q1 - Q0) * invdx;
			float dk = (k1 - k0) * invdx;
			vec2 dP = vec2(stepDir, delta.y * invdx);

			// Track all values in a vector
			float pixelStride = stride;
			float jitterMod = (gl_FragCoord.x + gl_FragCoord.y) * 0.25;
			vec4 PQK = vec4(P0, Q0.z, k0);
			vec4 dPQK = vec4(dP, dQ.z, dk);
			dPQK *= pixelStride;
			PQK += dPQK * mod(jitterMod, 1.0) * jitter;

			// Variables for completion condition
			float end = P1.x * stepDir;
			float prevZMaxEstimate = PQK.z / PQK.w;
			float rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;
			float stepped = 0.0;

			vec2 hitUV;
			bool intersected = false;
			for (float stepCount = 1.0; stepCount <= float(MAX_STEPS); stepCount ++) {

				PQK += dPQK;

				rayZMin = prevZMaxEstimate;
				rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
				prevZMaxEstimate = rayZMax;

				// "furter" is "more negative", so max should be further away,
				// or the smaller number
				swapIfBigger(rayZMax, rayZMin);

				stepped = stepCount;
				hitUV = (permute ? PQK.yx: PQK.xy) / resolution;
				if (isOutsideUvBounds(hitUV)) break;

				intersected = doesIntersect(rayZMax, rayZMin, hitUV);

				if (intersected || (P0.x * stepDir) > end) break;
			}

			// Binary search
			if (intersected && pixelStride > 1.0) {

				PQK -= dPQK;
				dPQK /= stride;
				float ogStride = pixelStride * 0.5;
				float currStride = pixelStride;

				prevZMaxEstimate = PQK.z / PQK.w;
				rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;

				for(int j = 0; j < int(BINARY_SEARCH_ITERATIONS); j ++) {
					PQK += dPQK * currStride;

					rayZMin = prevZMaxEstimate;
					rayZMax = (dPQK.z * 0.5 + PQK.z) / (dPQK.w * 0.5 + PQK.w);
					prevZMaxEstimate = rayZMax;

					swapIfBigger(rayZMax, rayZMin);

					vec2 newUV = (permute ? PQK.yx: PQK.xy) / resolution;
					ogStride *= 0.5;
					if (doesIntersect(rayZMax, rayZMin, newUV)) {
						hitUV = newUV;
						currStride = -ogStride;
					} else {
						currStride = ogStride;
					}

				}
			}

			// Found, blending
			vec4 result = texture2D(sourceBuffer, vUv);
			if (intersected) {
				vec4 col = texture2D(sourceBuffer, hitUV, 10.);

				vec2 ndc = abs(hitUV * 2.0 - 1.0);
				float maxndc = max(ndc.x, ndc.y);
				float fadeVal =
					(1.0 - (max( 0.0, maxndc - 0.4) / (1.0 - 0.4)  )) *
					(1.0 - (stepped / float(MAX_STEPS)));

				// TODO: Add z fade towards camera

				result += col * intensity;
			}

			gl_FragColor = result;

		}
		`

}
