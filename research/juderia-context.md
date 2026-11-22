# Judería y Portalet de la Sang · entorno cartográfico y plano V11

Revisión del 19 de noviembre de 2026. Este dossier documenta las calles, los edificios de contexto y el plano interactivo del barrio. El núcleo arquitectónico del Portalet, las viviendas inmediatas y la investigación histórica tienen sus propios dossiers.

## Ámbito y fidelidad

La ampliación incorpora **344 partes edificadas de 146 parcelas** del barrio y su entorno inmediato. Conserva sus coordenadas y los **tres patios** presentes en esas partes. El núcleo detallado se prepara por separado: **12 parcelas y 40 partes catastrales**, con sus uniones, posibles componentes separados y todos los datos originales de altura a disposición del modelador.

Las nuevas fachadas de contexto tienen huecos, puertas, zócalos, balcones, cornisas y cubiertas. Estos detalles son interpretativos. No se afirma que cada ventana reproduzca una fotografía actual de su vivienda. El proyecto conserva el tamaño, posición y subdivisiones de las huellas cartográficas, mientras utiliza estimaciones explícitas para elementos no medidos.

La selección corresponde al contorno de barrio OSM conservado en `landmarks.json`, ampliado 14 m. Este contorno delimita el área de trabajo y la vista de conjunto; **no representa un levantamiento arqueológico de la cerca medieval**. El contexto sólo incorpora una parte si su centro o más de la mitad de su superficie queda dentro de este ámbito. Las 22 piezas que sólo rozaban el borde permanecen en el generador general del atlas.

La documentación municipal y turística describe los ejes de Sang Vella, Segovia, Rams, Antigons, Teatro Romano y Pere Cartagena. Las calles se incorporan usando sus ejes OSM existentes, no dibujando una trama medieval imaginada. La denominación histórica Placeta de la Jueria no se asigna a la pequeña área peatonal de Pere Cartagena: la ubicación de ese nombre requiere un contraste distinto.

Fuentes institucionales de contexto:

- [Ayuntamiento de Sagunto · Barri de la Jueria, proyecto Xiuxiueig](https://www.sagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/barri-de-la-jueria/).
- [Rutas Jaume I · Judería de Sagunto](https://www.rutasjaumei.com/es/que-ver-en-sagunto/218/juderia-de-sagunto.php).

## Fuentes cartográficas

| Capa | Aplicación | Límite |
|---|---|---|
| [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/) | Coordenadas de las partes edificadas, patios y número de plantas. Los datos del atlas indican fecha de origen 21-08-2026. | Producto derivado; no información catastral oficial ni comprobación del estado actual de cada fachada. |
| [OpenStreetMap, Portalet 733421700](https://www.openstreetmap.org/way/733421700) y ejes del barrio | Portal, arcos secundarios, calles y pequeño espacio público. | Los anchos no etiquetados se aproximan. Los arcos no se datan automáticamente por su presencia en OSM. |
| [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) | 172 estimaciones de altura relativa de cubierta. | Primera cobertura LiDAR; no medida reciente de cornisa. |
| Plantas catastrales | Altura estimada de otras 172 partes, a razón de 3 m por planta. | Estimación visual explícita; no levantamiento de alturas. |
| [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma) | Colores de cubierta ya muestreados en el atlas. | Fecha individual de vuelo no verificada. El color no determina la forma exacta de los faldones. |
| MDT IGN y malla final de la aplicación | Cota de arranque de muros y adaptación de pavimentos. | La triangulación y los ajustes de cimentación pertenecen a la visualización. |

No se utiliza una altura genérica de reserva en los 344 cuerpos seleccionados. Las alturas se calculan respecto al terreno de origen y el arranque de muros se adapta a la superficie final. Tras corregir la selección no hay elevaciones adicionales de cubierta para evitar enterramientos.

## Propiedad de la geometría y continuidad

Se conservan los **44 cuerpos de 16 parcelas de Santa María**, los **94 cuerpos de 36 parcelas de Plaça Major y sus 13 fachadas principales**, así como Casa dels Berenguer, el Museo, la Ermita de la Sangre, Calvario y los demás monumentos. Los polígonos completos del Castillo y del Teatro Romano se protegen también de forma explícita.

La comprobación inicial identificó un error de ámbito: dos grandes partes catastrales de la parcela `3556901YJ3935N`, correspondientes al área ya representada por el Teatro Romano, rozaban el margen de la judería. Una de 6.660 m² habría producido una cubierta artificialmente elevada por la fuerte pendiente. Se excluyeron de la selección del caserío, conservando el Teatro existente. La corrección se hace mediante la identidad y las huellas del monumento; no elevando o recortando un bloque hasta que parezca aceptable.

`selectionStats.protectedLargeRejected` registra las partes grandes excluidas y su motivo. `boundaryRejected` registra las 22 piezas descartadas por el criterio de centro o mayoría de superficie. Estas listas son trazabilidad de la selección; no eliminan esos elementos de la cartografía general.

Las exclusiones de IDs y polígonos evitan un segundo volumen genérico sobre las viviendas detalladas. Los pequeños desacuerdos de borde entre la envolvente OSM de un monumento y Catastro permanecen medidos: la intersección acumulada del nuevo contexto con las huellas protegidas es aproximadamente **0,306 m²**, y con el núcleo detallado aproximadamente **0,076 m²**. Ninguna parte supera los umbrales geográficos de la comprobación. No se mueve una vivienda para disimular diferencias entre fuentes.

## Calles y pavimentación

Se añaden **26 tramos viarios** y **una pequeña área peatonal** en Pere Cartagena. Los tramos conservan sus ejes OSM. Los accesos que continúan fuera del ámbito sólo se recortan en este módulo; el resto de la calle sigue en el generador general. Una vía sólo se excluye por completo cuando se representa completa.

Las superficies de Santa María y Plaça Major tienen prioridad. Las calles nuevas se construyen como polígonos continuos, con juntas en los cambios de dirección y unión en los cruces. La unión se recorta exactamente contra las huellas catastrales y los pavimentos anteriores. No se modifica el eje cartográfico. Cada cara resultante se corta por las diagonales de la cuadrícula real del terreno, y `bindGround(finalHeightAt)` coloca sus vértices compartidos a una misma holgura de 10,5 cm sobre esa superficie.

No se incorpora como nueva vía pública el recorrido interior, escaleras o ascensor de Casa dels Berenguer. La parada sobre el posible baño ritual sirve para leer la documentación desde el contexto exterior; no certifica una ruta accesible por un patio o vivienda privada.

## Nueve puntos de lectura del contexto

El módulo aporta Segovia, Rams, Antigons, el sector de lectura de la sinagoga, Casa dels Berenguer, el posible baño ritual, el Museo, el borde hacia el Teatro y la memoria del barrio desde Castell. El modelo principal aporta los otros siete puntos hasta completar las 16 paradas.

Los puntos temáticos de sinagoga, baño ritual y memoria no se convierten en nuevos edificios reconstruidos. Sus etiquetas y fuentes indican el grado de certeza correspondiente. Las posiciones se acuerdan entre el modelo, el archivo de visita y el plano: una misma parada tiene una única coordenada.

Los encuadres se verifican sobre las mallas ensambladas. Si una cubierta obstruye la cámara, se cambia la orientación o la altura de observación; no se traslada el edificio ni se suprime del render.

## Plano y accesibilidad

`drawJuderiaMap` admite el plano serializado antes de cargar WebGL y el plano derivado del modelo una vez construido. Conserva norte arriba y escala métrica. Diferencia edificios de contexto, núcleo, pasos y pavimentos; los patios permanecen abiertos en el dibujo.

Los marcadores próximos se separan con un enlace a su posición real. La parada seleccionada conserva su punto geográfico. Cada número tiene un área de selección independiente, y el mapa mantiene los 16 destinos en móvil. La lectura por épocas utiliza la leyenda de la visita, sin clasificar automáticamente como medieval toda la fábrica doméstica actual.

## Recursos y validación

Los materiales, texturas y geometrías son propios de cada instancia. Asociar otra vez el terreno sustituye la geometría anterior y libera sus recursos. Cambiar entre lectura material e histórica restaura colores y texturas; eliminar otra instancia no invalida la activa.

Comandos reproducibles:

```sh
python research/validation-v11/prepare_juderia_context.py
python research/validation-v11/validate_juderia_context_geography.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v11/validate_juderia_context.mjs
```

Los informes JSON guardan las huellas de sus entradas. El control geográfico comprueba identidad de contornos y patios, propiedad de los cuerpos, ejes viarios, continuidad de calles y protección de monumentos. El control geométrico comprueba alturas, pavimentos, cámaras, materiales y la restitución de recursos. El plano se renderiza en seis combinaciones: minimapa, escritorio y móvil, con ambas paletas.

Los resultados de cierre y los límites de verificación gráfica se recogen en `research/validation-v11/README.md`. Los renderizados de inspección proceden de las mallas reales; no acreditan fotogrametría ni rendimiento GPU.

### Resultado del control propio

La comprobación geográfica final aprueba **20/20** condiciones. La comprobación de contexto y Canvas aprueba **314/314**, incluyendo **54 líneas de visión** de los nueve puntos, en vista completa y próxima y tres distancias. No detecta obstrucciones por el modelo cívico, el religioso ni el terreno ensamblado. La regresión del integrador amplía esa comprobación a la cámara real de la aplicación y al generador general de ciudad.

El contexto contiene **37 mallas y 65.520 triángulos**. Se evalúan **3.366 triángulos superiores de pavimento**, sin enterramientos ni flotación, con una holgura uniforme de **10,5 cm** respecto al terreno. Se comprueban además **13.464 muestras en caras y aristas**, con un error máximo de 0,0000054 m respecto a esa holgura. Esa holgura pertenece a la composición de superficies de visualización; no es una afirmación sobre una plataforma construida sobre las calles reales.

La primera prueba había detectado 22 triángulos que flotaban hasta unos 64 cm sobre concavidades de la malla, sobre todo en Sang Vella y Segovia. La subdivisión adaptativa redujo ese error, pero la inspección visual posterior demostró que no bastaba para garantizar continuidad. El procedimiento definitivo usa una unión poligonal completa y caras recortadas sobre los triángulos reales del terreno, como se explica a continuación.

Las seis imágenes de mapa se guardan como `juderia-map-*.png`. Se inspeccionaron el plano móvil oscuro y el de escritorio claro. Los 16 marcadores mantienen sus áreas de selección; la separación mínima se verifica contra 32 px en los planos grandes/móviles y 17 px en el minimapa. Los números se contrastan contra su propio fondo en ambas paletas. Los informes exactos son `juderia-context-geography-qa.json` y `juderia-context-qa.json`.

### Corrección de continuidad detectada en el render

La revisión del render próximo de Sang Vella detectó grandes cuñas en la calzada aunque los triángulos superasen la prueba de distancia al terreno. La investigación separó dos defectos. El primero estaba en la superficie del terreno que esa prueba tomaba como referencia: 40 parches planos de cimentación de las viviendas detalladas rebajaban los vértices compartidos de la cuadrícula de 2,5 m e invadían los callejones. Una malla de pavimento puede seguir fielmente un relieve de visualización deformado; por eso aquella prueba no bastaba.

Se comparó el mismo perfil de Sang Vella, muestreado cada 25 cm, con y sin esos 40 parches. Con ellos la calzada se apartaba hasta 1,361 m del MDT; sin ellos, la separación máxima baja a 6,73 cm. La pendiente longitudinal máxima pasa de 33,0 % a 13,7 %. Las viviendas ya tenían muros anclados al terreno de origen y suelos privados ocultos, por lo que no precisaban aplanar la calzada. El agente del modelo retiró esos parches, conservando todas las huellas, bases y alturas de los 40 cuerpos. Los 31 parches de los demás monumentos permanecen.

Además, la pavimentación ya no aplica una elevación residual independiente a cada triángulo. Todo vértice situado en una misma coordenada x/z utiliza exactamente la misma cota `ground(x,z) + 0.105`. La prueba final examina **7.305 coincidencias de vértices** y encuentra una diferencia máxima inferior a 0,000004 m, dentro de la precisión de los atributos Float32. El control del perfil añade **255 muestras** y exige una separación inferior a 15 cm respecto al MDT en esos tramos. Ambas comprobaciones forman parte del resultado 314/314.

`diagnose_juderia_streets.mjs` reproduce tanto el contrafactual de los 40 antiguos parches como la solución actual sin ellos; `juderia-street-diagnosis.json` conserva el perfil, las métricas y las huellas de las entradas. La comprobación visual final se realiza sobre la nueva exportación del modelo, no sobre el render anterior a la corrección.

El segundo defecto era topológico: las franjas de segmentos independientes terminaban con normales diferentes en cada giro y dejaban cuñas de terreno sin pavimentar. Los rayos de los píxeles negros no encontraban ninguna cara de pavimento. No era una sombra de otra malla ni un problema del exportador. Se localizaron dos muestras reproducibles en coordenadas del atlas: Sang Vella `[-19.1944701,89.0549997]` y Portalet `[-0.5937627,91.7990675]`.

`prepare_juderia_pavement.py` sustituye esas franjas por buffers de polilínea completa con juntas, los une en giros y cruces, y recorta la superficie con las huellas de Catastro y de los monumentos conservados. Cada porción de pavimento tiene un único propietario: los cruces no superponen dos caras coplanares. Los faldones verticales sólo aparecen en el perímetro exterior, sin bordillos internos entre antiguos segmentos. Se mantiene la anchura de los otros 25 tramos. En el primer callejón de Sang Vella se aplica el ajuste local descrito a continuación; ninguna de las calles de esta selección tenía una anchura explícitamente etiquetada en la fuente.

La superficie final tiene 2.897,002 m². La diferencia numérica de cobertura entre polígono y triangulación es inferior a 0,0002 m²; el solape acumulado entre caras es inferior a 0,000001 m². Los dos puntos negros iniciales, dos muestras posteriores del margen de fachada y un pequeño hueco residual en la unión con Segovia quedan cubiertos tanto en la prueba poligonal como mediante rayos sobre las mallas de Three.js. El resultado y las huellas de las fuentes se conservan en `juderia-pavement-coverage-qa.json`.

La triangulación se corta por las dos mitades de cada celda de 2,5 m del terreno. Así, incluso una unión en T tiene una cota lineal idéntica en toda su arista y no sólo en los vértices coincidentes. La prueba de 13.464 posiciones comprueba esa propiedad contra `terrain.meshHeightAt`. Si cambia la cuadrícula de `terrain.js`, debe regenerarse este dato derivado y repetirse el control; no se atribuye la densidad de triangulación a una precisión topográfica nueva.

El último control de la franja junto a la fachada izquierda de Sang Vella distinguió pavimento en sombra de un pequeño margen que aún mostraba la ortofoto. El ajuste se limita al tramo OSM `1365045242`, de 24,37 m: se rellenan **13,88 m²** entre la anchura aproximada y las fachadas catastrales contiguas. El algoritmo sólo acepta bandas conectadas al callejón y de hasta 1,2 m, conserva las huellas y excluye explícitamente todos los patios. Los puntos `[-21.49068,88.57841]` y `[-20.60465,89.17919]` pasan el control de cobertura. No se amplían los otros 25 tramos. Esta adaptación local se declara en `pavingNote` y `visualFacadeInfill`; no se presenta como una medición de aceras.

La unión de ese ajuste dejó un único hueco cerrado libre de 0,117 m² junto al encuentro con Segovia. Se cerró sólo ese residuo: el criterio admite huecos de menos de 0,25 m² dentro del mismo callejón, sin intersección con edificios, patios o pavimentos anteriores. El quinto punto de regresión `[-22.417127,87.550322]` conserva esa comprobación. El resultado final es 314/314; los cinco puntos antes defectuosos encuentran pavimento en el modelo ensamblado.

**Cierre visual:** se inspeccionaron `juderia-sang-vella.png` y `juderia-portalet.png` finales, a 1.440 × 1.080 y 64 muestras. La cuña de giro, el margen adosado a la fachada y el pequeño hueco residual rastreados durante la revisión ya no aparecen. El modelo principal corrigió también las caras inferiores del arco y adaptó el drenaje a la pendiente. Las imágenes son renderizados CPU de las mallas exportadas, con materiales aproximados; el resultado no certifica fotogrametría ni una prueba de rendimiento WebGL.
