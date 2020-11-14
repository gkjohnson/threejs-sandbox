export class HalfEdgeTriangle extends Triangle {

	constructor() {

		super();
		this.index = - 1;
		this.adjacent = [ null, null, null ];

		// Cached (these could be generated as needed for dynamic meshes)
		// compute and cache the local frame from the normal and the first edge
		this.localFrame = new Matrix4();

		// compute the 2d coordinates in the local frame
		this.a2 = new Vector2();
		this.b2 = new Vector2();
		this.b2 = new Vector2();

	}

	intersectEdge( line, target ) {

		// compute the edge index and position that's been intersected

	}

}
