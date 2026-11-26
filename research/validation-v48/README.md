# Santa María y controles del Atlas — comprobación de integración

La revisión del 26 de noviembre de 2026 se describe en [Santa María: entorno, interior y controles](../../docs/SANTA_MARIA_ENTORNO_INTERIOR.md). El modelo conserva 16 paradas propias y comparte escena y datos entre Atlas y Simulador.

## Imágenes de inspección

Estas vistas utilizan los buffers y transformaciones reales del modelo. Se renderizan por CPU en Blender con materiales e iluminación aproximados; **no son capturas WebGL ni imágenes generadas**. El relleno luminoso de las vistas interiores sirve sólo para examinar las mallas, no reconstruye lámparas físicas.

| Vista | Evidencia |
| --- | --- |
| Fachada occidental y terrazas | [Vista elevada](santa-maria-oeste.jpg) |
| Portada de los pies y escalerilla | [Vista desde la plaza](santa-maria-plaza-oeste.jpg) |
| Portada del Mediodía | [Recinto de piedra y cruz](santa-maria-cruz-mediodia.jpg) |
| Nave central | [Interior con cubierta](santa-maria-naves.jpg) |
| Bóvedas | [Lectura desde el interior](santa-maria-bovedas.jpg) |
| Capilla lateral | [Vista desde la nave lateral](santa-maria-capillas.jpg) |

## Evidencia numérica y de interfaz

- `public-realm-qa.json`: propiedad única de las tapas, cierres de terrazas y unión con las calles.
- `pavement-continuity-qa.json`: continuidad de los 51.128 triángulos del pavimento restante de Santa María y Plaza Mayor, con 598 uniones en T comprobadas.
- `santa-maria-ground.json`: terreno, anclaje y escalinata norte.
- `plaza-santa-maria-ensemble.json`: integración de las dos visitas y sus 32 paradas.
- `santa-maria-cameras-qa.md` y `.json`: export de las cámaras desde el modelo final y el `preset()` del Atlas, más su transformación al sistema territorial.
- `camera-depth-qa.json`, `depth-raster-qa.json` y `orbit-glitch-diagnosis.md`: reproducción del problema de profundidad y comprobación del ajuste continuo de cámara.
- [Arquitectura](../santa-maria-v48/architecture-qa.json): aperturas, cubiertas, bóvedas, umbrales, líneas de visión interiores y sección.
- [Panel plegable](../editorial-panel-visibility.md): teclado, escritorio, móvil, conservación de lectura y pruebas de proyección.

## Regeneración

Desde la raíz del repositorio:

```sh
node research/validation-v48/build-santa-maria-plan.mjs
python research/prepare-territory-visits.py
node research/validation-v48/export-santa-maria-cameras.mjs
node research/validation-v48/export-santa-maria-cameras.mjs --check
node research/build-territory-heritage.mjs

node --experimental-loader ./research/validate_loader.mjs research/validation-v48/export-urban-geometry.mjs --out /tmp/santa-maria.json.gz
python research/test-public-realm-geometry.py --geometry /tmp/santa-maria.json.gz --out /tmp/public-realm-qa.json
node research/test-pavement-continuity.mjs --geometry /tmp/santa-maria.json.gz --exclude-components santa-maria-cervantes --json /tmp/pavement-qa.json
blender -b --threads 8 --python research/validation-v48/render_urban.py -- --geometry /tmp/santa-maria.json.gz --output /tmp/santa-maria-views --samples 24 --jpeg
```

El build del worker requiere la dependencia `esbuild`. La plaza de Cervantes se excluye sólo de la prueba de continuidad coplanaria porque sus escalones tienen diferencias de cota intencionadas; sus tapas y contrahuellas se verifican en la prueba específica del espacio público. Los informes iniciales conservan las mediciones previas a las correcciones y se distinguen del informe final.

El navegador de comprobación local no dispone de WebGL. La revisión de interfaz se hizo en modo plano; la geometría y la cámara se comprobaron mediante los métodos descritos. No se ofrecen mediciones de FPS ni garantías sobre un dispositivo gráfico que no se haya ensayado.
