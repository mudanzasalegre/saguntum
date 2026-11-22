# Materiales arquitectónicos del Simulador 3D

La escala física de cada muestra procede de las dimensiones publicadas por Poly Haven. SAGUNTUM combina el albedo del material con el color de la cubierta cuando el conjunto territorial dispone de una muestra PNOA. Los mapas de normales OpenGL y rugosidad conservan el relieve de superficie bajo distintas condiciones de luz. Los autores distribuyen estos ocho recursos bajo [CC0](https://polyhaven.com/license).

| Acabado visual | Fotografía y procesado | Muestra repetible | Original |
| --- | --- | --- | --- |
| Revoco | Rob Tuytel | 1,00 m | [White Plaster 02](https://polyhaven.com/a/white_plaster_02) |
| Ladrillo visto | Dimitrios Savva | 1,90 m | [Brick Wall 12](https://polyhaven.com/a/brick_wall_12) |
| Chapa de fachada | Sergej Majboroda y Jenelle van Heerden | 2,70 m | [Corrugated Iron 02](https://polyhaven.com/a/corrugated_iron_02) |
| Piedra de zócalo | Rob Tuytel | 3,00 m | [Sandstone Blocks 05](https://polyhaven.com/a/sandstone_blocks_05) |
| Azotea mate | Rob Tuytel | 2,00 m | [Concrete Floor 02](https://polyhaven.com/a/concrete_floor_02) |
| Cubierta cerámica | Amal Kumar | 2,60 m | [Clay Roof Tiles 03](https://polyhaven.com/a/clay_roof_tiles_03) |
| Chapa de cubierta | Dimitrios Savva y Jenelle van Heerden | 1,12 m | [Corrugated Iron](https://polyhaven.com/a/corrugated_iron) |
| Muro revocado rural | Rob Tuytel | 2,50 m | [Plastered Stone Wall](https://polyhaven.com/a/plastered_stone_wall) |

Las fotografías reproducen la superficie de una muestra de material. La asignación a un inmueble y el estado de conservación son interpretativos. SAGUNTUM ha dibujado las 48 variantes de puertas, ventanas, persianas, contraventanas y portones. Su posición y la de balcones, toldos y cornisas proceden de reglas tipológicas. La huella, los patios y el uso declarado conservan su procedencia catastral o de OpenStreetMap.

Para reconstruir los ocho archivos WebP con Python, instala Pillow, NumPy y Requests y ejecuta `python research/territory-architecture-materials.py` desde el repositorio. El generador descarga tres canales de cada escaneo, valida el MD5 del proveedor y reutiliza los ficheros de la carpeta temporal para las siguientes ejecuciones. El navegador utiliza los atlas empaquetados. La variante compacta reduce a la mitad cada dimensión en pantallas táctiles o dispositivos con poca memoria.

La silueta de larga distancia se reproduce con `python research/territory-aerial-buildings.py` y Shapely. Usa los edificios, cotas y colores presentes en el conjunto territorial preparado. [Cartografía de partida y licencias](https://github.com/mudanzasalegre/saguntum/blob/main/research/territory/README.md)
