// structure representing a point on the surface of the half edge structure
export class HalfEdgePoint {

	constructor() {

		// the point in space
		this.point = new Vector3();

		// the triangle it's on right now
		this.index = - 1;

	}

}
