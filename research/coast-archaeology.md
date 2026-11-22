# Lugar 26 · Antiguo puerto de Arse–Saguntum

Revisión documental y de implementación: **19 de noviembre de 2026**.

Este módulo representa el yacimiento del Alter del Colomer y tres conjuntos subacuáticos vinculados al puerto antiguo. Es independiente del fortín y el poblado del Grau Vell, que corresponden al lugar 25. La fase histórica se presenta como **«Puerto romano · siglos I–II d.C.»**. No se propone una restitución integral del puerto ni una costa antigua exacta.

## 1. Documentación contrastada

| Fuente | Aportación y uso concreto |
|---|---|
| [Carmen Aranegui, *Saguntum se abre al mar*, 2021, pp. 147–167](https://www.ancientportsantiques.com/wp-content/uploads/Documents/PLACES/Spain-Portugal/Saguntum-Aranegui2021.pdf), especialmente pp. 154–156 y fig. 8 | Secuencia histórica, reorganización romana tras la segunda guerra púnica, torre de 5 × 6,8 m, calle y almacenes alargados con almacenamiento inferior y un piso superior. La restitución conserva una torre heredada de la fase republicana en una lectura parcial de época imperial. |
| [Barrachina y otros, *Excavaciones en el Grau Vell de Sagunt, 1983*, SAGVNTVM 18, 1984, pp. 205–228](https://www.academia.edu/82300790/Excavaciones_en_el_Grau_Vell_de_Sagunt_1983) | Dimensiones del enlosado —9,6 × 3,5 m—, anchuras murarias y estancias; reformas de distintas épocas. El fragmento de columna descrito no permite restituir una columnata. Las estancias visibles no se extruyen todas como si fueran contemporáneas. |
| [Carlos de Juan Fuertes, *Primera aproximación a la infraestructura portuaria saguntina*, SAGVNTVM 34, 2002, pp. 115–126](https://www.academia.edu/12369087/Primera_aproximaci%C3%B3n_a_la_infraestructura_portuaria_saguntina) | Espigón de la Gola, 22 bloques, extensión aproximada de 35 × 7,5 m, alineaciones y superposiciones. Documenta las dimensiones excepcionales del bloque 9. El enlace continuo entre las acumulaciones interior y exterior no está conservado: se representa como hipótesis discontinua. |
| [Ignacio Giner Ponce, trabajos arqueológicos subacuáticos, ARSE 36, 2002, pp. 81–97](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/320_05_trabajos_arqueologicos.pdf) | Planta de situación marina, separación entre conjuntos y extensión aproximada del Trencatimons interior de 50 × 25 m. El gráfico general orienta la relación entre costa, Gola y derrumbe exterior; no proporciona una georreferenciación reutilizable con precisión geodésica. |
| [Carlos de Juan, *El yacimiento del Grau Vell y la ampliación (fase I) del puerto de Sagunto*, PH 45, 2003, pp. 84–89](https://repositorio.iaph.es/handle/11532/393455) | Prospecciones y contexto de la arqueología subacuática. Se consultó el PDF del repositorio IAPH. No se ha utilizado como si incluyera una nube de puntos o una batimetría descargable. |
| [Ayuntamiento de Sagunto, conclusión de los trabajos arqueológicos, 11 de diciembre de 2025](https://aytosagunto.es/es/actualidad/2025-12-11-concluyen-los-trabajos-arqueologicos-en-el-antiguo-puerto-de-arse-saguntum-junto-al-grau-vell/) | Recepción de la intervención de excavación y consolidación. La noticia confirma que se entregaron topografía, fotogrametría y memoria. Ese levantamiento completo no se ha localizado en acceso público; el modelo no se atribuye su precisión. Las imágenes municipales se consultaron para reconocer materiales y coronaciones, sin publicarlas en el sitio. |
| [Universitat de València, práctica de prospección arqueológica, enero de 2026](https://www.uv.es/departamento-prehistoria-arqueologia-historia-antigua/es/novedades-del-departamento/practica-prospeccion-arqueologica-1285968927027/Novetat.html?id=1286469356303) | Referencia reciente a actividad docente e investigación sobre el yacimiento. No se utiliza para afirmar un régimen de apertura o visita libre. |
| [IGN, PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma) | Anclaje de la huella terrestre y contraste visual de orientación, entorno y costa. «Máxima Actualidad» identifica el servicio; no se ha asignado una fecha de vuelo no verificada. |

Se consultaron además la delimitación publicada en el [BOE de 2006](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2006-22780) y la noticia de las primeras excavaciones de Aranegui de 1974. El acceso al artículo de 1998 en el repositorio UV quedó bloqueado por el servidor, y la descarga de la monografía de 1982 desde el Museu de Prehistòria no se completó. Ninguno de estos dos textos inaccesibles se presenta como documento leído ni como levantamiento empleado.

## 2. Posición y trazado

El centro terrestre utilizado es **longitud −0,23494889; latitud 39,63767247**. La planta se trazó manualmente en el recorte PNOA de 1.800 × 1.335 píxeles con límites oeste −0,23575, este −0,23435, norte 39,63805 y sur 39,63725. El JSON conserva tanto esos límites como las coordenadas de los 21 trazados de muro. Se contrastó su organización con la planta publicada por Aranegui, sin convertir el calco visual en una medición arqueológica.

La proyección local coincide con la del resto del atlas:

```js
x = (lon + 0.278) * 111320 * Math.cos(39.679 * Math.PI / 180);
z = (39.679 - lat) * 111320;
```

La base terrestre toma la cota del muestreador de relieve común y añade un margen pequeño para evitar interferencias gráficas. No se ha aplicado exageración vertical. El polígono del área excavada se entrega como parche y exclusión del contexto urbano. No engloba el fortín del lugar 25 ni las edificaciones modernas contiguas.

### Emplazamientos marinos

| Conjunto | Centro aproximado `[lon, lat]` | Límite de interpretación |
|---|---|---|
| Espigón de la Gola | `[-0.23539, 39.63672]` | Ajustado al contrastar el esquema publicado con PNOA y la costa OSM actual. El arranque se sitúa aproximadamente 20 m mar adentro, conforme a la descripción de 2002. |
| Trencatimons interior | `[-0.23412, 39.63713]` | Acumulación interior diferenciada del espigón de la Gola. |
| Derrumbe exterior | `[-0.23355, 39.63661]` | Acumulación exterior; su explicación como estructura de señalización no justifica modelar un faro completo. |

Estas posiciones pueden desviarse **decenas de metros** de un levantamiento DGPS. El contraste con la máscara marina comprueba coherencia con la costa del atlas, no exactitud arqueológica. Todos los vértices de los bloques quedan dentro del agua de esa máscara. No se ha excavado artificialmente la playa para acomodar una coordenada dudosa.

## 3. Qué está documentado y qué se interpreta

| Elemento | Base documental o cartográfica | Decisión de modelado |
|---|---|---|
| Torre | Núcleo de 5 × 6,8 m y doble refuerzo de los flancos terrestres | Núcleo y refuerzos diferenciados. Coronaciones actuales irregulares estimadas. En Histórica se propone una altura de 6,5 m; no es una elevación medida. No se añaden almenas, fuego ni templo. |
| Calle enlosada | Superficie descrita de 9,6 × 3,5 m | Dimensiones conservadas, losas individualizadas y pequeñas lagunas. La posición exacta de cada losa se interpreta. |
| Muros visibles | 21 trazados visuales sobre PNOA | Mampostería de rodeno, caliza y cantos con núcleo de mortero; espesores y alturas menores estimados. El detalle de cada piedra es procedural. |
| Almacenes | Tipología alargada con dos niveles en época imperial | Tres unidades parciales sobre el ámbito excavado. El número no se presenta como inventario total del puerto. Fachadas, huecos, altura, estructura de madera y tejas se restituyen tipológicamente. |
| Interior | Función de almacenamiento, sin inventario completo de cada estancia | Ánforas de perfil romano, escalera, apoyos y mobiliario sobrio como explicación de uso. No se identifica una carga concreta ni se afirma su distribución excavada. |
| Columnas | Fragmentos arqueológicos, sin apoyo para una columnata completa | Dos fragmentos sueltos. Emplazamiento y dimensiones visuales aproximados. |
| Gola | 22 bloques y extensión aproximada de 35 × 7,5 m; dimensiones de piezas singulares | 22 grupos de bloques, con la pareja del bloque 9 y dos superposiciones legibles. Sus posiciones individuales son una adaptación; no un calco piedra a piedra de una topografía. |
| Derrumbes marinos | Ámbitos aproximados interior y exterior; el exterior del orden de 900 m² | 237 bloques geométricos ilustrativos en ambos ámbitos. Esa cifra es una decisión gráfica, no el recuento de un inventario arqueológico. |
| Enlace portuario | Hipótesis publicada sin estructura intermedia continua conservada | Trazo discontinuo y límites de ámbito. No se restituye como un muelle continuo probado. |

La vista **Actual** contiene vestigios de distintas fases. La vista **Histórica** propone solo una lectura parcial imperial con la torre anterior conservada. No se asignan las estructuras romanas a una arquitectura cartaginesa ni se combinan indiscriminadamente todos los muros tardíos en una única restitución.

## 4. Sección y lectura submarina

La fábrica exportada es `createCoastArchaeology({heightAt, project, records, data})`. Acepta registros como array, `{sites:[...]}` o mapa por identificador. Devuelve `{group, sites, stats}` con la entrada `puerto-antiguo`.

El sitio entrega grupos independientes `currentGroup` e `historicalGroup`. Este último comienza oculto. La sección se expone mediante:

```js
roofModes: ['historical']
roofLabel: 'Sección del almacén'
roofFocus: 'almacen'
```

`roof` agrupa cubierta, forjado del piso y frente superior. Al ocultarlo se ven las mercancías, los apoyos y las escaleras; al reponerlo se recupera el volumen completo. El foco `almacen` solo aparece en la fase histórica y su nota explica cómo abrir la sección. No se propone una estratigrafía costera ni un corte general del suelo.

`marine.group` contiene los restos submarinos actuales y `marine.historicalGroup` la interpretación. El control de lectura retira visualmente la lámina de agua. La fase histórica usa una etiqueta propia, **«Leer hipótesis marina»**, para evitar prometer que se están mostrando los mismos restos que en Actual.

El fondo propio del módulo tiene una base expositiva a **−5,1 m** y bancos suaves que apoyan los bloques a sus cotas aproximadas. La integración territorial rebaja el fondo genérico del mar a −8,5 m sin sustituir el MDT original. **Ninguna de estas superficies es batimetría medida.** Los bancos se introdujeron para que los bloques no aparecieran suspendidos sobre un plano. La ficha y el JSON mantienen explícita esta decisión.

El encuadre general del lugar excluye los grupos marinos para poder leer la excavación terrestre. El foco `marina` entrega un `THREE.Box3` de todos los bloques, excluyendo el sustrato; los focos Gola y derrumbe ofrecen encuadres próximos. Se mantiene navegación orbital.

## 5. Verificación

La geometría se agrupa por material con buffers indexados. El conjunto final contiene **32 mallas, 187.074 triángulos y 354.336 vértices** sumando todas las fases y cubiertas. No todas las mallas se muestran simultáneamente.

Pruebas del módulo, ejecutadas con los datos reales de relieve y registros como mapa:

| Comprobación | Resultado |
|---|---|
| Atributos finitos | Correctos |
| Índices fuera de rango | 0 |
| Triángulos degenerados | 0 |
| Estado inicial | Actual visible; Histórica oculta |
| Mallas visibles por modo | Actual 14; Histórica 18; Sección 13 |
| Máscara marina, vértices de bloques | 6.492 dentro del agua; 0 sobre tierra |
| Referencia de sección | `roofFocus: 'almacen'` válida |

Se revisaron renders CPU de la geometría real exportada: estado actual, restitución, sección interior y conjunto marino. La inspección detectó y corrigió el apoyo del fondo submarino y el encuadre conjunto de los tres ámbitos. Estos renders son comprobación geométrica y visual auxiliar; **no sustituyen una ejecución de WebGL en navegador**. La prueba de integración de la aplicación corresponde al agente principal.

Archivos de comprobación reproducibles, ignorados por el despliegue: `research/qa-v5-puerto-antiguo.mjs`, `research/qa-v5-marine-mask.mjs` y sus resultados JSON. Las fotografías, artículos descargados y recortes de investigación se mantienen fuera de `dist`; no se han publicado fotografías históricas ni municipales en el sitio.
