# Theatre map Canvas QA

Status: **PASS**. 272 scenarios; 24464 checks.

The real model supplies 21 geographic component polygons. Four target surfaces, both appearances, materials/layer modes and all 16 selected stops are exercised. Invalid point-only and non-finite components are also supplied to test the input guard.

| Surface | Size | Insets: left / right / top / bottom |
|---|---|---|
| minimap | 460 × 230 | 0 / 0 / 0 / 0 |
| modal | 1200 × 650 | 0 / 0 / 0 / 0 |
| desktop-fallback | 1363 × 936 | 424 / 80 / 108 / 80 |
| mobile-fallback | 390 × 844 | 16 / 16 / 124 / 434 |

Checks cover finite coordinates, 16 unique markers, label collision avoidance, exact marker hit targets, frame containment, unchanged geographic anchors for every selected stop, source-controlled layer colours, text contrast of at least 4.5:1 and bounded terrain shading.

This is native Canvas and controller-level verification. Browser layout, physical clicks and WebGL rendering require their separate browser checks.

