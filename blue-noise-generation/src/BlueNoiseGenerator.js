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

		console.time('0.5');
		fillWithOnes( initialSamples, pointCount );
		shuffleArray( initialSamples, this.random );
		console.timeEnd('0.5');
		console.time('1');
		for ( let i = 0, l = initialSamples.length; i < l; i ++ ) {

			if ( initialSamples[ i ] === 1 ) {

				samples.addPointIndex( i );

			}

		}
		console.timeEnd('1')

		// 2. Remove minority point that is in densest cluster and place it in a void.
		console.time('2')
		let iter = 0;
		while ( true ) {

			iter ++;
			const clusterPoint = samples.findIndex( 1, Math.max );
			samples.removePointIndex( clusterPoint );

			const voidPoint = samples.findIndex( 0, Math.min );
			if ( clusterPoint === voidPoint ) {

				samples.addPointIndex( clusterPoint );
				break;

			}

			samples.addPointIndex( voidPoint );

		}
		console.timeEnd('2')

		const ditherArray = new Uint32Array( size * size );

		// 3. PHASE I: Incrementally set the value of the dither array for each progressively
		// less intensely clustered minority point to the number of remaining points down to 0.
		// Remove the minority point after each iteration.
		savedSamples.copy( samples );

		console.time('3')
		let rank;
		rank = samples.count - 1;
		while ( rank >= 0 ) {

			const minIndex = samples.findIndex( 1, Math.max );
			samples.removePointIndex( minIndex );

			ditherArray[ minIndex ] = rank;
			rank --;

		}
		console.timeEnd('3')

		// 4. PHASE II: Do the same thing for the largest voids up to half of the total pixels with
		// the dither array value being set to the number of void points iterated over. Set the pixel
		// to a minority point after each iteration. Track "rank" as remaining points. Use the initial
		// binary pattern.
		console.time('4')
		const totalSize = size * size;
		rank = savedSamples.count;
		while ( rank < totalSize / 2 ) {

			const majIndex = savedSamples.findIndex( 0, Math.min );
			savedSamples.addPointIndex( majIndex );
			ditherArray[ majIndex ] = rank;
			rank ++;

		}
		console.timeEnd('4')

		// 5. PHASE III: Interpret majority points as minority points. Find the most intensely clustered
		// minority point and insert 1. Increment rank for each point inserted and set the dither array
		// value to "rank". Do this until rank reaches the max number of pixels in the grid.
		// TODO: we have to compute the score for each majority point as though it were a minority point.
		// Do we have to? Is there a faster way to do it?
		console.time('4.5')
		savedSamples.invert();
		console.timeEnd('4.5');

		console.time('5');
		while ( rank < totalSize ) {

			const majIndex = savedSamples.findIndex( 1, Math.max );
			savedSamples.removePointIndex( majIndex );
			ditherArray[ majIndex ] = rank;
			rank ++;

		}
		console.timeEnd('5');

		return { data: ditherArray, maxValue: totalSize };

	}

}
