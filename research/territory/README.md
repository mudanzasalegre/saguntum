# Cartografía del Simulador 3D

El simulador utiliza ETRS89 / UTM 30N (EPSG:25830). Una unidad de Three.js equivale a un metro. El origen local es E 730000, N 4395000. X aumenta hacia el este, Z hacia el sur e Y contiene la altitud ortométrica IGN. El marco de 19,5 × 22 km contiene todos los recintos municipales de Sagunt y una franja de continuidad visual. El límite administrativo procede del ICV y tiene una superficie de 134,058 km².

## Capas y procedencia

| Capa | Geometría y detalle | Procedencia y condiciones |
| --- | --- | --- |
| Recinto municipal | Todos los polígonos de INE 46220. Extracción WFS en EPSG:25830 y simplificación de un metro para su visualización. | Institut Cartogràfic Valencià, Generalitat Valenciana. [Catálogo y atribución](https://dadesobertes.gva.es/es/dataset/delimitacion-territorial-municipios-de-la-comunitat-valenciana) |
| Relieve | MDT25 de toda la extensión. MDT05 en los 10 × 8,4 km de mayor uso, remuestreado a 10 m. Ambos reciben interpolación bilineal desde los centros de las celdas originales. Los últimos 100 m del rectángulo interior empalman con la malla regional. | © Instituto Geográfico Nacional y CNIG. [Servicio MDT](https://www.idee.es/csw-codsi-idee/srv/api/records/spaignwcs_mdt) · [Licencia](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf) |
| Ortoimagen | Mosaico municipal a unos 5,35 m/píxel y corredor a unos 2,44 m/píxel. Los rectángulos EPSG:25830 coinciden con el MDT correspondiente. Incluyen la ocupación real de los intersticios, campos, infraestructuras y explanadas. | © PNOA, IGN y CNIG. [Ortoimagen de máxima actualidad](https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&request=GetCapabilities) · [Licencia](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf) |
| Edificios | Descarga INSPIRE pública de todo el municipio, código catastral 46222. Partes sobre rasante y huella del padre cuando carece de partes. Se conservan los anillos interiores y el uso documentado. Sólo se añaden huellas OSM válidas que cubran vacíos catastrales dentro del municipio. | Dirección General del Catastro. Metadatos municipales de 21 de agosto de 2026. Producto derivado por SAGUNTUM. [Datos y licencia](https://www.catastro.hacienda.gob.es/webinspire/) |
| Alturas | La primera opción catastral es la estimación del modelo normalizado MDSnE2.5 que ya se obtuvo para las escenas v32. Si falta, se emplea el número declarado de plantas con una altura tipológica de 3,05 m por planta residencial o 4 m industrial/agrícola. La geometría OSM conserva el atributo de altura cuando existe. El campo heightSource identifica el método de cada volumen. | © IGN/CNIG, DGC y colaboradores de OSM. [Documentación del muestreo anterior](../acquire_building_heights.py) |
| Costa y mar | Poligonización de los trazados OSM de costa contra el marco territorial. En el polígono marítimo entran el mar abierto y las dársenas comunicadas. La espuma recibe las líneas de costa originales recortadas al marco. Se respeta la corrección v32 que permite ver agua bajo la plataforma elevada del pantalán. | © colaboradores de OpenStreetMap, ODbL. [Extracto de Geofabrik](https://download.geofabrik.de/europe/spain/valencia.html) · [Licencia y atribución](https://www.openstreetmap.org/copyright) |

El índice conserva las URL de las peticiones, las licencias, el SHA-256 de las fuentes municipales y el del PBF regional. La fecha de adquisición de la ortoimagen corresponde al acceso al mosaico. La fecha de vuelo depende de cada tesela. Los archivos de consulta se procesan fuera del navegador. El visitante descarga exclusivamente los recursos derivados que sirve el atlas.

## Preparación y comprobación

Usar un entorno virtual con Python 3.12. Desde la raíz del proyecto:

```sh
python -m venv .venv
# Activar .venv con el método correspondiente al sistema operativo.
python -m pip install -r research/territory/requirements.txt
python research/territory/prepare.py --pbf /ruta/al/valencia-261121.osm.pbf
python research/territory/validate.py --report research/territory/validation.json
```

El [preparador de la red](../network_prepare.py) puede adquirir el PBF una sola vez y verificar su suma de control. Para otra edición, suministrar el archivo local y su URL real mediante `--pbf-url`. `--cache` cambia la carpeta de originales, por defecto `saguntum-territory-cache` dentro del directorio temporal del sistema. Para actualizar los datos oficiales, seleccionar una caché nueva y guardar la antigua si se necesita reproducir exactamente esa edición. `--out` permite comparar una exportación completa en un directorio nuevo antes de sustituir los archivos publicados. Las descargas sólo se persisten si finalizan correctamente. La capa OSM puede redistribuirse y reproducirse con la licencia ODbL.

El proceso comprueba el CRS del GML y los rásteres. Procesa el código municipal sin publicar titulares, direcciones ni enlaces a fichas de inmueble. Preserva las alturas documentadas y su método, normaliza geometrías a una retícula de 0,1 m y repara cruces. En la proyección en planta de dos partes superpuestas conserva arriba la de mayor altura. Los nuevos vértices de corte retienen precisión adicional para que la cuantización a decímetros de las huellas originales no reintroduzca solapes. Los polígonos menores de 1 m² se omiten. Las partes se asignan completas a un único sector por un punto interior. Cada sector declara tanto sus límites nominales como la envolvente real de todas sus geometrías.

## Contrato de los recursos

- `dist/assets/territory/world.json` contiene extensiones XZ, origen, fuentes, procedencia de alturas, costa, recintos ICV, mallas de elevación y catálogo espacial.
- `heights.bin` y `heights-core.bin` son grillas Int16 little-endian en decímetros, con filas desde el norte, coincidentes en sus límites con las extensiones de sus metadatos. La cuantización decimétrica es un formato de almacenamiento y no implica precisión de levantamiento de 10 cm.
- `ortho.jpg`, `ortho-core.jpg` y `map.jpg` comparten la orientación de las mallas. El último archivo es la miniatura cartográfica municipal.
- `b/<ix>_<iz>.json` contiene los volúmenes de la celda de 500 m. Cada registro tiene identificador, anillos XZ, altura, método, uso y, cuando existe, plantas y color estimado de cubierta. El primer anillo es exterior. El resto delimita los patios. Los anillos se cierran implícitamente.
- `overview.json` conserva el identificador y el sector de cada volumen lejano, con su huella simplificada. Incluye partes desde 600 m² o con al menos 15 m de altura y 100 m² de planta. El detalle de las calles tiene las huellas completas.

## Alcance métrico

Las coordenadas de los edificios, patios, costa y recinto municipal proceden de cartografía. Las alturas MDSn combinan un modelo de superficie histórico con el terreno de su época y pueden diferir del estado presente. Las alturas a partir de plantas, los materiales y los huecos de fachada son interpretativos. El MDT describe la superficie topográfica a la escala publicada. No contiene batimetría, fachadas, escaleras individuales ni las pendientes exactas de las aceras. Los dos edificios con altura OSM conservan ese atributo tal como está documentado en el atlas. La capa general completa los escenarios de visita a escala territorial. Las cotas y los detalles interiores de las maquetas patrimoniales tienen su propia documentación.

El [informe de comprobación](validation.json) recoge el máximo salto de borde entre mallas, las intersecciones geométricas residuales, nueve puntos de control y seis distancias comparadas contra la geodésica GRS80. Las pruebas cartográficas se ejecutan leyendo los recursos entregados. El informe de la aplicación documenta por separado las pruebas de WebGL.
