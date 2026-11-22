# Red viaria, paisaje y recorrido territorial

La base de calles integra las vías de Sagunto, Puerto de Sagunto y el Grau Vell mediante los identificadores de nodo de OpenStreetMap. El recorte sigue la relación municipal 348833, con 20 m de margen y una franja de 105 m a cada lado de los ejes del Palancia documentados en el atlas. Esto permite conservar las conexiones que discurren por el borde de Canet. La geometría de referencia administrativa de la aplicación procede del ICV. Ambas delimitaciones responden a fuentes distintas.

## Fuentes y atribución

La red, las áreas y los objetos proceden del extracto público de la Comunitat Valenciana distribuido por Geofabrik. La réplica OSM utilizada se cerró el 21 de noviembre de 2026 a las 21:20:51 UTC. Los sectores derivados se distribuyen bajo ODbL 1.0. La fecha de réplica describe la instantánea disponible. La antigüedad de cada observación de campo varía. [Geofabrik](https://download.geofabrik.de/europe/spain/valencia/index.html) · [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)

El corredor seco y el brazo meridional del Palancia reutilizan los ejes OSM y el contorno de agua interpretado sobre PNOA de la ficha v32. La lámina representa el contorno visible en esa fotografía. La documentación territorial distingue el cauce bajo, habitualmente seco, de las aguas observadas localmente cerca del mar. [Ficha y documentación del atlas](landscape-palancia.md) · [Caminos Naturales, río Palancia](https://caminosnaturales.es/es/red-de-caminos-naturales/poi-detalle/ID.01.34.24.88/e1922258-0cec-40c3-8ea5-5dc29cb1844d) · [Condiciones IGN](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf)

Las comprobaciones de proximidad a obstáculos utilizan los sólidos públicos de Catastro INSPIRE preparados en la capa territorial. Las cotas de los estribos se muestrean en las mismas mallas derivadas de MDT05 y MDT25 que usa el terreno. Los tableros se interpolan entre extremos. Corresponden a una estimación visual. [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/) · [IGN/CNIG](https://centrodedescargas.cnig.es/CentroDescargas/modelos-digitales-elevaciones)

## Reproducir y actualizar

Desde la raíz del proyecto, con Python 3.12 y los recursos de relieve y edificios en `dist/assets/territory`, ejecutar en un entorno virtual:

```sh
python -m pip install osmium==4.3.2 shapely==2.2.0 pyproj==3.8.0 networkx==3.7
python research/network_prepare.py
python research/network_validate.py
```

El preparador descarga una vez el PBF fechado y comprueba su MD5 `aad09514c34dd038af5fa3cd862abec2`. El SHA-256 final de la instantánea es `43a5aa1e4c4241d8f7bc41829eb518419d99e95841f8818d70ea080bbf1a2b74`. Guarda tanto el extracto como una caché intermedia identificada por contenido en la carpeta temporal del sistema. Se puede elegir un directorio persistente con `--cache`. Para actualizar, descargar o archivar otro extracto público de la misma región y ejecutar con `--pbf ruta/al/extracto.osm.pbf --source-url URL_ORIGINAL`. Los archivos fechados del distribuidor tienen retención limitada. La aplicación sirve todos los sectores localmente.

## Contrato espacial

En EPSG:25830, X es el este menos 730000 y Z es 4395000 menos el norte. Se redondean las coordenadas a 0,1 m para el transporte. La precisión geográfica depende del levantamiento original de cada elemento. Las calles se segmentan en los nodos de cruce OSM y en los bordes de los sectores de 1 km. Los pasos a distinto nivel conservan nodos distintos. Un cruce geométrico de líneas por sí solo no crea una conexión.

- `dist/assets/network/index.json` contiene sectores, viales principales simplificados para el mapa, restricciones simples por nodo, el recorrido continuo y su lista de aristas verificable. Cada URL de sector es relativa al directorio del índice.
- Cada sector contiene `roads`, `rail`, `waterways`, `areas` y `objects`. Los polígonos conservan anillo exterior y huecos. Los objetos proceden de puntos cartografiados. Las áreas también incluyen parques, plazas, huertas, fincas, industria, aparcamientos, playas, matorral y humedales.
- En las aristas, `a` y `b` son claves de conexión. `osm` identifica la vía fuente y `id` el fragmento exportado. `oneway` vale 1 en el sentido de los puntos, −1 en el contrario y 0 en ambos. Los coches siguen la orientación implícita de las rotondas cuando procede. `car` y `foot` habilitan actividad ambiental. La ruta aérea guiada emplea también calles compartidas y caminos accesibles.
- `widthTagged` distingue anchuras etiquetadas en OSM. Las demás se asignan por tipología para la representación. Los objetos `crossing` con `heading` disponen de orientación longitudinal de la calzada en radianes. Los cruces sin orientación conservan su coordenada. `bridge` identifica un tramo elevado y `deck[i]` da la elevación ortométrica estimada, en metros, en el punto i de una arista de carretera. Los túneles conservan su atributo.
- El tráfico excluye accesos de servicio y pistas, calles con ciertas restricciones condicionales, túneles, recintos privados identificados y corredores que se solapan con sólidos catastrales. El filtro conserva los huecos de los polígonos. Las condiciones de acceso reflejan sólo los atributos disponibles. La simulación carece de un inventario completo de acceso, un modelo de semáforos sincronizados y un intérprete de todas las restricciones de giro condicionales o con vías intermedias. El recorrido es una exploración visual.

## Validación del conjunto entregado

| Comprobación | Resultado |
| --- | ---: |
| Sectores y volumen total de recursos de red | 196 · 4,94 MB |
| Aristas únicas, incluidas calzadas, aceras y caminos | 15.671 |
| Nodos con más de dos aristas | 7.693 |
| Aristas aptas para vehículos y aristas aptas para peatones | 8.152 · 2.934 |
| Nodos con relaciones simples de giro | 184 |
| Tramos de carretera sobre puente | 189 |
| Áreas, fragmentos ferroviarios y objetos puntuales | 1.155 · 240 · 3.054 |
| Mobiliario o árboles descartados por coincidencia con sólidos | 19 |
| Conflictos residuales entre corredores de actividad habilitados y edificios del conjunto comprobado | 0 |
| Ruta Plaza Mayor – Alto Horno – Fortín | 9.682 m · 172 aristas |
| Distancia mínima de la ruta a los tres puntos patrimoniales | 22,3 m · 27,1 m · 26,3 m |
| Aristas duplicadas o extremos con distinta posición para una misma clave | 0 |

El validador reconstruye el recorrido a partir de sus aristas, comprueba continuidad entre sectores y compara distancias relativas con la geodésica GRS80. El desvío máximo entre distancia proyectada y geodésica para los tres puntos es del 0,030 %. Comprueba también que el eje del Palancia alcanza la desembocadura cartografiada y queda separado del Fortín. La comprobación de edificios utiliza un corredor de hasta 2 m a ambos lados del eje según el ancho de la vía para los vehículos y de 0,22 m para los peatones. Los efectos visuales de anchura de carrocería y giro corresponden al renderizador.
