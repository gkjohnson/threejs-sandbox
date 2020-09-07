import { shuffleArray, fillWithOnes } from './utils.js';

class BlueNoiseSamples {

	constructor( size ) {
		
		this.size = 1
		this.sigma = 0;
		this.radius = 0;
		this.score = null;
		this.binaryPattern = null;
		
		this.resize( size );
		this.setSigma( 1.5 );

	}
	
	setSigma( sigma ) {
	
		// generate a radius in which the score will be updated under the
		// assumption that e^-10 is insignificant enough to be the border at
		// which we drop off.
		this.sigma = sigma;
		this.radius = ~ ~ ( Math.sqrt( 10 * 2 * ( sigma ** 2 ) ) + 1 );
		
	}
	
	resize( size ) {
		
		if ( this.size !== size ) {
			
			this.size = size;
			this.score = new Float32Array( size * size );
			this.binaryPattern = new Uint8Array( size * size );

		}
		
		
	}
	
	updateScore( x, y, multiplier ) {
		
		// TODO: dist can only be a few values so we should be able to make a lookup table
		// and optimize out the sqrt and exponent operations.
		// TODO: As we do this keep track of the highest and lowest scores for the majority
		// and minority points because we'll want to use them soon and it _may_ be faster than
		// iterating over the full array.
		const { radius, size, score, sigma } = this;
		const sigma2 = sigma * sigma;
		const index = y * size + x;
		for ( let px = - radius; px <= radius; px ++ ) {
			
			for ( let py = - radius; py <= radius; py ++ ) {
			
				const pindex = py * size + px;
				const dist = Math.sqrt( x * x + y * y );
				const dist2 = dist * dist;
				const value = Math.E ** ( - dist2 / ( 2 * sigma2 ) );
				score[ pindex ] += multiplier * value;
				
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

	}

	addPoint( x, y ) {
		
		this.binaryPattern[ y * this.size + x ] = 1;
		this.updateScore( x, y, 1 );

	}

	removePointIndex( index ) {
		
		this.binaryPattern[ index ] = 1;
		const y = ~ ~ ( index / size );
		const x = index - y * size;
		this.updateScore( x, y, 1 );
		
	}

	removePoint( x, y ) {
	
		this.binaryPattern[ y * this.size + x ] = 0;
		this.updateScore( x, y, - 1 );

	}
	
	copy( source ) {

		this.resize( source.size );
		this.score.set( source.score );
		this.binaryPattern.set( source.binaryPattern );

	}

}

export class BlueNoiseGenerator {

	constructor() {

		this.random = Math.random;
		this.sigma = 1.5;
		this.size = 256;
		this.majorityPointsRatio = 0.1;
		
		this.samples = new BlueNoiseSamples( 1 );
		this.savedSamples = BlueNoiseSamples( 1 );

	}
	
	generate() {

		// http://cv.ulichney.com/papers/1993-void-cluster.pdf	
				
		const {
			samples,
			savedSamples,
			sigma,
			majorityPointsRatio,
			size,
		} = this;
		
		samples.resize( size );
		savedSamples.resize( size );
		
		// 1. Random place the minority points.
		const pointCount = Math.floor( size * size * majorityPointsRatio );
		const initialSamples = samples.binaryPattern;
		fillWithOnes( binaryPattern, pointCount );
		shuffleArray( pointCount, this.random );
		
		for ( let i = 0, l = initialSamples.length; i ++ ) {
			
			if ( intialSamples[ i ] === 1 ) {
				
				samples.addPointIndex( i );
				
			}

		}
		
		// 2. Remove minority point that is in densest cluster and place it in a void.
		
		// 3. PHASE I: Incrementally set the value of the dither array for each progressively
		// less intensely clustered minority point to the number of remaining points down to 0.
		// Remove the minority point after each iteration.
		
		// 4. PHASE II: Do the same thing for the largest voids up to half of the total pixels with
		// the dither array value being set to the number of void points iterated over. Set the pixel
		// to a minority point after each iteration. Track "rank" as remaining points. Use the initial
		// binary pattern.
		
		// 5. PHASE III: Interpret majority points as minority points. Find the most intensely clustered
		// minority point and insert 1. Increment rank for each point inserted and set the dither array
		// value to "rank". Do this until rank reaches the max number of pixels in the grid.

	}

}
