# Economato avenue camera: final visual review

The initial view looked across the opposite residential roofs, hiding most of
Avenida 9 d’Octubre. The approved replacement observes the avenue diagonally
from above the Gerencia. The exact 626 exported meshes are retained.

## Final camera

- Target in the architectural frame: **[5, 2, −9]**.
- Full eye: **[−52, 55, 18]**.
- Near eye: **[−36, 40, 12]**.
- Vertical field of view: **51 degrees**.

The target was moved 4 m from the first approved draft so it lies on the actual
retained Gerencia carriageway. The inherited local z = −13 target lay just inside
the opposite cadastral footprint; local z = −9 is within `gerencia-road`.
The full and near eye positions were retained during this small recentering.

## Reviewed evidence

Both final drafts were visually inspected. The avenue remains continuously
visible, with the residential street front on the left and the Economato on
the right. Begoña remains a background landmark in the full view. The near
view follows the same corridor without entering a roof. No building, tree or
surface was hidden or removed.

- `economato-avenue-full-recentered-draft.png`
- `economato-avenue-near-recentered-draft.png`

Draft settings: Blender CPU, 1 thread, 8 samples, 640 × 480. These are exact-mesh
inspection renders, not browser screenshots. The separate parent export uses
the final integrated model including its corrected internal ceiling.

The camera QA passes **8/8 checks** against the 626 meshes. Both centre rays
reach the avenue without a roof, tree or building intersection. Camera clearance
above the nearest geometry below is **54.88 m full** and **39.39 m near**. The
angular difference between full and near directions is **1.46 degrees**.
The standalone context QA was rerun and passes **43/43 checks**.

Only `focusSpecs.economato-entorno` changed in production context data; every
other context value was compared and preserved. No production JavaScript was
changed for this camera iteration. The preparer contains the same final values.

Final production context JSON SHA256:

`4e0aa2086b3b97caa73ee5fb23af98d3f93e67cea4c423637525e44359b5bc78`

All production sources were frozen before the parent's final registration and
integrated export. This review and its images do not mutate those sources.
