import { ShaderChunk } from '//cdn.skypack.dev/three@0.106.0/build/three.module.js';

export function initShadowColor() {

	ShaderChunk.shadowmap_pars_fragment = /* glsl */`

		${ ShaderChunk.shadowmap_pars_fragment }
		#ifdef USE_SHADOWMAP
			uniform sampler2D shadowColorMap;

			// Copied and modified from "ShaderChunk.shadowmap_pars_fragment" in r102.1
			vec3 texture2DCompareWithColor( sampler2D depths, sampler2D shadowColorMap, vec2 uv, float compare ) {

				return texture2DCompare( depths, uv, compare ) == 1.0 ? vec3( 1.0, 1.0, 1.0 ) : texture2D( shadowColorMap, uv ).rgb;

			}

			vec3 texture2DLerpWithColor( sampler2D depths, sampler2D shadowColorMap, vec2 size, vec2 uv, float compare ) {

				const vec2 offset = vec2( 0.0, 1.0 );
				vec2 texelSize = vec2( 1.0 ) / size;
				vec2 centroidUV = floor( uv * size + 0.5 ) / size;
				vec3 lb = texture2DCompareWithColor( depths, shadowColorMap, centroidUV + texelSize * offset.xx, compare );
				vec3 lt = texture2DCompareWithColor( depths, shadowColorMap, centroidUV + texelSize * offset.xy, compare );
				vec3 rb = texture2DCompareWithColor( depths, shadowColorMap, centroidUV + texelSize * offset.yx, compare );
				vec3 rt = texture2DCompareWithColor( depths, shadowColorMap, centroidUV + texelSize * offset.yy, compare );
				vec2 f = fract( uv * size + 0.5 );
				vec3 a = mix( lb, lt, f.y );
				vec3 b = mix( rb, rt, f.y );
				vec3 c = mix( a, b, f.x );
				return c;

			}

			vec3 getShadowWithColor( sampler2D shadowMap, sampler2D shadowColorMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
				vec3 shadow = vec3( 1.0, 1.0, 1.0 );
				shadowCoord.xyz /= shadowCoord.w;
				shadowCoord.z += shadowBias;
				bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
				bool inFrustum = all( inFrustumVec );
				bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
				bool frustumTest = all( frustumTestVec );
				if ( frustumTest ) {
				#if defined( SHADOWMAP_TYPE_PCF )
					vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
					float dx0 = - texelSize.x * shadowRadius;
					float dy0 = - texelSize.y * shadowRadius;
					float dx1 = + texelSize.x * shadowRadius;
					float dy1 = + texelSize.y * shadowRadius;
					shadow = (
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z )+
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy, shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
						texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
					) * ( 1.0 / 9.0 );
				#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
					vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
					float dx0 = - texelSize.x * shadowRadius;
					float dy0 = - texelSize.y * shadowRadius;
					float dx1 = + texelSize.x * shadowRadius;
					float dy1 = + texelSize.y * shadowRadius;
					shadow = (
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
						texture2DLerpWithColor( shadowMap, shadowColorMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
					) * ( 1.0 / 9.0 );
				#else
					shadow = texture2DCompareWithColor( shadowMap, shadowColorMap, shadowCoord.xy, shadowCoord.z ) * texture2D( shadowColorMap, shadowCoord.xy );
				#endif
				}
				return shadow;
			}
		#endif
	`;

	ShaderChunk.lights_fragment_begin =
		ShaderChunk.lights_fragment_begin.replace(
			'directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
			/* glsl */`
				directLight.color *=
					all( bvec2( directionalLight.shadow, directLight.visible ) ) ?
						(
							getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] )
						) * getShadowWithColor( directionalShadowMap[ i ], shadowColorMap, directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ):

						vec3( 1.0, 1.0, 1.0 );
			`
		);

}
