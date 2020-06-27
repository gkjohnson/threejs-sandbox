export class HalfEdgeTriangle {

	constructor() {

		this.index = - 1;
		this.adjacent = [null, null, null];

	}

	getTriangleFromBufferAttribute( positions, triangle ) {

		const { index } = this.index;
		triangle.a.setFromBufferAttribute( positions, index + 0 );
		triangle.b.setFromBufferAttribute( positions, index + 1 );
		triangle.c.setFromBufferAttribute( positions, index + 2 );

	}

}
