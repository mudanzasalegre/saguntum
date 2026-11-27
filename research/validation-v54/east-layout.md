# SAGUNTUM v54 · Registro del sector oriental del Castillo

## Alcance y criterio

El sector se registró sobre la ortofoto del servicio oficial **IGN PNOA de máxima actualidad**, conservando las huellas OSM ya presentes en v53 y la puerta de Almenara de v51. La imagen solicitada el 27 de noviembre de 2026 no se fecha como fotografía de 2026: no se ha establecido el año de vuelo del mosaico. La mejora prioritaria es describir el recinto actual —plataformas, ruinas abiertas, roca y recorridos—, sin levantar un alcázar medieval completo ni confundir una semejanza de tamaño con una identificación arqueológica.

El módulo `dist/js/castle-east-layout.js` y `east-layout.json` contienen los mismos datos geométricos. `east-layout-overlay.jpg` permite comprobar visualmente el registro. Las coordenadas son longitud/latitud; los ocho decimales conservan el resultado de la conversión de píxeles, **no expresan precisión de levantamiento**. Las trazas manuales son aproximaciones de orden 1–2 m. No hay cotas arqueológicas detalladas en este contrato.

## Fuentes examinadas

1. **IGN PNOA, WMS de máxima actualidad.** Capa `OI.OrthoimageCoverage`, EPSG:4326, bbox en orden WMS 1.3.0 `[39.67545,-0.27665,39.67705,-0.27465]`, raster solicitado de 1600 × 1658 px. La URL íntegra y el SHA-256 del JPEG constan en `east-layout.json`. Una resolución de petición de unos 0,107 m/píxel no demuestra que esa sea la resolución nativa ni su exactitud geométrica. Fuente: https://www.ign.es/wms-inspire/pnoa-ma
2. **SAGUNTUM v53 / OSM existente**, commit `3d3d523247d827acbec8b0debc333a1a85114019`: `dist/assets/data/cartography.json` y los arrays `MAPPED_BUILDINGS`/`MAPPED_ROADS` de `dist/js/castle.js`. Se cotejaron visualmente los cuatro recintos de ruina, los tres grandes paños aterrazados y los dos recorridos.
3. **Plan Director del Castillo, 2000**, pp. 97–98 y 110–112: emplazamiento oriental, protección natural de la vertiente sur y defensas exteriores al norte/este. La descripción histórica y las hipótesis de cronología no sustituyen al registro actual. Las hojas 132–134 consultadas son portadillas sin planta visible; el índice de planos no demuestra que los planos acotados estén en ese PDF. https://www.sagunto.es/media/b1qd4rn2/plan-director-del-castillo_-web.pdf
4. **Manuel Civera, Les cisternes del Castell de Sagunt, ARSE 41 (2007)**, pp. 162–164 y 174–175. Se cotejó la fotografía del depósito abierto junto al camino central de p. 175. Documenta una caja revestida y hundida con coronación irregular; todavía no se identifica de modo categórico con una de las cuatro huellas OSM. Las medidas interiores del texto no se transfieren a una huella por mera compatibilidad de dimensiones. https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/339_010_les_cisternes_del_castell.pdf
5. Las fotografías terrestres de **Ricsol** revisadas por el agente principal sirven de contraste de alzados: batería, escalera, torre semicircular, cañoneras y roca del extremo oriental. Este contrato evita convertir la estimación visual de altura en una medición. Las URL y atribuciones fotográficas se documentan en la investigación histórica del proyecto.

## Lectura de la planta actual

### Plataformas perimetrales

Se distinguen cuatro superficies abiertas. Sus áreas de trazado son sólo órdenes de magnitud de los polígonos interiores dibujados, no superficies catastrales ni arqueológicas.

| ID | Lectura visible | Registro | Tamaño aproximado del polígono interior |
| --- | --- | --- | --- |
| `battery-nw` | Terraza diagonal del noroeste, con retornos/escalones en el borde interior | Contigua a OSM `733215264` | 24 m de largo, 3–4,5 m de anchura; 91 m² |
| `battery-n` | Plataforma larga al pie de la cortina norte | Contigua a OSM `733215265` | 31 m de largo, 4–5,5 m de anchura; 154 m² |
| `battery-e` | Plataforma longitudinal oriental | Contigua a OSM `733215268` | 37–38 m de largo, unos 4 m de anchura; 157 m² |
| `bastion-ne` | Terraza poligonal ancha en el extremo noreste, abierta | Trazado interior desde ortofoto | 295 m² |

La batería noroeste es particularmente deficiente en v53: el `height:0` de una traza OSM da una línea de 0,16 m, mientras que la ortofoto muestra una terraza con frente interior, retornos y volumen. Esto no autoriza a reconstruir un edificio entero a partir del polígono. Las tres baterías necesitan suelo propio y sección coherente con su frente de contención; no basta con convertir cada traza en una muralla uniforme.

La proyección semicircular septentrional se ha marcado aproximadamente en `[-0.27551,39.67685314]`. Es un pequeño saliente unido al lienzo. El radio de 1,7 m es un parámetro de visualización y debe ajustarse con las fotografías, no citarse como medida histórica.

### Cuatro huellas de restos interiores

| OSM | Centro aproximado | Descripción admisible | Evitar |
| --- | --- | --- | --- |
| `733215260` | `[-0.2759073,39.6760460]` | Ruina meridional con alas, entrantes y un retorno adicional visible al norte | Llamar a toda la huella de unos 15 m una cisterna de 3,5 m; añadir tejado |
| `733215261` | `[-0.2752853,39.6763300]` | Vestigio rectangular del sureste, coronación desigual y suelo abierto | Imponer función o reconstruir una estancia completa |
| `733215262` | `[-0.2754003,39.6763637]` | Restos con entrante y prolongación hacia el suroeste | Duplicar la prolongación ya cartografiada como `733215267` |
| `733215263` | `[-0.2756553,39.6764980]` | Pequeña caja/depresión abierta al norte del camino central | Dar por segura su identidad sólo porque su planta exterior se aproxima a 4,3 × 2,7 m |

La fotografía de Civera p. 175 justifica el vocabulario formal de un depósito de caja revestida, con suelo hundido, muros interiormente lisos y cresta irregular. La posición relativa al camino y las fotografías actuales son compatibles con la pequeña huella, pero la asociación nominal se mantiene abierta. Las otras tres huellas conservan nombres genéricos.

### Suelo, roca y trazas

La explanada no es una bandeja lisa. La ortofoto muestra dos bordes subparalelos de roca/vestigios en el centro, un tramo al oeste de la caja pequeña, un retorno en L al norte, un vestigio corto central y fragmentos al sur. Son los ocho registros de `traces`. La incertidumbre material es deliberada: donde la imagen no permite separar roca y muro con seguridad, no se etiqueta como una cimentación continua ni se completa una planta doméstica.

`rock-band-central` delimita el área irregular donde conviene mezclar afloramiento y suelo. Su polígono es un ámbito de tratamiento discontinuo; no debe construirse como una plataforma maciza continua.

`escarpment-se` y `slope-n-east` delimitan bandas exteriores rocosas. Deben conservar el descenso del terreno natural; añadir estratos, fracturas y vegetación baja dispersa no exige explanar la ladera. El borde del recinto actual y la roca debajo de él explican su silueta mejor que un talud regular.

## Recorridos y nuevas paradas

Se conservan las líneas OSM del circuito `180732342` y eje `733215256`. El eje enlaza con la salida de la puerta de Almenara. Las anchuras propuestas de 2,30 y 2,65 m son parámetros de representación, no anchos levantados. Los márgenes de mezcla de 2 m permiten suavizar el corredor sin borrar el relieve fuera de él.

| Parada | Foco | Ojo propuesto sobre recorrido | Sentido aproximado |
| --- | --- | --- | --- |
| `almenara-bateria` | `[-0.27534,39.676758]` | `[-0.27537,39.676688]` | Norte, hacia la batería |
| `almenara-aljibes` | `[-0.2756553,39.676498]` | `[-0.27570,39.676454]` | Noreste, hacia la caja abierta |
| `almenara-baluarte` | `[-0.27499,39.676712]` | `[-0.275116,39.676651]` | Noreste, hacia la terraza final |
| `almenara-dependencias` | `[-0.275907,39.676046]` | `[-0.27601,39.676080]` | Este/sureste, hacia las ruinas meridionales |

El ajuste final de cámara debe situar los ojos 1,7–2,3 m sobre el suelo local resuelto por el modelo y comprobar la línea de visión. Los ojos propuestos no se sitúan dentro de los depósitos. La visita a dependencias es contemplativa: no se propone entrar por un muro ni reconstruir un acceso desconocido.

## Contrato para modelado y ajuste vertical

- `EAST_PLAN_FEATURES`: objeto con arrays `platforms`, `ruins`, `traces`, `rockAreas`, `points`.
- Polígonos y líneas: `coordinates` contiene pares `[longitud,latitud]`; el único punto usa un solo par.
- `floorMode:'local-plane'`: ajustar una superficie local por cada plataforma/depósito. Tomar el terreno en el entorno útil y sus transiciones; no copiar ciegamente un pico del MDT ni usar el punto más alto como cota universal.
- `floorOffsetM`, `blendMarginM`, `reliefRangeM`, `widthM` y `radiusM` son parámetros interpretativos explícitos. No equivalen a cotas o medidas publicadas.
- Un depósito hundido necesita vaciar/recortar el suelo interior o excluir su ámbito del terreno de cobertura; un suelo oscuro dibujado debajo de un terreno intacto no será visible.
- `EAST_ROUTE_DEFS` contiene las dos líneas de recorrido existentes; `EAST_STOPS` las cuatro nuevas paradas.
- `EAST_REPLACED_WALL_IDS` contiene `733215264`, `733215265`, `733215268`, `733215267`. Cada traza se debe sustituir o conservar una sola vez.
- Los cuatro IDs de ruina se deben excluir de los anillos genéricos si se añaden modelos específicos; de otro modo se superpondrían ambos.
- Se mantiene la puerta de Almenara en `[-0.2762665022,39.676214945]` y su tratamiento v51.

El Plan Director ofrece una superficie descriptiva de Almenara que no coincide necesariamente con una división inferida del polígono OSM. No se fuerza la cartografía para cuadrar una superficie textual ni se atribuye a esa diferencia significado arqueológico.

## Comprobación realizada

- Se inspeccionaron la ortofoto completa, sus ampliaciones norte/centro y el overlay final.
- Las cuatro huellas interiores OSM se registran razonablemente con los restos visibles.
- Los polígonos interiores de las cuatro plataformas se mantienen dentro de las superficies abiertas observables; no reemplazan la geometría exterior de todas las murallas.
- Se comprobó sintaxis del módulo con `node --check`.
- La comprobación de cotas, transitabilidad y líneas de visión corresponde a la integración de terreno y cámaras; este contrato no certifica todavía esa integración.

## Ajuste del enlace digital junto a la puerta

La comprobación con las jambas reales del modelo v51 detectó que el extremo final de la línea OSM 180732342 cruzaba el lateral de la cámara posterior. La ruta visible conserva su trazado principal y cambia únicamente el enlace final: pasa por `[-0.276128,39.676280]` y se une al eje central en `[-0.2761072,39.6762588]`. Desde allí, el camino central ya conecta con el vano. Es una acomodación de navegación del modelo, no una nueva medición ni un cambio en la cartografía fuente.
