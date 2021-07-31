// http://moinmo.in/AccessibleMoin?action=AttachFile&do=view&target=daltonize.py
// http://www.daltonize.org/search/label/Daltonize
// http://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
// http://mapeper.github.io/jsColorblindSimulator/

import { Vector3, Matrix3, Color } from '//cdn.skypack.dev/three@0.114.0/build/three.module.js';

const deuteranopeMat = new Matrix3().set(
	0.625, 0.375, 0,
	0.7, 0.3, 0.0,
	0, 0.3, 0.7
);

const protanopeMat = new Matrix3().set(
	0.56667, 0.55833, 0.0,
	0.43333, 0.44167, 0.24167,
	0, 0, 0.75833
);

const tritanopeMat = new Matrix3().set(
	0.95, 0, 0,
	0.05, 0.43333, 0.475,
	0, 0.56667, 0.525
);

const tempVec = new Vector3();

export class ColorBlindColor extends Color {

	toDeuteranope() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( deuteranopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

	toProtanope() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( protanopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

	toTritanope() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( tritanopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

}
