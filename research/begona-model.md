# Begoña · V27 architectural model

## Scope and reference system

`dist/js/begona.js` replaces the former compact model embedded in `port-garden.js`.
The architecture preserves OSM way **443618470**, checked against cadastral part
**cat-8338803YJ3983N_part1-0** / parcel **8338803YJ3983N** and the project PNOA reference.
The southeast front is anchored on the two actual OSM vertices
`[-0.2211553,39.6584108]` and `[-0.2209798,39.6586052]`.
Its length is 26.35146 m in the atlas projection. The basilical body is approximately
26.367 m deep; the recorded L extends to 37.08 m at the rear Casa Abadía.
Those plan coordinates are cartographic. Vertical heights, detailed spacing,
interior furnishings and ornamental subdivisions are proportional interpretations.
This is not an interior survey, an as-built record or a photogrammetric replica.

## Documentary decisions

- A **single central tower**, over the entrance and raised choir, dominates a
  pyramidal front. It is not a freestanding lateral campanile.
- Both wings have **three oval windows**, curved cornices and a panelled plinth.
  The main doorway has paired Ionic columns, a Doric frieze, volutes and a second
  body with a large oval opening. A convex balcony, open bell chamber, flanking
  domed turrets, cupola, lantern and cross complete the silhouette.
- The current restored ornamental reading is used, rather than the stripped
  facade after the removal of dangerous ornament in 1983. Decorative profiles
  are visual approximations; no precise post-restoration survey is claimed.
- The interior has **three naves**, pink faux-marble Tuscan columns, semicircular
  arcades, circular clerestory openings and rectangular side windows.
- The central roof has **five semicircular diaphragm arches supporting inclined
  flat concrete panels** and exterior tiles. It is deliberately not a barrel
  vault. The aisle ceilings are flat. The arches, panels and cornice relationships
  were checked against the actual CONTRAST interior photograph and its didactic
  explanation.
- The curved apse and triumphal arch, golden architectural retablo, side chapels,
  altar and pews provide a spatially readable interior. Sculptures are restrained
  abstract silhouettes, not claimed reproductions of the original works.
- The **raised choir** and its metal scroll railing are distinct from the nave.
  The organ follows the **unencased silver pipe front** in Josep Antoni Lluesma's
  1990 Cabanilles study. It is not given a fictitious Baroque wooden case.
  Its current condition and playability are not asserted. The two-manual console
  is schematic and proportional.
- Casa Abadía has a three-storey exterior and a regionalist south gable with
  apparent half timbering. This is behind the apse, not an open church transept.
  Its rooms are not invented as accessible interiors.
- A restrained low rear-left annex follows the cadastral outline, including its
  re-entrant courtyard. It is an exterior envelope for the documented parish
  dependencies, without a claim that each modern room or roof is measured.
- The church module owns only the entrance stair and its own architectural ground
  patches. BegoñaContext owns the forecourt, Alameda surfaces, vegetation and street
  furniture, avoiding the legacy duplicate plaza.

## Photographs inspected

- CONTRAST `image009.jpg`: actual church interior, captioned 2004. Tuscan columns,
  arcade, clerestory, diaphragm arches, flat roof panels, triumphal arch and retablo.
- CONTRAST `image013.jpg`: actual restored front, cream surfaces and ochre ornament.
- CONTRAST `image029.jpg`: **wooden 1:40 scale model**, not a building photograph.
  Used only to understand massing and the south gable; never treated as surveyed
  geometry or evidence of current colors.
- CONTRAST 2022 workbook page 33: two interior photographs, with cooler and warmer
  decoration. The model uses a restrained warm palette without dating it to 2026.
- Cabanilles 33 (1990), page 56: OESA pipe front and choir railing; page 55 console.

## Primary references

1. Ayuntamiento de Sagunto, *Església de Begonya*, project Xiuxiueig:
   https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/esglesia-de-begonya/
2. CONTRAST, *Iglesia de Nuestra Señora de Begoña (1929)*, direct architectural
   account with photographs and original drawn analysis:
   https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB.htm
3. CONTRAST / APIPS, *Itinerario didáctico multidisciplinar por el patrimonio
   industrial de Puerto de Sagunto*, pp. 32–33:
   https://www.apips.es/assets/files/CUADERNO_TP01.pdf
4. Josep Antoni Lluesma, *Los órganos de Santa María de Sagunto (Valencia) y el
   mundo musical de su entorno*, Cabanilles 33, January–March 1990:
   https://avamus.org/wp-content/uploads/2021/03/Cabanilles-033-033-1990-01-a-1990-03-Los-Organos-de-Santa-Maria-de-Sagunto-Valencia-y-el-mundo-musical-de-su-entorno.pdf
5. Existing atlas cartography and original source records for OSM, Catastro and IGN
   PNOA, retained in `port-cartography.json` and the V27 context evidence.

## Interaction and verification

The architectural visit has 15 stable `begona-` focus IDs, joined to five Alameda
stops by the port integration. Eight architectural focuses are inside, including
`begona-cubierta`: this is a person-height view looking up at the roof, not a roofless
section. Ground-floor eyes stay between 1.7 and 1.85 m above the model floor. Choir
views use the raised floor. Ground binding never moves interior cameras.

The reversible section removes roof tiles, concrete ceiling panels, diaphragm
arches, suspended lamps, choir floor, choir railing and organ together.
It retains the nave floor, lower arcades, clerestory walls, apse, retablo, exterior
facade and the roofs of the Casa Abadía and parish annex. Their undocumented interiors
remain closed. There are no unsupported choir furnishings left floating in the cutaway.

The architecture owns every geometry, material and procedural texture and has
idempotent disposal. Reading colors distinguish architecture, naves, liturgical
space, annexes and Alameda, without suggesting that these are construction phases.

`research/validation-v27/validate_begona_model.mjs` checks actual geometry rather
than just metadata: raycasts through physical window and door voids, interior eye
clearance and sightlines, normal-view ceilings, section dependency visibility,
finite buffers, nondegenerate triangles and resource disposal. The model's final
verified state passed **159 checks**, with **92,775 triangles**, **149 meshes**,
**57 physical window openings** and **3 door openings**. Later integrated and visual
checks are recorded separately; these unit checks do not prove browser rendering
or performance.

## Read review corrections before final integrated export

The side-turret pedestals now meet the wing cornice, and the tower base meets the
pitched roof behind the front wall. Outer wing piers end at their own lower
cornice rather than the taller central height. Casa Abadía timber crossbars are
clipped to the gable triangle. Repeated pew kneelers were deduplicated, rear aisle
roof wedges were closed, and interior oculus surrounds were provided on both
faces. The plan includes all twelve Tuscan pillar footprints and the choir rail;
the choir focus anchor lies within its actual raised slab. The north-side camera
was moved into the nearby street/Alameda opening after the first integrated test
found that its more distant position intersected neighboring houses. Final
clearance against those actual neighboring models is checked by the integrated
validator.

## Corrections from the complete CPU visual review

The bell chamber now contains restrained transverse supports connecting the
short yokes to its side masonry. The abstract Marian niche figure stands on a
plinth attached to the retablo bank, and the side-chapel silhouettes meet their
altar tables through low pedestals. These are support corrections, not new
claims about sculptural detail.

The cutaway hides suspended chandeliers and rods together with the roof from
which they hang. No separate model point lights remain. Casa Abadía and the
parish annex retain their roofs and gable in the cutaway, so their empty internal
volumes are not presented as documented rooms. The model QA now checks this
explicitly.
