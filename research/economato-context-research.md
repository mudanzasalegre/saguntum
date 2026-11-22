# Antiguo Economato: access, garden and immediate urban setting (V28)

## Scope and source status

This context completes the exterior immediately around the Economato, with its
front on Avenida 9 d’Octubre, the side passages and rear planted ground between
the building and the existing Gerencia walk. The Economato architecture, porch
interiors and entrance steps belong to `economato.js`. Its five mapped cadastral
parts, parent parcel `8338804YJ3983N`, total 1,520.13 m². The exact cadastral
footprints and courtyard holes are preserved.

The primary ground reference is the retained IGN/CNIG PNOA orthophoto at
`research/validation-v25/gerencia-context-orthophoto-reference.jpg`, 1800 × 1215
pixels, west −0.2255, east −0.2207, south 39.65775, north 39.66025. Its flight date
has not been verified; it establishes observed layout, not the current state of
the 2026 worksite. SHA256:
`668a7a5f063d4e01dfb9f06c406778c4b89e1dd784d8c81786daf3144d462e42`.

Sources:

- [IGN PNOA WMS](https://www.ign.es/wms-inspire/pnoa-ma): retained orthophoto,
  with the complete reproducible GetMap URL embedded in `economato-context.json`.
- [Catastro INSPIRE Buildings, Sagunto 46222](https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip):
  building-part coordinates, holes and attributed storeys; source metadata date
  21 August 2026 in the established atlas cartography.
- [Universitat de València: Gerencia, Casino y Economato](https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html):
  position between Casino and Begoña, principal façade and direct pavement
  access to the two porticoes. The photographs do not support a continuous
  fence separating this entire façade from the avenue.
- [APIPS, Cuaderno de Trabajo 01 (2022), p. 34](https://www.apips.es/assets/files/CUADERNO_TP01.pdf):
  relationship of the Economato, Casino and Offices to the avenue and the
  Gerencia houses behind.
- [Ayuntamiento, 20 January 2026](https://aytosagunto.es/es/actualidad/2026-01-20-progresan-los-trabajos-de-rehabilitacion-del-antiguo-economato-de-ahm-para-convertirlo-en-ceam-y-centro-de-dia/):
  rehabilitation began in December 2025; completion expected in 2027. This
  announcement does not establish completed CEAM/day-centre rooms or gardens.

No future CEAM garden, English courtyard, equipment or room layout has been
introduced as an existing condition. Construction machinery and current site
fencing are not reconstructed without verified placement. The scene is a
documented architectural reading, not an as-built survey of the active works.

## Delimitation and ownership

The immediate precinct is traced from 13 orthophoto points and includes narrow
outside strips around all five exact building parts. It is not asserted as a
legal parcel boundary. All surfaces are clipped to actual building footprints
and the two porch stair envelopes, with only 0.03 m clearance. This avoids the
broad empty buffers that previously exposed background ground next to buildings.

The new context contains 1,885.71 m² of continuous exterior ground:

| Ground ownership | Area |
| --- | ---: |
| Previously uncovered immediate exterior | 1,126.57 m² |
| Reviewed transfer from Gerencia | 759.15 m² |

Only four Gerencia source surface records transfer partly:
`gerencia-sidewalk-5`, `gerencia-east-garden-3`, `gerencia-garden-2` and
`gerencia-garden-3`. The original road and garden-path surfaces remain owned by
Gerencia. Casino, Museo Industrial, Begoña, Talleres and Horno surfaces retain
their exact values. Their already detailed neighbours, furniture and all earlier
mapped tree centres remain with their original owners.

Seven previously generic cadastral parts belonging to six parcels across the
avenue receive detailed contextual roof and façade rendering. Their source
footprints, holes and identifiers stay exact; 77 nearby parts remain rendered by
their existing owners. Roof elevation uses the existing MDSnE estimate where
available and attributed storeys otherwise. Window rhythm, sills, façade colour
and small roof details are visual interpretations, not measured surveys.

The demolished cadastral parts previously withheld by other contexts remain
withheld. They are neither regenerated as buildings nor used as fictitious holes
in the new ground coverage.

### Correcting the continuous front fence

The inherited Gerencia boundary line crossed the entire Economato front,
including the approaches to both porticoes. Primary photographs instead show
direct access from the pavement. The reviewed correction removes only 54.60 m
of `gerencia-boundary-1`, within a rectangle following the exact front axis. Its
two ends, totalling 13.126 m, and every other boundary line are retained. No new
gate, fence or undocumented street furniture is fabricated.

The parent applied this correction and the ground handoff only after reviewing
the candidate files and 41 passing ownership checks. The exact baseline hashes
and candidate hashes are recorded in
`research/validation-v28/economato-gerencia-ownership-transfer-qa.json`.
The fallback `gerencia-plan.json` changes only the same four surface components;
all its architecture, visits, floors, openings and other components stay exact.

## Ground, planting and reading modes

The ground distinguishes the light apron at the avenue, side paving, planted
rear ground and remaining compacted earth. Its material distribution follows
the retained orthophoto. The substrate underneath dense canopy is interpreted.
The fine apron joint rhythm is also interpreted and clipped before every
building, stair and older surface owner.

Eight additional visible rear crown centres are registered from the orthophoto.
They do not duplicate any earlier mapped tree centre within 3.2 m. The `pine`
class is a visual crown form, not a claimed botanical inventory. Interpreted
heights range from 7.6 to 8.5 m and source crown parameters from 3.1 to 3.7 m.
All eight trunks remain represented. Three crown parameters are reduced by the
full architecture clearance calculation; the complete foliage envelope remains
at least 0.45 m from building and stair footprints. Plan crown radius equals the
actual rendered envelope.

The new module adds no benches, lamps, road geometry or furniture. Existing
context furniture continues to provide the documented setting. This avoids
populating the unfinished future social centre with an invented landscape.

Five guide-compatible exterior focuses are available:

| ID | Reading | Layer |
| --- | --- | --- |
| `economato-acceso` | Pavement before the two porticoes | `entorno` |
| `economato-entorno` | Avenida 9 d’Octubre | `entorno` |
| `economato-arbolado` | Rear garden and Gerencia relationship | `entorno` |
| `economato-frente-urbano` | Existing houses across the avenue | `entorno` |
| `economato-ciudad-factoria` | Economato, Casino, Begoña and Gerencia together | `memoria` |

The geometry uses the established atlas projection and the exact final terrain
mesh sampler. Far and near viewpoints are raised above terrain, full new-tree
crown envelopes and mapped roof envelopes if necessary. Outdoor focuses have
no floor restriction. Thematic colours use the guide’s `entorno`/`memoria`
legend; normal textured materials restore reversibly.

## Verification and limits

- Source preparation: **12/12 checks passed**. No overlap with protected street,
  path, neighbouring-context or actual architectural footprints; complete
  replacement of transferred ground; complete close-strip coverage; exact
  terrain-grid triangulation; no duplicate parcel ownership or tree centres.
- Transfer candidate: **41/41 checks passed**. Only the four reviewed surfaces
  and one front boundary segment change. Old buildings, road/path geometry,
  trees, furniture, height reviews, exclusions outside the handoff, previous
  Casino clipping and fallback-plan metadata remain intact.
- Standalone Three.js context: **43/43 checks passed**. Finite, non-degenerate
  Float32 geometry; five valid guide focuses; exact source hashes; full foliage
  clearance; final-terrain binding; thematic and material modes; focus selection;
  resource disposal and repeated ground binding.
- Runtime context: **12 batched meshes, 10,036 triangles**. Ground mesh:
  819 vertices and 986 triangles. Maximum terrain contact error after final
  binding: **0.00002098 m at vertices**, **0.00001238 m at triangle interiors**.
- The source-alignment image was visually reviewed against the retained
  orthophoto. It is an analytical diagram, not a browser screenshot.

The parent's first complete integration pass found that the original Almacenes
observation ray crossed a mapped rear crown. The tree was retained. A narrow
follow-up identified the open corridor at local x ≈ 3.5 m between the first and
second rear crowns and recommended local far/near offsets `[0, 9, 18]` and
`[0, 5, 12]` from the unchanged target. All four focused rays against the complete
Economato and Gerencia context groups pass without an intersection. This probe
uses the already-verified 5 m local ground datum; the parent performs the full
production scene validation after applying the camera adjustment. Evidence is
saved in `economato-context-sightline-qa.json`. No planting or other production
context geometry was altered to clear the view.

The live browser was not recovered in this iteration. The parent performs final
integrated CPU render inspection and publication verification separately; this
file does not claim interactive-browser validation.

### Final avenue camera review

The initial integrated exterior image was dominated by the opposite residential
roofs. A subsequent camera-only correction moves the observation point above
Gerencia and centres the avenue itself, retaining all buildings and vegetation.
The final architectural-frame target is `[5, 2, −9]`, with full eye
`[−52, 55, 18]`, near eye `[−36, 40, 12]` and 51-degree vertical field of view.
The target falls on the retained `gerencia-road` surface. Both final 640 × 480
drafts were visually inspected; the avenue and both street fronts remain clear,
and the near view follows the same corridor. Exact exported-mesh camera QA
passes 8/8 checks and standalone context QA was rerun at 43/43. Details and
final source fingerprint are in `economato-avenue-camera-review.md`.

## Reproduction

`prepare_economato_context.py` writes only the new context data. If Gerencia has
already been transferred, it reads the verified original Gerencia context from
commit `db144b1307c565d7d61ab8cbddf1641ade0b755c`, preventing a second preparation
from losing the original transfer mask. The production geometry was frozen
before the parent integrated it. The later approved avenue-camera refinement
changes only its focus specification and preserves every other context value.
All production sources were frozen again before the parent's final registration
and integrated export.

`transfer_economato_context_ownership.py` writes reviewable candidates by default
and verifies exact baseline hashes before its optional `--apply` operation. It
recognizes the exact already-applied candidates without applying the transfer
twice. No earlier generator is rerun to recreate the Gerencia surfaces.
