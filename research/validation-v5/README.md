# Validación de la quinta edición — Costa, lugares 23–26

Revisión del 19 de noviembre de 2026. Las pruebas usan los módulos y datos de la aplicación. No hay geometría alternativa preparada para simular un resultado.

## Resultados

| Ámbito | Comprobaciones | Resultado |
|---|---:|---|
| Costa: catálogo, fases, coordenadas, mallas, agua, sección y cámaras | 131 | Superadas |
| Sagunto: carga regional diferida e integración | 169 | Superadas |
| Sagunto: huecos arqueológicos permanentes | 34 | Superadas |
| Sagunto: fallo de textura y reintento concurrente | 182 | Superadas |
| Puerto: regresión de los nueve conjuntos industriales | 44 | Superadas |

Las 64 configuraciones arqueológicas de Sagunto mantienen exactamente sus cámaras anteriores. Diez intersecciones de contexto en las vistas actuales ya estaban presentes en la referencia de la tercera edición; no aparecen en las vistas de corte o históricas. Los 25 rayos de control de las excavaciones permanentes quedan libres tras la carga y después de recorrer todos los modos.

El rechazo simulado de una textura retira los cuatro grupos parciales de Sagunto y libera 196 geometrías propias. Conserva los datos de Costa y Puerto. Dos solicitudes concurrentes comparten un único intento y el reintento crea una sola región completa.

En Costa, todos los atributos e instancias son finitos. Las vistas generales de los cuatro conjuntos caben en los encuadres de escritorio (1363 × 936) y móvil (390 × 844); no se detectan obstrucciones del contexto hacia sus puntos de interés. Los controles a baja altura mantienen su cota prevista. Las dos mitades del pantalán comparten fase. En los almacenes históricos se corrigieron solapes coplanares de las tapas de los muros: 21 rayos finales verifican una única cara superior en los encuentros y dinteles comprobados.

## Evidencia visual

`catalogo-costa-navegador.jpg` es una captura real de Chrome, con el catálogo filtrado por Costa. El navegador gestionado declara WebGL deshabilitado: la captura muestra la alternativa 2D. `browser-checks.json` recoge la navegación, mapas, fichas, modos y recorridos comprobados.

Las siete imágenes PNG se han renderizado con Cycles a partir de la geometría real exportada de Three.js, incluidas matrices, instancias y cámaras. Sirven para inspeccionar volumen, colocación, encuadre y secciones. Cycles sustituye los materiales del navegador, incluido el agua; estas imágenes **no son capturas de WebGL ni pruebas de su rendimiento**.

- `costa-conjunto.png`: vista general.
- `paseo-pergolas.png`: detalle del paseo actual.
- `pantalan-actual.png` y `pantalan-historico.png`: comparación con la misma cámara.
- `fortin-grau-vell.png`: torre, batería y almacenes.
- `puerto-romano-seccion.png`: restitución parcial con las cubiertas, los forjados y frentes superiores retirados.
- `arqueologia-marina.png`: agua retirada; los fondos y las profundidades son expositivos, no batimetría medida.

## Reproducción

Desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_coast.mjs --export
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v5.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_permanent_v5.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_retry_v5.mjs
node --experimental-loader ./research/validate_loader.mjs research/validate_port.mjs
blender -b -t 6 -P research/render_coast_validation.py
```

Los ficheros temporales `research/qa-*` no se versionan. Este directorio conserva los resultados revisados. Las pruebas CPU sustituyen únicamente la carga de texturas y el contexto canvas que no existen en Node; no sustituyen los modelos.

## Alcance pendiente de comprobación

La fluidez de navegación, compilación de shaders, reflejos y consumo GPU necesitan validación en un navegador con aceleración gráfica. Se revisó la geometría para formato vertical, pero no se declara una prueba en un dispositivo móvil físico. La navegación sigue siendo orbital, con puntos de observación bajos, sin recorrido libre en primera persona.
