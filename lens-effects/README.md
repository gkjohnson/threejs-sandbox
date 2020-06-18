# Lens Effects

Postprocessing effect to add lens distortion and chromatic aberation as well as film grain.

Grain technique based on [this ShaderToy project](https://www.shadertoy.com/view/4t2fRz) and image distortion based on [this article](https://www.taylorpetrick.com/blog/post/dispersion-opengl) and [this paper](https://web.archive.org/web/20061108181225/http://home.iitk.ac.in/~shankars/reports/dispersionraytrace.pdf).

![](./images/banner.png)

_Before / After. Car image from [wallpaperflare.com](https://www.wallpaperflare.com/tatra-tatra-603-czechoslovakia-socialist-car-v8-aerodynamic-wallpaper-pqflw)._

[Demo Here](https://gkjohnson.github.io/threejs-sandbox/lens-effects/).

# Improvements

**Grain**
- Allow noise to darken pixels.
- Add colored noise

**Distortion**
- Base the image distortion based on camera FoV and correct view normal. (add inverse projection matrix)
- Look into Brown Conrady distortion (mentioned on [wikipedia](https://en.wikipedia.org/wiki/Distortion_(optics)), this [shadertoy](https://www.shadertoy.com/view/MlSXR3)).
- Make parameters physically based.
- Add option to adjust camera's FoV.
- Update shader so chroma samples define quantity is replaced in the shader and we can unroll the loop
- Perform distortion in linear color space
- Does base ior need to be different for every band? It seems like no distortion should take place at ior 1.0
   - Technically I would think yes. The original base ior should differ per band, as well, and the base ior change should represent a shift in the base value per wavelength. This would result in a ratio of 1. when the base ior is one. However this would also mean that you couldn't get dispersion without bowing of some sort of the image, which might not be wanted.
	 - "Inversion" of the color band order would require an inversion of the normals that the incident light is coming in on.

# References

## Grain

- https://www.shadertoy.com/view/4t2fRz
- http://devlog-martinsh.blogspot.com/2013/05/image-imperfections-and-film-grain-post.html
- https://danielilett.com/2019-11-20-tut3-5-filmic-filters/
- https://github.com/mattdesl/glsl-film-grain

## Lens Distortion / Dispersion

- https://danielilett.com/2019-10-17-tut3-1-something-fishy/
- https://codea.io/talk/discussion/8708/barrel-distortion-shader
- [Barrel Blur Chroma](https://www.shadertoy.com/view/XssGz8)
- [Lens / Film Chromatic Aberration](https://www.shadertoy.com/view/llK3RR)
- [Barrel Blur](https://www.shadertoy.com/view/XslGz8)
- [Barrel Distortion](https://www.shadertoy.com/view/lddGDN)
- [Barrel Distortion Tutorial](https://www.shadertoy.com/view/MlSXR3)
- https://web.archive.org/web/20061108181225/http://home.iitk.ac.in/~shankars/reports/dispersionraytrace.pdf
- https://www.taylorpetrick.com/portfolio/webgl/lense
