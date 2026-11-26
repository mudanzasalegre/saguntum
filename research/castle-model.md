# Castillo de Sagunto · modelo de la visita V50

La versión V50 mejora la silueta conservada, las fábricas, las cubiertas y los elementos reconocibles del castillo. Añade la torre telegráfica de Ciudadela, revisa los restos bajos del foro y corrige la superficie de su plataforma central. Atlas y Simulador utilizan la misma geometría, con los dieciocho identificadores de visita existentes.

Las plantas cartografiadas, las medidas publicadas y las alturas estimadas mantienen procedencias distintas. El resultado es una maqueta documentada del conjunto conservado; no equivale a un levantamiento fotogramétrico ni reúne todas las fases en una fortaleza romana completa.

El módulo es `dist/js/castle.js`. La documentación histórica y la bibliografía utilizadas por la interfaz están en `dist/assets/data/castle-visit.json`; su investigación se explica en `research/castle-history.md`.

## Qué cambia

La planta utiliza los 272 vértices del contorno de OpenStreetMap ya incorporado a la cartografía del atlas. La elevación de los elementos se calcula después de construir la malla de Sagunto. De esta manera, los caminos y superficies arqueológicas consultan el terreno realmente dibujado, con las acomodaciones de otros edificios del atlas incluidas.

La revisión visual final detectó que la cuadrícula de elevación trasladaba parte de la depresión de las excavaciones del noroeste al centro del foro. `dist/js/castle-ground.js` acomoda exclusivamente el polígono central ya utilizado por la plaza. Estima su nivel a partir del borde sur y oriental del MDT, con una transición exterior limitada a 4 m. Esa altura es una decisión de adaptación visual, no una cota arqueológica medida. Las excavaciones del templo y la basílica quedan fuera del polígono de nivelación.

El Atlas aplica esta función antes de construir la malla y el Simulador la comparte en su ajuste del relieve. La función detecta una terraza ya acomodada y conserva el muestreador final en vez de aplicar dos veces la corrección. Así la arquitectura, las superficies y la circulación consultan el mismo terreno.

Se representan los siete recintos mediante la misma envolvente y sus trazas interiores: Armas, Almenara, Conejera, San Fernando, Estudiantes, Ciudadela y Dos de Mayo. Su asignación a grupos sirve para seleccionar y encuadrar la visita. Esa división de trabajo no pretende sustituir siete polígonos arqueológicos levantados sobre el terreno.

El modelo incorpora 61 trazas interiores de muro y descarta los segmentos que duplican la envolvente cartográfica. Se omiten también las trazas de fuera del recinto que pertenecen a otras estructuras, incluido el teatro. Los muros con una altura cartográfica de cero se conservan como trazas bajas, de unos centímetros, en lugar de recibir la altura de una muralla.

La lectura arquitectónica diferencia las siguientes partes. Los cambios de V50 se concentran en siluetas, cubiertas, materiales y rasgos documentados:

| Parte | Representación | Grado de certeza |
|---|---|---|
| Murallas y divisiones | Plantas cartográficas; perfiles diferenciados, paños de mampostería y tapial y coronaciones rotas | Planta trazada; alturas, espesores y detalle de fábrica interpretados; cronología mixta por defecto |
| Adarves y coronaciones | Parapetos, merlones y aspilleras en tramos seleccionados de las defensas norte y sur visibles en fotografías | Ubicación contrastada visualmente; ritmo, pérdidas y medidas aproximadas; sin almenado uniforme de toda la envolvente |
| Puerta de Almenara | Arco apuntado, dos óculos trilobulados abiertos, coronación irregular y hojas de madera plegadas en el paso | Posición cartográfica contrastada y rasgos de fachada documentados; dimensiones interpretadas |
| Acceso principal y puerta de San Fernando | Huecos abiertos que sustituyen el volumen del muro en el punto de paso | Posición cartográfica; forma y alzado esquemáticos, sin atribuir una fecha única a sus reparaciones |
| Basílica y curia | Muros bajos cartografiados; cuatro basas bajas en el frente de la curia | Identificación arqueológica; organización contrastada; altura residual y tamaño de las basas aproximados |
| Tabernae | Secuencia de habitaciones delimitadas por muros bajos al este del foro | Planta cartográfica identificada; alzado residual aproximado |
| Templo del foro | Podio y muros bajos que distinguen tres cellae paralelas, con acceso mediante peldaños bajos | Organización documentada; alineación visual de planta y alturas residuales aproximadas |
| Suelo del foro | Plataforma central nivelada dentro del polígono existente, transición de 4 m y acabado granular sin retícula ni juntas geométricas | Nivel estimado desde el borde sur/oriental del MDT; no cota arqueológica medida ni restitución de un pavimento íntegro |
| Gran cisterna del sur | Lectura de su extensión cubierta, sin abrir un subsuelo inexistente en la malla | Dimensiones interiores publicadas; localización aproximada por alineación del plano |
| Cisterna del norte | Foco de sector y explicación documental | Sin huella georreferenciada suficientemente precisa: no se inventa una planta de excavación |
| Nueve Pilares, Conejera | Foco de recinto; fotografía, croquis y dimensiones del interior en Fuentes | No se añade una cubierta ni una envolvente exterior sin huella georreferenciada inequívoca |
| Inscripción del pavimento | Foco dentro del contexto del foro | No se fabrica un texto completo ni una disposición original de todos los bloques |
| Torre telegráfica de Ciudadela | Cuerpo cuadrado sin cubierta, zócalo, vanos norte/sur y caras este/oeste macizas; remates incompletos y ladrillo en aristas y huecos | Posición y planta de 5,7 × 5,7 m del inventario IPCE; alzado residual estimado mediante fotografías |
| Antiquarium, antiguo Museo Militar y volumen contiguo | Huellas existentes, cubiertas inclinadas de teja y hastiales | Plantas cartográficas; vertientes y silueta contrastadas; pendientes, aleros y alturas aproximados |
| Otros edificios conservados | Huellas existentes y volúmenes de cubierta esquemática | Planta OSM/Catastro y estimaciones MDS previas del atlas; detalle pendiente de levantamiento |
| Caminos | Veinte líneas cartográficas, acabado granular y escalones locales; misma máscara de superficie en el Simulador | Trazas del mapa; anchuras y acabado aproximados, sin certificar accesibilidad física |

## Fuentes y decisiones de representación

El [Plan Director municipal de 2000](https://aytosagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf) documenta los siete recintos y sus relaciones. La hoja 80 contiene el plano del foro utilizado para distinguir templo al norte, curia al noreste, basílica al oeste, tabernae al este y cisterna con pórtico al sur. Las hojas 110–112 describen las plazas y construcciones. Es un documento de su fecha, no una fotografía del estado exacto de 2026.

La curia y la basílica se identifican según la investigación arqueológica recogida en el inventario de fuentes. La maqueta conserva muros bajos y algunos apoyos del pórtico; no repone cubiertas, columnas completas, estatuas o decoración perdida. Las trazas denominadas *Roman Senate* en OpenStreetMap ayudan a situar la curia, pero no constituyen la fuente de su interpretación histórica.

El levantamiento de la puerta y de los lienzos publicado en [FORTMED 2020, DOI 10.4995/FORTMED2020.2020.11387](https://riunet.upv.es/server/api/core/bitstreams/be75bcef-e0c5-40b7-a0ee-07a2003e9627/content) permite reconocer la puerta de Almenara como una estructura específica. La malla utiliza geometría propia; no incorpora ni se apropia de una malla fotogramétrica de aquella publicación. Sus dimensiones verticales y el detalle de las dovelas siguen siendo aproximaciones visuales.

La **fotografía de la fachada de Almenara** se contrastó directamente en el [dossier SERANCO 2019, página 43, también página 43 del PDF](https://seranco.es/wp-content/uploads/2019/07/Dossier-SERANCO-2019.pdf). Esta fuente del contratista muestra el arco apuntado, los dos óculos trilobulados y la coronación irregular. Esos rasgos sustituyeron el portal genérico inicial. Los óculos son huecos de la malla, no discos negros pegados sobre un muro. La figura 10 del artículo FORTMED documenta una hoja de madera; no se ha confundido con un alzado completo de la fachada. La puerta conserva clasificación mixta en la lectura por épocas porque una fotografía de su forma no permite fechar cada reparación.

La ubicación de la puerta se obtiene del cruce del camino OSM `733215257` con el muro `733215258`: aproximadamente **−0,2762665; 39,6762149**. Esa precisión numérica sirve al alineamiento de las geometrías; no implica precisión topográfica centimétrica. El foco de la visita utiliza la misma posición.

Para la cisterna sur se utiliza la descripción medida publicada en [Civera, «Les cisternes del Castell de Sagunt», ARSE 41, 2007](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/339_010_les_cisternes_del_castell.pdf): 65,60 × 4,14 m, dos galerías y la serie central de 22 arcos, compatible con 21 pilares intermedios. La altura de bóveda documentada, 3,45 m, se conserva como metadato. No se levantan esos pilares sobre la plaza ni se dibuja el depósito abierto. El trazado visual se interrumpe en la parte ocupada por edificios actuales, cuya representación tiene prioridad.

La pequeña cisterna del flanco norte, estudiada por Aranegui en 1984, se mantiene separada. El dato de 6 × 2,9 × 4 m corresponde a ese depósito, no a la gran cisterna sur. Al faltar una localización georreferenciada suficientemente verificada, su parada dirige la cámara al sector documentado y no añade un cajón arqueológico arbitrario.

El edificio OSM `82897960` corresponde al antiguo Museo Militar en el extremo sur de la basílica. Ese volumen, el cuerpo catastral contiguo y el Antiquarium (`180732338`) reciben cubiertas inclinadas ajustadas a sus huellas. Los otros edificios conservan soluciones esquemáticas. El volumen `733215254`, junto al conjunto de la puerta de San Fernando, no recibe una atribución individual no demostrada.

La nueva torre de Ciudadela se registra en la posición del inventario del IPCE, longitud −0,281978 y latitud 39,676237. La planta de 5,7 × 5,7 m es el dato medido; el cuerpo residual de 5,8 m empleado por el modelo es una estimación fotográfica. Se construyen huecos reales en las caras norte y sur, fábricas de ladrillo en las aristas y bandas, y una coronación incompleta. No hay cubierta restituida ni mecanismo telegráfico. El interior oscuro permite leer los huecos; no se incorpora una visita interior. La noticia de un telégrafo en 1838 no fecha automáticamente este edificio, inventariado como construcción de 1849–1850 [ipce-telegrafia].

No se levantan torres completas sobre posiciones tentativas de Hércules o Penó. El nombre antiguo de un emplazamiento no debe confundirse con la identificación del edificio telegráfico conservado. Las fotografías de Laurent de 1870 y los planos militares sirven como contraste histórico; no se trasladan al estado actual todos sus edificios o proyectos.

Para Nueve Pilares se inspeccionaron la fotografía de la página 173, las medidas de la 174 y el croquis de la 177 de Civera. Esa planta interior está documentada, pero falta una correspondencia inequívoca con la posición y cota de su envolvente en el terreno del atlas. La parada de Conejera ofrece esa documentación y mantiene el foco del recinto; no introduce nueve columnas expuestas ni una cubierta arbitraria.

Los materiales se generan proceduralmente y cada instancia mantiene sus recursos. V50 separa mampostería, tapial, sillar, ladrillo, grava y teja; las coordenadas de textura tienen escala propia por material. Así los paños no comparten el mismo aparejo uniforme y las superficies de paso se distinguen de los muros. La lectura de épocas y la selección conservan la posibilidad de recuperar los materiales originales.

Las fotografías se emplean para contrastar forma y material, sin incorporarlas como texturas. La fábrica procedural, la variación de color, las pérdidas de merlones y el patrón de deterioro son aproximaciones visuales, no una copia piedra a piedra. El estado ejecutado de los caminos descrito por el Ayuntamiento en noviembre de 2025 se conserva en Fuentes; el modelo no pretende reproducir cada bastidor y junta de esa obra ni materializa mejoras anunciadas después.

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

`createCastle` devuelve un `THREE.Group`. Cada instancia posee sus materiales y sus texturas. No existe una caché compartida que pudiera reutilizar materiales o texturas ya liberados al cambiar entre Sagunto y Palancia.

`userData.visit` contiene:

- `focuses`: objeto con las 18 paradas. Cada entrada tiene `id`, `label`, `regionId`, `coordinates`, `target` como `Vector3`, `offset`, `closeOffset`, `bounds` como `Box3`, `components`, `kind` y `sourceConfidence`.
- `regions`: siete entradas con identificador, nombre, coordenadas del punto de referencia y límites geométricos para encuadre.
- `bounds`: caja de la geometría completa, sin incluir el anillo de selección.
- `stats`: procedencia, recuentos, dimensiones y límites interpretativos.
- `selectFocus(id | null)`: selecciona y resalta los componentes correspondientes; devuelve la entrada seleccionada o `null`.
- `setReadingMode('materials' | 'periods')`: aplica la lectura de materiales o de componentes históricos.
- `getState()`: devuelve `selected` y `readingMode`.
- `qa`: muestras del terreno, portales, superficies, edificios y dimensiones de la cisterna utilizadas en las comprobaciones geométricas.

`userData.ownedResources` permite al mecanismo de descarga de escenas recuperar los materiales y las texturas incluso cuando la lectura por épocas ha desactivado temporalmente `material.map`.

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

En V50, `territory-heritage-models.js` registra las superficies de los caminos del castillo en la máscara de pavimento del Simulador. La máscara deriva de las caras efectivamente construidas: evita caminos genéricos superpuestos y permite usar la misma cota de circulación. La exclusión se limita a esos recorridos; no borra el terreno natural o arqueológico del resto del recinto. Se mantienen los veinte trazados y los diez edificios cartográficos del modelo compartido, y se recompila el trabajador territorial con los mismos módulos.

## Comprobación de la versión V50

Los validadores reconstruyen la escena con los módulos distribuidos, los datos locales y la malla final de terreno. Se ejecutan desde la raíz del repositorio:

```bash
node research/validation-v50/validate-castle.mjs
node research/validation-v50/validate-castle-guide.mjs
node research/validation-v50/validate-castle-simulator.mjs
node research/validation-v50/export-castle-cameras.mjs --check
```

Los resultados actuales están en `research/validation-v50/castle-geometry.json`, `castle-guide-qa.json`, `castle-simulator-qa.json` y `castle-cameras-qa.json`. La validación V7 se conserva en su carpeta como registro histórico, pero sus recuentos no describen la nueva geometría.

- **Geometría:** 50 comprobaciones superadas. Se comprueban apoyo de superficies sobre la malla final, pasos de las tres puertas, óculos de Almenara, vanos y caras cerradas de la torre, coronaciones selectivas y cubiertas. En los 25.315 triángulos de superficie examinados no se detectan centros enterrados; la separación mínima de sus centros respecto al terreno es de aproximadamente 3,316 cm. Las comprobaciones de huecos usan rayos contra los triángulos construidos.
- **Guía:** 53 comprobaciones superadas. Permanecen las 18 paradas, los siete recintos, los 72 hechos, los 32 destinos globales y el número 15 del castillo. La bibliografía contiene 29 fuentes y la cronología 15 hitos. Las 169 referencias resuelven; los otros 31 índices de visita conservan exactamente su contenido semántico anterior.
- **Registro espacial:** los focos del modelo coinciden con las coordenadas de la guía. La vista de conjunto centra su encuadre sobre la geometría completa, sin sustituir el punto nominal del mapa.
- **Simulador:** la comparación del constructor territorial real con el Atlas registra error cero en los buffers arquitectónicos y en su transformación de posición. Se conservan los 18 identificadores, los 20 caminos y los 10 edificios. La máscara de pavimento existe y las colisiones se construyen con el modelo actualizado.
- **Cámaras:** se valida la generación desde las fórmulas reales de `app.js` y el adaptador de cámara territorial, incluyendo vistas generales y cercanas. Los informes de V50 registran muestras y dimensiones de pantalla; no se extrapolan al rendimiento de cualquier GPU.

La geometría final validada de V50 contiene 83.047 triángulos en 107 mallas, frente a los 157.516 triángulos registrados en V7. Las cifras corresponden al modelo arquitectónico, no al coste completo de la ciudad, la vegetación o el terreno. Los tiempos de construcción CPU de los informes dependen del entorno y no son una medida de fluidez en el dispositivo del usuario.

Los renders de inspección se exportan y generan con `export-castle-geometry.mjs` y `render_castle.py` dentro de `research/validation-v50`. Sirven para comprobar huecos, siluetas, materiales y apoyos. Son renders de la geometría distribuida con iluminación de inspección; **no son capturas WebGL del navegador**.

## Límites que conserva la versión

En el Atlas, la visita enlaza puntos de observación y permite orbitar alrededor de ellos. El Simulador calcula superficies de paso y colisiones a partir de la geometría; esto no certifica la accesibilidad física ni el estado de apertura de un recinto real. Las alturas arquitectónicas, reparaciones, algunas cubiertas y el detalle de los aparejos siguen necesitando un levantamiento más preciso. La cisterna norte y Nueve Pilares conservan un tratamiento documental donde falta una huella georreferenciada inequívoca.
