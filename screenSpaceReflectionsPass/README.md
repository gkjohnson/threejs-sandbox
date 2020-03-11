# Screen-Space Reflections Render Pass

A rough screen space reflections implementation based on [Morgan McGuire's screen space ray tracing article](http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html) and [Kode80's Unity SSRR implementation](https://github.com/kode80/kode80SSR).


[![](./docs/example.png)](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

_sponza scene from GLTF 2.0 example models_

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

## Options
#### stride
The number of screen space pixels to step over per iteration in the down sampled depth texture.

#### steps
The number of steps to take along the cast ray.

#### binarySearchSteps
The number of extra iterations to take to search for the intersected surface.

#### intensity
The intensity of the reflection.

#### renderTargetScale


## TODO

### Bugs
- Improve the connected-ness of the reflections to the ground.
- Objects in the close foreground can create incorrect reflections on the floor / further objects (looks like an interpolated sampling issue?)
- Objects with zero thickness create incorrect stretched reflections
- Normals don't seem to be correct. Skewed wall on left causes stretch vase. The depth buffer could also be the culprit here.

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

### References

-  http://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Screen-space%20reflections.pdf
