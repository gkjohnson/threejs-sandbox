// https://computergraphics.stackexchange.com/questions/5698/making-low-discrepancy-sequence-noise-textures-not-lds-sample-positions
// http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
// https://developer.nvidia.com/sites/default/files/akamai/gamedev/docs/PCSS_Integration.pdf

// TODO: Remove dependency on shadow texture size
// TODO: Find a way to keep the contact shadows hard

const poissonDefinitions = `

// Better poisson disk generation taken from another PCSS implmentation
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadowmap_pcss.html#L54
#define NUM_RINGS 11
vec2 randomSeed = shadowCoord.xy;

vec2 poissonDisk[NUM_SAMPLES];

float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );
// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
float angle = rand( randomSeed ) * PI2 * noiseIntensity;
float radius = INV_NUM_SAMPLES;
float radiusStep = radius;
for( int i = 0; i < NUM_SAMPLES; i ++ ) {
	poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
	radius += radiusStep;
	angle += ANGLE_STEP;
}

`;

const functionDefinitions = `

#define NEAR_PLANE .5
uniform vec2 lightSize;
uniform float noiseIntensity;
uniform float softness;

void RE_Direct_RectArea_CUSTOM( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight, float factor ) {
	vec3 normal = geometry.normal;
	vec3 viewDir = geometry.viewDir;
	vec3 position = geometry.position;
	vec3 lightPos = rectAreaLight.position;
	vec3 halfWidth = rectAreaLight.halfWidth;
	vec3 halfHeight = rectAreaLight.halfHeight;
	vec3 lightColor = rectAreaLight.color;
	float roughness = material.specularRoughness;
	vec3 rectCoords[ 4 ];
	rectCoords[ 0 ] = lightPos - halfWidth - halfHeight;
	rectCoords[ 1 ] = lightPos + halfWidth - halfHeight;
	rectCoords[ 2 ] = lightPos + halfWidth + halfHeight;
	rectCoords[ 3 ] = lightPos - halfWidth + halfHeight;
	vec2 uv = LTC_Uv( normal, viewDir, roughness );
	vec4 t1 = texture2D( ltc_1, uv );
	vec4 t2 = texture2D( ltc_2, uv );
	mat3 mInv = mat3(
		vec3( t1.x, 0, t1.y ),
		vec3(    0, 1,    0 ),
		vec3( t1.z, 0, t1.w )
	);
	vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
	reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords ) * factor;
	reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords ) * factor;
}

vec2 findBlocker(sampler2D shadowMap, vec4 shadowCoord, vec2 searchSize) {

	#define NUM_SAMPLES int(BLOCKER_SAMPLES)
	${ poissonDefinitions }
	#undef NUM_SAMPLES

	vec2 uv = shadowCoord.xy;
	float thisDepth = shadowCoord.z;

	float avgDepth = 0.0;
	float blockerCount = 0.0;

	for(int i = 0; i < int(BLOCKER_SAMPLES); i++) {

		vec2 offset = poissonDisk[i];
		vec2 newUv = uv + offset * searchSize;
		float blockerDepth = unpackRGBAToDepth( texture2D(shadowMap, newUv) );

		float isBlocking = step(blockerDepth, thisDepth);
		avgDepth += isBlocking * blockerDepth;
		blockerCount += isBlocking;

	}

	return vec2(avgDepth / blockerCount, blockerCount);
}

vec2 getPenumbra(float dblocker, float dreceiver, float softness, vec2 lightSize) {

	float p = (dreceiver - dblocker) / dblocker;
	vec2 penumbra = lightSize * p * softness;
	return penumbra;

}

float pcfSample(sampler2D shadowMap, vec2 shadowRadius, vec4 shadowCoord) {

	#define NUM_SAMPLES int(PCF_SAMPLES)
	${ poissonDefinitions }
	#undef NUM_SAMPLES

	float shadow = 0.0;
	for (int i = 0; i < int(PCF_SAMPLES); i ++) {

		vec2 offset = poissonDisk[i];
		vec2 suv = shadowCoord.xy + offset * shadowRadius;
		shadow += texture2DCompare( shadowMap, suv, shadowCoord.z );

	}

	shadow /= float(PCF_SAMPLES);

	return shadow;

}

float getPCSSShadow(vec2 lightSize, sampler2D shadowMap, vec2 shadowMapSize, vec4 shadowCoord) {
	vec2 searchSize = softness * lightSize / shadowMapSize;
	vec2 blocker = findBlocker(shadowMap, shadowCoord, searchSize);

	if (blocker.y == 0.0) {
		return 1.0;
	}

	vec2 penumbra = getPenumbra(blocker.x, shadowCoord.z, softness, lightSize) / shadowMapSize;
	return pcfSample(shadowMap, penumbra, shadowCoord);
}
`;

const shadowLogic = `
shadow = getPCSSShadow(lightSize, shadowMap, shadowMapSize, shadowCoord);
`;


THREE.ShaderChunk.shadowmap_pars_fragment =
	THREE.ShaderChunk.shadowmap_pars_fragment
		.replace( /float getShadow/, t => `${ functionDefinitions }\n${ t }` )
		.replace( /#if defined\( SHADOWMAP_TYPE_PCF \)(.|\n)*?#endif/, shadowLogic );


THREE.ShaderChunk.lights_fragment_begin = `
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = normalize( vViewPosition );
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#pragma unroll_loop
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointDirectLightIrradiance( pointLight, geometry, directLight );
		#ifdef USE_SHADOWMAP
		directLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	#pragma unroll_loop
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotDirectLightIrradiance( spotLight, geometry, directLight );
		#ifdef USE_SHADOWMAP
		directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
#endif

// REMOVED THE DIRECTIONAL LIGHTS
// #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
// 	DirectionalLight directionalLight;
// 	#pragma unroll_loop
// 	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
// 		directionalLight = directionalLights[ i ];
// 		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );
// 		#ifdef USE_SHADOWMAP
// 		directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
// 		#endif
// 		RE_Direct( directLight, geometry, material, reflectedLight );
// 	}
// #endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];

		// EDITED: Use the shadow map from the directional light
		float factor = 1.0;
		#ifdef USE_SHADOWMAP
		DirectionalLight directionalLight = directionalLights[0 ];
		getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );
		factor =
			all( bvec2( directionalLight.shadow, directLight.visible ) ) ?
				getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) :
				1.0;
		#endif

		RE_Direct_RectArea_CUSTOM( rectAreaLight, geometry, material, reflectedLight, factor );
	}
#endif
#if defined( RE_IndirectDiffuse )
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
		}
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearCoatRadiance = vec3( 0.0 );
#endif
`;
