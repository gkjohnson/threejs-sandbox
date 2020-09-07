export class BlueNoiseGenerator {

	constructor() {

		this.random = Math.random;
		this.sigma = 1.5;
		this.size = 256;
		this.majorityPointsRatio = 0.1;

	}
	
	generate() {

		// http://cv.ulichney.com/papers/1993-void-cluster.pdf	
		
		// 1. Random place the minority points.
		
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
