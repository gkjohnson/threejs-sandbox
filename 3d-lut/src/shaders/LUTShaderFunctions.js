export const lutShaderFunctions = /* glsl */`

	vec3 lutLookup( sampler2D texture, float size, vec3 rgb ) {

		float bOffset = size * rgb.b;
		float bMix = mod( bOffset, size );
		float b1 = floor( bOffset ) / size;
		float b2 = ceil( bOffset ) / size;

		float gOffset = rgb.g / size;
		vec2 uv1 = vec2( rgb.r, gOffset );
		vec2 uv2 = vec2( rgb.r, gOffset );

		float alignedSize = ( size - 1.0 / size );
		float halfPixelSize = 0.5 / size;
		uv1 *= alignedSize;
		uv1 += vec2( halfPixelSize );
		uv1.y += b1;

		uv2 *= alignedSize;
		uv2 += vec2( halfPixelSize );
		uv2.y += b2;

		vec3 sample1 = texture2D( texture, uv1 ).rgb;
		vec3 sample2 = texture2D( texture, uv2 ).rgb;

		return mix( sample1, sample2, bMix );

	}

`;
