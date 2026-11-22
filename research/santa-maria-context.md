# Santa María: calles, plazas y caserío inmediato — V9

## Alcance y fuentes

La intervención añade el entorno inmediato de la iglesia al mismo sistema local del atlas: x hacia el este, z hacia el sur, origen geográfico −0,278 / 39,679. El marco arquitectónico de Santa María mantiene el anclaje cartográfico −0,27910948 / 39,67903398 y giro de 1,173 radianes. El contexto trabaja en coordenadas de mundo; su incorporación a la iglesia conserva esa transformación.

Se seleccionan **44 partes edificadas de 16 parcelas catastrales** que delimitan la plaza de Cervantes, Cavallers y Sagrari. Las coordenadas de los polígonos y sus vacíos se copian de `cartography.json`, sin sustituir los contornos por cajas. Ninguna de las 44 partes seleccionadas contiene un anillo de patio independiente; los patios y vacíos existentes entre partes permanecen libres porque las partes se dibujan separadamente. Se excluyen de la representación urbana genérica esos 44 registros y dos huellas OSM que duplican sus volúmenes.

La selección conserva a cargo de sus modelos ya existentes la Plaça Major, el Almudín, la Casa dels Berenguer y el vestigio tradicionalmente denominado «templo de Diana». Los once polígonos utilizados por el modelo civil de la Plaça Major y las huellas de los monumentos se emplean como regiones de preservación. El control geométrico del preproceso no encuentra intersecciones con el conjunto seleccionado. No se construye un segundo Almudín ni se restituye un templo antiguo en Sagrari.

Fuentes de la base urbana:

- [Dirección General del Catastro — INSPIRE Buildings, Sagunto/Sagunt](https://www.catastro.hacienda.gob.es/INSPIRE/Buildings/46/46222-SAGUNTO%20SAGUNT/A.ES.SDGC.BU.46222.zip): plantas, subdivisión de volúmenes y número de plantas. Se retienen las fechas y procedencia del conjunto original del atlas. El producto derivado no es información catastral oficial.
- [OpenStreetMap, plaza de Cervantes, vía 22922651](https://www.openstreetmap.org/way/22922651): contorno del espacio peatonal. Calles y pasos proceden de los nueve registros OSM indicados en el JSON de contexto. Se conserva el trazado; las anchuras sin etiqueta son estimaciones visuales limitadas por las huellas vecinas.
- [IGN/CNIG — MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado): alturas de superficie. El conjunto ya adquirido utiliza el percentil 60 de muestras positivas de MDSnE2.5; no equivale a una medida del alero o a la altura total de cada fachada.
- [IGN/CNIG — PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma): comprobación del tejido de cubiertas y muestras de color retenidas de los datos del atlas. La fecha de adquisición del archivo no acredita la fecha de cada vuelo.

## Escalinata y pretil: corrección documental

El acceso norte se representa mediante **dos tramos paralelos a la fachada**, que llegan a un rellano central. El trazado queda registrado sobre la vía [OSM 733321159](https://www.openstreetmap.org/way/733321159). La relación entre la puerta norte, Cavallers y el pretil se contrastó con las fotografías de las páginas 74–75 y con las medidas de los bloques de la página 79 del estudio de [María Forner Palanca y José Manuel Palomar Abascal, ARSE 58, 2024](https://centroarqueologicosaguntino.es/wp-content/uploads/2025/08/Arse_58-74-89.pdf).

Las fotografías actuales muestran un **pretil macizo de piedra**, con albardilla inclinada y un remate central curvo. No se modela una fila de balaustres abiertos. La fecha **1799** se atribuye al pretil, no al origen de toda la escalera. Tampoco se restituyen las esculturas y remates desaparecidos que aparecen en la fotografía de 1923 reproducida por el estudio.

En la cara exterior central se señalan dos bloques epigráficos superpuestos. Se conserva su diferencia de tamaño aproximada publicada: 1,67 × 0,59 m el superior y 1,23 × 0,63 m el inferior. Sus marcos se representan de forma discreta; no se inventa una transcripción legible sobre la textura. Las fotografías utilizadas para estudiar la geometría no se distribuyen como recursos de la web.

## Alturas, cubiertas y terreno

Los 44 volúmenes emplean **28 estimaciones IGN** y **16 derivaciones del número de plantas**. Ninguno necesita una altura doméstica aleatoria. La prioridad es altura registrada, estimación de superficie, plantas × 3 m y, solo si las anteriores faltan, una estimación explícita. Los pequeños huecos, balcones, carpinterías y revocos son una interpretación volumétrica genérica; no se afirma que reproduzcan el estado de cada fachada.

Las cubiertas mantienen la planta original y su color PNOA. Cuando se añade una pendiente, se construye una envolvente baja dentro del polígono mediante distancia a sus bordes. No se presenta como una medición de cada faldón o cumbrera. Los volúmenes permanecen separados para conservar los saltos de altura del Catastro. Las paredes llegan por debajo de la superficie para evitar bases suspendidas y sus zócalos siguen el terreno.

El suelo de la iglesia, suministrado por el modelo principal, queda aproximadamente a 59,323 m en esta versión. Es una adaptación del modelo a la malla de presentación del MDT que permite despejar el acceso sur; **no es una cota de nivelación del templo**. En consecuencia, el acceso norte salva aproximadamente 4,09 m por el tramo oeste y 4,92 m por el este. Los 48 peldaños resultantes son una discretización de ese desnivel para el atlas, no un recuento arqueológico documentado. Esta es la principal incertidumbre de escala del acceso y debe conservarse explícita al interpretar el modelo.

La plaza de Cervantes y los pavimentos siguen la función de altura de la malla final. Sus triángulos se subdividen adicionalmente donde una cimentación genera un cambio fuerte de pendiente: una interpolación amplia atravesaba el terreno junto al acceso occidental. Las transiciones laterales de los pavimentos incluyen faldones para evitar bordes flotantes. No se añaden árboles, mobiliario o reformas cuya posición no esté documentada.

En la banda estrecha de Cavallers contigua al muro norte, al oeste de la escalinata, se conserva específicamente la cota del MDT original para el pavimento. Ocho pequeñas celdas bajo esa banda impiden que la cimentación alta del templo eleve un talud de tierra artificial fuera de su muro. El ancho y acabado de esta transición son interpretativos; la banda sigue el trazado de Cavallers, no desplaza fachadas y no se presenta como un levantamiento del pavimento actual. Los faldones cierran la transición con la malla de terreno.

## Contrato de integración y recursos

`createSantaMariaContext({ data, landmarks, project, heightAt, churchFrame, contextData })` devuelve un grupo en coordenadas de mundo, exclusiones de edificios y vías, parches para el terreno, cinco focos de visita, componentes de plano, estadísticas y consultas de validación. `bindGround` adapta los edificios y pavimentos al terreno final; la geometría histórica de la escalera conserva el mismo marco.

El contexto posee sus materiales, geometrías y texturas por instancia. `setReadingMode` y `selectFocus` restauran los materiales originales al abandonar la lectura por periodos. `dispose` solo libera sus recursos. No existen cachés globales de materiales compartidos con otra iglesia o con los otros monumentos.

`drawSantaMariaMap` usa la planta georreferenciada de Santa María y los componentes de contexto. Conserva las cinco categorías de la visita: medieval, moderna, contemporánea, mixta e interpretación. Las paradas desplazadas para evitar colisiones mantienen una línea hasta su anclaje original y una zona de interacción individual. El rótulo, la huella y la paleta semántica del teatro no se reutilizan.

## Validación realizada

La validación de contexto y Canvas figura en `validation-v9/santa-maria-context-qa.json` y se reproduce mediante:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v9/validate_santa_maria_context.mjs
```

Resultado: **244 comprobaciones aprobadas**, con seis vistas Canvas representativas: minimapa de escritorio, plano grande de escritorio y plano de móvil, cada una en apariencia clara y oscura. Se comprueban la presencia de las 16 paradas, posiciones originales de las seleccionadas, separación entre marcadores, respuesta exacta a sus centros y contraste de etiquetas de al menos 4,5:1. Se proporcionan componentes inválidos para comprobar que el mapa los descarta sin perder la planta válida.

La geometría de contexto contiene 26 mallas y aproximadamente 22.300 triángulos. Los atributos son finitos, los peldaños despejan el terreno final y no hay intersecciones significativas de la plaza con esa malla. Se comprueba que la lectura por periodos restaura los materiales, que dos instancias no comparten recursos descartables y que liberar una no afecta a la otra. Los PNG de la visita completa generados por el modelo principal complementan estas comprobaciones; la prueba Canvas no se describe como una captura del navegador ni como una prueba de acceso físico peatonal.

La revisión de las primeras imágenes detectó que una cubierta vecina ocultaba el encuadre de portada norte. Se corrigió la dirección de cámara hacia el corredor de Cavallers. También se ajustaron las cámaras de escalinata y Sagrari tras comprobar sus rayos con el caserío propio y el patrimonio civil existente. La geometría situada en el propio punto de interés se distingue de una cubierta vecina que impide verlo; los edificios vecinos se conservan y son las cámaras las que se desplazan.
