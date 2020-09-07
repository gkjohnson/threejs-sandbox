export class BlueNoiseSamples {

	constructor( size ) {

		this.count = 0;
		this.size = 1
		this.sigma = 0;
		this.radius = 0;
		this.lookupTable = null;
		this.score = null;
		this.binaryPattern = null;

		this.resize( size );
		this.setSigma( 1.5 );

	}

	findIndex( value, func ) {

		// TODO: note that finding the largest void may depend on the score radius not
		// being arbitrarily cut off.
		const { score, binaryPattern } = this;
		let currValue = func( 0, 1 ) === 0 ? Infinity : - Infinity;
		let currIndex = - 1;
		for ( let i = 0, l = binaryPattern.length; i < l; i ++ ) {

			if ( binaryPattern[ i ] !== value ) {

				continue;

			}

			const pScore = score[ i ];
			const winScore = func( pScore, currValue );
			if ( winScore === pScore ) {

				currValue = pScore;
				currIndex = i;

			}

		}

		return currIndex;

	}

	setSigma( sigma ) {

		if ( sigma === this.sigma ) {

			return;

		}

		// generate a radius in which the score will be updated under the
		// assumption that e^-10 is insignificant enough to be the border at
		// which we drop off.
		const radius = ~ ~ ( Math.sqrt( 10 * 2 * ( sigma ** 2 ) ) + 1 );
		const lookupWidth = 2 * radius + 1;
		const lookupTable = new Float32Array( lookupWidth * lookupWidth );
		const sigma2 = sigma * sigma;
		for ( let x = - radius; x <= radius; x ++ ) {

			for ( let y = - radius; y <= radius; y ++ ) {

				const index = ( radius + y ) * lookupWidth + x + radius;
				const dist2 = x * x + y * y;
				lookupTable[ index ] = Math.E ** ( - dist2 / ( 2 * sigma2 ) );

			}

		}

		this.lookupTable = lookupTable;
		this.sigma = sigma;
		this.radius = radius;

	}

	resize( size ) {

		if ( this.size !== size ) {

			this.size = size;
			this.score = new Float32Array( size * size );
			this.binaryPattern = new Uint8Array( size * size );

		}


	}

	invert() {

		const { binaryPattern, score, size } = this;

		score.fill( 0 );

		for ( let i = 0, l = binaryPattern.length; i < l; i ++ ) {

			if ( binaryPattern[ i ] === 0 ) {

				const y = ~ ~ ( i / size );
				const x = i - y * size;
				this.updateScore( x, y, 1 );

			} else {

				binaryPattern[ i ] = 0;

			}

		}

	}

	updateScore( x, y, multiplier ) {

		// TODO: dist can only be a few values so we should be able to make a lookup table
		// and optimize out the sqrt and exponent operations.
		// TODO: As we do this keep track of the highest and lowest scores for the majority
		// and minority points because we'll want to use them soon and it _may_ be faster than
		// iterating over the full array.
		const { size, score, sigma, lookupTable } = this;
		const sigma2 = sigma * sigma;

		// const radius = Math.floor( size / 2 );
		const radius = this.radius;
		const index = y * size + x;
		const lookupWidth = 2 * radius + 1;
		for ( let px = - radius; px <= radius; px ++ ) {

			for ( let py = - radius; py <= radius; py ++ ) {

				// const dist2 = px * px + py * py;
				// const value = Math.E ** ( - dist2 / ( 2 * sigma2 ) );

				const lookupIndex = ( radius + py ) * lookupWidth + px + radius;
				const value = lookupTable[ lookupIndex ];

				let sx = ( x + px );
				sx = sx < 0 ? size + sx : sx % size;

				let sy = ( y + py ) % size;
				sy = sy < 0 ? size + sy : sy % size;

				const sindex = sy * size + sx;
				score[ sindex ] += multiplier * value;

			}

		}

	}

	// TODO:
	// - Use `setPointIndex` here?
	// - Verify we're not inadvertantly removing a point that doesn't exist and vice versa.
	addPointIndex( index ) {

		this.binaryPattern[ index ] = 1;

		const size = this.size;
		const y = ~ ~ ( index / size );
		const x = index - y * size;
		this.updateScore( x, y, 1 );
		this.count ++;

	}

	removePointIndex( index ) {

		this.binaryPattern[ index ] = 0;

		const size = this.size;
		const y = ~ ~ ( index / size );
		const x = index - y * size;
		this.updateScore( x, y, - 1 );
		this.count --;

	}

	copy( source ) {

		this.resize( source.size );
		this.score.set( source.score );
		this.binaryPattern.set( source.binaryPattern );
		this.setSigma( source.sigma );
		this.count = source.count;

	}

}
