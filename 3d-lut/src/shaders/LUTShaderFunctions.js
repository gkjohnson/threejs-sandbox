export const lutShaderFunctions = /* glsl */`

	vec3 lutLookup( sampler2D texture, float size, vec3 rgb ) {

		rgb = clamp( rgb, 0.0, 1.0 );

		float pixelWidth = size;
		float pixelHeight = size * size;
		float alignedSize = ( size - 1.0 ) / size ;
		vec2 halfPixelSize = vec2( 0.5 / pixelWidth, 0.5 / pixelHeight );

		// prep the red and green values
		float gOffset = rgb.g / size;
		vec2 uv1 = vec2( rgb.r, gOffset );
		uv1 *= alignedSize;
		uv1 += vec2( halfPixelSize );

		vec2 uv2 = vec2( rgb.r, gOffset );
		uv2 *= alignedSize;
		uv2 += vec2( halfPixelSize );

		// adjust b slice offset
		float bNormalized = size * rgb.b;
		float bSlice = min( floor( size * rgb.b ), size - 1.0 );
		float bMix = ( bNormalized - bSlice ) / size;

		float b1 = bSlice / size;
		float b2 = ( bSlice + 1.0 ) / size;

		uv1.y += b1;
		uv2.y += b2;

		vec3 sample1 = texture2D( texture, uv1 ).rgb;
		vec3 sample2 = texture2D( texture, uv2 ).rgb;

		return mix( sample1, sample2, bMix );

	}

`;
