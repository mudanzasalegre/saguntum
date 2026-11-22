# Gerencia y ciudad jardín · paisaje y entorno V25

## Base de la representación

El recinto conserva el perímetro y el paseo principal cartografiados en OpenStreetMap y las huellas edificadas de Catastro ya incorporadas al atlas. La ortofotografía PNOA georreferenciada de 1800 × 1215 píxeles permite contrastar las cubiertas, las copas, los espacios abiertos y la red de senderos. Su consulta no demuestra la fecha de vuelo ni el estado de cada elemento en noviembre de 2026.

Las fotografías municipales del 15 de noviembre de 2023 muestran el jardín oriental recuperado: caminos claros, piezas de pavimento alargadas, islas de tierra con plantaciones bajas recientes, árboles maduros heterogéneos, bancos de madera y farolas delgadas con un cabezal horizontal pequeño. También muestran un límite de fábrica revocada clara con verja oscura. Estos rasgos informan el acabado de la nueva escena.

La apertura real de ese ámbito oriental se produjo el 16 de diciembre de 2023. Su superficie publicada de 13.433,49 m² se refiere a la intervención, no al área total representada aquí. El ámbito al oeste del paseo se mantiene como un paisaje de suelo seco y espacios abiertos, sin atribuirle una rehabilitación completa. La adjudicación paisajística de marzo de 2026 se distingue de una obra terminada.

Fuentes:

- [Ayuntamiento · apertura de la zona este](https://aytosagunto.es/es/actualidad/el-ayuntamiento-abre-al-publico-la-zona-este-de-los-jardines-de-la-gerencia/).
- [Ayuntamiento · finalización de las obras orientales y fotografías, noviembre de 2023](https://aytosagunto.es/es/actualidad/las-obras-de-la-zona-este-de-la-antigua-gerencia-de-ahm-han-finalizado/).
- [Ayuntamiento · contrato paisajístico de marzo de 2026](https://aytosagunto.es/es/actualidad/2026-03-03-adjudicado-el-contrato-para-la-restauracion-paisajistica-en-el-entorno-de-la-gerencia-de-puerto-de-sagunto/).
- [IGN / CNIG · PNOA](https://www.ign.es/wms-inspire/pnoa-ma), límites, URL y hash conservados en el JSON.
- [Catastro · INSPIRE edificios](https://www.catastro.hacienda.gob.es/webinspire/), huellas y patios originales.
- [OpenStreetMap](https://www.openstreetmap.org/copyright), perímetro, eje principal y calles del entorno.

## Propiedad y continuidad de la escena

`gerencia.js` posee los doce grupos arquitectónicos históricos. `gerencia-context.js` posee el jardín, los senderos, el acceso, el límite y los edificios vecinos seleccionados. Las 42 partes catastrales del conjunto se reservan para evitar su extrusión genérica, aunque no todas equivalen a una construcción aislada representada. El número histórico de viviendas tampoco equivale al número de cubiertas o de partes catastrales.

Los modelos del Casino, Begoña, Museo Industrial, Alto Horno, Talleres Generales y los restantes monumentos conservan sus propietarios. Para los tres contextos anteriores se restan sus superficies efectivamente dibujadas y sus copas, en vez de eliminar indiscriminadamente todo su distrito de selección. Así se evitan duplicaciones sin abrir huecos artificiales en el jardín. El jardín amueblado del Casino tiene una exclusión adicional derivada del marco de su modelo anterior.

En los alrededores se detallan 143 partes edificadas: 142 partes catastrales pertenecientes a 47 parcelas y una huella de OpenStreetMap. Se conservan sus coordenadas y patios. Las alturas utilizan la estimación MDS existente cuando está disponible; en los otros casos son aproximaciones a partir de las plantas atribuidas. Las ventanas, zócalos, cornisas y pequeños detalles del contexto son una interpretación visual.

## Suelo, vegetación y mobiliario

Las superficies se recortan contra edificios, patios de otros propietarios y áreas de los contextos anteriores. Cada polígono se divide por las celdas y diagonales de la malla regional de cinco metros; `bindGround` recalcula sus alturas sobre la malla final. Esa coincidencia numérica no implica precisión topográfica adicional a la fuente.

La red incorpora el eje principal, otros senderos registrados y pequeños enlaces contrastados visualmente. Los caminos se interrumpen contra las huellas edificadas, evitando líneas que atraviesen los chalés. La anchura y el trazado de detalle de las islas ajardinadas son aproximados; no se dispone de un levantamiento completo de fin de obra.

Las 105 posiciones de árboles conservan sus píxeles de referencia. Las formas de palmera, copa frondosa y conífera abierta son tipos visuales; no constituyen una identificación botánica de cada ejemplar. Sus alturas, extensión de copas y ramas se interpretan. Once pequeños grupos de arbustos sugieren la plantación baja del jardín oriental sin convertirla en vegetación madura. Los troncos evitan edificios y caminos; las copas pueden extenderse sobre los bordes como en la fotografía.

Las catorce luminarias usan el tipo contemporáneo delgado mostrado en las fotografías municipales; sus posiciones exactas y separación se interpretan sobre el paseo. Cuatro bancos, el acceso abierto y el vallado conservan la escala peatonal. La puerta y las piezas menores no pretenden ser un levantamiento de cerrajería.

## Plano y focos

El contexto aporta siete puntos: acceso, paseo, jardín oriental, arbolado, jardín occidental, límites y memoria. Todos son exteriores, con `floor: null`. Sus cámaras se ajustan al suelo final; la integración regional comprobará además las obstrucciones con la arquitectura completa.

El plano entrega superficies con anillos y huecos, edificios vecinos, ejes de caminos con `geometryType: LineString`, ancho en metros y árboles con centro/radio. Las capas distinguen conjunto y jardines y recuperan los materiales originales al abandonar la lectura cromática. La vegetación dispone de un grupo propio para respetar el control global del atlas.

## Comprobación reproducible

`prepare_gerencia_context.py` deriva la selección, las superficies, la triangulación y el inventario gráfico. `validate_gerencia_context.mjs` comprueba geometría, huecos, propietarios, recursos, focos, modos de lectura y ajuste al terreno. `plot_gerencia_context.py` produce el plano de contraste con PNOA; es una figura de trazabilidad cartográfica y no una captura de WebGL.

Los informes y el plano se conservan en `research/validation-v25/`. Los hashes de las fuentes se registran para identificar el estado utilizado. La revisión del render integrado y la publicación corresponden al agente principal.

## Revisión de las copas junto a las fachadas

La inspección de los interiores detectó follaje atravesando una ventana de la sala principal. El constructor limita ahora la envolvente horizontal completa de las copas según su distancia a las huellas de los edificios, con una separación mínima de 0,45 m. Se ajustan 19 copas; los 105 troncos mantienen las coordenadas trazadas en la ortofoto. También se limitan los arbustos próximos a los muros. Estas dimensiones botánicas son interpretativas y la corrección no modifica la cartografía de origen.

El plano utiliza el mismo radio envolvente limitado. La validación comprueba la conservación de los troncos, la separación respecto a las fachadas, la correspondencia entre plano y geometría y la ausencia de vértices de follaje dentro de los edificios. La comprobación final se repite con la región integrada y con una nueva imagen del interior.

