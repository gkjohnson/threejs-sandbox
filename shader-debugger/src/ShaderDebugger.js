const _mesh = new Mesh();
class ShaderDebugger {

	get material() {

		return this._material;

	}

	set material( value ) {

		this._material = value;
		this.debugMaterial = value ? value.clone() : value;

	}

	constructor( mesh, material, renderer ) {

		this.material = material;
		this.mesh = mesh;
		this.renderer = renderer;

	}

	updateSymbols() {

		const material  = this._material;
		const debugMaterial = this._debugMaterial;
		const mesh = this.mesh;

		debugMaterial.copy( material );
		debugMaterial.needsUpdate = true;

		debugMaterial.onBeforeCompile = function ( shader ) {

		};

	}

	readPixel() {}

}
