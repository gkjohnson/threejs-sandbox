# Screen-Space Reflections Render Pass

A rough screen space reflections implementation based on [Morgan McGuire's screen space ray tracing article](http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html) and [Kode80's Unity SSRR implementation](https://github.com/kode80/kode80SSR).


[![](./docs/example.png)](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

_sponza scene from GLTF 2.0 example models_

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

# API

## SSRRPass

_extends Pass_

### .stride

```js
stride : Number
```

The number of screen space pixels to step over per iteration in the down sampled depth texture.

### .steps

```js
steps : Number
```

The number of steps to take along the cast ray.

### .binarySearchSteps

```js
binarySearchSteps : Number
```

The number of extra iterations to take to search for the intersected surface.

### .intensity

```js
intensity : Number
```

The intensity of the reflection.

### .renderTargetScale

```js
renderTargetScale : Number
```

### .jitter

```js
jitter : Number
```

### .constructor

```js
constructor( scene : Scene, camera : Camera, options : Object )
```

## TODO

### Upcoming

- Depth / normal aware upscale / blur
- Improve the connected-ness of the reflections to the ground (see bottom of mirror in spheres example)
- Fix reflections of non retrieved hits. At glancing angles the unrendered background is hit and a color sample is taken (see helmet scene).
- Look into a different jitter technique
- Use metalness and roughness values to fade result hit (pack normal xy, metalness, roughness into single buffer)
- Use depth pyramid to raymarch to improve performance, diffuse rough results
- Provide jitter adjustment for multiple frames
- Test orthographic camera

### Bugs
- Improve the connected-ness of the reflections to the ground.
- Objects in the close foreground can create incorrect reflections on the floor / further objects (looks like an interpolated sampling issue?)
- "Black" is considered close to the camera at the moment and is also the same as the clear color. So if there's no background elements then the unrendered space will look like it's "close" to the camera and cause intersections.
	- This is complicated because the depths are negated and in the range `[ near, far ]`. Fix this when the depth is changed to use another format later.
- At really glancing angles (especially far back on the sponza floor when moving the camera down) it looks like the rays are not actually hitting the wall in the back. Maybe it's because it hits itself? Or the depth behind it? Lowering the rendertarget and raymarch scale to 0.2 demonstrates this -- it looks like the pixels are hitting themselves

### Features

- Use a depth pyramid map to raymarch
- Use cheap rays for roughness
- Resolve color using sibling pixels to improve detail. Should ray direction affect this? Should the values be flipped?
- Use a different jitter technique such as Halton or Poisson disks -- `rand( gl_FragCoord )` works too.
- Understand how to render depth target mip pyramid.
- Use mip LoDs for normals, color, depth? to blend the pixels
- Provide a minimum thickness for potentially thin objects?
- Add alpha test clipping to the pass shaders so the leaves on the planters look correct
- Add spatial denoising blur
- Perform a reuseable depth prepass to improve performance on all subsequent passes.
- Add a max loop iteration and unroll loop to see if performance improves.

### Stretch

- Investigate how incidence angle should play a role
- Test orthographic camera
- Avoid rendering the same data twice (reuse depth buffer from prior renders, other effects)
- Support animations
- Improve rendertarget memory footprint.
- See if we can improve the look of rendering using thickness -- some thin surfaces are missed
- Optionally fall back to environment map
- Understand how roughness and metalness affect the blending model -- reference how environment maps are sampled and applied

### References

- https://github.com/haolange/Unity_ScreenSpaceTechStack

- https://github.com/Domenicobrz/WebGL2-Screen-space-reflections

- https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html

- http://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Screen-space%20reflections.pdf

- https://github.com/Unity-Technologies/PostProcessing/blob/v2/PostProcessing/Runtime/Effects/ScreenSpaceReflections.cs
