# Gráficos del simulador territorial

## Comparaciones

Las capturas proceden del canvas WebGL del proyecto original. El comparador verifica numéricamente la posición, orientación, campo de visión, hora y tipo de luz de los pares v40/v41. La prueba del Alto Horno toma primero el objetivo de la cámara en la visita del Atlas y registra su posición en la cuadrícula territorial. [Carrer Major](fachadas.jpg) · [Pantalán y Mediterráneo](mediterraneo.jpg) · [Alto Horno n.º 2](alto-horno.jpg)

En el Alto Horno coinciden los 114 lotes arquitectónicos muestreados y los 26 lotes de su entorno inmediato. La corrección de altura entre los dos suelos es de −4,7 cm. En los 145 vértices visibles, el desfase mediano es de 0,57 píxeles y el percentil 95 de 1,43 píxeles en una imagen de 1200 × 760. Cinco lotes periféricos de la escena extensa del Atlas quedan fuera de las correspondencias. [Cámaras, lotes y errores de reproyección](v41/horno.json)

## Materiales, relieve y paisaje

El hormigón, la piedra de los remates, las barandillas pintadas y el cinc reciben acabados distintos dentro de un único lote de elementos instanciados. Las muestras de albedo y rugosidad son las mismas que usa la piel del edificio. El vidrio cercano incorpora el cielo de la escena y la altura de la edificación que tiene enfrente. Los balcones comprueban el espacio en los extremos del vuelo y una altura libre de 2,35 m. Las reglas de fachada siguen siendo interpretativas. Las ventanas documentadas en el Grau Vell se mantienen en las reconstrucciones del Atlas. [Escaneos y dimensiones físicas](../../dist/assets/materials/architecture/CREDITS.md) · [Licencia CC0 de Poly Haven](https://polyhaven.com/license) · [Fotografía del antiguo colegio, Berta26, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Colegi_del_Grau_Vell.jpg)

La fotografía de Joanbanjo de dos ventanas del Carrer Major identifica la calle e ilustra la diversidad de sus huecos. La ficha carece de una identificación catastral que permita atribuir ambas ventanas a una parcela determinada. La captura de la calle distingue los acabados tipológicos de las visitas documentadas. Las condiciones municipales reservan los derechos sobre el contenido de su portal. Mapillary publica condiciones de atribución por fotografía. Esta edición distribuye los escaneos CC0 empaquetados y el modelo patrimonial existente. [Dos finestres al carrer Major, Joanbanjo, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Dos_finestres_al_carrer_Major,_Sagunt.jpg) · [Ayuntamiento de Sagunto](https://aytosagunto.es/es/aviso-legal/) · [Condiciones de Mapillary](https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data)

Las parcelas próximas de relieve real y los suelos corregidos de los monumentos proyectan sombras. Los materiales de profundidad usan los mismos recortes de excavación y pavimento que las superficies visibles. El perfil alto mantiene el contacto por profundidad cerca del observador. En vuelo rápido se suspende ese pase y se espacian los reflejos en los perfiles que priorizan fluidez.

El cruce de 58.628 centros de copa del IGN con 44.838 huellas de edificaciones y 8.022 elementos de calzada del paquete reduce 4.336 radios y descarta 353 centros sin espacio para representar el árbol. La geometría del cruce considera patios y excluye tableros y túneles del viario. Los centros restantes conservan las coordenadas y alturas del inventario. Se representan grupos de vegetación y radios estimados. Un byte por copa almacena el resultado. Los grupos próximos mantienen su variación cromática PNOA y admiten una oscilación suave en alta y Ultra. La preferencia del sistema por movimiento reducido inmoviliza las hojas. [Preparación reproducible](../prepare-canopy-clearance.py) · [Coberturas y procedencia de las copas](../../dist/assets/territory/canopy/index.json) · [Datos IGN](https://www.ign.es/web/ign/portal/politica-datos)

## Motor, perfiles y costa

La distribución original incluye Three.js r180. La publicación oficial consultada el 23 de noviembre de 2026 era r187. Three.js documenta que el complemento `Water`, `ShaderMaterial` y las modificaciones de `onBeforeCompile` requieren `WebGLRenderer`. El mar territorial extiende ese complemento con datos de distancia a la orilla, espuma y una cámara especular. El suelo y las construcciones también utilizan fragmentos GLSL para ortofoto, huecos, cortes y materiales. La selección evalúa estos requisitos antes de crear la escena. En el equipo de prueba Chromium exponía WebGPU y la escena eligió WebGL 2. Si falla la creación del contexto, el mapa 2D permite acceder a los lugares y reintentar. [Publicación r187](https://github.com/mrdoob/three.js/releases/tag/r187) · [Water](https://threejs.org/docs/pages/Water.html) · [ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html) · [Material.onBeforeCompile](https://threejs.org/docs/pages/Material.html#onBeforeCompile)

| Perfil | Sombra solar próxima | Sondeo del cielo por cara | Píxeles máximos en escritorio |
| --- | ---: | ---: | ---: |
| Baja | 512² | 32² | 1,5 millones |
| Media | 1536² | 64² | 2,6 millones |
| Alta | 2048² | 64² | 4,4 millones |
| Ultra | 4096² | 128² | 7,2 millones |

La opción automática considera resolución física, indicadores de memoria y núcleos cuando el navegador los facilita, capacidades del contexto y tiempos recientes P50/P95. Reduce primero el detalle y después la resolución de pantalla. Espera más tiempo para subir de nivel. En pantallas pequeñas se aplican presupuestos de píxeles más bajos. Ultra requiere soporte de texturas de coma flotante en framebuffer, al menos cuatro muestras posibles y las capacidades de textura estipuladas en el selector. Las fotografías representan el perfil alto.

La costa conservó 1.833 vértices de superficie, un mapa de normales de 128 píxeles, un campo de orilla de 1.013 píxeles de ancho y un reflejo planar de 768 píxeles en escritorio. Se verificó además que avanza el reloj de las olas y que la dirección solar oriental al amanecer cambia hacia poniente al atardecer. La componente vertical del sol al mediodía fue 0,960 el 21 de junio y 0,453 el 21 de diciembre. Por la noche se apagan los destellos solares. La interfaz usa hora solar aparente y la declinación estacional en la latitud local. [Datos de la prueba de perfiles y agua](v41/perfiles.json) · [Ecuaciones solares de NOAA](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)

## Rendimiento observado

Se midieron intervalos de `requestAnimationFrame` en Chrome 156 para Windows con ANGLE/D3D11 y NVIDIA GeForce RTX 3090, a 1200 × 760 y un píxel físico por píxel CSS. Se ejecutaron primero los dos encuadres v40 y después los dos actualizados, sin otra prueba gráfica simultánea del equipo. Cada encuadre tiene 120 intervalos con cámara quieta, nombres y actores ocultos, tras cargar su geometría cercana. En estas condiciones el refresco de imagen limita la mediana.

| Cámara | Calidad | P50 v40 | P95 v40 | P50 actual | P95 actual |
| --- | --- | ---: | ---: | ---: | ---: |
| Carrer Major, a 3 m | Alta | 16,7 ms | 16,8 ms | 16,7 ms | 16,8 ms |
| Pantalán mirando hacia la costa | Alta | 16,7 ms | 16,8 ms | 16,7 ms | 16,8 ms |

En el vuelo de ocho segundos, con tráfico activo, carga progresiva y acelerador pulsado, la cámara recorrió 3.290 m y se observaron 345 intervalos. La mediana fue de 16,7 ms y el percentil 95 de 33,3 ms, con una media de 43,1 cuadros por segundo. El máximo de peticiones de sectores pendientes observado en los muestreos de estado fue cuatro. Los tiempos corresponden a este equipo de escritorio. Las mediciones de memoria JS incluyen objetos pendientes de recolección y las cifras de dibujo dependen de cuándo se actualiza el reflejo y la sombra. [Carrer Major v40](v40/calle.json) · [Carrer Major actualizado](v41/calle.json) · [Pantalán v40](v40/costa.json) · [Pantalán actualizado](v41/costa.json) · [Vuelo libre](v41/vuelo.json)

## Reproducción

Se necesitan Python 3, Playwright para Python, un Chrome instalado, NumPy y Pillow. El ensayo de arbolado utiliza además Shapely 2. Se sirven dos copias de `dist` con servidores HTTP locales independientes, una por versión.

```powershell
python research/prepare-canopy-clearance.py
python research/check-graphics-v41.py --base http://127.0.0.1:8470/ --out research/graficos-v41/v40 --version v40 --only calle costa
python research/check-graphics-v41.py --base http://127.0.0.1:8471/ --out research/graficos-v41/v41 --version v41
python research/graficos-v41/comparar.py
```
