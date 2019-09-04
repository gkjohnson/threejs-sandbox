const {
	WebGLRenderTarget,
	Mesh,
	DepthFormat,
	Vector2,
	Scene,
	MeshDepthMaterial,
	Camera,
	BackSide,
} = THREE;

const renderTarget = new WebGLRenderTarget();
renderTarget.format = DepthFormat;

const resolution = new Vector2();
const scene = new Scene();
const depthMat = new MeshDepthMaterial( { side: BackSide } );
const mesh = new Mesh( null, new MeshDepthMaterial());
const camera = new Camera();
scene.add( mesh );

class TranslucentMesh extends Mesh {

	onBeforeRender( renderer, cam ) {

		const geometry = this.geometry;
		const pr = renderer.getPixelRatio();

		renderer.getSize( resolution );
		renderTarget.setSize( resolution.x * pr, resolution.y * pr );

		camera.position.copy( cam.position );
		camera.rotation.copy( cam.rotation );
		camera.projectionMatrix.copy( cam.projectionMatrix );
		camera.projectionMatrixInverse.copy( cam.projectionMatrixInverse );

		mesh.geometry = geometry;

		const currRt = renderer.getRenderTarget();
		renderer.setRenderTarget( renderTarget );
		renderer.render( scene, camera );
		renderer.setRenderTarget( currRt );

		this.material.uniforms.depthTexture.value = renderTarget;

		// render geometry to another linear depth buffer
		// assume a single group / material
		// copy current render
		// render using normals to bend and transparency to model absorbed color
		// another value for ior and dispersion
	}

	onAfterRender() {

		this.material.uniforms.depthTexture.value = null;

	}
}
