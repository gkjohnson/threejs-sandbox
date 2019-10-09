# Valve File Loaders

A small effort to try to decode and load valve 3d file formats.

Get models from [SFMLab](SFMLab.com).

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
- ~How do you use the `vertOffset` field in the `strips` objects?~
  - Seem to not be used.
- Mark the beginning and ends of structs in memory to make sure everything lines up as expected.
- How large are the strides for the structs? Why do some seem to be longer than others?
  - The size of in the structs seems to be what was expected but it doesn't explain the apparent need for padding
- Read in a file and use the structs to read the data and make sure it makes sense and lines up
- With multiple triangle strips being used it might be best to use the primitive restart approach: https://stackoverflow.com/questions/4386861/opengl-jogl-multiple-triangle-fans-in-a-vertex-array
- When animating bones: https://github.com/ValveSoftware/source-sdk-2013/blob/0d8dceea4310fde5706b3ce1c70609d72a38efdf/sp/src/public/bone_setup.cpp

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

## Things To Note
- THREE assumes counter clockwise triangle winding order while DirectX (and probably the vtx files) [assume clockwise order](https://stackoverflow.com/questions/23790272/vertex-winding-order-in-dx11).
- There's a lot of indirection in the way vertex data is defined. Look in the loop and at the `mstudio_meshvertexdata_t` struct in `studio.h` to unpack it.

## Understanding Vertices
### Key Structs and Functions
#### .VVD
Defined in `studio.h`.

##### struct vertexFileHeader_t
The header provides a pointer to a buffer of interlaced bone weight, position, normal, and uv data.

##### struct mstudiovertex_t
Defines the data layout for the vertex data buffer.

##### struct mstudio_modelvertexdata_t
The struct to access all the vertex data in the given buffer via functions like `Position(i)`, `Normal(i)`, `Vertex(i)`, etc.

TODO: To get the vertex index the function `GetGlobalVertexIndex` is used.

#### .MDL
Defined in `studio.h`.

##### struct studiohdr_t
Provides pointers to various model data including texture data and "body parts".

##### struct mstudiobodyparts_t
Defines a groups of models.

##### struct mstudiomodel_t
Defines a group of meshes and contains a handle to the `mstudio_modelvertexdata_t` from the VVD class (right??).

##### struct mstudiomesh_t
Defines a mesh to be rendered and contains a handle to `mstudio_meshvertexdata_t` (_NOT_ model), which indirectly accesses data in the `mstudio_modelvertexdata_t` struct of the meshes parent model.

This struct defines `vertoffset` and `vertindex` to index into the model data. Possibly this is cached or duplicated data from the VTX strip data?

##### struct mstudio_meshvertexdata_t
Defines accessors into the model vertex data for vertices using the `vertOffset` field (see `getModelVertexIndex` function).

#### .VTX
Defined in `optimize.h`

Defines indices and render approaches for the model in a set of bodyparts, meshes, strips, etc that mirrors the structure of the data in the MDL file.

### Putting it all together

From the loop linked to above the order to go from strip to final vertex is as follows:

```c
// From Strip
// iterate over every index in the strip
index = pStrip -> indexOffset + i;

// From StripGroup
// index into the strip group's index buffer (defined as `(byte*)this + this.indexoffset)`)
// see stripGroup -> pIndex
index2 = pStripGroup -> indexBuffer[ index ];

// index into the group's vertex buffer (defined as `(byte*)this + this.vertoffset)`)
// see stripGroup -> pVertex
index3 = pStripGroup -> vertexBuffer[ index2 ] -> origMeshVertID;

// From mstudiomesh_t
// index into the meshes indices
// see mstudio_meshvertexdata_t::Position and mstudio_meshvertexdata_t::GetModelVertexIndex
index4 = pMesh -> vertexoffset + index3;

// From mstudiomodel_t
// see mstudio_modelvertexdata_t::Position and mstudio_modelvertexdata_t::GetGlobalVertexIndex
index5 = index4 + pModel -> vertexindex / sizeof( vertex );
```
