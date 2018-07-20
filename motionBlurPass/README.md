# Per-Object Motion Blur Render Pass

A per-object motion blur pass that works with the THREE.RenderComposer class. Works with meshes and skinned meshes by saving the position on the previous frame and smearing between there and the new position. Morph targets and displacement maps are not accounted for.

[![](./docs/image.png)](https://gkjohnson.github.io/threejs-contributions/motionBlurPass/webgl_postprocessing_perobjectmotionblur.html)

[Demo Here!](https://gkjohnson.github.io/threejs-contributions/motionBlurPass/webgl_postprocessing_perobjectmotionblur.html)

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
	// More samples is smoother. This option is only available globally
	// and not overrideable.
	samples: 30,

	// How much to expand the geometry by along the motion vector
	// This can cause cracks in geometry with hard normals
	expand: 1,

	// How intensely to blur the models
	smearIntensity: 1,

	// What the maximum amount of smear is to apply to a model. This is good
	// for limiting smear in fast camera moves or when models are moving and
	// nearly disappear
	maxSmearFactor: 0.05,

	// Whether or not to blur transparent objects
	blurTransparent: false,

	// Whether or not to account for camera motion in the blur
	renderCameraBlur: true
}
```

#### Mesh.motionBlur

All of the options above can be overriden by adding a `motionBlur` overrides object onto the meshes to be rendered.

```js

	var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ transparent: true }));
	mesh.motionBlur = { renderTransparent: true }

```

### Possible Improvements
- Draw multiple interpolated positions of geometry between frames and use that to smear
- Allow for setting the scale of the velocity buffer
- Add dithering / jitter to the smear samples to improve the low sample look
