# Fachadas y cubiertas del simulador territorial

La [comparación a cámara fija](comparacion.jpg) reúne cuatro vistas del renderizador WebGL. Las capturas completas y el estado de cada cámara se conservan en [versión 36](v36/checks.json) y [revisión del simulador](v37/checks.json). Las huellas, patios y alturas de ambas series proceden de las mismas parcelas.

## Territorio y fotografía

El año inicial de construcción declarado por Catastro se asocia mediante la referencia pública del edificio padre a **44.620 de las 44.838 partes**. Corresponden a 12.636 edificios. Hay 4.020 partes con fecha anterior a 1940, 20.249 entre 1940 y 1979 y 20.351 desde 1980. El año ayuda a escoger el ritmo de huecos y acabados de cada edificio. La apariencia actual de una fachada reformada puede corresponder a otra época. Las 218 partes sin correspondencia conservan el criterio de uso, altura y ubicación. [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/) · [Condiciones de reutilización](https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf).

La iluminación indirecta de la calle se modula con la altura de los edificios circundantes. Se muestrea el MDSnE del IGN de 2,5 m en tres direcciones hacia el exterior de cada fachada, a distancias de 4 a 34 m, junto con el MDT del Atlas. Se estima la fracción de cielo obstruida a la altura del peatón y del alero. El modelo contiene 238.905 bordes con obstrucción en 32.754 partes. La luz solar directa y sus sombras se calculan por separado en Three.js. La resolución de la cuadrícula limita la precisión en callejones estrechos. [Fuentes y comprobaciones de integridad](../../dist/assets/territory/building-fabric/manifest.json).

Las cubiertas de los dos niveles de distancia comparten las ortofotos municipal y regional que usa el terreno. En las zonas cubiertas, las teselas PNOA de 25 o 50 cm conservan el mayor detalle al acercarse. Se atenúa el color proyectado cuando la imagen contiene vegetación o sombras profundas junto a un tejado. Los detalles que se leen en la fotografía, como lucernarios y cambios de material, siguen formando parte de la imagen. [PNOA](https://pnoa.ign.es/).

## Materiales y aproximaciones

En las fachadas ordinarias, persianas con relieve, jambas, cantos de balcones y vierteaguas se dimensionan a partir de los huecos de cada planta. Los materiales giran al entrar en los retranqueos, tanto en laterales como en dinteles y alféizares. A corta distancia, el cristal muestra el cambio de paralaje de los planos interiores y cortinas según la posición del observador. El reflejo angular diferencia suelo y cielo. Colores individuales, modelo de persiana, barandillas, interiores y distribución exacta de huecos siguen siendo interpretativos. La visita patrimonial mantiene sus propias geometrías y materiales.

El año y la obstrucción añaden 230.984 bytes comprimidos al conjunto de las 22 teselas de fachadas. Los datos viajan en la petición existente de cada región. El código de obstrucción utiliza el atributo de vértice existente y la fotografía ya residente en la GPU. El mobiliario de fachada cercano reserva un máximo de 4.500 instancias en dispositivos de puntero táctil o con poca memoria y actualiza el intervalo ocupado de cada búfer.

## Reproducción

Desde la raíz del repositorio, los siguientes comandos reutilizan el ZIP municipal de Catastro empleado por `research/territory/prepare.py` y la extracción MDSnE empleada por `research/territory-building-fabric.py`. Ambos permiten sustituir la ruta de la caché con `--archive` y `--surface`, respectivamente. El primer programa usa la biblioteca estándar de Python. El segundo requiere NumPy y Rasterio.

```powershell
python research/territory-building-years.py
python research/territory-facade-exposure.py
```

Para repetir las capturas, se sirve la carpeta `dist` de la versión correspondiente y se ejecuta el siguiente comando con Playwright para Python y Chrome instalados.

```powershell
python research/territory-building-fabric-gl.py --base http://127.0.0.1:8471 --out research/realismo-urbano/v37 --new --views major barcelona naves manzanas
python research/territory-building-fabric-gl.py --base http://127.0.0.1:8471 --out research/realismo-urbano/movil --new --mobile
```

## Comprobaciones

La comparación fila a fila de los 44.838 registros contra la versión 36 conserva los identificadores, perfiles de fachada, portales y pendientes de cubierta. Las cadenas de obstrucción se verificaron contra el número de lados del polígono exterior de cada parte.

| Cámara | V36 llamadas | Revisión llamadas | V36 triángulos | Revisión triángulos | p95 revisión |
|---|---:|---:|---:|---:|---:|
| Carrer Major | 337 | 338 | 883.304 | 926.691 | 16,8 ms |
| Puerto a pie de calle | 252 | 253 | 1.114.051 | 1.172.210 | 16,8 ms |
| Naves industriales | 107 | 108 | 730.394 | 787.309 | 16,7 ms |
| Manzanas desde unos 200 m | 149 | 150 | 1.167.201 | 1.223.534 | 16,8 ms |

Estas cifras corresponden al conjunto de la escena, tras la carga de los sectores, incluida la actualización simultánea del paisaje. Se midieron 90 intervalos de animación por vista con Chrome y calidad alta en este equipo. También se recorrió la cámara del Puerto con viewport de 390 × 844, escala 2, pantalla táctil emulada y calidad baja. En estas visitas no se registraron errores de JavaScript, compilación de shaders ni recursos HTTP fallidos. La prueba móvil usa el motor de Chrome en escritorio. [Registro móvil y cámara](movil/checks.json).
