# SDF Raymarching Anti Aliasing

Experiments in antialiasing opaque raymarched SDF shapes.

_in progress_

## TODO

- See if we can come up with a way to support both SDF shapes and non-SDF raymarched shapes.
- Add option for testing all AA approaches.
- Use GPU timer to test performance of all performances.
- Use basic metaball SDF for demo.
- Add visualization for step count.
- https://iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm

## Approach 1

- At any given step compute the width of the pixel given the camera perspective.
- Compute the color / alpha contribution of the fragment by mapping the range [+0.5 * px, -0.5 * px] to [0, 1] and accumulate color / opacity.
- if opacity gets near 1 end the iteration.
- For silhouettes return opacity to use alpha to coverage.

## Approach 2

- Sample the SDF multiple times using a subpixel jitter and blend.
- Use alpha to coverage for silhouette aa.

## Approach 3

- fwidth and dfdx / dfdy cannot be used in the loop.
- if a fragment is "hit" create a manual fwidth / derivative functions by manually sampling a neighboring x / y pixel.
- the alpha contribution for the pixel is computed via `alpha = smoothstep( - fw, fw, sample );`
- May just be a more complicated version of approach 1. 

