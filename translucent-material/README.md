# Translucent Material

A posteffect that renders translucently with modeled light diffusion, refraction, and absorbtion.

## Notes

- Render front to back depth peeling
- Only apply surface normal refraction based on the top surface normals
- Perform light diffaction based on normals?
- Render 100% transparent object after composite to get surface reflection / sheen / surface shadows
- Use directional light to perform subsurface scattering?
- Manually discard against scene depth
- Understand light absorbtion behavior -- the object gets deeper more light gets absorbed and it gets darker. Thin objects will transmit all color. Perhaps store total depth in alpha?

## References
- https://github.com/mrdoob/three.js/issues/15941
- https://github.com/mrdoob/three.js/issues/15440
- https://discourse.threejs.org/t/depth-peel-and-transparency/5365
- https://github.com/mrdoob/three.js/issues/14049
