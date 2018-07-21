# Percentage Closer Soft Shadows

A hacked in implementation of [NVidia's Percentage Closer Soft Shadows](http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf) with an Area Light.

[![](./docs/image.png)](https://gkjohnson.github.io/threejs-contributions/pcss/index.html)

[Demo Here!](https://gkjohnson.github.io/threejs-contributions/pcss/index.html)

### Possible Improvments
- Cleanly implement so it can be reused / used in multiple lights (area lights cannot cast shadows at the moment, though)
- Afford control over PCF and blocker sample counts
- Optimize the blocker search by using a depth mip map pyramid
- Remove dependency on shadow texture resolution (changing the shadow resolution changes the scale of the blur effects)
