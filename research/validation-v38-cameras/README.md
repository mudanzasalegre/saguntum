# Encuadres de las visitas en el territorio

La fuente de las cámaras es el Atlas original de Sites, versión 37. La calibración recorre las 529 paradas de 32 lugares mediante los controles de la propia aplicación. Incluye las seis observaciones costeras de Puerto Antiguo y los puntos de observación de los tres paisajes. Para las dos visitas al pantalán, cada selección comienza en estado contemporáneo. La propia parada puede activar su fase histórica.

## Reproducir la calibración

Se necesitan Python, Playwright para Python y Chrome con WebGL. Servir `dist` de la versión de referencia en un puerto y `dist` de la revisión que se quiere comprobar en otro. Desde la raíz del repositorio de trabajo, ejecutar los dos programas con sus servidores correspondientes.

```sh
python research/export-territory-visit-cameras.py --base http://127.0.0.1:8470
python research/check-territory-visit-cameras.py --base http://127.0.0.1:8471
python research/check-territory-visit-cameras.py --base http://127.0.0.1:8471 --coast
```

La segunda comprobación utiliza además Pillow y pyproj. El exportador guarda `dist/assets/territory/visit-cameras.json`. La opción `--places` permite repetir lugares concretos conservando el resto. La instrumentación sólo observa el módulo cargado en el navegador de calibración.

## Coordenadas, escala y presentación

Cada parada guarda el objetivo tridimensional, la cota de terreno del Atlas en ese objetivo, la posición del observador y su campo vertical de visión. Las dos medidas de referencia corresponden a 1440 × 900 y 390 × 844 píxeles CSS. El simulador aplica a ojo y objetivo la misma transformación horizontal que utiliza el modelo patrimonial. La diferencia entre la cota territorial y la del Atlas se aplica a ambos. Así se conserva la altura de un ojo respecto a la estructura observada, también en los interiores. Los formatos intermedios interpolan la distancia de cámara y la apertura. La composición se centra en el lienzo del simulador, que tiene sus propios controles.

Algunas vistas lejanas de paisajes se encuentran a varios kilómetros de la ficha principal del lugar. Las posiciones de las cámaras pertenecen al modelo original. Su reproducción numérica conserva ese dibujo y sus aproximaciones documentales. Las posiciones de los marcadores siguen las coordenadas de las fichas.

## Comprobaciones

Los dos recorridos completos de calibración dieron idénticos ojos, objetivos, cotas y campos visuales a cuatro decimales. Cada identificador de cámara corresponde a una única parada en el catálogo. La comparación geodésica independiente usa PROJ para transformar directamente las posiciones originales en EPSG:25830 y medir la diferencia con la transformación local de cada modelo. `checks.json` identifica las diferencias máximas de registro horizontal, vertical y de campo visual en cada formato.

La prueba de navegación utiliza los enlaces territoriales reales, comprueba la selección del modelo y espera a que la cámara se detenga. Mide la desviación del ojo y el objetivo con una tolerancia de 2,5 cm y compara el campo de visión con una tolerancia de 0,001°. Incluye las 24 paradas de la Glorieta, los soportales de Plaza Mayor, el coro de Begoña, Casablanca, el centro ambiental de la Marjal, el Palancia a pie, el almacén histórico y la pasarela del pantalán. La Glorieta se revisó también al tamaño de un teléfono en la misma GPU de escritorio. Queda pendiente la validación física de estas cámaras en Safari de iPhone y iPad.

Las dos planchas proceden del lienzo WebGL del simulador en Chrome para Windows, con NVIDIA GeForce RTX 3090. La primera reúne las 24 paradas de la Glorieta. En la segunda se aprecian las seis observaciones de Puerto Antiguo, incluidas las crujías del almacén abierto y la zona de inspección marina. Esta última toma conserva el fondo expositivo de la interpretación del Atlas.

También se abrió el enlace original `#glorieta` en WebKit para Windows con el perfil de iPhone 13 de Playwright. El Atlas entró en modo 3D. En el mismo navegador se pasó al monumento a Romeu en el simulador y después al almacén histórico de Puerto Antiguo. Ambas visitas cargaron el modelo en WebGL 2. El archivo `webkit-windows.json` recoge las rutas, los estados de carga y las excepciones observadas.
