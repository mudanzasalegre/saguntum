# V18 · Verificación de la Vía del Pòrtic

Esta revisión conserva la identidad general del atlas y amplía un lugar existente. La edición representa el yacimiento, el espacio musealizado bajo los dos bloques actuales, la plaza y el barrio inmediato. Las reconstrucciones históricas se identifican por su grado de respaldo documental.

## Comprobaciones reproducibles

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| Escena regional de producción | 1.005 comprobaciones; 156 cámaras | Carga diferida, recuperación tras un fallo de textura, geometría integrada, niveles de suelo, vista por modos, materiales y encuadres de la nueva visita y del Museo Arqueológico |
| Arquitectura de Pòrtic | 156 comprobaciones | Dimensiones publicadas, apoyos, cloaca hueca, cámaras interiores, luces selectivas, lectura por colores, superficies y restauración del estado |
| Contexto urbano | 50 comprobaciones | Propiedad única de los edificios, patios, alturas, calles, pavimentos y continuidad del terreno |
| Documentación | 13 bloques | Veinte paradas, cuarenta hechos, dieciocho hitos, diecinueve fuentes, concordancia con el plano y límites de interpretación |
| Controladores de visita | 33 comprobaciones | Doce visitas independientes, selección, progreso, fuentes, cronología y funcionamiento documental sin WebGL |
| Recursos estáticos | 380 comprobaciones | Sintaxis, importaciones, referencias, JSON, HTML, fuentes y coordenadas compartidas |

Los resultados completos constan en `integrated-scene-qa.json`, `portic-architecture-qa.json`, `portic-context-qa.json`, `portic-visit-results.json`, `visit-controller-results.json` y `static-assets-qa.json`.

La prueba regional ejecuta los constructores y las funciones de encuadre reales de la aplicación, sustituyendo únicamente la carga de imágenes por un adaptador de Node. Comprueba las cámaras a 1.363 × 936, 390 × 844 y 844 × 390, en distancia normal y próxima. Esto verifica geometría y encuadres; no certifica rendimiento GPU ni constituye una prueba táctil real de cada dispositivo.

## Riesgos encontrados y corregidos

- Los edificios contenedores tienen una huella irregular. Las pasarelas, depósitos y restos se ajustaron a ese contorno; el terreno exterior se recompone entre las huellas y la ventana de corte.
- La consulta de altura de cámara respeta esa superficie pública: el fondo subterráneo sólo se admite dentro de las dos huellas anfitrionas.
- Al volver a Actual desde una parada que necesita Corte o desde la reconstrucción histórica, se recupera la vista general y se evita mirar a través del forjado cerrado.
- Las cámaras de las letrinas y del entorno se corrigieron después de detectar oclusiones por una barandilla y por el edificio actual.
- Plano, modelo y guía comparten la paleta de seis temas. Los tres focos exteriores conservan la planta 0 y el ámbito contemporáneo.
- Los edificios detallados sustituyen sus equivalentes genéricos; las visitas y los contextos anteriores mantienen su propietario geométrico.

## Interfaz comprobada en navegador

La vista previa gestionada se abrió en `http://127.0.0.1:4173/`. Se verificaron la portada genérica, los 31 lugares del catálogo, la entrada `#portic`, el plano con veinte paradas, la selección de la cloaca, las pestañas de cronología y fuentes, el diálogo bibliográfico y el retorno al conjunto. La captura `portic-interfaz-2d.jpg` y `browser-qa.json` documentan esta comprobación.

**Limitación observada:** el navegador de prueba no permite crear un contexto WebGL. La aplicación mantiene su modo de plano y documentación, y desactiva los controles que requieren 3D. No se presenta esta revisión como una prueba visual del render GPU ni como una medición de fluidez gráfica.

## Renders de inspección

Los PNG de esta carpeta se generan con `render_portic.py` a partir de las mallas, normales, colores, texturas Canvas y posiciones de luces exportadas de Three.js. Las vistas de Actual, Corte e Histórica provienen de esos grupos de la aplicación. El render CPU utiliza Blender Cycles a 1.440 × 1.080; la iluminación ambiental, la equivalencia de potencia de las luces y el tratamiento de la transparencia no son idénticos a WebGL.

Se inspeccionan la calzada desde el interior, la cloaca abierta, el conjunto urbano y la restitución histórica. Son renders del modelo, no fotografías del yacimiento ni capturas del navegador. La versión de Blender disponible no incluye OpenImageDenoise; los renders se conservan sin alteración generativa de sus detalles.

### Imágenes revisadas

- [Conjunto urbano actual](portic-conjunto.png)
- [Corte del yacimiento y la plaza](portic-corte.png)
- [Interior y calzada](portic-calzada.png)
- [Apertura de la cloaca](portic-cloaca.png)
- [Interpretación del siglo II](portic-historica.png)
- [Interfaz y plano en el navegador](portic-interfaz-2d.jpg)

Los parámetros y las huellas de integridad constan en `render-review.json`.

## Reproducción

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v18/build-portic-plan.mjs
node research/validation-v18/validate_portic_documentation.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v18/validate_portic_architecture.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v18/validate_portic_context.mjs
node research/validation-v18/validate_visit_controllers.mjs
python research/validation-v18/validate_static_assets.py
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v18.mjs --export
blender -b -t 4 --python research/validation-v18/render_portic.py -- --scene portic-cloaca --samples 96
```

Los validadores de geometría utilizan el paquete Canvas del runtime primario indicado por `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. La preparación cartográfica requiere Shapely, Matplotlib y Pillow; la aplicación no añade estas dependencias. Los archivos de geometría intermedios comprimidos y los registros de ejecución no forman parte de la publicación.

## Límites de precisión

La ubicación de las parcelas y el relieve tienen procedencia cartográfica. La planta arqueológica se ajusta proporcionalmente a las publicaciones; las cotas absolutas del subsuelo, las alturas de los restos y los detalles de fachada no proceden de un levantamiento integral. En el segundo bloque, los muros bajos son tipológicos. La restitución del siglo II no reconstruye toda la ciudad ni atribuye a los alrededores contemporáneos una fecha antigua. La navegación es orbital con puntos preparados; no se afirma un paseo libre en primera persona.
