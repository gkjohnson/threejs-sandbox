import { shuffleArray, fillWithOnes } from './utils.js';
import { BlueNoiseSamples } from './BlueNoiseSamples.js';

export class BlueNoiseGenerator {

	constructor() {

		this.random = Math.random;
		this.sigma = 1.5;
		this.size = 64;
		this.majorityPointsRatio = 0.1;

		this.samples = new BlueNoiseSamples( 1 );
		this.savedSamples = new BlueNoiseSamples( 1 );

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
		fillWithOnes( initialSamples, pointCount );
		shuffleArray( pointCount, this.random );

		for ( let i = 0, l = initialSamples.length; i < l; i ++ ) {

			if ( initialSamples[ i ] === 1 ) {

				samples.addPointIndex( i );

			}

		}


		console.log(1);

		// 2. Remove minority point that is in densest cluster and place it in a void.
		while ( true ) {

			const minPoint = samples.findIndex( 1, Math.max );
			samples.removePointIndex( minPoint );

			const majPoint = samples.findIndex( 0, Math.min );
			if ( minPoint === majPoint ) {

				break;

			}

			samples.addPointIndex( majPoint );

		}

		console.log(2);
		return;

		const ditherArray = new Uint32Array( size * size );

		// 3. PHASE I: Incrementally set the value of the dither array for each progressively
		// less intensely clustered minority point to the number of remaining points down to 0.
		// Remove the minority point after each iteration.
		savedSamples.copy( samples );

		let rank;
		rank = samples.count - 1;
		while ( rank > 0 ) {

			const minIndex = samples.findIndex( 1, Math.max );
			samples.removePointIndex( minIndex );

			ditherArray[ minIndex ] = rank;
			rank --;

		}

		// 4. PHASE II: Do the same thing for the largest voids up to half of the total pixels with
		// the dither array value being set to the number of void points iterated over. Set the pixel
		// to a minority point after each iteration. Track "rank" as remaining points. Use the initial
		// binary pattern.
		const totalSize = size * size;
		rank = savedSamples.count;
		while ( rank < totalSize / 2 ) {

			const majIndex = savedSamples.findIndex( 0, Math.min );
			savedSamples.addSamplePoint( majIndex );
			ditherArray[ majIndex ] = rank;
			rank ++;

		}

		// 5. PHASE III: Interpret majority points as minority points. Find the most intensely clustered
		// minority point and insert 1. Increment rank for each point inserted and set the dither array
		// value to "rank". Do this until rank reaches the max number of pixels in the grid.
		// TODO: we have to compute the score for each majority point as though it were a minority point.
		// Do we have to? Is there a faster way to do it?
		savedSamples.invert();
		while ( rank < totalSize ) {

			const majIndex = savedSamples.findIndex( 1, Math.max );
			savedSamples.removeSamplePoint( majIndex );
			ditherArray[ majIndex ] = rank;
			rank ++;

		}

		return { data: ditherArray, maxValue: totalSize };

	}

}
