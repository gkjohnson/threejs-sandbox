# SDF Raymarching Anti Aliasing

Experiments in antialiasing opaque raymarched SDF shapes.

_in progress_

## TODO

- See if we can come up with a way to support both SDF shapes and non-SDF raymarched shapes.
- Provide silhouette AA.
- Provide internal-overlap AA.

### Silhouette AA

- Can be done using alpha-to-coverage and taking the fwidth of the opacity.
- "Discarded" pixels need to have a coherent color so we don't get a "halo" effect. Or the AA could just apply by eating into the existing silhouette.

### Internal AA

- Cannot call derivative functions within the raymarch loop because steps are not guaranteed to be coherent across sibling pixels.
- Seems occur at intersecting shapes or depth disparities of a single convex shape.
- AA could be achieved by checking depth or march count differences at the end of the loop using derivatives.
- Just use final color as derivative to AA?
