# Per-Object Motion Blur Render Pass

A per-object motion blur pass that works with the THREE.RenderComposer class. Works with meshes and skinned meshes by saving the position on the previous frame and smearing between there and the new position. Morph targets and displacement maps are not accounted for.

[![](./docs/image.png)](https://gkjohnson.github.io/threejs-contributions/motionBlur/index.html)

[Demo Here!](https://gkjohnson.github.io/threejs-contributions/motionBlur/index.html)

### Use

```js

// ... set up scene, camera, renderer...

var renderScene = new THREE.RenderPass( scene, camera );
var motionPass = new THREE.MotionBlurPass( scene, camera, options );

var composer = new THREE.EffectComposer( renderer );
composer.setSize( window.innerWidth, window.innerHeight );
composer.addPass( renderScene );
composer.addPass( motionPass );
motionPass.renderToScreen = true;

// ...

function render() {

	composer.render();
	requestAnimationFrame( () => render );

}
render();

```

### API

#### Options

The set of options that can be passed to the MotionBlurPass constructor. These can also be changed by modifying them on the MotionBlurPass instance itself.

```js
{
	// How many steps to samples to take when smearing the motion blur
	// More samples is smoother
	blurSamples: 30,

	// How much to expand the geometry by along the motion vector
	// This can cause cracks in geometry with hard normals
	expand: 1,

	// How intensely to blur the models
	intensity: 1,

	// Whether or not to blur transparent objects
	blurTransparent: false,

	// Whenter or not to account for camera motion in the blur
	renderCameraBlur: true
}
```

#### Mesh.motionBlur

All of the options above can be overriden by adding a `motionBlur` overrides object onto the meshes to be rendered.

```js

	var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ transparent: true }));
	mesh.motionBlur = { renderTransparent: true }

```

