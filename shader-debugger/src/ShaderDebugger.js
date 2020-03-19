import { Mesh, Scene } from '//unpkg.com/three@0.114.0/build/three.module.js';
import { parseVariables } from './utils.js';

const _mesh = new Mesh();
const _scene = new Scene();
_scene.add( _mesh );
export class ShaderDebugger {

	get material() {

		return this._material;

	}

	set material( value ) {

		this._material = value;
		this._debugMaterial = value ? value.clone() : value;

	}

	constructor( camera, mesh, material, renderer ) {

		this.camera = camera;
		this.material = material;
		this.mesh = mesh;
		this.renderer = renderer;

	}

	updateSymbols() {

		const material  = this._material;
		const debugMaterial = this._debugMaterial;
		const mesh = this.mesh;
		const camera = this.camera;
		const renderer = this.renderer;

		const vertexVars = parseVariables( material.vertexShader );
		const fragmentVars = parseVariables( material.fragmentShader );

	}

	readPixel() {}

}
