# Conditional Lines

![](./images/banner.png)

_<p align="center">Background lines faintly overlaid</p>_

Generalized conditional line shader and geometry generator based on [LDrawLoader](https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/LDrawLoader.js) and inspired by [this thread](https://discourse.threejs.org/t/ldraw-like-edges/17100).

Provides a `OutsideEdgesGeometry` for generating edges based on non-merged edges rather than face normals.

[Demo Here](https://gkjohnson.github.io/threejs-sandbox/conditional-lines/).

## Possible Improvements

- Add support for Line2 objects to display fat lines.
- Generate the conditional lines and "hard" lines in a single pass.
