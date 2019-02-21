# 3D Model Diff

Viewer for visualizing the difference in two models.

Similar to [Github's STL Diff Tool](https://github.blog/2013-09-17-3d-file-diffs) but works for any loadable 3d file.

## Approach

- Render *new* model as green with a stencil operation to set to 1.
- Render *old* model as red with a `LESS` depth function.
- Render *old* model with no color, a stencil operation to set to set 0, and an `EQUAL` depth function.
- Render *new* model with neutral gray color, a stencil operation to set 0, and an `EQUAL` depth function.

## Ideas
- Render removed geometry in red and added in green. Same in gray.
- Screen space pixel diff.
- Fade slider.
- Render UVs, normals, and other attributes to diff.
