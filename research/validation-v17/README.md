# V17 · Verificación del Museo Arqueológico y su entorno

Esta carpeta conserva las comprobaciones de la Casa del Mestre Penya, sus dos plantas, la plaza y la conexión con la Judería. La identidad del atlas, sus 31 lugares y sus seis ámbitos permanecen generales.

## Métodos y alcance

- `validate_museo_documentation.mjs`: coherencia de las veinte paradas, cuarenta hechos, diecinueve hitos, veinte fuentes, coordenadas, plantas y límites de interpretación.
- `validate_museo_context.mjs`: conservación de huellas, propietarios anteriores, alturas, pavimentos, recursos y modos de lectura del nuevo contexto.
- `validate_museo_context_cameras.mjs`: observaciones del entorno con los edificios y monumentos vecinos presentes.
- `../validate_sagunto_v17.mjs`: ejecuta las funciones reales de construcción diferida, recuperación tras fallo de textura, encuadre y movimiento de cámara de la aplicación. Incluye terreno final, cimentaciones, calles, ciudad genérica y contextos anteriores.
- `validate_visit_controllers.mjs`: selección, cronología, fuentes, sección, enlaces y progreso de once visitas mediante el controlador real y un adaptador de elementos; no sustituye una prueba de disposición visual en navegador.
- `validate_static_assets.py`: sintaxis JavaScript, imports, recursos locales, JSON, referencias y accesibilidad estructural del HTML publicado.

La comprobación integrada examina 228 encuadres: veinte paradas del museo y dieciocho de Berenguer, en tres proporciones de pantalla y en vista general/cercana. Las cámaras se contrastan con la malla final del suelo, el espacio de interfaz disponible y las obstrucciones de los edificios. En interiores se comprueban nueve rayos distribuidos en el encuadre y un espacio inmediato de 0,8 m. Los impactos de las panorámicas sobre la propia cubierta se distinguen de las oclusiones por edificios vecinos.

El arco frente al museo conserva una única instancia en la Judería. El museo no lo reproduce ni lo traslada. Las escenas anteriores de la Sangre, el Salvador y Berenguer retienen sus focos documentados.

## Resultado final

| Comprobación | Resultado |
| --- | --- |
| Documentación y coordenadas | 13 / 13 |
| Arquitectura, pasos, plantas, sección y recursos | 149 / 149 |
| Contexto y propiedad cartográfica | 45 / 45 |
| Cámaras del contexto en la escena completa | 8 / 8 |
| Integración regional y encuadres | 1.037 / 1.037; 228 cámaras |
| Once controladores de visita | 31 / 31 |
| Distribución estática | 363 / 363; 45 solicitudes iniciales de datos |

El informe integrado final no presenta oclusiones inesperadas, obstrucciones interiores inmediatas, cámaras bajo el suelo ni cambios en los archivos de entrada durante la validación. La comprobación de arquitectura confirma la continuidad del rellano de la escalera y la ausencia de superficies coplanares superpuestas en esos encuentros. Las pruebas no miden FPS ni la duración de carga del navegador.

## Reproducción

Desde la raíz del repositorio, sin instalar ni compilar dependencias:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v17.mjs --export
node research/validation-v17/validate_visit_controllers.mjs
python research/validation-v17/validate_static_assets.py
```

Los scripts de geometría utilizan el paquete Canvas preinstalado del entorno, indicado por `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. El adaptador sustituye la lectura de texturas del navegador; mantiene la construcción real de la escena. El resultado `integrated-scene-qa.json` registra hashes SHA-256 de los módulos y datos utilizados.

## Inspección visual

`render_museo.py` importa los vértices, normales, UV, materiales, texturas e instancias exportados del modelo Three.js. Blender/Cycles los dibuja por CPU. Son renders de comprobación de la geometría implementada; no son capturas del navegador ni imágenes generadas para simular una aplicación.

```sh
blender -b -t 4 --python research/validation-v17/render_museo.py -- --scene museo-conjunto
```

Los renders finales de revisión incluyen el conjunto con su plaza, la sección, la planta baja y la planta alta. Los veinte focos, incluidos el arco y la circulación del patio, se comprueban además mediante las pruebas de cámara. La iluminación de inspección añade relleno ambiental para leer los interiores, por lo que no pretende reproducir píxel a píxel el render WebGL.

El navegador disponible para la comprobación tiene WebGL desactivado. Se revisan en él la portada genérica, el catálogo, el cuaderno, el plano por plantas, las fuentes, la cronología y los enlaces entre el museo y la Judería. La validación de geometría y cámara se realiza por separado; no se afirma una medición de rendimiento gráfico ni una verificación visual GPU en este entorno.

## Precisión

El ajuste numérico de un pavimento a la malla no expresa precisión topográfica sobre el terreno real. Las posiciones interiores, los detalles constructivos menores y la disposición de la colección son interpretaciones documentadas. El corte no muestra un subsuelo excavado ni convierte las piezas simplificadas en réplicas escaneadas. Las observaciones preparadas no son navegación libre en primera persona.
