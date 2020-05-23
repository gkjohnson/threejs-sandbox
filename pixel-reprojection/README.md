# Pixel Reprojection

Example demonstrating pixel reprojection from a previous frame using velocity buffers.

[Demo here](https://gkjohnson.github.io/threejs-sandbox/pixel-reprojection/)

## TODO

- Fix velocity buffer in motion blur pass
- Fix discarded depth when zooming in
- Adjust depth comparison epsilon based on distance to camera -- changes "thickness" of depth buffer
- Add jitter
- use multiple samples
- See Insides [TRAA](https://github.com/playdeadgames/temporal/blob/master/Assets/Shaders/TemporalReprojection.shader example)
