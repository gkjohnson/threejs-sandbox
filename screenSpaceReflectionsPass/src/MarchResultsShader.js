import { Matrix4, Vector2 } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { sampleFunctions } from '../../custom-mipmap-generation/src/mipSampleFunctions.js';

export const MarchResultsShader = {

	defines: {

		MAX_STEPS: 10,
		BINARY_SEARCH_ITERATIONS: 4,
		PYRAMID_DEPTH: 1,
		USE_THICKNESS: 0,
		EDGE_FADE: 0.3,
		ORTHOGRAPHIC_CAMERA: 0,
		GLOSSY_MODE: 0,
		ENABLE_DEBUG: 0,

		JITTER_STRATEGY: 0,
		GLOSSY_JITTER_STRATEGY: 1,
		BLUENOISE_SIZE: '32.0',

	},

	uniforms: {

		colorBuffer: { value: null },
		packedBuffer: { value: null },
		depthBuffer: { value: null },
		depthBufferLod: { value: null },
		backfaceDepthBuffer: { value: null },
		invProjectionMatrix: { value: new Matrix4() },
		projMatrix: { value: new Matrix4() },

		blueNoiseTex: { value: null },

		stride: { value: 20 },
		resolution: { value: new Vector2() },
		thickness: { value: 1 },
		jitter: { value: 1 },
		roughnessCutoff: { value: 1 },
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

		${ sampleFunctions }

		varying vec2 vUv;
		uniform sampler2D colorBuffer;
		uniform sampler2D packedBuffer;
		uniform sampler2D depthBuffer;
		uniform sampler2D backfaceDepthBuffer;
		uniform mat4 invProjectionMatrix;
		uniform mat4 projMatrix;
		uniform vec2 resolution;

		uniform float roughnessCutoff;
		uniform float thickness;
		uniform float stride;
		uniform float jitter;
		uniform float maxDistance;

		// Include the blue noise texture if we're using blue noise jitter ( 1 ) or
		// we're using a glossiness mode with blue noise jitter.
		#if JITTER_STRATEGY == 1 || ( GLOSSY_JITTER_STRATEGY == 1 && GLOSSY_MODE != 0 )
		uniform sampler2D blueNoiseTex;
		#endif

		#if GLOSSY_MODE == 3 // MIP_PYRAMID_GLOSSY
		uniform sampler2D depthBufferLod;
		#endif

		vec3 Deproject( vec3 p ) {

			vec4 res = invProjectionMatrix * vec4( p, 1 );
			return res.xyz / res.w;

		}

		vec3 Project( vec3 p ) {

			vec4 res = projMatrix * vec4( p, 1 );
			return res.xyz / res.w;

		}

		vec3 UnpackNormal( vec4 d ) {

			return d.xyz * 2.0 - 1.0;

		}

		#if USE_THICKNESS

		#if GLOSSY_MODE == 3 // MIP_PYRAMID_GLOSSY

		// If we're using z hierarchy glossiness sample from the lod depth map with a variable
		// LOD and thickness.
		bool doesIntersect( float rayzmax, float rayzmin, vec2 uv, int lod, float thickness ) {

			float sceneZMin = packedTexture2DLOD( depthBufferLod, uv, lod ).r;

			return sceneZMin != 0.0 &&  rayzmin > sceneZMin - thickness && rayzmax < sceneZMin;

		}

		#else

		// If we're using thickness then account for the thickness uniform when sampling.
		bool doesIntersect( float rayzmax, float rayzmin, vec2 uv ) {

			float sceneZMin = texture2D( depthBuffer, uv ).r;

			return sceneZMin != 0.0 &&  rayzmin > sceneZMin - thickness && rayzmax < sceneZMin;

		}

		#endif

		#else

		// check if the ray passed through the min and max depth values at the given uv.
		bool doesIntersect( float rayzmax, float rayzmin, vec2 uv ) {

			float sceneZMax = texture2D( backfaceDepthBuffer, uv ).r;
			float sceneZMin = texture2D( depthBuffer, uv ).r;

			return sceneZMin != 0.0 && rayzmin >= sceneZMax && rayzmax <= sceneZMin;

		}

		#endif

		float distanceSquared( vec2 a, vec2 b ) {

			a -= b;
			return dot(a, a);

		}

		// NOTE: "further" is actually "more negative"
		void swapIfBigger( inout float a, inout float b ) {

			if ( a > b ) {

				float t = a;
				a = b;
				b = t;

			}

		}

		bool isOutsideUvBounds( float x ) {

			return x < 0.0 || x > 1.0;

		}

		bool isOutsideUvBounds( vec2 uv ) {

			return isOutsideUvBounds( uv.x ) || isOutsideUvBounds( uv.y );

		}

		void main() {

			// Screen position information
			vec2 screenCoord = vUv * 2.0 - vec2( 1, 1 );
			float nearClip = Deproject( vec3( 0, 0, - 1 ) ).z;

			// Samples
			vec4 dataSample = texture2D( packedBuffer, vUv );
			float depthSample = texture2D( depthBuffer, vUv ).r;

			// TODO: this is added because with the ortho camera we get some stray samples that
			// hit outside the model so make sure we ignore any non retrievals.
			if ( depthSample == 0.0 ) {

				gl_FragColor = vec4( 0.0 );
				return;

			}

			// View space information
			vec3 vnorm = UnpackNormal( dataSample );
			float roughness = dataSample.a;

			if ( roughness >= roughnessCutoff ) {

				gl_FragColor = vec4( 0.0 );
				return;

			}

			#if ORTHOGRAPHIC_CAMERA
			// The ray is positioned at our screen coordinate into the screen
			// "depthSample - nearClip" will be negative here -- TODO: into the screen should be z = - 1.
			vec3 ray = vec3( 0.0, 0.0, 1.0 );
			vec3 vpos = ( depthSample - nearClip ) * ray + Deproject( vec3( screenCoord, - 1 ) );
			vec3 dir = normalize( reflect( normalize( vec3(0.0, 0.0, - 1.0) ), normalize( vnorm ) ) );
			#else
			vec3 ray = Deproject( vec3( screenCoord, - 1 ) );
			ray /= ray.z;
			vec3 vpos =  depthSample * ray;
			vec3 dir = normalize( reflect( normalize( vpos ), normalize( vnorm ) ) );
			#endif

			// Define view space values
			float maxDist = maxDistance;
			float rayLength = ( vpos.z + dir.z * maxDist ) > nearClip ? ( nearClip - vpos.z ) / dir.z : maxDist;
			vec3 csOrig = vpos;
			vec3 csEndPoint = csOrig + dir * rayLength;

			// Projected Coordintes
			vec4 H0 = projMatrix * vec4( csOrig, 1.0 );
			vec4 H1 = projMatrix * vec4( csEndPoint, 1.0 );

			// Homogenous Divisor
			float k0 = 1.0 / H0.w, k1 = 1.0 / H1.w;

			// Clip Space Coordinates?
			vec3 Q0 = csOrig.xyz * k0, Q1 = csEndPoint.xyz * k1;

			// Screen Space Pixel Coordinates [ 0.0, resolution.xy ]
			vec2 P0 = H0.xy * k0, P1 = H1.xy * k1;
			P0 = P0 * 0.5 + vec2( 0.5 ), P1 = P1 * 0.5 + vec2( 0.5 );
			P0 *= resolution, P1 *= resolution;

			// Scoot the final coordinate a bit if the two points are really close
			P1 += vec2( ( distanceSquared( P0, P1 ) < 0.0001 ) ? 0.01 : 0.0 );
			vec2 delta = P1 - P0;

			// Ensure X is the larger coordinate
			bool permute = false;
			if ( abs( delta.x ) < abs( delta.y ) ) {
				permute = true;
				delta = delta.yx;
				P0 = P0.yx; P1 = P1.yx;
			}

			// invdx = px difference along larger stride axis
			float stepDir = sign( delta.x );
			float invdx = stepDir / delta.x;

			// Derivatives
			// Step for one pixel for each component
			vec3 dQ = ( Q1 - Q0 ) * invdx;
			float dk = ( k1 - k0 ) * invdx;
			vec2 dP = vec2( stepDir, delta.y * invdx );

			// Track all values in a vector
			float pixelStride = stride;

			// Ray Starting Position Jitter
			#if JITTER_STRATEGY == 0 // REGULAR_JITTER
			float jitterAmount = mod( ( gl_FragCoord.x + gl_FragCoord.y ) * 0.25, 1.0 );
			#elif JITTER_STRATEGY == 1 // BLUENOISE_JITTER
			float jitterAmount = texture2D( blueNoiseTex, gl_FragCoord.xy / BLUENOISE_SIZE ).r;
			#endif

			// Tracking Variables
			vec4 PQK = vec4( P0, Q0.z, k0 );
			vec4 dPQK = vec4( dP, dQ.z, dk );

			// Start by taking an initial stride to avoid intersecting at the first pixel.
			// TODO: this was added -- maybe offset the start by the normal instead?
			PQK += dPQK;

			// Scale the derivative by the pixel stride
			dPQK *= pixelStride;
			PQK += dPQK * jitterAmount * jitter;

			// Variables for completion condition
			float end = P1.x * stepDir;
			float prevZMaxEstimate = PQK.z / PQK.w; // Q0.z * H0.w : Back to camera space z
			float rayZMin = prevZMaxEstimate;
			float rayZMax = prevZMaxEstimate;
			float stepped = 0.0;

			// Glossy Variable Init
			#if GLOSSY_MODE == 1 // SIMPLE_GLOSSY
			float searchRadius = 0.0;

			#if GLOSSY_JITTER_STRATEGY == 1 // BLUENOISE_JITTER

			vec3 searchVector = ( texture2D( blueNoiseTex, gl_FragCoord.xy / BLUENOISE_SIZE ).gra - vec3( 0.5 ) );

			#elif GLOSSY_JITTER_STRATEGY == 2 // RANDOM_JITTER

			vec3 searchVector = normalize(
				vec3(
					rand( gl_FragCoord.xy - sin( vUv * 400.0 ) * 100.0 ) - 0.5,
					rand( gl_FragCoord.xy - cos( vUv * 100.0 ) * 200.0 ) - 0.5,
					rand( gl_FragCoord.xy - tan( vUv * 800.0 ) * 50.0 ) - 0.5
				)
			) * ( rand( gl_FragCoord.xy ) - 0.5 ) * 2.0;

			#endif

			#elif GLOSSY_MODE == 2 // MULTI_GLOSSY

			#define GLOSSY_RAY_COUNT 6
			vec3 searchVectors[ GLOSSY_RAY_COUNT ];
			float searchRadius = 0.0;
			vec3 accumulatedColor = vec3( 0.0 );

			#if GLOSSY_JITTER_STRATEGY == 1	 // BLUENOISE_JITTER

			float angle = texture2D( blueNoiseTex, gl_FragCoord.xy / BLUENOISE_SIZE ).g * 2.0 * PI;

			#elif GLOSSY_JITTER_STRATEGY == 2 // RANDOM_JITTER

			float angle = rand( gl_FragCoord.xy ) * 2.0 * PI;

			#endif

			// Generate sample vectors
			float angleStep = 13.123412 * PI / float( GLOSSY_RAY_COUNT );
			float ratio;
			#pragma unroll_loop_start
			for ( int i = 0; i < 6; i ++ ) {

				ratio = float ( UNROLLED_LOOP_INDEX ) / float ( GLOSSY_RAY_COUNT );
				searchVectors[ i ] = normalize( vec3( sin( angle ), cos( angle ), 2.0 * ratio - 1.0 ) ) * ratio;
				angle += angleStep;

			}
			#pragma unroll_loop_end

			#elif GLOSSY_MODE == 3 // MIP_PYRAMID_GLOSSY

			float searchRadius = 0.0;
			vec3 finalColor = vec3( 0.0 );

			#endif

			vec2 hitUV;
			bool intersected = false;
			for ( float stepCount = 1.0; stepCount <= float( MAX_STEPS ); stepCount ++ ) {

				#if GLOSSY_MODE == 0
				PQK += dPQK;
				#else
				// Take a larger stride based on the search radius for our glossiness
				PQK += ( dPQK / pixelStride ) * ( max( searchRadius, pixelStride ) );
				#endif

				rayZMin = prevZMaxEstimate;
				rayZMax = ( dPQK.z * 0.5 + PQK.z ) / ( dPQK.w * 0.5 + PQK.w );
				prevZMaxEstimate = rayZMax;

				// "further" is "more negative", so max should be further away,
				// or the smaller number
				swapIfBigger( rayZMax, rayZMin );

				stepped = stepCount;
				hitUV = ( permute ? PQK.yx : PQK.xy ) / resolution;
				if ( isOutsideUvBounds( hitUV ) ) break;

				// TODO: this is here because there are cases where we rayZMin is somehow hitting
				// a positive value after marching for awhile which is odd because "into the screen"
				// should be negative.
				if ( rayZMin > 0.0 ) break;

				// TODO: the glossiness paths should convert glossiness search radius from world space in to screen space
				#if GLOSSY_MODE == 0 // NO_GLOSSY

				intersected = doesIntersect( rayZMax, rayZMin, hitUV );

				#elif GLOSSY_MODE == 1 // SIMPLE_GLOSSY

				float rayDist = abs( ( ( rayZMax - csOrig.z ) / ( csEndPoint.z - csOrig.z ) ) * rayLength );
				searchRadius = rayDist * roughness;

				vec3 radius = searchVector * searchRadius;
				radius.xy /= resolution.x / resolution.y;
				radius.xy *= PQK.w;
				intersected = doesIntersect( rayZMax + radius.z, rayZMin + radius.z, hitUV + radius.xy );

				if (intersected) {

					hitUV = hitUV + radius.xy;

				}

				#elif GLOSSY_MODE == 2 // MULTI_GLOSSY

				float rayDist = abs( ( ( rayZMax - csOrig.z ) / ( csEndPoint.z - csOrig.z ) ) * rayLength );
				searchRadius = rayDist * roughness;

				bool didIntersect = false;
				float total = 0.0;
				vec3 radius;
				#pragma unroll_loop_start
				for ( int i = 0; i < 6; i ++ ) {

					radius = searchVectors[ i ] * searchRadius;
					radius.xy /= resolution.x / resolution.y;
					radius.xy *= PQK.w;

					didIntersect = doesIntersect( rayZMax + radius.z, rayZMin + radius.z, hitUV + radius.xy );
					if ( didIntersect ) {

						accumulatedColor += texture2D( colorBuffer, hitUV + radius.xy ).rgb;
						intersected = true;
						total += 1.0;

					}

				}
				#pragma unroll_loop_end

				if ( intersected ) {

					hitUV = hitUV;
					accumulatedColor /= total;

				}

				#elif GLOSSY_MODE == 3 // MIP_PYRAMID_GLOSSY

				float rayDist = abs( ( ( rayZMax - csOrig.z ) / ( csEndPoint.z - csOrig.z ) ) * rayLength );
				searchRadius = rayDist * roughness * 3.0;

				float radius = searchRadius * PQK.w;
				float lod = radius * 10.0;

				intersected = doesIntersect( rayZMax, rayZMin, hitUV, int( ceil( lod ) ), thickness + searchRadius );

				if ( intersected ) {

					hitUV = hitUV;
					finalColor = texture2D( colorBuffer, hitUV, lod * 2.0 ).rgb;

					#if ENABLE_DEBUG
					gl_FragColor = vec4( lod );
					return;
					#endif

				}

				#endif
				if ( intersected || ( PQK.x * stepDir ) > end ) break;

			}

			// Don't perform binary search if using mip or multi sample binary glossiness
			#if BINARY_SEARCH_ITERATIONS && GLOSSY_MODE != 2 && GLOSSY_MODE != 3

			// Binary search
			#if GLOSSY_MODE == 1
			if ( intersected && pixelStride > 1.0 && searchRadius < 0.1 ) {
			#else
			if ( intersected && pixelStride > 1.0 ) {
			#endif

				PQK -= dPQK;
				dPQK /= stride;
				float ogStride = pixelStride * 0.5;
				float currStride = pixelStride;

				prevZMaxEstimate = PQK.z / PQK.w;
				rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;

				for( int j = 0; j < int( BINARY_SEARCH_ITERATIONS ); j ++ ) {
					PQK += dPQK * currStride;

					rayZMin = prevZMaxEstimate;
					rayZMax = ( dPQK.z * 0.5 + PQK.z ) / ( dPQK.w * 0.5 + PQK.w );
					prevZMaxEstimate = rayZMax;

					swapIfBigger( rayZMax, rayZMin );

					vec2 newUV = ( permute ? PQK.yx : PQK.xy ) / resolution;
					ogStride *= 0.5;
					if ( doesIntersect( rayZMax, rayZMin, newUV ) ) {

						hitUV = newUV;
						currStride = -ogStride;

					} else {

						currStride = ogStride;

					}

				}

			}
			#endif

			#if ENABLE_DEBUG

			gl_FragColor = intersected ? vec4( hitUV, stepped / float( MAX_STEPS ), 1.0 ) : vec4( 0.0 );

			#else

			if ( intersected ) {

				vec2 ndc = abs( hitUV * 2.0 - 1.0 );
				float maxndc = max( abs( ndc.x ), abs( ndc.y ) ); // [ -1.0, 1.0 ]
				float ndcFade = 1.0 - ( max( 0.0, maxndc - EDGE_FADE ) / ( 1.0 - EDGE_FADE )  );
				float stepFade = 1.0 - ( stepped / float( MAX_STEPS ) );
				float roughnessFade = 1.0 - roughness;

				#if GLOSSY_MODE != 0 // using GLOSSINESS mode

				roughnessFade = 1.0 / ( pow( searchRadius, 1.0 ) + 1.0 );
				// roughnessFade = 1.0 / ( PI * pow( searchRadius, 2.0 ) + 1.0 );
				// roughnessFade = smoothstep(5.0, 0.0, searchRadius);

				#endif

				roughnessFade *= smoothstep( roughnessCutoff, roughnessCutoff * 0.9, roughness );

				#if GLOSSY_MODE == 2 // MULTI_GLOSSY

				vec3 color = accumulatedColor;

				#elif GLOSSY_MODE == 3 // MIP_PYRAMID_GLOSSY

				vec3 color = finalColor;
				float factor = smoothstep( 3.0, 6.0, searchRadius );
				roughnessFade = 1.0 / ( searchRadius * factor + 1.0 );
				// roughnessFade = 1.0;

				#else

				vec3 color = texture2D( colorBuffer, hitUV ).rgb;

				#endif

				gl_FragColor = vec4( color * ndcFade * stepFade * roughnessFade, 0.0 );

			} else {

				gl_FragColor = vec4( 0.0 );

			}

			#endif

		}
		`

};
