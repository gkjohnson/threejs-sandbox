// http://moinmo.in/AccessibleMoin?action=AttachFile&do=view&target=daltonize.py
// http://www.daltonize.org/search/label/Daltonize

// TODO: Do the RGB colors need to be in linear colorspace?
const rgb2lms = new THREE.Matrix3(
	17.8824, 43.5161, 4.11935,
	3.45565, 27.1554, 3.86714,
	0.0299566, 0.184309, 1.46709
);

const lms2rgb = new THREE.Matrix3().getInverse(rgb2lms);
const deuteranopeMat = new THREE.Matrix3(
	1, 0, 0,
	0.494207, 0, 1.24827,
	0, 0, 1
);
const protanopeMat = new THREE.Matrix3(
	0, 2.02344,-2.52581,
	0, 1, 0,
	0, 0, 1
);
const tritanopeMat = new THREE.Matrix3(
	1, 0, 0,
	0, 1, 0,
	-0.395913, 0.801109, 0
);

const tempVec = new THREE.Vector3();

class LMSColor {

	constructor( l, m, s ) {

		this.l = l;
		this.m = m;
		this.s = s;

	}

	getRGB( target ) {

		tempVec.x = this.l;
		tempVec.y = this.m;
		tempVec.z = this.s;
		tempVec.applyMatrix3( lms2rgb );
		target.r = tempVec.x;
		target.g = tempVec.y;
		target.b = tempVec.z;

	}

	fromRGB( r, g, b ) {

		tempVec.x = r;
		tempVec.y = g;
		tempVec.z = b;
		tempVec.applyMatrix3( rgb2lms );
		this.l = tempVec.x;
		this.m = tempVec.y;
		this.s = tempVec.z;

	}

	toDeuteranope() {

		tempVec.x = this.l;
		tempVec.y = this.m;
		tempVec.z = this.s;
		tempVec.applyMatrix3( deuteranopeMat );
		this.l = tempVec.x;
		this.m = tempVec.y;
		this.s = tempVec.z;

	}

	toProtanope() {

		tempVec.x = this.l;
		tempVec.y = this.m;
		tempVec.z = this.s;
		tempVec.applyMatrix3( protanopeMat );
		this.l = tempVec.x;
		this.m = tempVec.y;
		this.s = tempVec.z;

	}

	toTritanope() {

		tempVec.x = this.l;
		tempVec.y = this.m;
		tempVec.z = this.s;
		tempVec.applyMatrix3( tritanopeMat );
		this.l = tempVec.x;
		this.m = tempVec.y;
		this.s = tempVec.z;

	}
}
