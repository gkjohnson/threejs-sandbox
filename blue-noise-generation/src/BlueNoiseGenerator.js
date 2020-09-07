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

		console.time( 'Array Initialization' );
		fillWithOnes( initialSamples, pointCount );
		shuffleArray( initialSamples, this.random );
		console.timeEnd('Array Initialization');

		console.time( 'Score Initialization' );
		for ( let i = 0, l = initialSamples.length; i < l; i ++ ) {

			if ( initialSamples[ i ] === 1 ) {

				samples.addPointIndex( i );

			}

		}
		console.timeEnd( 'Score Initialization' );

		// 2. Remove minority point that is in densest cluster and place it in a void.
		console.time( 'Point Rearrangement' );
		while ( true ) {

			const clusterIndex = samples.findCluster();
			samples.removePointIndex( clusterIndex );

			const voidIndex = samples.findVoid();
			if ( clusterIndex === voidIndex ) {

				samples.addPointIndex( clusterIndex );
				break;

			}

			samples.addPointIndex( voidIndex );

		}
		console.timeEnd( 'Point Rearrangement' );


		// 3. PHASE I: Incrementally set the value of the dither array for each progressively
		// less intensely clustered minority point to the number of remaining points down to 0.
		// Remove the minority point after each iteration.
		const ditherArray = new Uint32Array( size * size );
		savedSamples.copy( samples );

		console.time( 'Dither Array Phase 1' );
		let rank;
		rank = samples.count - 1;
		while ( rank >= 0 ) {

			const clusterIndex = samples.findCluster();
			samples.removePointIndex( clusterIndex );

			ditherArray[ clusterIndex ] = rank;
			rank --;

		}
		console.timeEnd( 'Dither Array Phase 1' );

		// 4. PHASE II: Do the same thing for the largest voids up to half of the total pixels with
		// the dither array value being set to the number of void points iterated over. Set the pixel
		// to a minority point after each iteration. Track "rank" as remaining points. Use the initial
		// binary pattern.
		console.time( 'Dither Array Phase 2' );
		const totalSize = size * size;
		rank = savedSamples.count;
		while ( rank < totalSize / 2 ) {

			const voidIndex = savedSamples.findVoid();
			savedSamples.addPointIndex( voidIndex );
			ditherArray[ voidIndex ] = rank;
			rank ++;

		}
		console.timeEnd( 'Dither Array Phase 2' );

		// 5. PHASE III: Interpret majority points as minority points. Find the most intensely clustered
		// minority point and insert 1. Increment rank for each point inserted and set the dither array
		// value to "rank". Do this until rank reaches the max number of pixels in the grid.
		// TODO: we have to compute the score for each majority point as though it were a minority point.
		// Do we have to? Is there a faster way to do it?
		console.time( 'Samples Invert' );
		savedSamples.invert();
		console.timeEnd( 'Samples Invert' );

		console.time( 'Dither Array Phase 3' );
		while ( rank < totalSize ) {

			const clusterIndex = savedSamples.findCluster();
			savedSamples.removePointIndex( clusterIndex );
			ditherArray[ clusterIndex ] = rank;
			rank ++;

		}
		console.timeEnd( 'Dither Array Phase 3' );

		return { data: ditherArray, maxValue: totalSize };

	}

}
