# Validación del Puerto · edición 4

Revisión realizada el 19 de noviembre de 2026 sobre el código de esta edición.

## Pruebas geométricas

- `puerto-geometry.json`: 44 comprobaciones, 64 encuadres de escritorio/móvil, 0 errores y 0 oclusiones del contexto. Incluye métricas del terreno, edificios y modelos.
- `archaeology-regression.json`: 86 comprobaciones de los yacimientos anteriores. Los modos corte e histórica quedan libres de oclusiones; el estado actual conserva el contexto que cubre los restos.
- `permanent-excavation-regression.json`: 34 comprobaciones de hueco del circo, muestras de borde, atributos finitos, triángulos no degenerados, restauración de materiales y estabilidad de geometría.
- `road-support-verification.json`: comparación del terreno y pavimentos originales, sampler de la superficie final y apoyos enterrados en los encuentros de calles.
- `browser-checks.json`: recorrido completo de 24 lugares, filtros 3 + 6 del Puerto, fichas y vistas de escritorio, móvil vertical y horizontal.

## Evidencia visual

`puerto-contexto.png` y `horno-contexto.png` son renders CPU de la geometría real exportada desde Three.js, con el MDT y la ortofoto usados por la aplicación. Sirven para comprobar posiciones, volúmenes, cubiertas y suelo. No son fotografías ni capturas del renderizador WebGL, y la iluminación difiere del visor.

`talleres-cubierta-abierta.png` y `begona-modelo.png` muestran modelos aislados en renders CPU. `catalogo-puerto.jpg` es una captura del navegador en la vista alternativa 2D.

El navegador gestionado de pruebas tiene WebGL deshabilitado. Se verifican la interfaz y la cartografía 2D en él, y la geometría con Three.js y renders CPU. No se ha medido el rendimiento GPU ni se presenta esta comprobación como una validación WebGL completa.

## Reproducción de la prueba del Puerto

Desde la raíz del proyecto:

```bash
node --loader ./research/validate_loader.mjs research/validate_port.mjs --export
blender -b -t 6 --python research/render_port_validation.py -- --both
```

El verificador ejecuta Three.js vendorizado, sin WebGL. El render CPU necesita Blender instalado. Los archivos geométricos grandes intermedios se escriben bajo los nombres temporales `research/qa-*` y no se incluyen en el producto publicado.
