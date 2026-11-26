# Plaça Major · contexto cartográfico y plano de visita (V10)

> Actualización de 26 de noviembre de 2026: los ocho cuerpos de las parcelas 3558301 y 3558302 conservan sus coordenadas, pero pasan a la arquitectura compartida de Plaza Mayor para abrir los soportales 7–8 y 9. Véase [cierre sur y contrato de sustitución](plaza-mayor-south-front.md). Los recuentos de 13 fachadas y 44 cuerpos protegidos, y los comandos y resultados que siguen, documentan la versión histórica V10. El estado actual y su pavimentación compartida se verifican en la [revisión del conjunto](../docs/PLAZA_SANTA_MARIA.md).

Revisión: 19 de noviembre de 2026. Esta nota documenta los nuevos pavimentos, calles, volúmenes de contexto y plano interactivo de la plaza. La arquitectura principal y los contenidos históricos se describen en los informes y módulos correspondientes de la misma iteración.

## Qué se conserva y qué se añade

El conjunto incorpora **94 cuerpos catastrales de 36 parcelas próximas**, además de las fachadas principales de la plaza. Conserva los contornos y los tres patios presentes en esos cuerpos, sin trasladar casas para despejar las cámaras. Las nuevas fachadas secundarias son una representación genérica con ventanas, puertas, balcones, revocos y cubiertas. No equivalen a un levantamiento individual de cada vivienda.

El núcleo arquitectónico reúne **13 registros**: las 11 envolventes OSM existentes y las parcelas del número 17, donde se conserva la Puerta del Almudín, y del número 16, que enlaza los soportales. Sus 53 partes catastrales permiten contrastar alturas y divisiones. La finca 17 tiene dos cuerpos separados en la cartografía: se conservan como dos envolventes. Por ello, el número de cuerpos de ese núcleo es distinto del número de registros.

La selección protege las huellas de Santa María, su contexto V9, la judería y los demás monumentos existentes. **Los 44 cuerpos de 16 parcelas de Santa María siguen en su módulo anterior**. No se han incorporado de nuevo a este contexto, ni se ha modificado su geometría. Los viales y pavimentos que ya le pertenecían se usan como límites de la nueva pavimentación.

## Fuentes cartográficas utilizadas

| Capa | Uso en esta iteración | Límite de interpretación |
|---|---|---|
| [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/) · municipio 46222 | Partes edificadas, patios, número de plantas, correspondencia entre parcelas y fincas de la plaza. Se reutiliza la selección ya presente en `cartography.json`, cuya fecha de origen figura como 21-08-2026. | Es un producto derivado, no cartografía catastral oficial. La descarga de esta sesión no certifica el estado actual de cada fachada. |
| [OpenStreetMap · área 733042234](https://www.openstreetmap.org/way/733042234) y área 733042235 | Contorno peatonal, plaza, Peixateria, ejes de Carrer Major y Carrer del Castell y accesos. | Los anchos no etiquetados se interpretan. La gran área 733042234 también cubre conexiones meridionales; no es exclusivamente la plaza rectangular. |
| [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) | Alturas relativas de cubierta ya muestreadas en los datos del atlas. | Son estimaciones procedentes de la primera cobertura LiDAR y no mediciones nuevas de cornisa o cumbrera. |
| [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma) | Colores de cubierta conservados de las muestras del atlas y apoyo visual de contexto. | La fecha de vuelo no está verificada aquí. El color no acredita la forma exacta de cada faldón. |
| IGN MDT y malla final del atlas | Cota final de calles, plaza, arranque de muros y puntos de observación. | La triangulación de visualización y los ajustes junto a cimentaciones son una integración visual del modelo; no un levantamiento topográfico nuevo. |

Los edificios del contexto no se han descargado otra vez ni sustituido por polígonos dibujados a mano. El script `research/validation-v10/prepare_plaza_context.py` copia sus coordenadas y huecos de la fuente del atlas. Las uniones de las nuevas fincas 16 y 17 y los recortes de pavimentación se declaran expresamente como geometrías derivadas.

## Corrección de la localización del Almudín

La consulta del [Plan Especial de Protección municipal, tomo I](https://aytosagunto.es/media/y1zhyqmy/04-95pl_tomoi_opt.pdf), página PDF 133, identifica **Plaça Major 17, manzana 34596, parcela 11**. La ficha describe una puerta pétrea ancha con arco carpanel y escudo cuatribarrado. Las fotografías institucionales de [Rutas Jaume I](https://www.rutasjaumei.com/es/que-ver-en-sagunto/220/plaza-mayor-de-sagunto.php) muestran la placa 17 y sitúan el portal en la pared interior del soportal. Se consultaron como referencia de modelado; no se añaden como galería al producto.

El antiguo registro OSM 844866517 corresponde a otra casa de la secuencia, el número 13, y no debía sostener el portal. La incorporación de la finca 17 y de su vecina 16 corrige esa omisión cartográfica del núcleo anterior.

| Finca | Registro del núcleo | Correspondencia catastral | PEP, página PDF |
|---|---|---|---|
| Plaça Major 17 · portal | `core-3459611YJ3935H` | 3459611YJ3935H · cinco partes | 133 |
| Plaça Major 16 | `core-3459612YJ3935G` | 3459612YJ3935G · tres partes | 134 |
| Plaça Major 15 | 844866519 | 3459613YJ3935G | 135 |
| Plaça Major 14 | 844866518 | 3459614YJ3935G | 136 |
| Plaça Major 13 | 844866517 | 3459615YJ3935G | 137 |
| Plaça Major 12 | 844866516 | 3459616YJ3935G | 138 |
| Plaça Major 11 | 844866515 | 3459617YJ3935G | 139 |
| Plaça Major 10 | 844866514 | 3459618YJ3935G | 140 |
| Plaça Major 5 | 844866524 | 3559101YJ3935H | 179 |
| Plaça Major 3 | 844866522 | 3559102YJ3935H | 180 |
| Plaça Major 2 | 844866521 | 3559103YJ3935H | 181 |
| Plaça Major 1 | 844866520 | 3559104YJ3935H | 182 |
| Plaça Major 4 | 844866523 | 3559105YJ3935H | 183 |

Las cabeceras de las fichas orientales se comprobaron visualmente: el OCR confundía varios números. El orden de las páginas del catálogo sigue el de las parcelas, que no coincide con el orden de numeración de las casas.

La unión catastral del número 17 contiene un cuerpo delantero de unos **32,88 m²** y otro posterior de unos **154,92 m²**, con una separación de **1,29 m** entre ambos. Se conserva esa separación en `secondaryFootprints`. No se construye una envolvente convexa que rellene el hueco, ni se deduce de ella una sala histórica del almacén. La identificación documental del portal no acredita el plano de los antiguos interiores.

La referencia al **Forn de la Plaça, casa número 6 en una fotografía del catálogo de 1985**, no permite asignar con seguridad una finca vigente. La visita lo trata como memoria sectorial. La hipótesis inicial de situarlo en una de las fachadas orientales se descartó al contrastar sus fichas. No se altera una vivienda del contexto conservado de Santa María ni se inventa el interior de un horno.

## Selección, exclusiones y pequeños desacuerdos entre fuentes

La selección toma los cuerpos a menos de 24 m de las envolventes del núcleo. Elimina los cuerpos que pertenecen al propio núcleo, los que invaden de forma apreciable las huellas protegidas y las duplicaciones OSM que coexistían con Catastro. Las listas de exclusión se pasan al generador de ciudad para que éste no dibuje un segundo volumen genérico sobre la geometría detallada.

La selección no altera polígonos para ocultar diferencias entre cartografías. En los límites entre las envolventes OSM y las partes catastrales queda una intersección acumulada de **0,766 m²**, repartida en discrepancias menores de 1 m² por parte. Frente a las huellas protegidas queda una intersección numérica acumulada de **0,013 m²**. El informe geográfico mide esos valores y verifica sus umbrales. Son diferencias de borde entre fuentes, no parcelas enteras duplicadas. Retener el contorno fuente es preferible a desplazar una casa o recortarle una franja sin evidencia métrica adicional.

## Pavimentos y elevaciones

El plano de la plaza procede de la parte septentrional del área peatonal OSM 733042234, separada de la conexión meridional mediante un recorte documentado en latitud 39,679225. El modelo del pavimento mantiene además los accesos meridionales y el área de Peixateria. Las superficies se recortan contra los pavimentos y las huellas protegidas de Santa María; no se extienden sobre la iglesia o sus cuerpos vecinos.

Diez tramos de calle conservan los ejes OSM. Los ejes que continúan fuera del ámbito detallado se recortan localmente, pero **no se excluye su vía completa** del contexto general. Las vías sustituidas íntegramente sí figuran en `excludedRoadIds`. Esto evita que desaparezca una calle lejana al mejorar sólo su llegada a la plaza.

`bindGround(finalHeightAt)` reconstruye el contexto después de generar el terreno final. Los vértices del pavimento se consultan sobre esa malla, no sobre una cota plana de la plaza. Se subdividen las caras que cruzan una arista de cimentación para impedir que el suelo atraviese la pavimentación. Las cintas se estrechan al llegar a huellas ocupadas, manteniendo su eje original.

Los 94 cuerpos de contexto tienen alturas atribuidas: **51 usan la estimación IGN y 43 el número de plantas**. No se ha necesitado una altura de reserva arbitraria. La altura de cubierta se mantiene respecto a la referencia de terreno fuente; el arranque de los muros se adapta al terreno final. La validación no detectó ninguna elevación adicional de cubierta necesaria para evitar su enterramiento. Los perfiles de tejado y las fachadas secundarias siguen siendo interpretativos.

## Plano interactivo y encuadres

`drawPlazaMayorMap` utiliza el plano serializado antes de disponer de WebGL y el plano del modelo cuando ya está creado. Su extensión incluye las parcelas circundantes, las calles de llegada, el contorno de la plaza y las 16 paradas. Conserva la orientación geográfica norte arriba y una escala métrica.

La separación de marcadores mantiene legibles los puntos próximos: cuando debe apartar un número, dibuja un enlace a su coordenada real. La parada seleccionada conserva la posición geográfica. Cada marcador dispone de su zona de selección, y el contraste del texto se comprueba en las dos paletas. El dibujo mantiene los huecos de patios y diferencia el núcleo, la pavimentación y los edificios de contexto. Los colores de lectura histórica proceden de la misma leyenda de la visita.

Los cuatro puntos que aporta este módulo son Peixateria, Cavallers, Carrer Major y Carrer del Castell. Sus posiciones se refieren a ámbitos públicos cartografiados; no afirman la huella exacta de un edificio desaparecido. Los encuadres de Peixateria y Cavallers se orientan por sus corredores abiertos, evitando las fachadas septentrionales y las cubiertas del Sagrari sin desplazar esos edificios.

## Recursos e integración

El grupo del contexto trabaja en coordenadas mundiales. Expone sus exclusiones, listas de IDs, componentes de plano, puntos de observación, estadísticas y recursos propios. El ensamblador cívico agrega esos elementos al modelo principal y conecta los cambios de selección y de lectura histórica.

Las texturas, materiales y geometrías pertenecen a cada instancia. Volver a asociar el terreno sustituye y libera la geometría anterior sin acumular recursos. Eliminar una instancia no invalida los materiales de otra. La lectura por épocas y el resaltado restauran el color y la textura originales al desactivarse.

## Comprobaciones y evidencia

Los comandos se ejecutan desde la raíz del proyecto:

```bash
python research/validation-v10/validate_plaza_context_geography.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v10/validate_plaza_context.mjs
```

La primera prueba comprueba la identidad de los contornos y huecos, la separación entre propietarios de geometría, la permanencia del contexto de Santa María, las sustituciones de calles y la finca del Almudín. La segunda construye el contexto junto con los modelos cívicos y religiosos y lo asocia al terreno final. Comprueba geometrías finitas, procedencia de alturas, estado y liberación de materiales, continuidad de pavimentos y líneas de visión de sus cuatro puntos.

El control de pavimentos evalúa los centroides de los **5.720 triángulos superiores**: no detectó intersecciones con el terreno ni caras flotantes. La holgura obtenida fue de aproximadamente **0,055 a 0,227 m**, incluyendo las pequeñas acomodaciones en aristas del terreno. Las cifras de detalle quedan en el JSON de QA para poder revisar una eventual modificación posterior.

El plano se comprueba y se guarda en seis imágenes: minimapa de 460×240, plano de escritorio de 1100×700 y plano móvil de 300×320, cada uno en paleta clara y oscura. Los 16 puntos conservan su área de selección; el texto de todos los marcadores alcanza al menos 4,5:1 de contraste. La inspección visual confirma que el plano móvil sigue siendo legible y que el entorno permanece incluido en el encuadre.

La regresión integral de V10, mantenida por el integrador principal, verifica además las cámaras reales de la aplicación en escritorio, móvil vertical y móvil horizontal, los demás monumentos, la exclusión de duplicados del generador urbano y la liberación al cambiar de región. Los informes incluyen hashes de las entradas para identificar qué versión se validó.

Resultado de cierre: **16/16 comprobaciones geográficas y 274/274 de contexto/Canvas**, sin fallos. La regresión integral termina correctamente con **102 encuadres de la plaza sin oclusión** y conserva los 102 encuadres comprobados de Santa María. El gate estático definitivo pasa **265/265 comprobaciones** sobre 48 archivos JavaScript, 89 dependencias locales, 61 JSON, 27 peticiones iniciales, 16 diferidas y 109 IDs de HTML. No queda ninguna página temporal de pruebas dentro de la distribución.

### Archivos de evidencia

- `research/validation-v10/plaza-context-geography-qa.json`
- `research/validation-v10/plaza-context-qa.json`
- `research/validation-v10/plaza-map-*.png`
- `research/validation-v10/sagunto-regression.json` · integración completa
- `research/validation-v10/static-assets-qa.json` · distribución final

Esta iteración mejora la correspondencia cartográfica y la lectura visual de la plaza. Mantiene visibles los límites de la documentación: no ofrece fotogrametría, un plano medido de interiores privados, una restitución completa del almacén desaparecido ni una certificación de transitabilidad peatonal.
