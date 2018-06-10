# threejs-merge-vertices
`THREE.BufferGeometry` extension to generate and optimize triangle indices by deduping vertex attributes and generating new triangle indices.

## Use

```js
<script src=".../three.js"></script>
<script src=".../BufferGeometryOptimizeTriangleIndices.js"></script>

<script>

  // Create buffer geometry with no triangle indices
  var sphere = new THREE.SphereGeometry(1, 100, 100);
  var bufgeom = (new THREE.BufferGeometry()).fromGeometry(sphere);

  // The buffer geometry is taking '' with all attributes
  console.log(`${ bufgeom.getMemoryUse() * 1000 }kb`);

  // Optimize the buffer geometry and generate triangle indices
  bufgeom.optimizeTriangleIndices();

  // The buffer geometry is taking '' with all attributes
  console.log(`${ bufgeom.getMemoryUse() * 1000 }kb`);

</script>
```

## API
### InterleavedBufferAttribute.copy
### InterleavedBufferAttribute.clone

Missing copy and clone functions.

### BufferGeometryUtils.getMemoryUse(bufferGeometry)

Returns the memory allocated for the geometry (vertex attribute and index arrays) as bytes.

### BufferGeometryUtils.interleaveAttributes(attributes)

Converts the provided normal attributes into a set of interleaved attributes that share a buffer.

### BufferGeometry.mergeVertices(precision = 3)

Updates the vertex attributes and index arrays with optimized, deduped versions representing the same mesh.

The `precision` argument determines the decimal precision used when deduping vertex attributes.
