# Screen-Space Reflections Render Pass

A rough screen space reflections implementation based on [Morgan McGuire's screen space ray tracing article](http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html) and [Kode80's Unity SSRR implementation](https://github.com/kode80/kode80SSR).


[![](./docs/example.png)](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

_scene with no normal maps, 1px stride, and 1000 steps_

_sponza scene from GLTF 2.0 example models_

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

## TODO

### Upcoming

#### High Priority
- Check coarser depth map lod based on ray distance.
- Use depth pyramid to raymarch to improve performance, diffuse rough results

#### Medium Priority
- Remove for loop ( unroll )
- Further avoid surfaces intersecting with themselves.
- Add blue noise.

#### Low Priority
- Use metalness and roughness values to fade result hit (pack normal xy, metalness, roughness into single buffer)
- Use the normal / depth used for raymarching and compare that the to the current high def fragment in the upscale. The normal and depth in the blur loop body should be from the march uv but using that causes issues.
- Improve the connected-ness of the reflections to the ground (see bottom of mirror in spheres example) (this happens with high stride because we step first after applying jitter meaning we get no steps near the base of the mirror)
- Simplify step calculations.
- Understand TODO items in raymarch code -- how are we getting positive values for rayZMin? Why are we getting ray hits where there is no depth with ortho cam?

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

- https://blog.demofox.org/2020/05/10/ray-marching-fog-with-blue-noise/

- https://github.com/haolange/Unity_ScreenSpaceTechStack

- https://github.com/Domenicobrz/WebGL2-Screen-space-reflections

- https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html

- http://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Screen-space%20reflections.pdf

- https://github.com/Unity-Technologies/PostProcessing/blob/v2/PostProcessing/Runtime/Effects/ScreenSpaceReflections.cs

#### Godot Implementation

- https://github.com/godotengine/godot/tree/481151be09108a30002ae0a9df118eeddd3987be/servers/rendering/rasterizer_rd/shaders

- https://github.com/godotengine/godot/blob/481151be09108a30002ae0a9df118eeddd3987be/servers/rendering/rasterizer_rd/shaders/screen_space_reflection.glsl

- https://github.com/godotengine/godot/blob/a4e200a47a151ed5ce1627a17ce694048987eadf/servers/rendering/rasterizer_rd/rasterizer_effects_rd.h
