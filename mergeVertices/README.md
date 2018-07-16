# Merge Vertices
`THREE.BufferGeometry` extension to generate and optimize triangle indices by deduping vertex attributes and generating new triangle indices. Also provides a couple bug fixes and utility functions for `BufferGeometry`.

[Demo here!](https://gkjohnson.github.io/threejs-contributions/mergeVertices/index.html)

Submitted in [this PR](https://github.com/mrdoob/three.js/pull/14116) to THREE.js.

## Use

```js
<script src=".../three.js"></script>
<script src=".../BufferGeometryOptimizeTriangleIndices.js"></script>

<script>

  // Create buffer geometry with no triangle indices
  var sphere = new THREE.SphereGeometry( 1, 100, 100 );
  var bufgeom = ( new THREE.BufferGeometry() ).fromGeometry( sphere );

  // The buffer geometry is taking '' with all attributes
  console.log( `${ THREE.BufferGeometryUtils.estimateBytesUsed( bufgeom ) * 1000 }kb` );

  // Optimize the buffer geometry and generate triangle indices
  bufgeom.mergeVertices();

  // The buffer geometry is taking '' with all attributes
  console.log( `${ THREE.BufferGeometryUtils.estimateBytesUsed( bufgeom ) * 1000 }kb` );

</script>
```

## API
### InterleavedBufferAttribute.copy
### InterleavedBufferAttribute.clone

Missing copy and clone functions.

### BufferGeometryUtils.estimateBytesUsed(bufferGeometry)

Returns the memory allocated for the geometry (vertex attribute and index arrays) as bytes.

### BufferGeometryUtils.interleaveAttributes(attributes)

Converts the provided normal attributes into a set of interleaved attributes that share a buffer.

### BufferGeometry.mergeVertices(tolerance = 1e-4)

Updates the vertex attributes and index arrays with optimized, deduped versions representing the same mesh.

The `tolerance` argument determines the decimal precision used when deduping vertex attributes.
