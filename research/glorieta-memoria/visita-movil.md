# La Glorieta en móvil y tableta

La versión 36 abría las guías y los planos de todo el Atlas, el relieve completo del casco urbano y sus escenas patrimoniales al entrar en `#glorieta`. La panorámica inicial de teléfono también podía quedar fuera de la distancia a la que aparecía el jardín detallado. La captura aportada por el usuario muestra un reinicio de Safari. El perfil de la versión 36 revela una carga de memoria elevada que puede provocar ese síntoma. Falta un registro de diagnóstico del teléfono original para atribuirle una causa única.

## Datos que carga la visita

El catálogo mantiene sus 32 lugares. La Glorieta carga sus 24 paradas, las fuentes, la cronología, el plano y los materiales originales. La escena comparte la guía y el motor del Atlas. Al cambiar entre la plaza y otra visita, la página libera el contexto gráfico anterior y conserva el destino, la parada y el índice del recorrido regional.

El sector usa 321 × 321 muestras originales del relieve derivado de MDT05, con el mismo origen, orientación e interpolación del Atlas. El recorte de la ortofotografía comparte esos límites y se exporta desde el JPEG de producción. La ventana cubre unos 641 × 609 m. El MDT proporciona las cotas del terreno. La densidad del recorte conserva el muestreo del proyecto y la precisión nominal sigue siendo la del producto original.

La cartografía del entorno incluye 2.961 partes de edificios y 171 vías candidatas antes del filtrado geométrico de la escena. Se conservan las huellas, huecos, identificadores y metadatos de Catastro y OSM. La plaza mantiene sus 191 partes arquitectónicas y la lista de huellas protegidas. El generador de ciudad omite los polígonos que se superponen a la plaza y a sus fachadas. Las alturas estimadas y los materiales interpretativos mantienen el grado de certeza explicado en la visita.

## Perfiles de la aplicación

Prueba en Chrome con WebGL real, ventana táctil de 390 × 844, escala de pantalla 3 y reducción de movimiento. Se abrió la panorámica inicial con una página nueva en cada versión. Las cifras de recursos suman los cuerpos descodificados de las peticiones a `/assets/`. La memoria indica el heap de JavaScript en una muestra posterior al primer renderizado. Varía con el recolector de basura. Los contadores gráficos proceden del propio renderizador.

| Medida | v36 | Visita sectorizada |
| --- | ---: | ---: |
| Recursos solicitados | 110 | 36 |
| Recursos descodificados | 44,31 MB | 7,76 MB |
| Memoria de JavaScript observada | 855 MB | 157 MB |
| Geometrías residentes | 569 | 95 |
| Texturas residentes | 32 | 13 |
| Llamadas de dibujo | 288 | 122 |
| Triángulos enviados | 1.581.214 | 604.792 |

Los registros completos se guardan en [v36.json](v36.json), [actual.json](actual.json) y [webkit-tableta.json](webkit-tableta.json).

## Comprobaciones

- Chrome teléfono y WebKit tableta recorrieron las 24 paradas por URL con el renderizador activo y sin excepciones de página. Se inspeccionaron la apertura y los encuadres de las visitas. La panorámica usa los vértices reales del perímetro y las cámaras a pie conservan su posición al adaptar el campo de visión al espacio que deja la ficha. [Panorámicas de apertura](panoramicas.jpg) · [Las 24 paradas en el teléfono](24-paradas.jpg).
- El recorrido regional continuó por las posiciones 10, 11 y 12 de 16 al cambiar de Salvador a Glorieta y después a Vía del Pòrtic. También se abrieron la parada del Alto Horno y la de las fuentes de la Glorieta mediante enlaces directos. [Secuencia del recorrido](recorrido-regional.json).
- En WebKit se abrió el plano de las fuentes, se cerró el aviso, se cambió a la parada de Romeu y se recuperó el 3D con el botón accesible de la ficha. El enlace conservó la parada de Romeu.
- El control geométrico comprobó 9.915,3 m² de perímetro, cotas entre 47,88 y 49,00 m en sus vértices, 16 polígonos válidos y 59 troncos, 21 bancos y 17 luminarias fuera de la fuente y los pabellones.

Chrome y WebKit se ejecutaron en Windows. Las dimensiones, el tacto y la escala de pantalla se emularon. Sigue pendiente la verificación en el iPhone físico que mostró el error.

## Reproducción

Desde la raíz del repositorio, con Python y Pillow, el siguiente comando vuelve a generar el sector con los archivos locales ya atribuidos en el Atlas.

```sh
python research/prepare-glorieta-sector.py
```

Para repetir los perfiles, instala Playwright para Python, Chrome y el motor WebKit de Playwright. Sirve `dist` con un servidor HTTP y adapta la URL si usas otro puerto.

```sh
python -m http.server 8000 --directory dist
python research/profile-glorieta-startup.py --base http://localhost:8000 --out actual.json --routes --transfer
python research/profile-glorieta-startup.py --base http://localhost:8000 --out webkit.json --webkit --tablet --routes --capture capturas
```
