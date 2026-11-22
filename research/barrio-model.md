# Barrio Obrero · modelo arquitectónico V29

## Alcance y conservación del atlas

La iteración incorpora un modelo específico `createBarrio` en `dist/js/barrio.js`. Conserva el identificador territorial `barrio-obrero`, el Atlas vivo como portada, sus rutas globales y el resto de monumentos. El módulo sustituye la representación genérica del barrio sin alterar las coordenadas, las **95 referencias catastrales**, las **287 partes edificadas** ni las **siete manzanas** del ámbito heredado.

El número de referencias no equivale al número histórico de casas. Las ampliaciones, anexos y sustituciones actuales se mantienen. La fecha catastral se exporta como dato de procedencia, pero **no decide la forma histórica**: la asignación se apoya en la posición de bloque del catálogo municipal, la morfología que subsiste, las dimensiones de la envolvente y sus plantas registradas.

## Fuentes y lectura visual

Fuente principal: Ayuntamiento de Sagunto, *Catálogo de protección del patrimonio arquitectónico y urbanístico de Sagunto. N.º 2 Puerto de Sagunto*, [PDF municipal](https://aytosagunto.es/media/u1ip2u2f/03-97_catalogo_proteccion_patrimonio_puerto_sagunto_2-de-9_opt.pdf). Las páginas siguientes son números humanos de página PDF:

- **82:** secciones globales S1 y S2. S1 rotula aleros a **3,70 y 7,30 m**. S2, correspondiente al tipo V, rotula **7,00 m**. La localización de estas cotas se comprobó visualmente después de que la revisión inicial de otras láminas no las encontrase. No se debe conservar la advertencia preliminar de que todas eran cotas inventadas.
- **86:** planta general y distribución A–G de los tipos. Correlación con `record.blocks`: índices 0=A, 1=B, 2=G, 3=C, 4=D, 5=E, 6=F.
- **89:** tipo III, casas de una planta en C, D, E y F. La planta muestra el jardín delantero, el cuerpo residencial organizado mediante un paso longitudinal con estancias laterales, y el corral con dependencias en la franja interior de la manzana. Los rectángulos con diagonales en la franja trasera representan patios, no escaleras.
- **91:** tipo IV en los extremos de D y F. Dos plantas, casas emparejadas, escalera común central y cubiertas a dos aguas. La sección relaciona las dos bandas residenciales con la franja posterior. Los testeros presentan pequeños óculos y grandes paños sin ventanas domésticas repetidas.
- **92–95:** materiales y secciones. Mampostería enfoscada, pilares de ladrillo, tabiques de ladrillo, pavimento hidráulico, carpintería de madera, techo horizontal de cañizo/enlucido de yeso, forjados con viguetas de madera y revoltón de ladrillo, cubierta de teja árabe sobre tablero y mortero. Se indican jácenas de madera de 30×30 y cabios de 18×6. El modelo evita llenar las estancias con cerchas expuestas que las secciones no muestran.
- **96:** reglas de intervención que permiten redistribuciones interiores. Por ello, una planta histórica no es una descripción del interior privado actual.

La volumetría actual conserva las partes INSPIRE Catastro ya registradas en `port-workers.json`, contrastadas en el trabajo de contexto con la ortofoto PNOA. Los datos de geometría mantienen sus fuentes y sus licencias originales. No se han incorporado fotografías de terceros como texturas. Todos los materiales del modelo se dibujan proceduralmente.

## Dos interiores seleccionados

| Interior del atlas | Referencia y parte actual | Fundamento | Alcance de la interpretación |
|---|---|---|---|
| `barrio-casa-baja` | `8140503YJ3984A`, `cat-8140503YJ3984A_part2-0` | Tipo III, bloque D, p. 89 | Adaptación del paso longitudinal, habitaciones laterales y relación jardín/corral a una envolvente actual de aproximadamente 10,18 × 7,60 m. |
| `barrio-casa-alta` | `8140507YJ3984A`, `cat-8140507YJ3984A_part5-0` | Tipo IV, extremo de D, p. 91 y secciones | Cuerpo de aproximadamente 21,37 × 7,52 m, entendido como pareja con acceso/escalera central común y dos niveles. |

Estas referencias localizan las envolventes sobre el mapa; no atribuyen inventarios ni distribuciones actuales a sus ocupantes. Los planos no rotulan habitación por habitación los usos de sala, cocina o dormitorio. Esas paradas ofrecen una **lectura doméstica tipológica**, declarada en guía, metadatos y geometría. Las dimensiones de tabiques, peldaños, muebles y carpinterías son ajustes de representación. El mobiliario es discreto y no se presenta como un inventario histórico recuperado.

Las otras referencias contienen envolventes y huecos exteriores. Sus cubiertas permanecen cerradas al abrir la sección; no se simulan 95 viviendas privadas detalladas.

## Geometría y materiales

Los muros perimetrales son extrusiones perforadas. Las puertas y ventanas son huecos verdaderos y permiten ver la profundidad del muro. Los recercados, hojas de madera, cristales, alféizares y zócalos se modelan por separado; los zócalos dejan libre el paso de las puertas. Las puertas de los ejemplos interiores se abren físicamente.

Las cubiertas históricas se triangulan recortadas a cada huella actual y se dividen por su cumbrera. Los cambios de planta, anexos y azoteas actuales siguen presentes. Aleros, cornisas, chimeneas, canalones, cierres bajos y carpinterías particularizan las hileras con variaciones discretas de tono. La textura del techo interior es lisa y distinta del pavimento hidráulico.

Los jardines y corrales se generan exclusivamente dentro de las máscaras de las siete manzanas y de los intervalos libres de partes edificadas. Cuando una dependencia trasera ocupa parte del ancho, el corral se recorta al intervalo restante. No se coloca un patio encima de un anexo. En los frentes de E y F hacia la avenida 9 d’Octubre no se restablecen sistemáticamente los jardines perdidos que documenta el catálogo.

La vegetación doméstica está en un grupo `vegetation` separado, formado por los dos meshes combinados de troncos y copas. Suelos, cancelas y tapias conservan su visibilidad al apagar la vegetación.

## Sección, escaleras y cámaras

La sección retira únicamente tejados, hastiales altos y techos superiores de los dos ejemplos. La vivienda de una planta queda abierta para leer su distribución. En la casa de dos plantas se conserva el forjado intermedio, su intradós liso, el hueco de escalera, las paredes de las dos alturas y el desembarco real.

La escalera común del tipo IV tiene 20 peldaños, contrahuella de 0,18 m, huella aproximada de 0,28485 m y ancho de 1,30 m. Son dimensiones interpretadas para conectar físicamente las dos cotas modeladas. La abertura del forjado se calcula a partir del tramo; el desembarco posterior permite acceder lateralmente a las viviendas del nivel superior. El mínimo de altura libre medida mediante rayos verticales sobre cada peldaño es aproximadamente 3,30 m. La representación no afirma reproducir exactamente la fábrica interna de la escalera histórica.

Hay cuatro paradas interiores: sala, cocina y dormitorios en la casa baja, y planta alta en la casa de dos niveles. Cada una dispone de cámara normal y cercana, ambas con ojo a **1,63 m** sobre el pavimento. Las ocho posiciones se comprueban contra el modelo físico: suelo debajo, techo liso encima, radio libre de 0,30 m y trayecto visual sin paredes ni muebles hasta su objetivo.

`barrio-seccion` es una vista aérea interpretativa, con `floor=0`, `buildingId=barrio-casa-baja`, `requiresSection=true` e `interiorView=false`. Las vistas exteriores no se confunden con una planta visitable.

## Contrato de integración

`createBarrio({record, site, project, heightAt, contextData, visitData})` devuelve el grupo principal, `point` de Three.js, `views` con `offset`/`closeOffset`, `view`, `roof`, `vegetation`, parches de terreno, exclusiones y un `visit` compatible con los demás monumentos.

`visit.plan` publica desde la misma geometría:

- Siete `blocks`, 95 `buildings` con nombre/coordenadas/referencia y 287 `registeredParts`.
- Tres registros `floors` asociados a su `buildingId`.
- Habitaciones, particiones, patios y otros componentes con su capa de lectura.
- Huecos de puertas y ventanas, con posición, anchura, altura y edificio.
- Escalera, trazos de peldaños, eje y desembarco; el mapa no necesita copiar un dibujo de otro monumento.
- Quince paradas arquitectónicas. El contexto aporta las otras cinco paradas del recorrido de 20.

Capas de lectura: `edificio`, `espacios`, `construccion`, `memoria` y `entorno`. Los métodos `setSection`, `setReadingMode`, `selectFocus`, `bindGround` y `dispose` son reversibles o idempotentes. `bindGround` adapta únicamente las superficies domésticas al terreno final y puede elevar cámaras exteriores, pero no cambia la altura humana de las interiores ni sus objetivos registrados. Las cotas de edificios, plantas y focos se calculan en constructor con un datum tomado en el frente de cada parcela.

## Validación y límites

El script reproducible es `research/validation-v29/validate_barrio_model.mjs` y el informe generado es `research/validation-v29/barrio-model-qa.json`:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v29/validate_barrio_model.mjs
```

La validación independiente del modelo comprueba conservación exacta de vértices catastrales; posiciones finitas y triángulos no degenerados después de convertir a Float32; 15 paradas y 2 tipos; huecos reales; cámaras físicas; escalera y desembarco; exclusión de patios frente a anexos; semántica de sección; vegetación conmutable; reversibilidad de modos; y liberación de cada recurso exactamente una vez.

El estado congelado contiene **198 meshes combinados, 414.353 triángulos, 234 puertas de edificio, 822 ventanas/óculos, 53 jardines y 55 corrales representados**. Las cantidades son recuentos del modelo y no deben presentarse como estadísticas históricas del barrio. La carga geométrica se combina por material, bloque y edificio representativo para evitar una llamada de dibujo por cada detalle.

Esta comprobación no sustituye la revisión visual del atlas completo, que realiza la integración raíz con su terreno real, el contexto, el mapa, las rutas y los controles. Tampoco convierte la maqueta en un levantamiento topográfico o una reconstrucción exacta de interiores privados contemporáneos.

## Correcciones tras la revisión visual integrada

La revisión del render detectó un desajuste real: los jardines se habían colocado con la altura del raster en el centro de la casa, mientras la acera ya seguía el terreno final modificado por otras cimentaciones. El peor caso medido tenía un salto de 0,904 m. Se cambió el datum de las casas al frente parcelario, se retiraron los parches/cortinas de cimentación propios de los jardines y se adaptó su borde público mediante `bindGround` a la misma rasante del contexto. Desde ese borde la superficie enlaza con la cota junto a la vivienda. Las cancelas exportan su `bottomY` real y los jardines su `frontGroundY`; no se afirma que estas pendientes sean un levantamiento del lugar. Los muretes se construyen con sección vertical, evitando la inclinación accidental de una viga genérica girada en diagonal.

Se añadieron umbrales físicos de 0,50 m de fondo que atraviesan todo el espesor de muro y enlazan pavimento interior y llegada exterior. Se comprueba con rayos que no queda una franja sin suelo bajo las puertas representativas. El remate superior queda 6 mm sobre el pavimento para evitar dos superficies coincidentes; ese pequeño resalto se declara una interpretación constructiva.

Las manchas negras observadas en algunos testeros no eran únicamente sombra: una arista de contorno con ambos extremos a cota de alero omitía el triángulo de hastial al cruzar la cumbrera. Ahora esa arista se subdivide en el punto de cruce y se cierra físicamente. La QA comprueba los dos extremos de las 68 cubiertas históricas mediante 136 rayos a una cota situada sobre el alero.

La cámara de cocina muestra la encimera, su ventana al corral y el paso al distribuidor. La cámara de primera planta se sitúa físicamente sobre el rellano posterior y mira hacia abajo por la escalera, conservando el ojo a 1,63 m sobre el pavimento. Se retiraron los dos bancos superiores interpretativos, que reducían el paso, y se añadió una prueba de distancia del mobiliario a las puertas del rellano. Sala y sección conservan sus encuadres aprobados.

### Continuidad de los suelos sobre el terreno final

La comprobación sobre las caras renderizadas, posterior al primer ajuste de rasantes, encontró penetraciones de terreno de hasta 16,57 cm en dos jardines grandes: la superficie tenía solamente dos triángulos y deformar sus cuatro esquinas no seguía los cambios del terreno final. Los 53 suelos de jardín y sus caminos se teselan ahora con celdas de un máximo de 0,40 m; se generan sus caras superior/inferior y el borde exterior, sin paredes internas por celda. `bindGround` mantiene cada vértice de superficie por encima del terreno final con una holgura de 0,041 m, además de la transición hacia la casa. Las cancelas conservan su regla de rasante; la corrección no cambia parcelas, fachadas, cámaras ni composición. La prueba de integración del contexto revisa vértices, centros y lados de triángulos de todas estas superficies contra el terreno final.

El probe integrado final pasó con hash `ce04bd68202eef36c976f3d34308bb7af56ab5aa0d1517e7f39999275f6814db`: 53 jardines, 15.150 triángulos superiores de suelo y 1.818 de caminos, sin penetración de terreno en vértices, centros o lados. Los 4.770 vértices inferiores de las 53 cancelas difieren de la rasante esperada como máximo 6,08 mm, dentro de la tolerancia de 1 cm para el espesor de barrotes sobre rasante inclinada. Resultado en `research/validation-v29/barrio-ground-edge-probe.json`.

### Huecos hacia el corral y superficies de circulación

La revisión interior posterior identificó una obstrucción real: dos ventanas interpretativas de la casa baja estaban alineadas con los muros de los anexos traseros catastrales `part1` y `part3`. La ranura de la cocina no era un efecto de encuadre. Se conservan ambos anexos y se sitúan los huecos dentro del intervalo libre del corral, a x local aproximada de 2,18 m para cocina (ancho 0,78 m) y −0,92 m para dormitorio (ancho 1,06 m). Son posiciones de representación compatibles con las huellas actuales, no una atribución de huecos documentados a la vivienda privada. Treinta rayos distribuidos por las dos aberturas comprueban su paso a través de todos los muros y tabiques, incluyendo los anexos, sin obstrucción.

Las franjas negras del suelo también revelaron caras coincidentes: el desembarco duplicaba la superficie del forjado general; bajo las puertas, el remate inferior de muros y molduras terminaba exactamente en la misma cota del pavimento. El desembarco adicional se reduce a la banda de 10 cm necesaria para completar el encuentro con el hueco de escalera. Las bases de los huecos de puerta quedan 1 cm bajo el acabado, y los umbrales exteriores se elevan 6 mm. No cambian los niveles de planta, los ojos de cámara ni la circulación. La comprobación de 74 puntos bajo puertas y 9 del rellano exige una única superficie visible de apoyo; los 83 puntos pasan sin superficies coincidentes.

El modelo con estas correcciones tiene hash `1323dcc38d63e9a672c50f00cad9c8f75ce072232fc7e4bb22db3352f3b2ce6a`. Pasa las 85 comprobaciones de `validate_barrio_model.mjs`, incluidas las ocho cámaras interiores a 1,63 m. Mantiene las cantidades geométricas anteriores y no modifica la rasante, la teselación de jardines ni el contexto aprobado. Las dos cámaras se revisan mediante exportaciones locales de los meshes reales (`export_barrio_local_views.mjs`) y el mismo motor CPU usado en la inspección integrada, sin sustituirlos por imágenes generadas.

Inspección visual final realizada sobre `barrio-cocina-local-review.png` y `barrio-planta-alta-local-review.png`: la primera muestra el hueco completo de la ventana, la encimera y el paso con pavimento continuo; la segunda muestra la bajada, las barandillas y el acceso inferior desde el desembarco, cuyo pavimento hidráulico vuelve a ser visible. Las franjas negras anchas de umbrales y rellano han desaparecido. Se mantienen las sombras de contacto naturales junto a las carpinterías. Las dos imágenes corresponden al SHA anterior, con encuadres congelados.
