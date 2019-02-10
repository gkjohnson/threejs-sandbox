# Accumulated Volume Lights

Defines a light based on a mesh and renders by moving a point light along the surface of the mesh and accumulating the result over multiple frames.

## TODO
- At the moment the light is always positioned at the center of each triangle even when it is iterating ove the same triangle a second time. It would be best to evenly spread out positions across the surface of the triangle on subsequent iterations.
- Jitter the camera over time to render AA.
- Add an interesting mesh model for the light.