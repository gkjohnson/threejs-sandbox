# Translucent Material

A posteffect that renders translucently with modeled light diffusion, refraction, and absorbtion.

[Demo Here](https://gkjohnson.github.io/threejs-sandbox/translucent-material/index.html)

## TODO

- normal pass + refraction / Abbe dispersion
- diffusion
- fade to solid surface

## Possible Improvements

- Make it physically based
- Test with multiple meshes
- Subsurface scattering
- Jitter sampling for blur
- Blur depth accumulation
- Shadows

## Notes

- Render front to back depth peeling
- Only apply surface normal refraction based on the top surface normals
- Perform light diffraction based on normals?
- Render 100% transparent object after composite to get surface reflection / sheen / surface shadows
- Use directional light to perform subsurface scattering?
- Manually discard against scene depth
- Understand light absorption behavior -- the object gets deeper more light gets absorbed and it gets darker. Thin objects will transmit all color. Perhaps store total depth in alpha? Or store amount of light absorbed by accumulating and blending 1 - base color.
	- Instead accumulate the light that should be absorbed clamped to [0, 1] and subtract that from the initial buffer.
- Possibly we don't need an alpha channel for the accumulation buffer.

## Limitations

- Objects cannot penetrate.
- Refracted normal does not accumulate (does not refract into transparent object behind)

## Fields

- `transmissionDispersionAbbe`
- `transmissionIOR`
- `transmissionFactor`
- `trasmissionScatter`

## References

- https://docs.arnoldrenderer.com/display/A5AFMUG/Transmission
- http://wili.cc/research/translucency/hftrans.pdf
- https://github.com/mrdoob/three.js/issues/15941
- https://github.com/mrdoob/three.js/issues/15440
- https://discourse.threejs.org/t/depth-peel-and-transparency/5365
- https://github.com/mrdoob/three.js/issues/14049

### Other

- https://www.cs.umd.edu/gvil/papers/hao_tog04.pdf
- https://research.nvidia.com/sites/default/files/pubs/2017-03_Phenomenological-Transparency/McGuire2017Transparency.pdf
