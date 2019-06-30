// http://moinmo.in/AccessibleMoin?action=AttachFile&do=view&target=daltonize.py
// http://www.daltonize.org/search/label/Daltonize
// http://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
// http://mapeper.github.io/jsColorblindSimulator/

class ColorblindColor extends THREE.Color {}

(function() {

	const deuteranopeMat = new THREE.Matrix3().set(
		0.625, 0.375, 0,
		0.7, 0.3, 0.0,
		0, 0.3, 0.7
	);

	const protanopeMat = new THREE.Matrix3().set(
		0.56667, 0.55833, 0.0,
		0.43333, 0.44167, 0.24167,
		0, 0, 0.75833
	);

	const tritanopeMat = new THREE.Matrix3().set(
		0.95, 0, 0,
		0.05, 0.43333, 0.475,
		0, 0.56667, 0.525
	);

	const tempVec = new THREE.Vector3();

	ColorblindColor.prototype.toDeuteranope = function() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( deuteranopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

	ColorblindColor.prototype.toProtanope = function() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( protanopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

	ColorblindColor.prototype.toTritanope = function() {

		tempVec.x = this.r;
		tempVec.y = this.g;
		tempVec.z = this.b;
		tempVec.applyMatrix3( tritanopeMat );
		this.r = tempVec.x;
		this.g = tempVec.y;
		this.b = tempVec.z;

	}

})();
