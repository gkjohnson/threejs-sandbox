# Color Space Exploration

Exploration to see how different render target types and dithering affect banding due to linear -> gamma color correction.

[Demo here](https://gkjohnson.github.io/colorspace-exploration/index.html)

# Options

**postprocessing**

Whether to use an EffectComposer postprocessing stack or not. If false then the renderer is used to render to a render target of appropriate bit precision before being copied to the canvas.

**gammaOutput**

Whether to run the linear to gamma color space conversion or not.

**dithering**

Whether and at what stage to apply dithering. `MATERIAL` means dithering will be applied during the material render. `POSTPROCESS` means the dithering will be added during the gamma correction post process.

**targetType**

What render target precision to use.
