export class TranslucentObjectPass {

	constructor( scene, camera ) {

		this.objects = [];
		this.scene = scene;
		this.camera = camera;
		this.layers = 1;

		// color buffer to accumulate in to
		// intermediate front depth buffer to render in to
		// intermediate back depth buffer to render in to

	}

	setSize( width, height ) {

	}

	dispose() {

	}

	render( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		// NOTE: 3d objects should not penetrate

		const layers = this.layers;

		for ( let i = 0; i < layers; i ++ ) {

			// render front faces into depth buffer
			// manually test against rest of the scene depth

			// render backface into color of a new buffer underneath the current display
			// render dpeth into a depth buffer
			// manually test against rest of the scene depth. Use closest depth of the two

		}

		// composite the color buffer into the read buffer
		// using the normal sample perform refraction a sample the readbuffer
		// use mipmap to simulate diffusion
		// use wavelength ior diffraction
		// render a fully translucent pass on top to emulate the surface treatment
		// render each object with depth here

		// Render back faces first to model internal reflection / gem stone qualities?

	}

}
