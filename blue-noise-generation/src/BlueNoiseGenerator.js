import { shuffleArray, fillWithOnes } from './utils.js';
import { BlueNoiseSamples } from './BlueNoiseSamples.js';

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
		samples.setSigma( sigma );
		savedSamples.resize( size );
		savedSamples.setSigma( sigma );
		
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
		while ( true ) {
			
			const minPoint = samples.find( 1, Math.max );
			const majPoint = samples.find( 0, Math.min );
			
			if ( minPoint === majPoint ) {
				
				break;
				
			}
			
			samples.removePointIndex( minPoint );
			samples.addPointIndex( majPoint );
			
		}
		
		
		// 3. PHASE I: Incrementally set the value of the dither array for each progressively
		// less intensely clustered minority point to the number of remaining points down to 0.
		// Remove the minority point after each iteration.
		savedSamples.copy( samples );
		
		// 4. PHASE II: Do the same thing for the largest voids up to half of the total pixels with
		// the dither array value being set to the number of void points iterated over. Set the pixel
		// to a minority point after each iteration. Track "rank" as remaining points. Use the initial
		// binary pattern.
		
		// 5. PHASE III: Interpret majority points as minority points. Find the most intensely clustered
		// minority point and insert 1. Increment rank for each point inserted and set the dither array
		// value to "rank". Do this until rank reaches the max number of pixels in the grid.

	}

}
