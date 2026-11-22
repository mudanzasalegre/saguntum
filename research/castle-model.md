# Castillo de Sagunto · modelo de la visita V7

La versión V7 sustituye el castillo genérico por una representación del conjunto conservado apoyada en sus trazas cartográficas. El objetivo es poder reconocer sus recintos, puertas, ruinas del foro y edificios actuales durante una visita virtual. La maqueta **no equivale a un levantamiento fotogramétrico** ni presenta todos los elementos como partes de una fortaleza romana.

El módulo es `dist/js/castle.js`. La documentación histórica y la bibliografía utilizadas por la interfaz están en `dist/assets/data/castle-visit.json`; su investigación se explica en `research/castle-history.md`.

## Qué cambia

La planta utiliza los 272 vértices del contorno de OpenStreetMap ya incorporado a la cartografía del atlas. La elevación de los elementos se calcula después de construir la malla de Sagunto. De esta manera, los caminos y superficies arqueológicas consultan el terreno realmente dibujado, con las acomodaciones de otros edificios del atlas incluidas.

Se representan los siete recintos mediante la misma envolvente y sus trazas interiores: Armas, Almenara, Conejera, San Fernando, Estudiantes, Ciudadela y Dos de Mayo. Su asignación a grupos sirve para seleccionar y encuadrar la visita. Esa división de trabajo no pretende sustituir siete polígonos arqueológicos levantados sobre el terreno.

El modelo incorpora 61 trazas interiores de muro y descarta los segmentos que duplican la envolvente cartográfica. Se omiten también las trazas de fuera del recinto que pertenecen a otras estructuras, incluido el teatro. Los muros con una altura cartográfica de cero se conservan como trazas bajas, de unos centímetros, en lugar de recibir la altura de una muralla.

La lectura arquitectónica diferencia las siguientes partes:

| Parte | Representación | Grado de certeza |
|---|---|---|
| Murallas y divisiones | Plantas cartográficas; espesores, alturas y coronaciones irregulares aproximados | Planta trazada; alzado interpretado; cronología mixta por defecto |
| Puerta de Almenara | Arco apuntado, dos óculos trilobulados abiertos, coronación irregular y hojas de madera plegadas en el paso | Posición cartográfica contrastada y rasgos de fachada documentados; dimensiones interpretadas |
| Acceso principal y puerta de San Fernando | Huecos abiertos que sustituyen el volumen del muro en el punto de paso | Posición cartográfica; forma y alzado esquemáticos, sin atribuir una fecha única a sus reparaciones |
| Basílica y curia | Muros bajos identificados en el plano del foro y en las trazas cartográficas | Identificación arqueológica; altura residual aproximada |
| Tabernae | Secuencia de habitaciones delimitadas por muros bajos al este del foro | Planta cartográfica identificada; alzado residual aproximado |
| Templo del foro | Planta y restos de podio, superficie y acceso mediante peldaños bajos | Huella ajustada de forma visual al plano municipal y a la ortofoto; no restitución de una fachada completa |
| Pavimento del foro | Superficie subdividida adaptada al terreno, con juntas discontinuas | Situación aproximada; textura y deterioro interpretados |
| Gran cisterna del sur | Lectura de su extensión cubierta, sin abrir un subsuelo inexistente en la malla | Dimensiones interiores publicadas; localización aproximada por alineación del plano |
| Cisterna del norte | Foco de sector y explicación documental | Sin huella georreferenciada suficientemente precisa: no se inventa una planta de excavación |
| Inscripción del pavimento | Foco dentro del contexto del foro | No se fabrica un texto completo ni una disposición original de todos los bloques |
| Antiquarium y edificios conservados | Huellas cartográficas, volúmenes de altura aproximada y cubiertas esquemáticas | Planta OSM/Catastro y estimaciones MDS previas del atlas; detalles de fachada interpretados |
| Caminos | Veinte líneas cartográficas, con anchuras y acabado visuales | Trazas del mapa; no certificación de accesibilidad o apertura física |

## Fuentes y decisiones de representación

El [Plan Director municipal de 2000](https://aytosagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf) documenta los siete recintos y sus relaciones. La hoja 80 contiene el plano del foro utilizado para distinguir templo al norte, curia al noreste, basílica al oeste, tabernae al este y cisterna con pórtico al sur. Las hojas 110–112 describen las plazas y construcciones. Es un documento de su fecha, no una fotografía del estado exacto de 2026.

La curia y la basílica se identifican según la investigación arqueológica recogida en el inventario de fuentes. La maqueta conserva muros bajos y algunos apoyos del pórtico; no repone cubiertas, columnas completas, estatuas o decoración perdida. Las trazas denominadas *Roman Senate* en OpenStreetMap ayudan a situar la curia, pero no constituyen la fuente de su interpretación histórica.

El levantamiento de la puerta y de los lienzos publicado en [FORTMED 2020, DOI 10.4995/FORTMED2020.2020.11387](https://doi.org/10.4995/FORTMED2020.2020.11387) permite reconocer la puerta de Almenara como una estructura específica. La malla de V7 utiliza geometría propia; no incorpora ni se apropia de una malla fotogramétrica de aquella publicación. Sus dimensiones verticales y el detalle de las dovelas siguen siendo aproximaciones visuales.

La **fotografía de la fachada de Almenara** se contrastó directamente en el [dossier SERANCO 2019, página 43, también página 43 del PDF](https://seranco.es/wp-content/uploads/2019/07/Dossier-SERANCO-2019.pdf). Esta fuente del contratista muestra el arco apuntado, los dos óculos trilobulados y la coronación irregular. Esos rasgos sustituyeron el portal genérico inicial. Los óculos son huecos de la malla, no discos negros pegados sobre un muro. La figura 10 del artículo FORTMED documenta una hoja de madera; no se ha confundido con un alzado completo de la fachada. La puerta conserva clasificación mixta en la lectura por épocas porque una fotografía de su forma no permite fechar cada reparación.

La ubicación de la puerta se obtiene del cruce del camino OSM `733215257` con el muro `733215258`: aproximadamente **−0,2762665; 39,6762149**. Esa precisión numérica sirve al alineamiento de las geometrías; no implica precisión topográfica centimétrica. El foco de la visita utiliza la misma posición.

Para la cisterna sur se utiliza la descripción medida publicada en [Civera, «Les cisternes del Castell de Sagunt», ARSE 41, 2007](https://www.centroarqueologicosaguntino.es/uploads/descargas/339_010_les_cisternes_del_castell.pdf): 65,60 × 4,14 m, dos galerías y la serie central de 22 arcos, compatible con 21 pilares intermedios. La altura de bóveda documentada, 3,45 m, se conserva como metadato. No se levantan esos pilares sobre la plaza ni se dibuja el depósito abierto. El trazado visual se interrumpe en la parte ocupada por edificios actuales, cuya representación tiene prioridad.

La pequeña cisterna del flanco norte, estudiada por Aranegui en 1984, se mantiene separada. El dato de 6 × 2,9 × 4 m corresponde a ese depósito, no a la gran cisterna sur. Al faltar una localización georreferenciada suficientemente verificada, su parada dirige la cámara al sector documentado y no añade un cajón arqueológico arbitrario.

El edificio OSM `82897960` corresponde al antiguo Museo Militar en el extremo sur de la basílica. Los edificios adyacentes y el volumen del norte de Estudiantes se mantienen como construcciones actuales de cubierta esquemática. El volumen `733215254`, junto al conjunto de la puerta de San Fernando, no recibe una atribución individual no demostrada. Tampoco se levantan torres completas sobre posiciones tentativas de Hércules o Penó: se conservan las masas y quiebros trazados en cartografía.

La geometría no utiliza imágenes generadas ni texturas descargadas. La textura de piedra se crea proceduralmente en la aplicación, con recursos propios de cada instancia. Su aparejo y variaciones de color son recursos visuales, no una transcripción de cada paramento conservado.

## Lectura de épocas

La opción «Leer las épocas» cambia la apariencia de componentes identificados, sin reconstruir un estado antiguo completo. Los colores coinciden con la leyenda de la aplicación:

| Clave | Color | Uso en la geometría |
|---|---|---|
| `ancient` | `#e1c18b` | Estructuras arqueológicas identificadas del foro |
| `medieval` | `#8ad3ca` | Clave disponible para fábricas medievales identificadas; no se fuerza sobre las puertas mixtas |
| `modern` | `#f0b192` | Edificios y acondicionamientos contemporáneos identificados |
| `unknown` | `#c0cbc9` | Lienzos mixtos o sin una atribución de fase suficientemente precisa |

Un recinto entero no recibe automáticamente la fecha de su nombre o de su episodio histórico más conocido. Los materiales originales se restablecen al regresar a «Piedra y materiales».

## Contrato de integración

```js
import { createCastle, castleRoadIds, castleBuildingIds } from './castle.js';

const castle = createCastle({
  project,
  heightAt: terrain.meshHeightAt,
  data: cartography,
  visitData: castleVisitData,
  detail: 'full'
});

const visit = castle.userData.visit;
visit.selectFocus('puerta-almenara');
visit.setReadingMode('periods');
```

`createCastle` devuelve un `THREE.Group`. Cada instancia posee sus materiales y su textura. No existe una caché compartida que pudiera reutilizar materiales o texturas ya liberados al cambiar entre Sagunto y Palancia.

`userData.visit` contiene:

- `focuses`: objeto con las 18 paradas. Cada entrada tiene `id`, `label`, `regionId`, `coordinates`, `target` como `Vector3`, `offset`, `closeOffset`, `bounds` como `Box3`, `components`, `kind` y `sourceConfidence`.
- `regions`: siete entradas con identificador, nombre, coordenadas del punto de referencia y límites geométricos para encuadre.
- `bounds`: caja de la geometría completa, sin incluir el anillo de selección.
- `stats`: procedencia, recuentos, dimensiones y límites interpretativos.
- `selectFocus(id | null)`: selecciona y resalta los componentes correspondientes; devuelve la entrada seleccionada o `null`.
- `setReadingMode('materials' | 'periods')`: aplica la lectura de materiales o de componentes históricos.
- `getState()`: devuelve `selected` y `readingMode`.
- `qa`: muestras del terreno, portales, superficies, edificios y dimensiones de la cisterna utilizadas en las comprobaciones geométricas.

`userData.ownedResources` permite al mecanismo de descarga de escenas recuperar los materiales y la textura incluso cuando la lectura por épocas ha desactivado temporalmente `material.map`.

La integración mediante `createMonuments` conserva el teatro y la API anterior, y añade construcción diferida:

```js
const monuments = createMonuments({
  project, heightAt: rawHeight, data: cartography,
  castleVisit: castleVisitData, deferCastle: true
});

// Excluir los IDs del castillo de caminos y edificios genéricos del contexto.
// Crear después urban y terrain con el flujo habitual del atlas.
monuments.buildCastle(terrain.meshHeightAt);
```

`buildCastle` es idempotente. El getter `monuments.castle` devuelve `null` hasta completar esa construcción. Los objetos `points.castle` y `points.forum` conservan su identidad y se actualizan con los focos nuevos. La construcción inmediata sigue siendo el comportamiento por defecto.

Los veinte caminos y diez edificios cartográficos se incluyen como un subconjunto compacto local. Así se conserva el detalle cuando el castillo aparece en el contexto territorial del Palancia, donde la carga general utiliza una cartografía reducida. No se añade una petición de red durante la construcción.

## Comprobación geométrica

El comando de validación utiliza el MDT real, los monumentos existentes, la superficie urbana, la malla final del terreno y las fórmulas de cámara extraídas de `app.js`:

```bash
node --experimental-loader ./research/validate_loader.mjs \
  research/validate_castle_v7.mjs --export
```

Resultado de la revisión: **328 comprobaciones superadas**. El informe completo queda en `research/validation-v7/castle-geometry.json`.

- Las tres puertas permiten atravesar su espesor con los 27 rayos de prueba, a varias alturas y desplazamientos laterales. Los dos óculos de Almenara también permanecen abiertos a través de todo el espesor.
- Los 24.752 triángulos de suelo comprobados mantienen sus centros por encima de la malla. El mínimo observado de separación es aproximadamente 3,68 cm. Se corrigió la triangulación inicial de los caminos para subdividir también los cambios de pendiente; comprobar solamente sus vértices no bastaba.
- Las 18 paradas y la vista general producen cámaras finitas. Las vistas completas caben en el área real libre de la interfaz para 1363 × 936, 390 × 844 y 844 × 390 píxeles. Ninguno de los objetivos de cámara de esas 114 combinaciones de parada, tamaño y acercamiento queda oculto por el terreno.
- La selección y la lectura por épocas restauran los materiales iniciales. Dos instancias de castillo no comparten materiales ni textura liberables.
- Las referencias de procedencia del modelo resuelven a identificadores del JSON documental.
- La función de geometría del Teatro Romano permanece idéntica, byte por byte, a la versión anterior.

El modelo resultante contiene aproximadamente 157.516 triángulos repartidos en 102 mallas. Los lienzos sin una identificación individual de visita comparten lotes por recinto; se conserva su geometría y se reduce el número de llamadas de dibujo. El informe registra el tiempo de construcción CPU: la última ejecución observó aproximadamente 1,12 s mientras se realizaba el render de inspección en paralelo. Es una medida dependiente de la carga del entorno, no una medición de rendimiento gráfico en el dispositivo del usuario.

Los renders de inspección se obtienen con:

```bash
blender -b -t 8 -P research/render_castle_v7.py
```

Cycles carga la geometría exportada de Three.js y la ortofoto real. Esas imágenes sirven para inspeccionar huecos, relaciones de volumen y apoyos; **no son capturas del navegador**, y sus materiales e iluminación son aproximados.

## Límites que conserva la versión

La visita salta entre puntos de observación y permite orbitar alrededor de ellos. No se promete todavía un sistema de circulación peatonal con colisiones, escaleras accesibles o comprobación del estado de apertura de cada sector. Las alturas arquitectónicas, reparaciones, forma exacta de algunas cubiertas y detalle de los aparejos necesitan un levantamiento más preciso para aumentar su fidelidad. Las lagunas documentales se hacen visibles en el texto y en los metadatos del modelo, en vez de rellenarse con una reconstrucción total presentada como cierta.
