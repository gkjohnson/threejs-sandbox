export const sampleFunctions = /* glsl */`

	// Without original size argument
	vec4 packedTexture2DLOD( sampler2D texture, vec2 uv, int level ) {

		float targetRatio = 1.0 / pow( 2.0, float( level ) );
		float startY = targetRatio;
		float originalWidth = 2.0 / 3.0;

		vec2 scaledDimensions = vec2( originalWidth * targetRatio, targetRatio );
		vec2 offset = vec2(
			level > 0 ? originalWidth : 0.0,
			level > 0 ? startY : 0.0
		);

		vec2 samplePoint = mix( offset, offset + scaledDimensions, uv );
		return texture2D( texture, samplePoint );

	}

	vec4 packedTexture2DLOD( sampler2D texture, vec2 uv, float level ) {

		float ratio = mod( level, 1.0 );
		int minLevel = int( floor( level ) );
		int maxLevel = int( ceil( level ) );

		return mix( packedTexture2DLOD( texture, uv, minLevel ), packedTexture2DLOD( texture, uv, maxLevel ), ratio );

	}

	// With original size argument
	vec4 packedTexture2DLOD( sampler2D texture, vec2 uv, int level, vec2 originalSize ) {

		float maxLevel = min( floor( log2( originalSize.x ) ), floor( log2( originalSize.y ) ) );
		level = int( min( float( level ), maxLevel ) );

		// use inverse pow of 2 to simulate right bit shift operator
		vec2 currentPixelDimensions = floor( originalSize / pow( 2.0, float( level ) ) );
		vec2 targetRatio = currentPixelDimensions / originalSize;
		float originalWidth = ( originalSize / floor( originalSize * 1.5 ) ).x;

		float startY = targetRatio.y;
		vec2 scaledDimensions = vec2( originalWidth * targetRatio.x, targetRatio.y );
		vec2 offset = vec2(
			level > 0 ? originalWidth : 0.0,
			level > 0 ? startY : 0.0
		);

		vec2 samplePoint = mix( offset, offset + scaledDimensions, uv );
		return texture2D( texture, samplePoint );

	}

	vec4 packedTexture2DLOD( sampler2D texture, vec2 uv, float level, vec2 originalSize ) {

		float ratio = mod( level, 1.0 );
		int minLevel = int( floor( level ) );
		int maxLevel = int( ceil( level ) );

		return mix(
			packedTexture2DLOD( texture, uv, minLevel, originalSize ),
			packedTexture2DLOD( texture, uv, maxLevel, originalSize ),
			ratio
		);

	}

`;
