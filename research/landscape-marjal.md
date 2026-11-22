# Marjal dels Moros · base documental y modelo de paisaje

Iteración V6 del Atlas SAGUNTUM. Consulta y descarga de datos: **19 de noviembre de 2026**. Esta fecha identifica la consulta; no equivale a la fecha de vuelo de la ortofoto, a una visita de campo ni a una inspección del estado de las instalaciones.

## Alcance y resultado

Se incorpora el lugar **27, Marjal dels Moros**, en el subámbito `marjal` de Paisajes. La escena representa el humedal de Sagunto–Puçol mediante su relieve, lagunas y acequias cartografiadas, comunidades vegetales y pequeños elementos de observación. Se ofrece una visión territorial, una vista próxima de l’Estany y un encuadre a altura peatonal sobre una pasarela identificada en cartografía.

La geometría del módulo se limita a vegetación, carpintería de los observatorios, pasarelas y pequeños detalles. La aplicación principal se encarga de terreno, agua, cartografía de contexto y edificios. El módulo no añade una segunda Alqueria dels Frares: su foco dirige a la huella de contexto del CEACV.

Los emplazamientos proceden de cartografía existente. Los detalles de madera y la distribución de plantas son una interpretación, no un levantamiento topográfico o botánico. No se dibujan aves en posiciones supuestamente actuales, ni se presenta el nivel de agua como una observación en tiempo real.

## Documentación utilizada

| Fuente | Aportación al modelo | Límite de la evidencia |
| --- | --- | --- |
| [Generalitat Valenciana / CEACV, paneles de la Marjal dels Moros](https://mediambient.gva.es/documents/20550103/169924854/POSTERS%2BMARJAL%2BDELS%2BMOROS.pdf/80a6c3a4-8363-4c1d-a37d-5395c4c927ec?t=1599818503737) | Plano de estaciones de interpretación, relación entre lagunas, saladar, litoral y observatorios; comunidades de carrizo, enea y junco; papel de la Alqueria dels Frares. | El plano divulgativo no constituye un levantamiento métrico. Sus rutas ilustradas no se convierten automáticamente en caminos nuevos. |
| [Turisme Comunitat Valenciana, Marjal dels Moros](https://www.comunitatvalenciana.com/es/valencia/sagunt-sagunto/espacios-naturales/marjal-dels-moros) | Descripción del mosaico de lagunas, pastizales salinos y espacios agrícolas; orden de magnitud de 350 ha del humedal descrito. | Esa cifra no se intercambia con la superficie de una figura administrativa de protección. |
| [MITECO, ZEC ES0000148](https://iepnb.gob.es/areas-tematicas/espacios-protegidos/ES0000148_LIC_ZEC/marjal-dels-moros) | Hábitats lagunares y salinos, juncales y vegetación halófila; pertenencia a Natura 2000. | Los tipos de hábitat no localizan cada especie ni cada individuo. |
| [Generalitat Valenciana, microrreserva Marjal dels Moros-A](https://mediambient.gva.es/documents/91061501/174991043/Marjal%2Bdels%2BMoros-A.pdf/fab8cf08-7096-bcad-8ca2-0a0e1fc89870?t=1657783758282) | Vegetación del saladar y carácter bajo del relieve; permite diferenciar su porte del carrizal. | La geometría representada de la microrreserva se toma de OSM, no se presenta como deslinde oficial. |
| [Puçol Turismo, Marjal dels Moros](https://pucolturismo.es/es/lugares-de-interes/marjal-dels-moros) | Comunidades de Phragmites, Typha, juncos y plantas tolerantes a la sal. | Se utiliza su descripción natural; no se traslada al catálogo su cronología industrial. |
| [VAERSA, rutas guiadas](https://www.vaersa.com/cas/eventos/rutas-guiadas-a-la-marjal-dels-moros/) | Los itinerarios pueden adaptarse a las condiciones del humedal. | El atlas no garantiza apertura, accesibilidad ni estado físico de un recorrido. |
| [Fotografía de campo publicada en 2013](https://vamosdexcursion.blogspot.com/2013/11/la-marjal-dels-moros.html) | Referencia visual de la tipología abierta de madera del observatorio de l’Estany: niveles, escalera y barandillas. | Fuente visual histórica secundaria. No proporciona dimensiones medidas ni demuestra el estado actual. No se reproduce la fotografía dentro del sitio. |
| [OpenStreetMap, relación 1188416](https://www.openstreetmap.org/relation/1188416) | Emplazamientos y geometrías de humedal, agua, caminos, observatorios y edificaciones. | Cartografía comunitaria de cobertura variable; el límite no sustituye al oficial. |
| [IGN/CNIG, PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma) | Contraste visual de la morfología, parcelas y contexto. | El nombre del servicio no identifica por sí mismo el año de vuelo de este recorte. |

El dato de unas 350 ha se etiqueta en el catálogo como «humedal descrito por CEACV». No se utiliza como superficie del polígono OSM ni como extensión jurídica de la ZEC/ZEPA. Las figuras y extensiones territoriales no son intercambiables.

## Georreferenciación y cartografía

Se conserva el sistema del atlas: origen geográfico `[-0.278, 39.679]`, coordenada X hacia el este, Z hacia el sur y Y en metros. No se aplica exageración vertical. El ámbito local suministrado por la aplicación va de X −700 a 3660 y Z 4300 a 8100, con elipse de centro `[1480, 6200]` y radios `[2180, 1900]`.

La descarga OSM se realizó mediante la API para el rectángulo `[-0.282, 39.607, -0.237, 39.639]`. El recorte territorial de la aplicación es ligeramente mayor. El polígono utilizado como máscara de humedal procede de la relación 1188416, con contorno de la vía 161279628 y hueco de la vía 78610416. Se respetan también las exclusiones de suelo residencial, industrial, agrícola y jardines que figuran en la cartografía de contexto.

Se reconocen **17 polígonos de agua** para excluir plantas del espejo de las lagunas. Se conservan sus huecos y la marca de intermitencia cuando existe. Incluyen las vías 223352297, 223352301, 223352307, 226441792, 226441794, 226441795, 1134806025, 1134806026, 1134806029, 1134806030, 1134806031, 1134806032, 1134806034 y 1134806035, y las relaciones 14371582, 15355508 y 2998825. No se convierte toda la marjal en una lámina continua. En particular, la relación 14371582 conserva su carácter intermitente: la aplicación mantiene su lectura como terreno húmedo/ortofoto, sin cubrirla de agua permanente. No se inventan charcos parciales dentro de ese contorno, pues no hay evidencia cartográfica suficiente de su extensión actual. El foso del fortín de Grau Vell no forma parte de este conjunto de lagunas.

El relieve utiliza el archivo `marjal-elevation.json` integrado por la aplicación, con malla de 5 m. El módulo consulta `heightAt` para apoyar las plantas y los pilotes, sin modificar el relieve. La fotografía aérea usa el recorte de PNOA indicado en `marjal-orthophoto.json`, a 4096 × 3570 píxeles.

### Observatorios y elementos localizados

| Elemento | Referencia OSM | Coordenadas [longitud, latitud] | Representación |
| --- | --- | --- | --- |
| Observatori de l’Estany | Nodo 10577688162 | `[-0.2568743, 39.6189302]` | Plataforma de madera con segundo nivel, escalera y panel. Tipología basada en fotografía; dimensiones aproximadas. |
| Observatori de l’Era | Nodo 10577688108 | `[-0.2662962, 39.624475]` | Plataforma y pantalla de observación. |
| Observatori del Senillar | Nodo 1762583846 | `[-0.2562384, 39.6265731]` | Plataforma abierta de madera. |
| Observatori de les Fotges | Nodo 1762583848 | `[-0.2574107, 39.6312177]` | Plataforma abierta de madera. |
| Observatori de la Mar | Nodo 1762575183 | `[-0.2520992, 39.6248405]` | Plataforma abierta de madera. |
| Observación de la séquia de Montcada | Nodo 1762546962 | `[-0.2652026, 39.6177112]` | Pantalla baja y panel, sin torre añadida. |
| Mirador panorámico | Vía 164648414 | Centro `[-0.2612528, 39.6294029]` | Contorno del espacio cartografiado, borde bajo y panel; aprovecha la elevación existente. |
| Alqueria dels Frares / CEACV | Vía 164651541 | Centro `[-0.2664267, 39.6325262]` | Foco sobre su edificio de contexto. |

Las instalaciones menores comparten una familia formal de carpintería. Esa coherencia visual no implica que se disponga de un levantamiento independiente y reciente de cada instalación. Las plataformas abiertas evitan atribuirles pabellones cerrados, cubiertas o distribuciones interiores sin evidencia suficiente.

Las cuatro pasarelas modeladas siguen las vías OSM **164647482, 1134646148, 1134646169 y 156435561**. Su longitud total proyectada es **334.83 m**. Incluyen la pasarela del saladar, accesos de Senillar y Estany y el paso peatonal de la Gola. La anchura representativa es de 1.8–2.0 m, con tablones, vigas inferiores, apoyos, tornillería y barandillas. La longitud y alineación derivan de los trazados; anchura, sección y cotas de carpintería son aproximaciones. Cada trazado conserva una plataforma nivelada sobre el relieve muestreado.

## Vegetación y lectura estacional

Se modelan cuatro familias mediante geometría instanciada:

- **Carrizo:** varios tallos, hojas laterales y panículas; porte alto junto a orillas.
- **Enea:** tallos y hojas basales con cabezas cilíndricas pardas, diferenciada del carrizo.
- **Junco y pradera húmeda:** haces más bajos y estrechos.
- **Saladar:** grupos de bajo porte, variación gris verdosa y volumen compacto.

Las fuentes documentan las comunidades, pero no su distribución exacta actual. Por eso las matas se generan con una semilla fija y reglas explícitas: proximidad a orillas, polígono de saladar, exclusión de agua abierta, caminos, edificios, parcelas ajenas al humedal y borde del terreno. Las plantas próximas a las pasarelas tienen mayor densidad visual para que el encuadre bajo permita leerlas. Esto es una decisión de representación, no un muestreo ecológico.

La escena contiene 17,179 grupos vegetales: 1,756 de carrizo, 239 de enea, 9,347 de junco y 5,837 de saladar. Estas cifras son estadísticas de renderizado, no abundancias naturales. Las plantas no se insertan dentro de los polígonos de agua abierta ni sobre edificios. Tampoco se sugieren rutas nuevas dentro de las lagunas.

La configuración es contemporánea y no incluye una fase histórica. El nivel del agua, la vegetación y los colores corresponden a una escena explicativa estática. El contenido visible puede variar en el humedal real por estacionalidad, gestión o episodios meteorológicos.

## Navegación y contrato de integración

El módulo exporta `createMarshLandscape({heightAt, project, records, data})`, que devuelve `{group, sites}`. El sitio `marjal-moros` incluye `currentGroup`, `vegetation`, `point`, `views`, `focuses`, `stats` y los cuatro `excludedRoadIds`. La aplicación debe omitir esos identificadores del dibujo genérico de calles para no superponer una calzada a la carpintería.

Los ocho focos son Estany, pasarela, saladar, Senillar, panorámica, Fotges, Era y CEACV. La ficha incluye la colección común `observationPoints` con identificadores, rótulos, coordenadas y notas para el mapa 2D. Los otros observatorios también están representados y pueden verse orbitando. El foco de pasarela incorpora `position` y `target`: la cámara queda exactamente **1.65 m sobre el tablero**. Es un encuadre virtual; no activa una locomoción libre ni promete una ruta físicamente practicable.

Los grupos `currentGroup` y `vegetation` se separan para que la aplicación pueda controlar la vegetación sin ocultar las pasarelas. `patches` y `exclusions` se devuelven vacíos porque este módulo no altera el terreno ni sustituye edificios principales. Las superficies de agua pertenecen al sistema de paisaje de la aplicación.

## Comprobación

Validación CPU integrada ejecutada con el DEM, la cartografía y la malla visible definitivos del recorte:

- 11 mallas, incluyendo las familias vegetales instanciadas.
- 1,521,246 triángulos contando todas las instancias.
- 0 valores no finitos, 0 índices de geometría inválidos y 0 triángulos degenerados en las geometrías base.
- 17,179 raíces verificadas: 0 dentro de agua abierta, 0 fuera del humedal permitido, 0 sobre parcelas de exclusión, 0 dentro de edificios y 0 fuera de la elipse con margen.
- Apoyo de las raíces sobre el DEM comprobado con tolerancia de 1 mm.
- Altura peatonal sobre tablero comprobada por intersección vertical: 1.65000000 m.
- Construcción de la escena local en unos 0.25 s en una medición CPU de esta sesión. Es una medida puntual de creación de geometría; no es una promesa de rendimiento de navegación.

Se revisaron renders CPU de Estany y pasarela con el relieve y la ortofoto para comprobar escala, apoyos y composición. La revisión detectó huecos en las curvas de la pasarela; se corrigieron con encuentros continuos a inglete. El saladar se resolvió con tallos, ramificaciones y pequeñas copas para distinguirlo de piedras. La revisión integrada del agua, iluminación y controles corresponde a la aplicación completa.
