# Paisaje territorial de Sagunto

## Geografía y apariencia

El simulador recorta la ortofoto PNOA en 128 teselas de 1024 m para el corredor de Sagunto, Puerto de Sagunto y Grau Vell. El muestreo de esta capa es de 1 m en escritorio. Otras 32 teselas a 2 m sirven las vistas más alejadas. El área rectangular de adquisición suma 134,22 km² e incluye parte de la costa. Las zonas locales de 25 y 50 cm del Atlas siguen proporcionando el primer plano cuando hay cobertura. Los dos niveles nuevos se superponen a las imágenes generales ya existentes en su mismo sistema ETRS89 / UTM 30N. [Índice de adquisiciones, fechas de consulta y huellas SHA-256](../../dist/assets/territory/landscape/index.json) · [Ortofoto PNOA Máxima Actualidad](https://pnoa.ign.es/web/portal/pnoa-imagen/ortofotos-pnoa-maxima-actualidad)

El fondo montañoso se extiende a un rectángulo de 44 × 58 km. El MDT25 original se remuestrea a 250 m para dibujar las sierras lejanas. En la unión con el área navegable prevalece su elevación más detallada. La periferia permite reconocer la silueta de las montañas y la apertura de los valles. Las curvas de las crestas quedan suavizadas a esa distancia. La lámina marina, los perfiles de las playas y el pantalán utilizan el sistema de agua del Atlas. [Modelos digitales de elevación del IGN](https://pnoa.ign.es/web/portal/pnoa-lidar/modelo-digital-del-terreno) · [Condiciones de reutilización del IGN](https://www.ign.es/web/ign/portal/politica-datos)

Se ha muestreado el color de la vegetación en las 58 628 copas o agrupaciones del inventario MDSnV. La orientación aparente del follaje de media y larga distancia responde a la luz sobre una copa de volumen aproximado. La posición y la altura provienen del inventario. La especie, la forma de cada rama y la respuesta fotométrica siguen siendo interpretativas. [Inventario de copas y procedencia](../../dist/assets/territory/canopy/index.json)

El pavimento expuesto puede recoger en el vuelo fotográfico una sombra distinta de la que proyectan las fachadas a la hora simulada. En el Carrer Major se localizó el fenómeno mediante raycasting WebGL. Dos puntos de terreno consecutivos contenían colores PNOA RGB (58, 58, 69) y (59, 55, 63). En vista próxima, el material fotográfico compensa las sombras más oscuras sobre suelo de clase libre junto a huellas catastrales. El cálculo usa el tono del suelo próximo y la iluminación de la escena. Dos píxeles de revisión pasaron de (26, 31, 50) y (25, 31, 43) a (90, 99, 108) y (92, 101, 106). El mecanismo se limita a suelo urbano con edificios visibles. Se excluyen las clases cartográficas de playa, cultivo, vegetación y cauce.

## Carga y memoria

El terreno y las cubiertas comparten las texturas regionales. Se mantienen hasta cuatro teselas de la ventana de detalle, con un máximo de dos descargas simultáneas. Las fotografías originales de las seis regiones patrimoniales del Atlas también se leen por teselas, manteniendo su registro. La tarjeta gráfica evita así cargar las placas completas de 4096 píxeles al visitar un monumento. Ninguna petición del navegador consulta los servidores cartográficos.

| Imágenes de paisaje en la vista general | Huella estimada con mipmaps |
| --- | ---: |
| v36, dos texturas territoriales | 148,1 MiB |
| v37, escritorio, incluido el horizonte | 40,7 MiB |
| v37, móvil, incluido el horizonte | 14,7 MiB |

La estimación supone cuatro bytes por píxel y una cadena de mipmaps completa. Describe estas imágenes concretas. La geometría, las ventanas próximas, los buffers del renderizador y las demás texturas consumen memoria adicional. Al aproximarse, el atlas regional móvil de 1024 × 1024 añade aproximadamente 5,3 MiB. En escritorio alcanza 2048 × 2048 y 21,3 MiB. El paso de muestreo móvil se duplica en esa ventana. El paquete de paisaje completo pesa 60,7 MB y se distribuye por zonas.

## Comprobaciones

En seis ventanas de 32 × 32 píxeles se compararon las teselas empaquetadas y el JPEG oficial antes de la compresión. El error absoluto medio por canal varió entre 2,00 y 4,13 sobre 255. Las muestras incluyen Sagunto, Puerto de Sagunto, Grau Vell, el pantalán, el corredor y la Marjal. [Coordenadas y resultados completos](cartografia.json)

Se renderizaron tres pares de capturas en Chrome sobre Windows con una RTX 3090. Se utilizaron idénticas coordenadas, objetivo, campo visual y calidad 2 en las dos versiones. Las capturas proceden directamente del canvas WebGL. Las rutas se abrieron con su presentación territorial predeterminada. [Comparación de las tres vistas](comparacion.jpg) · [Mediciones v36](antes.json) · [Mediciones v37](despues.json)

| Escena v37 en escritorio | Carga inicial local | Mediana del intervalo de fotograma |
| --- | ---: | ---: |
| Vista general | 696 ms | 16,7 ms |
| Corredor industrial y agrícola | 629 ms | 16,7 ms |
| Ladera del Castillo | 655 ms | 16,7 ms |

En la órbita rasante del Castillo, el pivote estaba a 1815 m y la carga del primer plano utilizó una distancia efectiva de 210 m. El motor incorporó los modelos originales del Castillo, el Teatro, el Calvario y la necrópolis.

En Chrome se comprobó también el perfil táctil de 390 × 844, densidad 2 y calidad 0 en el panorama, el corredor, el Castillo y la costa del pantalán. Las cuatro escenas utilizaron las fotografías reducidas. No se observaron errores de compilación de shaders, de carga HTTP ni excepciones de JavaScript. Estos tiempos proceden de la GPU de escritorio. La validación en un iPhone físico queda pendiente. [Mediciones de la emulación móvil](despues-movil.json) · [Pantalán desde el agua](costa-despues-movil.jpg)

## Reproducción

La preparación necesita Python 3 con requests, Pillow con WebP, NumPy y tifffile. Los originales solicitados al IGN quedan en la carpeta temporal del sistema para evitar descargas repetidas. Las comprobaciones en navegador requieren Playwright y Chrome instalado. Para comparar las versiones, servir la carpeta dist de v36 en el puerto 8470 y la del árbol actualizado en el 8471.

```shell
python research/prepare-territory-horizon.py
python research/compare-territory-landscape.py
python research/compare-territory-landscape.py despues --mobile --cases panorama cultivos sierra costa
```
