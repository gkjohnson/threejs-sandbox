# Accumulated Volume Lights

Defines a light based on a mesh and renders by moving a point light along the surface of the mesh and accumulating the result over multiple frames.

[Demo Here!](https://gkjohnson.github.io/threejs-sandbox/volume-lights/)

## TODO
- The point light is always positioned at the center of each triangle even when it is iterating over the same triangle a second time. It would be best to evenly spread out positions across the surface of the triangle on subsequent iterations.
- Create an interesting scene.
- Add velocity buffer to reproject existing accumulated effects.
- Add screen space reflections.
- Support emissive materials.
- Step evenly throughout the index array so the light positions are likely more evenly spread out.
