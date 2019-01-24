# Valve File Loaders

A small effort to try to decode and load valve 3d file formats. The formats are not very well-documented and only texture loading has been implemented.

## Formats

- [X] **VTF** https://developer.valvesoftware.com/wiki/Valve_Texture_Format
  - Texture Format
- [ ] **VMT** https://developer.valvesoftware.com/wiki/Material
  - Material Format
- [ ] **VTX** https://developer.valvesoftware.com/wiki/VTX
  - Per-target optimized representations of vertex indices (?)
- [ ] **VVD** https://developer.valvesoftware.com/wiki/VVD
  - Bone, normal, vertex, attribute information
- [ ] **PHY** https://developer.valvesoftware.com/wiki/PHY
  - Physics and ragdoll information
- [ ] **MDL** https://developer.valvesoftware.com/wiki/MDL
  - The high level information for defining the structure of a model

## Other References

- https://www.unknowncheats.me/forum/counterstrike-global-offensive/163599-source-external-mdl-parser.html
- https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/sp/src/public/studio.h
- https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/mp/src/public/optimize.h
