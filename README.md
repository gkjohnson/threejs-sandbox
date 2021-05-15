# threejs-sandbox

[![build](https://img.shields.io/github/workflow/status/gkjohnson/threejs-sandbox/Node.js%20CI?style=flat-square&label=build)](https://github.com/gkjohnson/threejs-sandbox/actions)

Set of experiments and extensions to THREE.js. These pages are a sandbox of examples and not necessarily ready to include in projects and may require some work to properly and performantly integrate.

## Potential Projects

- Deferred Renderer
- TRAA, non float buffer on volume-lights ([see playdead implementation](https://github.com/playdeadgames/temporal/blob/master/GDC2016_Temporal_Reprojection_AA_INSIDE.pdf))
- use GLSL syntax parser for debugger
- [VXGI](https://wickedengine.net/2017/08/30/voxel-based-global-illumination/)
- Subsurface Scattering
- SSDO
- Stochastic transparency
- Glossly refraction post effect (based on overlap, depth?)
- Glint shader (https://twitter.com/xavierchermain/status/1305443303819800579)
- Immediate-mode style global (or imported) tool that lets you draw debug widgets easily
- Bent normals generator 
  - https://twitter.com/FewesW/status/1342595321948499971
  - https://twitter.com/FewesW/status/1162362788003614721
- Screen space shadows
  - https://panoskarabelas.com/posts/screen_space_shadows/
- Provide helper for depth peeling renders
  - Based on [translucent material](https://github.com/gkjohnson/threejs-sandbox/tree/master/translucent-material) demo.
- Gem shader
  - https://github.com/Sorumi/UnityRayTracingGem
  - http://sorumi.xyz/posts/unity-ray-tracing-gem-shader/
- Texture atlaser for mesh optimization
- Screen Space Global Illumination
- Triangle draw order reorganizer for transparency / overdraw
  - http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.83.572&rep=rep1&type=pdf

**Next**
- Half Edge data structure
- GPU particles
- Curl noise
	- https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
	- http://petewerner.blogspot.com/2015/02/intro-to-curl-noise.html
