# Translucent Material

A posteffect that renders translucently with modeled light diffusion, refraction, and absorbtion.

## Notes

- Render front to back depth peeling
- Only apply surface normal refraction based on the top surface normals
- Perform light diffraction based on normals?
- Render 100% transparent object after composite to get surface reflection / sheen / surface shadows
- Use directional light to perform subsurface scattering?
- Manually discard against scene depth
- Understand light absorption behavior -- the object gets deeper more light gets absorbed and it gets darker. Thin objects will transmit all color. Perhaps store total depth in alpha?
	- Instead accumulate the light that should be absorbed clamped to [0, 1] and subtract that from the initial buffer.

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
