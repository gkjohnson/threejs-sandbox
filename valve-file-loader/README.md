# Valve File Loaders

A small effort to try to decode and load valve 3d file formats.

## Formats

- **VTF** https://developer.valvesoftware.com/wiki/Valve_Texture_Format
  - Texture Format
- **VMT** https://developer.valvesoftware.com/wiki/Material
  - Material Format
- **VTX** https://developer.valvesoftware.com/wiki/VTX
  - Per-target optimized representations of vertex indices
- **VVD** https://developer.valvesoftware.com/wiki/VVD
  - Bone, normal, position, uv, attribute information
- **PHY** https://developer.valvesoftware.com/wiki/PHY
  - Physics and ragdoll information
- **MDL** https://developer.valvesoftware.com/wiki/MDL
  - The high level information for defining the structure of a model

## Open Questions
- How do you use the `vertOffset` field in the `strips` objects?
- Mark the beginning and ends of structs in memory to make sure everything lines up as expected.
- How large are the strides for the structs? Why do some seem to be longer than others?
	- The size of in the structs seems to be what was expected but it doesn't explain the apparent need for padding
- Read in a file and use the structs to read the data and make sure it makes sense and lines up

## TODO
- Parse Bone Structure

## Other References

### [Studio.h](https://github.com/ValveSoftware/source-sdk-2013/blob/master/sp/src/public/studio.h)

Source with struct definitions used in the `mdl` and other files.

### [Optimize.h](https://github.com/ValveSoftware/source-sdk-2013/blob/master/mp/src/public/optimize.h)

Source with struct definitions used in the `vtx` files.

### [Vradstaticprops.cpp](https://github.com/ValveSoftware/source-sdk-2013/blob/master/sp/src/utils/vrad/vradstaticprops.cpp)

Source with some file loading vertex reading logic.

Especially the loop defined at [lines 1504-1688](https://github.com/ValveSoftware/source-sdk-2013/blob/master/sp/src/utils/vrad/vradstaticprops.cpp#L1504-L1688), which shows the relationship between the MDL and VTX file data.
