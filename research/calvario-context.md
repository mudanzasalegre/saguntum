# Calvario de Sagunto: contexto geográfico y plano de visita

## Alcance de la ampliación V12

El recinto, la ermita, las estaciones y su camino serpenteante corresponden al módulo `calvario.js`. El contexto conserva la relación entre ese recinto y las viviendas y calles que lo rodean. Su selección procede de la cartografía ya atribuida en el atlas; no se ha sustituido por una disposición genérica de casas.

Se incorporan **156 cuerpos edificados de 60 parcelas catastrales completas**, con **tres patios** conservados. El ámbito de selección es el perímetro cartografiado del Calvario ampliado 30 m. Una parcela entra por su centro o por la mayor parte de su superficie, y mantiene todos sus cuerpos. Se descartan las parcelas que corresponden a monumentos o propietarios detallados anteriores.

Los modelos de Santa María, Plaça Major, judería, Teatro, Castillo y demás monumentos permanecen bajo sus propietarios existentes. La selección protege 521 huellas o componentes anteriores y excluye del caserío genérico las nuevas partes y cuatro duplicados OSM identificados por solapamiento. **No se introducen parches planos de cimentación doméstica**: las viviendas siguen la ladera y conservan sus huellas y patios.

## Fuentes y grado de fidelidad

| Elemento | Procedencia | Alcance |
|---|---|---|
| Huellas, cuerpos y patios | Dirección General del Catastro, INSPIRE Buildings, municipio 46222 | Partes cartográficas conservadas sin alterar sus coordenadas. Metadatos de la descarga del atlas: 21 de agosto de 2026. |
| Calles exteriores | OpenStreetMap, colección cartográfica atribuida del atlas | Se conservan sus ejes; los tramos se recortan al área de detalle. |
| Relieve | IGN MDT empleado por el atlas | Se sigue la triangulación de 2,5 m existente, sin sustituirla por una plataforma plana. |
| 71 alturas | Estimaciones de superficie IGN MDS normalizado conservadas en los datos | Datos derivados de cobertura LiDAR; no son mediciones contemporáneas de cada fachada. |
| 85 alturas | Número de plantas catastrales | Aproximación de 3 m por planta, con los límites visuales del renderizador compartido. |
| Color de cubierta | Muestras de la ortofotografía PNOA del atlas | Color de referencia. Los faldones y las cumbreras son interpretativos. |
| Ventanas, puertas, revocos y balcones | Composición arquitectónica interpretativa | Detalle visual de contexto, sin atribuir una distribución medida a cada vivienda. |

No hay alturas de reserva sin fuente. El renderizador aplica su mínimo visual de **2,5 m** a cinco cuerpos con estimación fuente de 2 m. Además, dos cuerpos bajos sobre laderas pronunciadas necesitan pequeñas correcciones de visualización de la cubierta para evitar su intersección con el MDT triangulado: aproximadamente **0,195 m** y **0,470 m**. Estas correcciones no modifican los datos fuente, las huellas ni el terreno y quedan identificadas por cuerpo en el informe de QA. Las cubiertas de parcelas con patios mantienen sus huecos.

### Referencias de datos

- [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/).
- [OpenStreetMap: ermita del Calvario](https://www.openstreetmap.org/way/733104780).
- [IGN: MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).
- [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma).

La procedencia detallada de las alturas y los colores permanece en cada registro catastral del contexto, junto con su tabla de códigos `provenanceTextCodes`. La fecha de vuelo de la ortofotografía no está verificada. Los productos derivados del atlas no constituyen información catastral oficial ni un levantamiento actual de todas las fachadas.

## Accesos y pavimento exterior

Se representan diez tramos de calles exteriores, entre ellos Padre Torralva, traviesas de Sant Ramon, Amalia Danés, Alcoy y Detrás de la Escuela. Dos ejes completos se sustituyen en el caserío genérico; en los demás se conserva la continuidad externa del atlas y solo se detalla el fragmento del ámbito.

Las anchuras sin etiqueta OSM son interpretativas. Las franjas de las calles se unen antes de triangular, se recortan contra edificios, patios, recinto del Calvario y pavimentos de las visitas anteriores. El resultado exterior ocupa aproximadamente **1.052,48 m²**, con **1.133 triángulos** y **976 vértices**.

Cada cara se corta por las mismas diagonales de la malla del terreno de 2,5 m. Los vértices siguen la altura final más una holgura gráfica uniforme de **10,5 cm**; esa separación evita el conflicto visual entre dos superficies y no afirma una elevación medida del pavimento. Solo se generan caras laterales en el perímetro, no entre franjas interiores. La cobertura calculada no invade el recinto ni rellena patios privados.

El camino del vía crucis y las estaciones son propiedad exclusiva del modelo del Calvario. Estos diez tramos exteriores **no constituyen un nuevo itinerario devocional** ni añaden estaciones.

## Plano interactivo

`drawCalvarioMap` representa la geometría del plano específico del Calvario, sus componentes y las coordenadas finales de las paradas. El ascenso serpenteante se destaca con una línea de mayor grosor; los muros tienen una jerarquía secundaria. Las curvas de nivel de **5 m**, calculadas sobre el MDT, ayudan a leer la ladera en el plano ampliado.

Las **18 paradas temáticas** de la visita no se confunden con las **14 estaciones devocionales**. Cuando las paradas cercanas a la ermita se superponen en una pantalla pequeña, sus marcadores se separan y se conectan al punto geográfico mediante una guía. El marcador seleccionado mantiene su ubicación real. Se utilizan las dos paletas del atlas, escala métrica y orientación norte.

La lectura por capas usa `readingLayer` y los mismos cinco colores anunciados en la leyenda y aplicados al modelo: camino, arquitectura de la ermita, cerámicas, conservación y paisaje. `period` conserva por separado la información cronológica. Los 18 marcadores mantienen el color de su categoría, incluso al seleccionarlos; un doble aro dorado identifica la selección. Las parcelas y calles exteriores permanecen neutras, sin atribuirles una categoría histórica del Calvario. La prueba Canvas comprueba los colores efectivamente dibujados de cada marcador, las 156 parcelas y los diez segmentos exteriores en las seis variantes.

## Arquitectura y recursos

`calvario-context.js` reutiliza el renderizador de viviendas y pavimento probado en la judería, mediante un adaptador con datos, identificadores y recursos propios. Esto conserva el mismo tratamiento de fachadas, materiales y pendientes en barrios contiguos sin duplicar otro motor de caserío. El módulo de la judería no se modifica.

Cada instancia mantiene sus propios materiales, texturas y geometrías. `bindGround` elimina y reemplaza los recursos de las superficies anteriores antes de volver a construir sobre el terreno final. Los cambios de lectura restablecen los materiales iniciales al salir de la vista por capas.

## Verificación reproducible

- `research/validation-v12/prepare_calvario_context.py`: selección de parcelas y calles; llama a la preparación del pavimento.
- `research/validation-v12/prepare_calvario_pavement.py`: unión, recorte y triangulación sobre el terreno.
- `research/validation-v12/validate_calvario_context_geography.py`: conservación de fuentes, parcelas completas, patios, propietarios previos y ejes viarios.
- `research/validation-v12/validate_calvario_context.mjs`: geometría finita, ajuste al relieve, materiales, ciclo de vida y mapas en escritorio/móvil y ambas paletas.

Los informes JSON registran los hashes de entrada. La validación visual de los renders del núcleo y el entorno se documenta por separado; las pruebas de geometría y Canvas no acreditan el rendimiento de WebGL en un dispositivo real.

### Resultados de la validación del contexto

| Comprobación | Resultado |
|---|---:|
| Conservación geográfica y propietarios | 26/26 correctas |
| Geometría, recursos y plano Canvas | 282/282 correctas |
| Mallas / triángulos de contexto | 26 / 24.895 |
| Muestras de caras y aristas del pavimento | 4.532 |
| Error máximo respecto a la holgura sobre el terreno | 0,0000044 m |
| Variantes Canvas inspeccionadas | Seis: dos temas × minimapa, plano de escritorio y plano móvil |
| Paradas seleccionables en cada variante | 18 |
| Contraste mínimo de las etiquetas de paradas | 5,10:1 |

En los planos ampliados se dibujan 398 segmentos de curvas de nivel. Los muros y el camino se representan como líneas abiertas; los casalicios interpretados aparecen como cuadrados sin numerar, diferenciados de los círculos numerados de la visita temática.
