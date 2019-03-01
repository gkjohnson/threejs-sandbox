class DiffViewer {

	constructor() {

		const renderer = new THREE.WebGLRenderer();

		this.renderer = renderer;
		this.newScene = null;
		this.oldScene = null;

	}

	render() {

		// set stencil to render 1
		// set new model to render as green
		// render new model

		// disable stencil
		// set new model to render as red with `LESS` depth
		// render old model

		// disable color mask
		// set stencil to render 0
		// set depth function use `EQUAL`
		// render old model

		// set stencil to render 0
		// set stencil to only render where stencil === 0
		// set model to render with gray color
		// render new model

	}

}
