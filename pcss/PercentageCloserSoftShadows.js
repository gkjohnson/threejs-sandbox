// https://computergraphics.stackexchange.com/questions/5698/making-low-discrepancy-sequence-noise-textures-not-lds-sample-positions
// http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf

const poissonDefinitions = `
// from https://www.geeks3d.com/20100628/3d-programming-ready-to-use-64-sample-poisson-disc/
// another option is the halton sequence
vec2 poissonDisk[64];
poissonDisk[0] = vec2(-0.613392, 0.617481);
poissonDisk[1] = vec2(0.170019, -0.040254);
poissonDisk[2] = vec2(-0.299417, 0.791925);
poissonDisk[3] = vec2(0.645680, 0.493210);
poissonDisk[4] = vec2(-0.651784, 0.717887);
poissonDisk[5] = vec2(0.421003, 0.027070);
poissonDisk[6] = vec2(-0.817194, -0.271096);
poissonDisk[7] = vec2(-0.705374, -0.668203);
poissonDisk[8] = vec2(0.977050, -0.108615);
poissonDisk[9] = vec2(0.063326, 0.142369);
poissonDisk[10] = vec2(0.203528, 0.214331);
poissonDisk[11] = vec2(-0.667531, 0.326090);
poissonDisk[12] = vec2(-0.098422, -0.295755);
poissonDisk[13] = vec2(-0.885922, 0.215369);
poissonDisk[14] = vec2(0.566637, 0.605213);
poissonDisk[15] = vec2(0.039766, -0.396100);
poissonDisk[16] = vec2(0.751946, 0.453352);
poissonDisk[17] = vec2(0.078707, -0.715323);
poissonDisk[18] = vec2(-0.075838, -0.529344);
poissonDisk[19] = vec2(0.724479, -0.580798);
poissonDisk[20] = vec2(0.222999, -0.215125);
poissonDisk[21] = vec2(-0.467574, -0.405438);
poissonDisk[22] = vec2(-0.248268, -0.814753);
poissonDisk[23] = vec2(0.354411, -0.887570);
poissonDisk[24] = vec2(0.175817, 0.382366);
poissonDisk[25] = vec2(0.487472, -0.063082);
poissonDisk[26] = vec2(-0.084078, 0.898312);
poissonDisk[27] = vec2(0.488876, -0.783441);
poissonDisk[28] = vec2(0.470016, 0.217933);
poissonDisk[29] = vec2(-0.696890, -0.549791);
poissonDisk[30] = vec2(-0.149693, 0.605762);
poissonDisk[31] = vec2(0.034211, 0.979980);
poissonDisk[32] = vec2(0.503098, -0.308878);
poissonDisk[33] = vec2(-0.016205, -0.872921);
poissonDisk[34] = vec2(0.385784, -0.393902);
poissonDisk[35] = vec2(-0.146886, -0.859249);
poissonDisk[36] = vec2(0.643361, 0.164098);
poissonDisk[37] = vec2(0.634388, -0.049471);
poissonDisk[38] = vec2(-0.688894, 0.007843);
poissonDisk[39] = vec2(0.464034, -0.188818);
poissonDisk[40] = vec2(-0.440840, 0.137486);
poissonDisk[41] = vec2(0.364483, 0.511704);
poissonDisk[42] = vec2(0.034028, 0.325968);
poissonDisk[43] = vec2(0.099094, -0.308023);
poissonDisk[44] = vec2(0.693960, -0.366253);
poissonDisk[45] = vec2(0.678884, -0.204688);
poissonDisk[46] = vec2(0.001801, 0.780328);
poissonDisk[47] = vec2(0.145177, -0.898984);
poissonDisk[48] = vec2(0.062655, -0.611866);
poissonDisk[49] = vec2(0.315226, -0.604297);
poissonDisk[50] = vec2(-0.780145, 0.486251);
poissonDisk[51] = vec2(-0.371868, 0.882138);
poissonDisk[52] = vec2(0.200476, 0.494430);
poissonDisk[53] = vec2(-0.494552, -0.711051);
poissonDisk[54] = vec2(0.612476, 0.705252);
poissonDisk[55] = vec2(-0.578845, -0.768792);
poissonDisk[56] = vec2(-0.772454, -0.090976);
poissonDisk[57] = vec2(0.504440, 0.372295);
poissonDisk[58] = vec2(0.155736, 0.065157);
poissonDisk[59] = vec2(0.391522, 0.849605);
poissonDisk[60] = vec2(-0.620106, -0.328104);
poissonDisk[61] = vec2(0.789239, -0.419965);
poissonDisk[62] = vec2(-0.545396, 0.538133);
poissonDisk[63] = vec2(-0.178564, -0.596057);

`;

const functionDefinitions = `

uniform vec2 lightSize;
uniform float noiseIntensity;
uniform float softness;

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float random(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5;
}

float findBlocker(sampler2D shadowMap, vec4 shadowCoord, vec2 shadowMapSize, vec2 searchSize) {

	${ poissonDefinitions }

	vec2 uv = shadowCoord.xy;
	float thisDepth = shadowCoord.z;

	float avgDepth = 0.0;
	float blockerCount = 0.0;

	for(int i = 0; i < 64; i++) {

		vec2 offset = poissonDisk[i] / shadowMapSize;
		float rand = random(shadowMapSize * shadowCoord.xy) * noiseIntensity;
		offset.x = offset.x * cos(rand) - offset.y * sin(rand);
		offset.y = offset.y * cos(rand) + offset.x * sin(rand);
		offset *= searchSize;

		vec2 newUv = uv + offset;
		float blockerDepth = unpackRGBAToDepth( texture2D(shadowMap, newUv) );

		float isBlocking = step(blockerDepth, thisDepth);
		avgDepth += isBlocking * blockerDepth;
		blockerCount += isBlocking;

	}

	avgDepth /= max(blockerCount, 1.0);
	return avgDepth;

}

float pcfSample(sampler2D shadowMap, vec2 shadowMapSize, vec2 shadowRadius, vec4 shadowCoord) {

	${ poissonDefinitions }

	float count = 1.0;
	float shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );

	for (int i = 0; i < 64; i ++) {

		vec2 offset = poissonDisk[i] / shadowMapSize;
		float rand = random(shadowMapSize * shadowCoord.xy) * noiseIntensity;
		offset.x = offset.x * cos(rand) - offset.y * sin(rand);
		offset.y = offset.y * cos(rand) + offset.x * sin(rand);
		offset *= shadowRadius;

		vec2 suv = shadowCoord.xy + offset;
		shadow += texture2DCompare( shadowMap, suv, shadowCoord.z );
		count ++;

	}

	shadow /= count;

	return shadow;

}
`;

// LIGHT_WIDTH
// LIGHT_HEIGHT
// PCF_SAMPLES
// BLOCKER_SAMPLES

const shadowLogic = `
// vec2 lightSize = vec2(lightWidth, lightHeight);
vec2 searchSize = lightSize * (1.0 - shadowCoord.z) * softness;// * 25.0 * ;
// searchSize = 11150.0 * clamp(shadowCoord.z - 0.02, 1.0, 0.0) / shadowCoord.z;

float dblocker = findBlocker(shadowMap, shadowCoord, shadowMapSize, searchSize);
float dreceiver = shadowCoord.z;
float p = (dreceiver - dblocker) / dblocker;
vec2 penumbra = lightSize * p * softness;
penumbra = max(penumbra, 1.0);

// penumbra = max(penumbra, 0.05);
// penumbra = 1.0 - pow(1.0 - penumbra, 1.1);

shadow = pcfSample(shadowMap, shadowMapSize, penumbra, shadowCoord);
`;


THREE.ShaderChunk.shadowmap_pars_fragment =
	THREE.ShaderChunk.shadowmap_pars_fragment
		.replace( /float getShadow/, t => `${ functionDefinitions }\n${ t }` )
		.replace( /#if defined\( SHADOWMAP_TYPE_PCF \)(.|\n)*?#endif/, shadowLogic );
