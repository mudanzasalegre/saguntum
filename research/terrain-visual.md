# Superficies fotográficas del Simulador 3D

## Cobertura y procedencia

El simulador incorpora 115 hojas locales de 512 × 512 m. Cuarenta conservan un paso de 25 cm y 75 tienen un paso de 50 cm. Las hojas cubren el casco histórico, los barrios del Puerto, las conexiones intermedias, Grau Vell, la Marjal dels Moros y las dunas de Almardà. Los vuelos consultados en siete puntos de control corresponden a mayo o junio de 2024. El servicio declara una resolución de 25 cm en los siete puntos. La fecha de consulta, las consultas de metadatos, la caja EPSG:25830 de cada descarga y su SHA-256 se guardan en el índice. [Índice de fuentes y hojas](../dist/assets/territory/surface-photo/index.json) · [PNOA Máxima Actualidad](https://pnoa.ign.es/web/portal/pnoa-imagen/ortofotos-pnoa-maxima-actualidad)

Los 31 destinos del Atlas se comprobaron en el marco ETRS89 / UTM 30N. Veintisiete quedan sobre ortofoto de 25 cm. El Sanatorio, el puerto antiguo y el punto del Palancia quedan sobre ortofoto de 50 cm. La parada marítima del pantalán cae dentro del Mediterráneo que dibuja el simulador. Las seis ventanas terrestres de control se compararon con las mismas coordenadas del JPEG oficial previo a la compresión. El error absoluto medio de canal fue de 1,98 a 4,67 niveles sobre 255. Esta comprobación verifica que el recorte y sus ejes concuerdan con la fuente. [Validación cartográfica](terrain-visual-checks/cartografia.json)

La fotografía se atribuye a Ortofoto PNOA Máxima Actualidad © IGN, CC BY 4.0 scne.es. Las máscaras derivan de los anillos de Catastro INSPIRE y los usos de suelo de OpenStreetMap preparados en el proyecto. Se mantienen los patios. El mar utiliza el polígono costero ya registrado. Se omiten las hojas que quedan completamente a más de 35 m dentro del límite de agua. [Política de datos del IGN](https://www.ign.es/web/ign/portal/politica-datos) · [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/) · [OpenStreetMap y colaboradores, ODbL](https://www.openstreetmap.org/copyright)

## Del vuelo al material

Terreno y cubiertas planas consultan los mismos píxeles con coordenadas en metros. El origen de Three.js corresponde al este 730000 y al norte 4395000. La coordenada X crece al este y la Z al sur. La máscara catastral limita la fotografía sobre el techo y suaviza su borde. Al pie de la edificación se usa el color de suelo de su entorno inmediato, obtenido fuera de su huella. Al ocultar los edificios vuelve a verse la fotografía original. Pueden quedar vehículos, vegetación y sombras del momento del vuelo en superficies expuestas. La ortofoto aporta la apariencia de las cubiertas en planta. Las fachadas y los alzados siguen su propia reconstrucción.

Para la visión de cerca, los usos cartografiados seleccionan el microrrelieve y la variación de reflectancia de suelo seco, arena y grava. Se respetan las dimensiones horizontales de cada muestra. El tono a escala de parcela procede de la fotografía de Sagunto. La textura centimétrica y la amplitud vertical del relieve son interpretativas. Las tres capturas de material se distribuyen con licencia CC0. [Dry Ground 01, Rob Tuytel](https://polyhaven.com/a/dry_ground_01) · [Damp Beach Sand, Dimitrios Savva](https://polyhaven.com/a/damp_beach_sand) · [Gravel Floor, Matterfield y Jenelle van Heerden](https://polyhaven.com/a/gravel_floor) · [Licencia de Poly Haven](https://polyhaven.com/license)

El motor prepara una ventana móvil de 512 × 512 m dividida en cuatro sectores. El atlas fotográfico alcanza 2048 × 2048 píxeles en escritorio y 1024 × 1024 con pantalla pequeña o control táctil. El tamaño en memoria del atlas RGBA con mipmaps es de unos 21,3 MiB y 5,3 MiB respectivamente. Se añaden la máscara de 256 × 256 y dos texturas repetibles de 512 × 512. Como máximo hay dos pares de imágenes en descarga simultánea y cuatro hojas activas para decodificación. Las versiones móviles de las hojas más finas se sirven ya reducidas. En conjunto pesan 7,55 MB frente a 25,58 MB de los originales de escritorio. Tras doce segundos fuera de la zona de detalle se liberan los atlas de la GPU. Las hojas empaquetadas, las variantes móviles y sus metadatos suman 50,6 MB. La vista general carga el índice y utiliza las fotografías territoriales existentes. Si falla una hoja de aproximación, el visor recupera la placa regional disponible.

## Reproducción

Se necesitan Python, requests, Pillow con WebP, NumPy, SciPy, rasterio, Shapely 2 y pyproj. Para las pruebas de navegador se utilizan Playwright para Python y Chrome. Desde la raíz del repositorio se puede ejecutar lo siguiente.

```shell
python research/terrain-visual.py
python research/terrain-visual-verify.py --out research/terrain-visual-checks/cartografia.json
python -m http.server 8433 --directory dist
```

La adquisición realiza 31 solicitudes cartográficas delimitadas al WMS y siete consultas de metadatos. Los JPEG originales y sus metadatos se conservan en la carpeta temporal `saguntum-pnoa-surface-v1`. La opción `--cache` permite conservarlos en una ubicación permanente. El código también conserva los créditos y las URL y verifica las sumas de los seis archivos de material escaneado. Al repetir el proceso con la misma caché se reutilizan los originales. El navegador utiliza archivos locales del sitio.

Con el servidor en marcha se comprueban la descarga progresiva, la compilación de materiales, los recortes de las hojas, la degradación ante una hoja ausente y las vistas del casco histórico, campos, Grau Vell, cauce y playa. Las capturas proceden del WebGL del simulador. La prueba móvil usa Chrome con pantalla y puntero táctil emulados. [Capturas y medidas de escritorio](terrain-visual-checks/escritorio) · [Capturas y medidas en pantalla móvil emulada](terrain-visual-checks/movil)

```shell
python research/terrain-visual-check.py --base http://127.0.0.1:8433/ --out research/terrain-visual-checks/escritorio
python research/terrain-visual-check.py --base http://127.0.0.1:8433/ --mobile --out research/terrain-visual-checks/movil
```
