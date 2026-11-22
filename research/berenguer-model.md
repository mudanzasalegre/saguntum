# Casa dels Berenguer y muro de Diana · Modelo V14

Fecha de revisión: 19 de noviembre de 2026.

## Alcance y registro

El modelo sustituye la casa simplificada y el antiguo muro genérico por un conjunto visitable con dieciocho focos. Se conservan la identidad global del atlas y los otros monumentos. La casa y Diana son objetos independientes de Three.js y comparten metadatos de visita, selección y lectura temática. La vista histórica de Diana no cambia las cubiertas de la casa.

El registro horizontal utiliza las seis partes de Catastro de las parcelas `3558202YJ3935G` (cuatro partes de la casa) y `3558201YJ3935G` (dos del anexo occidental), conservadas literalmente en `berenguer-context.json`. La huella OSM `733321157` sirve para el límite del conjunto y la circulación meridional. Las partes catastrales y la huella OSM no son equivalentes: no se rellena todo el ámbito con un único bloque cubierto. La pequeña pieza `3558249YJ3935G_part1-0` se conserva como volumen auxiliar de altura interpretada.

Las exclusiones de edificios se realizan por identificadores exactos. Las tres partes antes incluidas en los contextos de Santa María y la Judería se retiran allí durante la integración, evitando volúmenes superpuestos. La escena propia sustituye los pasos interiores OSM `1419209842`–`1419209846`; el contexto exterior conserva el trazado de Sagrari y la calle oriental.

El muro sigue la polilínea cartografiada con su quiebro y retorno. La cara norte tiene una longitud aproximada de 16 m en esta cartografía. La documentación municipal describe aproximadamente 15 × 4 m para el frente antiguo; esas cifras no convierten la restitución en un levantamiento métrico.

## Evidencia utilizada para la forma

Se inspeccionaron visualmente las fotografías municipales de fachada, patio, galería y muro, y las imágenes de SKRQ, especialmente sus alzados y secciones con escala gráfica de 0–5 m. Las imágenes se usaron como referencia de trabajo y no se incorporaron a una galería de la aplicación.

| Elemento | Evidencia | Decisión de representación |
|---|---|---|
| Fachada norte | Fotografías de Turismo Sagunto | Portada de medio punto con grandes dovelas; tres balcones del primer piso; tres ventanas del siguiente; cuatro huecos pequeños del desván; cornisa de ladrillo y cubierta de teja. |
| Escudo | Fotografía de la clave de la portada | Volumen pétreo legible, sin inventar un blasón detallado no cotejado. |
| Patio y logia | Fotografía de las arcadas y descripción municipal | Dos arcos rebajados con huecos reales y columna central, galería contemporánea de acero, vidrio y madera. Posición interior y proporciones son interpretativas. |
| Diferentes cotas | Descripción municipal y secciones de acondicionamiento | Patio inferior, recorrido en dos tramos y patio superior separados físicamente, con rellanos coincidentes. Las cotas internas modeladas son expositivas. |
| Aljibe | Restauración municipal de 2022 | Estancia seca de fábrica irregular, bóveda de cañón y descenso en dos tramos. No se representa una piscina ritual como certeza. |
| Anexo occidental | Intervención municipal documentada en 2025 | Envolvente parcialmente desmontada, fábricas conservadas, dos arcos y apoyos de estabilización. No se dibuja una casa intacta ni se presupone la finalización de la segunda fase. |
| Muro antiguo | Fotografías, cartografía y bibliografía arqueológica | Grandes bloques con juntas, caras desiguales y retorno; trasdós continuo para evitar agujeros espurios. La distribución exacta de cada bloque es una interpretación visual. |
| Fábricas superiores | Fotografías del muro y alzados de SKRQ | Mampostería, ladrillo, restos de mortero y piezas verticales reutilizadas, distinguidos de los grandes bloques inferiores. |
| Plaza de Diana | Proyecto SKRQ y fotografías | Grava clara, losas pétreas, roca aflorante, bancos, valla, cipreses y vid. No se añade una columnata ni una cella hipotética. |

Las fuentes principales son [Turismo Sagunto, Casa dels Berenguer](https://saguntoturismoblog.wordpress.com/2018/09/23/casa-dels-berenguer-de-sagunto/), [SKRQ, plaza del Templo de Diana](https://skrq.es/es/diana.html), [Ayuntamiento, conservación de 2022](https://aytosagunto.es/es/actualidad/el-ayuntamiento-consolida-y-restaura-el-muro-del-templo-de-diana-y-la-mikve-de-la-casa-dels-berenguer/) y [Ayuntamiento, primera fase del anexo en 2025](https://aytosagunto.es/es/actualidad/2025-08-04-concluye-la-primera-fase-de-las-obras-en-el-inmueble-anexo-a-la-casa-dels-berenguer/). La investigación histórica completa, sus identificadores y sus localizadores figuran en `berenguer-history.md` y `berenguer-visit.json`.

## Forma, materiales y rendimiento

Las arcadas y el portal se extruyen con agujeros en la geometría; no son manchas oscuras dibujadas sobre una pared maciza. La puerta de madera está retranqueada dentro de su hueco. Los balcones incluyen losa, pasamanos, barrotes y retornos laterales. Los huecos tienen jambas y carpinterías; la galería incorpora soportes metálicos y vidrio.

Las cubiertas contienen faldones y canales de teja modelados, aleros, cornisa, cabios y piezas de madera. El muro tiene 70 bloques grandes en la interpretación geométrica actual, además de calces y fábrica superior; este número es una estadística del modelo, no un inventario arqueológico. Sus caras se desvían ligeramente del rectángulo y varían en color. Un núcleo de mortero cierra las juntas, evitando agujeros de luz artificiales.

Las texturas procedurales son originales. Añaden poro, grano, vetas y juntas mediante color y relieve superficial; no se usan fotografías descargadas como texturas de fachada. Los materiales vuelven exactamente a sus colores, mapas y mapas de relieve originales después de la lectura temática.

La geometría se agrupa por componente, tema y material para reducir llamadas de dibujo. La primera revisión final del núcleo tiene 115 mallas y aproximadamente 106 mil triángulos, contando los objetos alternativos de la lectura histórica. Sólo una representación arqueológica se ve a la vez. Las cifras pueden variar ligeramente tras la revisión visual final y se publican en el informe de validación.

## Sección y vista histórica

`createBerenguer()` expone `group.userData.visit`, `roof`, `setSection()` y `dianaSite`. Este último contiene `group`, `remains`, `reconstruction`, `hypotheses`, `views`, `historicalMask`, `point` y los textos de interpretación. Sus mallas se incluyen en las mismas listas de selección que las de la casa, sin cambiar su parentesco.

El corte de la casa retira las cubiertas, el forjado que oculta el aljibe, una mitad de la bóveda y la envolvente occidental que impedía verlo. Conserva la otra mitad de la bóveda, sus arranques, el suelo seco, la escalera y elementos suficientes para leer la estructura. El controlador general recorta únicamente el terreno y sus zócalos dentro de la máscara declarada (`clipContext:false`); no recorta los interiores recién modelados. Cerrar el corte restaura todas las visibilidades originales.

La máscara del aljibe es expositiva y está centrada en x=−89.5,z=40.5 del sistema del atlas. Tiene 8 × 11.3 m y fondo 59.05 m en el sistema de alturas del modelo. Estos valores son parámetros de integración gráfica, no medidas de excavación ni cotas publicadas del monumento.

La vista histórica de Diana aísla la fábrica antigua conservada. Una plataforma baja opcional sólo explica una posible lectura de terraza. La atribución a un templo y su cronología siguen discutidas; por ello no se reconstruye un templo completo. Se mantiene el terreno actual como contexto (`historicalMask.clipTerrain:false`), evitando un vacío artificial bajo el muro. El panel explica esta decisión.

## Cámaras y plano

El plano contiene los dieciocho puntos en las coordenadas de la documentación de visita y en las capas temáticas acordadas. Las guías se dibujan en una primera pasada y los círculos numerados después, para que ninguna línea atraviese una cifra. Los puntos cercanos se desplazan visualmente con una guía a su posición cartográfica, sin cambiar las coordenadas guardadas.

Las cámaras interiores permanecen dentro de los vacíos físicos. Sus posiciones no se multiplican por la relación de aspecto de un teléfono: hacerlo las sacaba del patio y las introducía en la fábrica o el caserío vecino. La revisión visual situó la cámara general del patio por delante de las jambas, en el hueco noreste, con un ángulo de 74° que permite reconocer las dos arcadas. La logia y el corte del aljibe usan 58°; la sección se observa desde su extremo norte y oeste para leer la media bóveda. Los encuadres generales de fachada y anexo conservan ajuste al tamaño de pantalla; se buscaron direcciones y límites concretos sobre el conjunto urbano real, con Santa María presente.

Los puntos de documentación y los puntos a los que mira la cámara son conceptos diferentes. La portada, el escudo y el muro se enfocan a su cara visible, aunque la coordenada de la parada identifique el ámbito completo. Esto evita colocar el destino dentro de una pared.

## Verificación reproducible

Ejecutar desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v14/build-berenguer-plan.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v14/validate-berenguer-model.mjs
```

El validador del núcleo comprueba atributos finitos, triángulos completos, raíces independientes, exclusiones catastrales, sincronía de dieciocho paradas, agujeros de las dos arcadas y de la portada, continuidad de las caras del muro, apertura real hasta el suelo seco del aljibe y restauración de materiales y visibilidades. Prueba también el plano en tres tamaños y la respuesta ante un contorno malformado. Los rayos se lanzan sobre la geometría construida de Three.js, no sobre fórmulas paralelas del modelo.

La revisión integrada del equipo añade el terreno final, edificios vecinos, cámaras y renderización CPU de las mismas mallas. Una imagen de Blender verifica la composición de esas mallas, pero no constituye una medición de rendimiento WebGL. La validación de navegador y los límites observados se documentan por separado en el informe integrado.
