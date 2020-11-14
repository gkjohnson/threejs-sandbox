# Screen-Space Reflections Render Pass

A rough screen space reflections implementation based on [Morgan McGuire's screen space ray tracing article](http://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html) and [Kode80's Unity SSRR implementation](https://github.com/kode80/kode80SSR).


[![](./docs/example.png)](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

_scene with no normal maps, 1px stride, and 1000 steps_

_sponza scene from GLTF 2.0 example models_

[Demo here!](https://gkjohnson.github.io/threejs-sandbox/screenSpaceReflectionsPass/)

## Features

#### Medium Priority
- Add option to disable fade based on distance. With glossy reflections we can progressively take larger and larger steps which let us sample further distances the glossier a surface is. However with fade based on distance glossy sufaces will have to fade at the same rate a sharp surfaces.
- Remove for loop ( unroll )
- Further avoid surfaces intersecting with themselves.
- Fix depth pyramid glossiness when passing behind objects.
- Blur intensity based on roughness (blur rougher surfaces more).
- Weight blur based on roughness similarity.
- Use bicubic filtering for mip map glossiness sampling

#### Low Priority
- Use metalness and roughness values to fade result hit (pack normal xy, metalness, roughness into single buffer)
- Use the normal / depth used for raymarching and compare that the to the current high def fragment in the upscale. The normal and depth in the blur loop body should be from the march uv but using that causes issues.
- Simplify step calculations.
- Understand TODO items in raymarch code -- how are we getting positive values for rayZMin? Why are we getting ray hits where there is no depth with ortho cam?
- Use a depth pyramid map to raymarch
- Use cheap rays for roughness
- Provide a minimum thickness for potentially thin objects?
- Investigate how incidence angle should play a role (Fresnel effect -- is it always relevant? What about for mirrors?)
- Optionally fall back to environment map
- Convert the sample radius for glossy sampling from world space to clip coordinates

## Fixes

### Bugs
- Objects in the close foreground can create incorrect reflections on the floor / further objects (looks like an interpolated sampling issue?)
- "Black" is considered close to the camera at the moment and is also the same as the clear color. So if there's no background elements then the unrendered space will look like it's "close" to the camera and cause intersections.
	- This is complicated because the depths are negated and in the range `[ near, far ]`. Fix this when the depth is changed to use another format later.
- At really glancing angles (especially far back on the sponza floor when moving the camera down) it looks like the rays are not actually hitting the wall in the back. Maybe it's because it hits itself? Or the depth behind it? Lowering the rendertarget and raymarch scale to 0.2 demonstrates this -- it looks like the pixels are hitting themselves

### Possible Optimizations

- Use mip LoDs for normals, color, depth? to blend the pixels
- Add a max loop iteration.
- Add loop unrollfor blur and raymarch.
- Use seperable blur.
- Use stencil mask to prevent raymarching on pixels that have a high roughness.
- Remove if statments.
- Use depth mip chains for raymarching.
- Simplify code.
- Remove type conversion in shaders.
- MRT
- Stop traversal if a ray goes behind a surface but does not hit.
- Perform a reuseable depth prepass to improve performance on all subsequent passes.
- Use explicit mip level fetch.
- Use explict pixel fetch from sample.
- Use WebGL custom mip maps.
- Generate non power of two mip maps

### References

- \* https://github.com/GPUOpen-Effects/FidelityFX-SSSR/blob/master/docs/FFX_SSSR_Technology.pdf

- \* https://lukas-hermanns.info/download/bachelorthesis_ssct_lhermanns.pdf

- http://bitsquid.blogspot.com/2017/08/notes-on-screen-space-hiz-tracing.html

- https://blog.demofox.org/2020/05/10/ray-marching-fog-with-blue-noise/

- https://github.com/haolange/Unity_ScreenSpaceTechStack

- https://github.com/Domenicobrz/WebGL2-Screen-space-reflections

- https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html

- http://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Screen-space%20reflections.pdf

- https://github.com/Unity-Technologies/PostProcessing/blob/v2/PostProcessing/Runtime/Effects/ScreenSpaceReflections.cs

- http://advances.realtimerendering.com/s2015/index.html

#### Godot Implementation

- https://github.com/godotengine/godot/tree/481151be09108a30002ae0a9df118eeddd3987be/servers/rendering/rasterizer_rd/shaders

- https://github.com/godotengine/godot/blob/481151be09108a30002ae0a9df118eeddd3987be/servers/rendering/rasterizer_rd/shaders/screen_space_reflection.glsl

- https://github.com/godotengine/godot/blob/a4e200a47a151ed5ce1627a17ce694048987eadf/servers/rendering/rasterizer_rd/rasterizer_effects_rd.h
