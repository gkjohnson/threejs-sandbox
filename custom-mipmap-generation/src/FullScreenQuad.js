import { OrthographicCamera, PlaneBufferGeometry, Mesh } from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';

export class FullScreenQuad {

	get camera() {

		return this._camera;

	}

	get material() {

		return this._mesh.material;

	}

	set material( value ) {

		this._mesh.material = value;

	}

	constructor( material ) {

		const camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		const geometry = new PlaneBufferGeometry( 2, 2 );

		this._mesh = new Mesh( geometry, material );
		this._camera = camera;

	}

	dispose() {

		this._mesh.geometry.dispose();

	}

	render( renderer ) {

		renderer.render( this._mesh, this._camera );

	}

}
