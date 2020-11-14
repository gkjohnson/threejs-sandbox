# Half Edge Structure

## TODO
- Implicit coordinte system per face derived from first triangle edge and normal
- Get a random point and face on the surface of the geometry
- Use 3d perlin noise to drive the heading of the point
- Track which face the dot is on
- Transform start and endpoints into barycentric coordinates (normalized [0, 1]) to see if it's stepped over the boundary.
- Move dot into new face, clamp the walk to the edge in barycentric, back it out and and extend the walk into the new face.
- Create a coordinate system based on the triangles first edge and normal
