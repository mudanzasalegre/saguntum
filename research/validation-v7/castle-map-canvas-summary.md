# Castle map Canvas QA

Status: **PASS**. 64 scenarios; 5296 checks.

The matrix includes four target sizes, both map palettes, materials/periods modes and four selected states. Every render receives a point-only regionGeometry entry to exercise the polygon guard.

| Surface | Size | Insets (left / right / top / bottom) |
|---|---|---|
| minimap | 460 × 230 | 0 / 0 / 0 / 0 |
| modal | 1200 × 650 | 0 / 0 / 0 / 0 |
| desktop-fallback | 1363 × 936 | 424 / 80 / 108 / 80 |
| mobile-fallback | 390 × 844 | 16 / 16 / 124 / 434 |

Checks cover finite drawing and target coordinates, 18 unique markers, marker-centre separation, exact hitTarget IDs at each centre, frame containment, period/theme label colours, unchanged selected anchors and bounded terrain shading.

This is a native Canvas rendering check, not a browser layout, WebGL or pointer-event integration test. Application and model code were not modified.
