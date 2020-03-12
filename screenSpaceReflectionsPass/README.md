# Screen-Space Reflections Render Pass

A rough screen space reflections implementation based on [Morgan McGuire's screen space ray tracing article](http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html) and [Kode80's Unity SSRR implementation](https://github.com/kode80/kode80SSR).


[![](./docs/example.png)](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

_sponza scene from GLTF 2.0 example models_

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

## Options
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

#### .intensity

```js
intensity : Number
```

The intensity of the reflection.

#### .renderTargetScale

```js
renderTargetScale : Number
```

#### .jitter

```js
jitter : Number
```

## TODO

- Set up a debug scene with mirror surfaces for testing

### Bugs
- Improve the connected-ness of the reflections to the ground.
- Objects in the close foreground can create incorrect reflections on the floor / further objects (looks like an interpolated sampling issue?)
- Normals don't seem to be correct. Skewed wall on left causes stretch vase. The depth buffer could also be the culprit here with banding
	- The banding is likely from the GammaCorrection shader and not loss of precision.
- For some reason where there are gaps ray marching still seems to occur. Maybe because the case of `F      B     F` (where F is front face is B is back face) is not handled. This is apparent in the spheres scene.
- "Black" is considered close to the camera at the moment and is also the same as the clear color. So if there's no background elements then the unrendered space will look like it's "close" to the camera and cause intersections.
	- This is complicated because the depths are negated and in the range `[ near, far ]`. Fix this when the depth is changed to use another format later.

### Features

- Optionally fall back to environment map
- Understand how roughness and metalness affect the blending model
- Blur output based on roughness and ray distance
- Use a depth pyramid map to raymarch
- Use cheap rays for roughness
- Support animations
- Fade as we near the end of the ray
- Fade as the ray nears the edge of the buffer
- Avoid rendering the same data twice (reuse depth buffer from prior renders, other effects)
- Separate the color resolve from raymarch hit so color resolve can happen in higher resolution while marching happens in a lower one.
- Use a different jitter technique such as Halton or Poisson disks.
- Understand how to render depth target mip pyramid.
- Allow for setting distance / normal buffer sizes separately from the march buffer

### References

-  http://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Screen-space%20reflections.pdf
