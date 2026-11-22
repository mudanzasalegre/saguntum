# Cartografía de Sagunto y Puerto de Sagunto

Datos adquiridos el 19 de noviembre de 2026. Esa es la fecha de consulta y descarga; no debe presentarse como fecha de vuelo de la ortofotografía o levantamiento del terreno.

## Datos incorporados

### Modelo del terreno

`dist/assets/data/elevation.json` contiene una malla de 1.025 × 1.025 cotas procedentes del **Modelo Digital de Elevaciones de España, IGN/CNIG**. El área mide 2.050 × 1.950 m. El paso de muestreo de la aplicación es aproximadamente 2,0 × 1,9 m, frente a los 8,0 × 7,6 m de la primera versión. El servicio XYZ deriva del **MDT05, de paso de malla de origen de 5 m**. El muestreo más denso conserva mejor el detalle ya presente en las teselas; no supone un nuevo levantamiento de 2 m ni garantiza esa exactitud. Los valores se redondean a una décima; rango 27,7–169,8 m. La precisión decimal de almacenamiento no implica exactitud altimétrica de 10 cm.

Se descargaron nueve teselas PNG de nivel 15 y 512 × 512 píxeles desde:

https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png

El estilo oficial declara raster-dem sin una codificación alternativa; se utiliza la codificación Terrain RGB de Mapbox: `-10000 + (R*65536 + G*256 + B)*0.1`. La malla suministrada es una obra derivada para visualización, no un levantamiento de precisión ni una nube LiDAR de monumentos. El origen MDT05 está documentado por IDEE: https://blog-idee.blogspot.com/2024/03/nuevo-servicio-xyz-del-modelo-digital.html. No se ha verificado la fecha de vuelo de cada tesela. El terreno desnudo no incluye fachadas, árboles ni geometría individual de bordillos o peldaños.

Catálogo oficial: https://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign

Estilo oficial: https://xyz-mdt.idee.es/1.0.0/raster-dem/files/styles/style_sombreado.json

### Ortofotografía

`dist/assets/data/orthophoto.jpg` es una imagen de 4.096 × 3.896 píxeles procedente del servicio oficial PNOA Máxima Actualidad. Representa exactamente el área y orientación norte-arriba de la malla local. Se obtuvo mediante WMS 1.3.0, capa `OI.OrthoimageCoverage`, EPSG:4326, BBOX en orden latitud/longitud conforme a ese CRS y versión. `orthophoto.json` conserva el URL completo de la petición y los límites geográficos.

Servicio: https://www.ign.es/wms-inspire/pnoa-ma

El paso de píxel de la imagen servida es de aproximadamente 0,5 m; no determina la resolución nativa de las fotografías del mosaico. La fecha exacta de captura no se ha verificado. La imagen contiene el castillo, teatro, ciudad histórica y río Palancia en su ubicación real. No sustituye la documentación arquitectónica de los edificios.

### Geometría vectorial local

`dist/assets/data/cartography.json` contiene un extracto de OpenStreetMap:

- Perímetro del castillo, relación OSM **16216725**, ensamblado sin invención de vértices a partir de sus cuatro vías exteriores. 272 coordenadas, incluido el cierre.
- Planta del Teatro Romano, vía OSM **1199467403**, con 66 coordenadas.
- 81 trazas de muros y ruinas situadas en el entorno del castillo. Las alturas solo se incluyen cuando están etiquetadas en OSM; el resto es `null`.
- 2.198 plantas de edificios, 1.206 vías y senderos y 102 geometrías de cobertura del suelo o agua.
- Enriquecimiento de atributos originales: 21 vías con número de peldaños, 48 con inclinación, 5 con anchura, 173 con información de aceras y 25 edificios con niveles de cubierta. Los valores faltantes no se rellenan como datos cartográficos.
- 32 alineaciones de muros de contención y 14 áreas peatonales cerradas, extraídas de OSM.
- Nodos cartografiados de las plazas del castillo. Los dos focos de cámara añadidos para castillo y teatro se identifican expresamente como puntos representativos o inferidos, no como mediciones arqueológicas.

API: https://api.openstreetmap.org/api/0.6/map?bbox=-0.286,39.670,-0.266,39.687

Castillo: https://www.openstreetmap.org/relation/16216725

Teatro: https://www.openstreetmap.org/way/1199467403

El perímetro real del castillo abarca aproximadamente de -0,2837119 a -0,2748569 de longitud y de 39,6753846 a 39,6772773 de latitud. El ancho este-oeste de esa envolvente es de unos 760 m. Es una medida calculada de la envolvente OSM y no la longitud de un itinerario ni la suma de las murallas.

La forma de la planta del teatro sitúa la escena a lo largo de un eje aproximadamente noroeste-sureste, con el graderío al suroeste. El centro aproximado de la orchestra usado para cámara es -0,27800 / 39,67689, inferido de esa planta.

### Alturas aproximadas de edificios a partir de LiDAR

Se ha adquirido una cobertura del **Modelo Digital de Superficies normalizado de Edificación, MDSnE2,5**, servicio WCS oficial IGN/CNIG, capa `mdsn_e025`. Corresponde a la primera cobertura PNOA-LiDAR; la fecha de vuelo local no está verificada. La fuente rasteriza altura respecto al suelo de la clase edificación. La malla del servicio tiene aproximadamente 2,5 m de paso.

Fuente oficial del producto: https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado

Servicio: https://wcs-mds.idee.es/mds?request=GetCapabilities&service=WCS&version=2.0.1

Se descargó una ventana de 814 × 856 celdas. Para cada planta OSM se seleccionaron los centros de celda situados dentro del polígono, se descartaron valores fuera de 1,5–70 m y se calculó el percentil 60. Se exige un mínimo de tres muestras válidas y un 45 % de cobertura positiva. **1.975 de los 2.198 edificios** obtuvieron una estimación. Mediana 8 m, rango 2–40 m. Los pequeños edificios o los que carecen de correspondencia suficiente conservan las otras fuentes y el respaldo interpretativo del renderizador.

El campo `surfaceHeightEstimate` es una altura aproximada de superficie/cubierta, **no una medición de cornisa, fachada o estado actual**. Se conservan además percentil 95, cantidad de muestras, cobertura y procedencia. Los campos OSM `height` y `levels` permanecen intactos. Las fuentes se guardan en `building-height-provenance.json` y `cartography.surfaceHeightProvenance`.

Como referencias de escala: Santa María presenta un percentil 60 de cubierta de 22 m y su campanario 40 m; Calvario 8 m; Sangre 11 m; Salvador 12 m; Berenguer y Museo 11 m. Son estadísticas del ráster dentro de las plantas, no dimensiones arquitectónicas exactas. El Ayuntamiento documenta una altura total de **58 m** para el campanario de Santa María y describe su pináculo de hierro. Por ello el modelo arquitectónico puede superar los 40 m muestreados en el ráster: la estadística de superficies no es una medición completa del pináculo. Fuente: https://www.sagunto.es/va/ajuntament/arees-i-serveis/cultura-i-educacio/campus-obert-a-la-ciutadania/xiuxiueig/esglesia-arxiprestal-de-santa-maria/ .

### Ocho monumentos del casco histórico

`landmarks.json` conserva las coordenadas, plantas, fuentes y límites de certeza de ocho conjuntos. Las plantas identificadas son Santa María (vía 203070952, campanario 1303693357), Calvario (733104780), Sangre (203084352), Salvador (77444950), Museo (203064640), Portalet de la Sang (733421700) y complejo de Berenguer (733321157, identificado por nodo de centro de visitantes 8585769354). La plaza utiliza un punto de enfoque entre sus calles cartografiadas; la posición individual de la puerta del Almudín requiere interpretación sobre referencias de fachada.

El Calvario incorpora el trazado cartográfico de 50 nodos de la vía 733321149, ocho líneas de contención y dos escalinatas. Las catorce estaciones están documentadas por la cofradía, pero sus posiciones individuales no están cartografiadas en este extracto. Berenguer conserva una planta compleja que incluye extensiones; el foco de la casa principal se sitúa al norte. La página municipal de edificios corrobora su situación con una ubicación junto a esa fachada; ese marcador no es una medición de la puerta.

### Contexto regional

`dist/assets/data/regional.json` reúne el núcleo histórico de Sagunto, Puerto de Sagunto, Canet d'en Berenguer, el río Palancia, los principales ejes de transporte y el contorno real del litoral y dársenas. Contiene 409 puntos de costa ensamblados, 878 segmentos de vías principales, 53 trazas ferroviarias, ocho geometrías de agua y 17 áreas residenciales/industriales/comerciales.

Los puntos OSM de los núcleos son:

| Núcleo | Longitud | Latitud |
| --- | --- | --- |
| Sagunto | -0.2786451 | 39.6792916 |
| Puerto de Sagunto | -0.2208575 | 39.6631732 |
| Canet d'en Berenguer | -0.2209621 | 39.6804554 |

Las fuentes adicionales exactas están en la propiedad `sources` del archivo. El polígono del mar reutiliza la costa real y añade un cierre en el borde oriental de la ventana de representación. No es un límite administrativo ni una costa inventada.

## Proyección y uso en Three.js

Origen común: longitud **-0.278**, latitud **39.679**. Coordenadas `x` al este y `z` al sur, en metros:

```js
x = (longitude + 0.278) * 111320 * Math.cos(39.679 * Math.PI / 180);
z = (39.679 - latitude) * 111320;
```

Es una proyección local equirectangular adecuada para la escala de esta visualización. No debe usarse para deslindes ni mediciones oficiales. `y` contiene la altitud del terreno, sin exageración vertical en los archivos. Si se añade exageración visual, debe identificarse como tal.

Límites locales: `minX=-950, maxX=1100, minZ=-850, maxZ=1100`. La malla de elevación avanza de oeste a este dentro de cada fila, y de norte a sur entre filas; fila 0 corresponde a `minZ`. La imagen tiene el norte arriba.

Los elementos de OSM que atraviesan la ventana conservan sus vías completas, incluso si continúan fuera de ella. La capa visual debe recortarlos o filtrarlos con los límites del terreno. No deben proyectarse todos los puntos del río sobre una cota constante en el borde local.

## Exactitud y decisiones de representación

Son datos geográficos reales: relieve, ortofotografía, trazas de murallas y edificios, calles, senderos, río y costa. Las alturas de edificios sin dato OSM o estimación LiDAR válida, las alturas de muros, la decoración, texturas de piedra, vegetación instanciada y detalles arquitectónicos de modelado requieren interpretación visual. No se han adquirido modelos fotogramétricos ni escáneres de los monumentos.

Debe quedar visible en el producto que se trata de una **recreación interpretativa sobre cartografía real**, evitando describir los modelos como gemelos digitales exactos. La ficha de fuentes puede explicar que las plantas proceden de OSM y el relieve y ortofoto de IGN/PNOA.

## Atribución y licencias

IGN/PNOA: **Obra derivada de IGN / PNOA · CC BY 4.0 · ign.es**. Los metadatos de la obra indican la descarga el 19/11/2026 sin asignar ese año a la captura. Si se obtiene posteriormente la fecha del vuelo y los productores autonómicos, se deben añadir.

Licencia oficial: https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf

OpenStreetMap: **© OpenStreetMap contributors** con enlace visible a https://www.openstreetmap.org/copyright. Los extractos de datos y modificaciones de esos extractos se distribuyen bajo **ODbL 1.0**, https://opendatacommons.org/licenses/odbl/1-0/. Esta obligación sobre los datos no exige atribuir la misma licencia al código de visualización independiente.

Las consultas web verificaron el catálogo oficial, el documento de licencia IGN y la página oficial de derechos OSM. No se extrajo cartografía de Google Maps; solo se leyó la coordenada del enlace de ubicación publicado por el Ayuntamiento como corroboración de la Casa dels Berenguer.

## Reproducción

Los scripts `extract_cartography.py`, `acquire_elevation.py` y `extract_regional.py` conservan la adquisición inicial. La ampliación usa `enrich_cartography.py`, `upgrade_terrain.py` y `acquire_building_heights.py` (este último con `/usr/bin/python3`, GDAL preinstalado). Ejecutar en ese orden tras la adquisición inicial para reconstruir los datos enriquecidos. La descarga original de OSM y los rásteres de trabajo quedan fuera del paquete del sitio. La imagen y mallas están incorporadas al sitio, de modo que la exploración normal no exige consultar servicios cartográficos externos.
