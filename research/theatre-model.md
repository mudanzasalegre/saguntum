# Teatro Romano de Sagunto — revisión del modelo de noviembre de 2026

## Estado representado

La escena representa el teatro conservado y rehabilitado. La revisión del **26 de noviembre de 2026** contrasta su arquitectura con plantas y secciones del proyecto de Grassi y Portaceli, documentos anteriores a esa intervención y fotografías de distintas fechas. El objetivo es que el edificio se reconozca por sus proporciones, sus vacíos, la diferencia de acabados de la cávea y su cuerpo escénico, además de por su posición en la ladera.

La geometría principal está en `dist/js/theatre.js`; su entorno inmediato se incorpora mediante `dist/js/theatre-environs.js`. `dist/js/monuments.js` mantiene la integración del teatro con el atlas. La entrada global, la marca **SAGUNTUM · Atlas vivo**, el Castillo y las demás visitas conservan su identidad.

La escena principal no muestra un supuesto teatro romano intacto ni reconstruye un estado completo de 1969. Las imágenes históricas sirven para reconocer cambios. El alzado romano desaparecido y las subestructuras se explican con su grado de certeza en `dist/assets/data/theatre-visit.json` y `research/theatre-history.md`.

## Base documental y decisiones de modelado

| Documento | Uso en esta revisión | Límite |
|---|---|---|
| Hernández, López, Pascual y Aranegui, 1993, [estudio arqueológico](https://revistas.um.es/car/article/download/68181/65651/283861) | Restricciones de radios, órdenes de asientos, accesos, planta de las exedras y esquema del subsuelo | El estudio incluye restituciones; no todas sus alturas son fábrica conservada. |
| Grassi y Portaceli, [archivo de La Casa de la Arquitectura](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933) | Plantas, secciones y alzado para relacionar cávea, escenario, pilares, pared posterior y cubierta | Cotas relativas de proyecto; la ficha no fecha individualmente las fotografías. |
| Antonio Almagro, [serie AA-013 de la RABASF](https://www.academiacolecciones.com/arquitectura/inventario.php?id=AA-013_03) | Comparación de plantas y secciones anteriores a la gran rehabilitación | La ficha remite a una publicación de 1979. No equivale al estado actual ni a una nueva medición. |
| Daniel Villafruela, [fotografía de septiembre de 1969](https://commons.wikimedia.org/wiki/File:Sagunto-1969-Amphit%C3%A9atre-RI-51-0000972.jpg) | Lectura del graderío y sus huecos antes de Grassi y Portaceli | Ya muestra un monumento transformado por intervenciones anteriores. |
| Mike1979 Russia, [fotografía del 29 de julio de 2014](https://commons.wikimedia.org/wiki/File:Teatre_Rom%C3%A0_de_Sagunt_02.jpg) | Contraste de silueta, superficies, cubierta y relación con la ladera | Referencia fechada de 2014; no acredita reformas posteriores. |
| Rjdeadly, [fotografía del 18 de julio de 2015](https://commons.wikimedia.org/wiki/File:Saguntum_rear_wall_of_theatre.jpg) | Aberturas del zócalo posterior y pasarela en el encuentro con el cuerpo rehabilitado | Referencia fechada de 2015; dimensiones y perfiles de detalle interpretados. |
| L. Roisin, [postal hacia 1920 en BIVALDI](https://bivaldi.gva.es/es/consulta/registro.cmd?id=11149) | Comparación histórica de acceso y cávea | Fecha aproximada del catálogo; no documenta por sí sola la configuración romana original. |
| [Galería de Turisme Comunitat Valenciana](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/monumentos/teatro-romano) | Contraste visual del interior y exterior rehabilitados | Fotografías sin fecha de toma indicada; las cifras divulgativas no sustituyen las medidas arquitectónicas. |
| Cartografía OSM, MDT y [ortofoto PNOA](https://pnoa.ign.es/web/portal/pnoa-imagen/visualizadores-y-servicios-web) incluidos en el proyecto | Posición, orientación, relieve y encuentro con los trazados del entorno | Exactitud de las fuentes cartográficas; detalles del paisaje aproximados. |

Las referencias completas, autorías, localizadores y fechas de consulta están en el archivo de visita. Las imágenes se consultan en sus repositorios de origen; esta revisión no redistribuye fotografías o láminas de terceros dentro del sitio.

## Proporciones: cada medida conserva su significado

Los radios arqueológicos de referencia son **8 m** para la orchestra libre y **11 m** con los niveles senatoriales; los límites de ima, media y summa cavea son **17 / 24,5 / 33,5 m**. El pórtico estudiado llega a **39,5 m**. Su diámetro de 79 m no es la anchura exterior total: el edificio incluye un segundo anillo y cuerpos laterales. El mismo estudio describe 6, 8 y 9 filas en los órdenes principales, con una organización diferente en los extremos de la parte alta. [Hernández et al., 1993, pp. 28–30](https://revistas.um.es/car/article/download/68181/65651/283861).

Se mantienen separados tres datos del cuerpo escénico: la profundidad del proscaenium de **6,40 m**, el frente escénico de **44 m** al que se refiere el estudio de la decoración y el lienzo de cierre septentrional de **57,25 m** descrito al estudiar el postscaenium. El lienzo de **52,75 m** de la publicación de 1986 no se usa como equivalente automático de los anteriores. [Hernández et al., 1993, pp. 31–33 y 38](https://revistas.um.es/car/article/download/68181/65651/283861); [Hernández, 1986](https://roderic.uv.es/rest/api/core/bitstreams/9cf42415-05d5-45ff-8e2c-966cf613200f/content).

Las secciones del proyecto contemporáneo permiten comparar **orchestra ±0,00**, **escenario +1,20** y **coronación +20,20**. Estas referencias son alturas relativas del proyecto. No se confunden con altitudes sobre el nivel del mar, ni con la propuesta arqueológica para el alzado romano perdido. [La Casa de la Arquitectura](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933).

## Arquitectura que organiza la lectura

### Cávea y remate

El acabado claro del graderío central y la fábrica rugosa de los flancos se modelan como sectores distintos. Las escaleras radiales, pasillos y huecos deben conservar su relación con esos sectores. La repetición regular se limita a los componentes donde sirve para expresar una estructura realmente regular; los límites de la fábrica expuesta reciben un tratamiento más irregular.

El remate se expresa mediante paños separados, sus pasos y sus interrupciones. La apertura axial y los extremos evitan convertir la parte alta en una corona maciza continua. El modelo no añade una columnata, un templo central o una cubierta romana superior como hechos conservados.

### Cuerpo escénico

La lectura desde la orchestra distingue la tarima, las tres exedras bajas con sus pasos, los pilares elevados, las galerías y la pared posterior. La cubierta completa la silueta contemporánea con una superficie clara inclinada y una cara inferior de madera. La escena deja de depender de una pared frontal plana que oculte la profundidad del edificio.

Desde fuera se reconoce un volumen alto y cerrado, con cuerpos laterales y aperturas contenidas. El zócalo posterior incorpora catorce aberturas físicas y una pasarela metálica que marca el encuentro entre la fábrica de piedra y el cuerpo rehabilitado. Tres rellanos se apoyan en ménsulas; el tramo principal se sitúa a la cota relativa +1,20. La disposición se contrasta con el alzado norte del proyecto y la fotografía de 2015. El tamaño de los huecos, la anchura de la pasarela y sus apoyos son interpretativos, no nuevas mediciones. [La Casa de la Arquitectura](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933); [Rjdeadly, 2015](https://commons.wikimedia.org/wiki/File:Saguntum_rear_wall_of_theatre.jpg).

El contacto con los apoyos de piedra y con el desnivel es parte del modelo. El ladrillo regular, la fábrica rugosa, la piedra clara, la tarima, los metales y la cubierta tienen tratamientos materiales diferenciados.

Los fragmentos del antiquarium se representan mediante diecisiete piezas lisas en cuatro grupos sobre la galería posterior, además de dos columnas exentas. La fotografía frontal del archivo del proyecto orienta la distribución y la escala. Las piezas son genéricas: sus contornos y posiciones menores son aproximados, sin réplicas de piezas inventariadas, inscripciones ni relieves reconstruidos. No se extrapolan a una fachada romana decorada completa. [La Casa de la Arquitectura](https://lacasadelaarquitectura.es/recurso/restauracion-y-rehabilitacion-del-teatro-romano/3a26830f-f701-4c15-9cc6-c75f14d29933).

### Entorno inmediato

El teatro se mantiene registrado en la ladera. Las trazas cartográficas, los muros de aproximación, los afloramientos y la vegetación deben relacionarse con ese relieve; no se nivela el recinto exterior como una plaza plana ni se sustituye el Castillo por un decorado añadido. La geometría del entorno distingue las bases cartográficas de los detalles interpretados a partir de fotografías. El helper construye cuatro clases de componentes: accesos, contención, roca y arbolado. El material de matorral queda reservado, sin emitir geometría. Sus mallas se vuelven a apoyar sobre el terreno definitivo sin alterarlo; los encuadres arquitectónicos no incluyen ese entorno en su caja de ajuste.

Las copas se localizan visualmente en la ortofoto PNOA consultada el 19 de noviembre de 2026. La fecha de adquisición de la imagen no está identificada. Las especies, alturas y contornos son interpretados; las vías y muros conservan sus trazados OSM, con dimensiones de detalle aproximadas. [IGN/PNOA](https://pnoa.ign.es/web/portal/pnoa-imagen/visualizadores-y-servicios-web).

## Huecos, subsuelo y capas

Los accesos y puertas se resuelven con geometría separada alrededor del hueco. Los focos de visita miran a los pasos y a las partes relacionadas; su posición no acredita que esos lugares sean accesibles al visitante real.

**Corte** retira la cubierta y la tarima contemporáneas para leer el subsuelo escénico. El esquema conserva los datos del canal del aulaeum y la cloaca, sin inventar una maquinaria completa de telón. Los restos no se presentan como una medición de cada pozo y el corte no equivale a una fase histórica completa. [Hernández et al., 1993, pp. 31–33](https://revistas.um.es/car/article/download/68181/65651/283861).

| Capa | Color | Alcance |
|---|---|---|
| `ancient` | `#d6bd8b` | Restos o trazas romanos identificables, con representación conservadora. |
| `contemporary` | `#77b8c7` | Componentes de la rehabilitación y acabados actuales representados. |
| `mixed` | `#be98d6` | Fábrica que acumula restos, consolidaciones y restituciones. |
| `interpretation` | `#929ba0` | Subsuelo esquemático y fragmentos genéricos, sin precisión de inventario. |

El cambio entre materiales y capas conserva los materiales propios de cada componente. La selección de una parada resalta sólo los elementos asociados a ella. La leyenda no es una cartografía estratigráfica piedra a piedra.

## Registro y terreno

La referencia se conserva en **−0,27795671425 / 39,67686986465** y el giro Three.js en **−0,5027 rad**. Son parámetros de registro de la maqueta; la cantidad de decimales no expresa precisión arqueológica. El centro parte del ajuste al arco cartografiado y la orientación se contrastó con el tramo recto de la escena y la ortofoto del proyecto.

`surfaceHeight(x, z, raw)` recorta la superficie de visualización bajo la arquitectura. Su finalidad es evitar que el MDT interpolado atraviese orchestra, graderíos, escena o el corte didáctico. El relieve exterior se conserva fuera de la zona tratada. `bindGround(meshHeightAt)` ajusta la seguridad de los encuadres después de construir la superficie final, incluidas las piezas del entorno.

Las huellas del teatro y las vías interiores reconstruidas por el modelo se excluyen de la extrusión urbana genérica. Así se evita superponer otro edificio o una calle sobre la misma cávea. Los identificadores de exclusión se exportan desde el módulo para que las distintas escenas usen el mismo criterio.

## Contrato de la visita e integración

```js
const theatre = createTheatre({ heightAt, project, data, visitData });
const visit = theatre.userData.visit;
visit.focuses[stopId];
visit.selectFocus(stopId);        // null limpia la selección
visit.setReadingMode('materials'); // o 'periods'
visit.setSection(true);           // false restituye cubierta y tarima
visit.bindGround(finalMeshHeightAt);
visit.getState();
```

Las **16 paradas** mantienen sus identificadores y enlaces. Los focos se vinculan a los componentes remodelados y conservan la diferencia entre vista general, detalle y subsuelo. La vista general `teatro-conjunto` usa `fitBounds: true` para adaptar el encuadre completo al espacio disponible en escritorio y móvil. Las otras quince paradas usan `fitBounds: false` para respetar su posición prevista; la guía y la geometría comparten estas marcas. El aditus y el vomitorio usan cámaras interiores a la altura de sus pasos, un campo de visión de 58° y posiciones de acercamiento propias: así el foco sigue la abertura en vez de mirar desde arriba contra la bóveda o contra las gradas. Las dos paradas del subsuelo llevan `requiresSection: true` en ambos registros. La entrada al teatro usa el foco `teatro-conjunto` del propio modelo para encuadrar la arquitectura desde el lado adecuado.

El plano se deriva de la misma transformación geográfica y se exporta a `dist/assets/data/theatre-plan.json`. Permanece disponible en la alternativa 2D cuando el navegador no puede iniciar WebGL. `theatre-visit.json` mantiene coordenadas, contenido y fuentes de las paradas; el índice territorial se regenera a partir de ese contenido.

El Simulador utiliza el mismo módulo arquitectónico a través del catálogo de patrimonio y su trabajador empaquetado. Las cámaras horneadas en `dist/assets/territory/visit-cameras.json` y `atlas-frames.json` se reexportan después del registro sobre el terreno final. Esta actualización es necesaria para que los nuevos focos se vean también en el Simulador.

Las geometrías, materiales y texturas pertenecen a su instancia mediante `userData.ownedResources`, de modo que desmontar una escena no invalida otra copia del teatro.

## Verificación de esta revisión

La revisión integrada conserva sus comprobaciones en `research/validation-v49/`:

- `validate-theatre.mjs` construye la geometría real y el ensamblaje local del teatro con el terreno final. Verifica dimensiones, huecos, superficies, focos, sección y estados de materiales.
- `validate-theatre-guide.mjs` contrasta los 16 identificadores y las 32 visitas globales con una base fija anterior a la revisión; comprueba referencias, coordenadas y marcas de cámara contra el modelo real. Guarda el resultado reproducible en `theatre-guide-qa.json`.
- `export-theatre-cameras.mjs` aplica el encuadre de la aplicación a los focos y exporta las cámaras tras enlazar el suelo definitivo.
- Los renders CPU se generan desde las mallas y matrices reales de Three.js. Permiten inspeccionar silueta y colisiones; sus materiales aproximados no equivalen a una captura del renderizador WebGL.
- La visita, las fuentes, el plano y los controles de la interfaz se revisan en la vista previa gestionada y en la publicación.

Los resultados y la procedencia de la versión publicada se registran en `docs/SITES_SYNC.md`. La validación local se centra en el ensamblaje que influye en el teatro; no necesita cargar la Glorieta distante para comprobar sus encuentros.

Durante esta iteración, el navegador disponible comunica `GL_RENDERER Disabled` y no inicia WebGL. Por ello se distingue la comprobación de la interfaz en su alternativa 2D de la inspección geométrica y los renders CPU. No se presenta esta última como validación GPU en navegador.

## Límites que permanecen

La revisión mejora una interpretación arquitectónica documentada. No es un levantamiento fotogramétrico, una nube de puntos ni un gemelo de conservación. Las irregularidades del aparejo, cada fragmento, cada reparación, el detalle de las protecciones y la vegetación exigirían documentación o mediciones adicionales para su reproducción individual.

Las imágenes institucionales sin fecha y las fotografías de 1969 o 2014 no certifican por sí solas el estado exacto de noviembre de 2026. El [IVC documenta obras posteriores en accesos y barandillas](https://ivc.gva.es/es/escena/cultura-impulsa-la-ampliacion-del-aforo-del-teatro-romano-y-nuevas-mejoras-en-el-conjunto-monumental-de-sagunto); sus anuncios y balances se mantienen fechados en la visita. El modelo no valida accesibilidad, evacuación, aforo permanente ni itinerarios físicos autorizados.
