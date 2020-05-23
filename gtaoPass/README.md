# Ground Truth Ambient Occlusion

GTAO implementation based on Asylum Tutorials work [here](- https://github.com/asylum2010/Asylum_Tutorials/blob/master/ShaderTutors/54_GTAO/).

[Demo here](https://gkjohnson.github.io/gtaoPass/)

# TODO

**Other**
- The pyramid atlas seems to be bleeding

**Noise**
- Add a depth aware blur
- Add a spatial denoising blur
- Disocclusion Blur (https://www.youtube.com/watch?v=3EdE38iRn2A @ 3:08)

**Code**
- Performance
- Memory
- Clean up shader, add comments
- Unroll loop in the GTAO shader
- Try different mip map techniques for the depth pyramid
  - Make the sample fetches a function so we don't incur all texture taps if they're not needed

**Features**
- Control over which sample is displayed

# References

- https://github.com/asylum2010/Asylum_Tutorials/blob/master/ShaderTutors/54_GTAO/main.cpp
- https://github.com/asylum2010/Asylum_Tutorials/blob/4f2bc39a8ae69db1ceb59e9a763ef91c7b3dc6de/ShaderTutors/Common/gtaorenderer.cpp
- https://github.com/asylum2010/Asylum_Tutorials/blob/master/Media/ShadersGL/gtao.frag
- https://www.youtube.com/watch?v=mIE3DNbeVvY
- https://www.youtube.com/watch?v=7VPb8mZiIrs
- http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/SSAO11.pdf
- http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.214.6686&rep=rep1&type=pdf
- https://github.com/scanberg/hbao
- http://guitarjawa.net/?page_id=789
- https://docs.nvidia.com/gameworks/content/gameworkslibrary/visualfx/hbao/product.html
- https://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf
- http://advances.realtimerendering.com/s2010/Ownby,Hall%20and%20Hall%20-%20Toystory3%20(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf
