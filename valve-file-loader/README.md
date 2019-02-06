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

- https://www.unknowncheats.me/forum/counterstrike-global-offensive/163599-source-external-mdl-parser.html
- https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/sp/src/public/studio.h
- https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/mp/src/public/optimize.h
