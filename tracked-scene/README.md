# Tracked Scene

Three extension that adds a "childadded" and "childremoved" events and allows for deep tracking of all objects in the scene.

# API

## TrackedScene

_extends THREE.Scene_

Tracks all the objects in a scene and fires events when a deep child hass been added or removed.

### Events

_addedtoscene_

Fired when a deep child is added to the scene.

_removedfromscene_

Fired when a deep child is removed from teh scene.

### .allObjects

```js
allObjects : Set
```
