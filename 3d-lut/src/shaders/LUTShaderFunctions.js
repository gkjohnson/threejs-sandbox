export const lutShaderFunctions = /* glsl */`

	vec3 lutLookup( sampler2D tex, float size, vec3 rgb ) {

		// clamp the sample in by half a pixel to avoid interpolation
		// artifacts between slices laid out next to each other.
		float halfPixelWidth = 0.5 / size;
		rgb.rg = clamp( rgb.rg, halfPixelWidth, 1.0 - halfPixelWidth );

		// green offset into a LUT layer
		float gOffset = rgb.g / size;
		vec2 uv1 = vec2( rgb.r, gOffset );
		vec2 uv2 = vec2( rgb.r, gOffset );

		// adjust b slice offset
		float bNormalized = size * rgb.b;
		float bSlice = min( floor( size * rgb.b ), size - 1.0 );
		float bMix = ( bNormalized - bSlice ) / size;

		// get the first lut slice and then the one to interpolate to
		float b1 = bSlice / size;
		float b2 = ( bSlice + 1.0 ) / size;

		uv1.y += b1;
		uv2.y += b2;

		vec3 sample1 = texture2D( tex, uv1 ).rgb;
		vec3 sample2 = texture2D( tex, uv2 ).rgb;

		return mix( sample1, sample2, bMix );

	}

`;
