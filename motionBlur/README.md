# Motion Blur Render Pass

![](./docs/image.png)

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

### Options

TODO
