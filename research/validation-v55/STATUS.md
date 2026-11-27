# Validación v55 · cerrada

**Aprobada.** `validation-manifest.json` reúne ocho informes aprobados, los
SHA-256 de las fuentes finales y la procedencia de las 19 imágenes revisadas.
El cotejo final no detecta fuentes obsoletas. No quedan correcciones de
geometría, contacto, cámaras o plano pendientes en este ámbito.

## Comprobaciones realizadas

- **Modelo y Simulador:** 763 comprobaciones de los constructores reales y
  24 comprobaciones específicas de v55. Las 182 mallas patrimoniales tienen
  buffers y registro métrico coincidentes entre Atlas y Simulador.
- **Recorridos:** 207 muestras del paso de Almenara y 219 de los dos caminos
  orientales, sin bloqueos. Las excavaciones y el acceso inclinado del nido
  conservan suelo real y recorte correspondiente en ambos constructores.
- **Cámaras:** 48 encuadres normales y 10 cercanos, incluidos escritorio y
  móvil; ojos fuera de muros y huecos, y objetivos visibles sobre el terreno.
- **Senderos exteriores:** 37.160 muestras del Atlas y 31.020 del Simulador
  para los tres IDs acordados, con separación respecto al suelo entre
  aproximadamente 0,7 y 4,3 cm. El error respecto al margen nominal es menor
  de 1,8 cm. El terreno, los trazados y las etiquetas de acceso se conservan.
- **Plano y catálogo:** nueve escenarios de plano, incluidos móvil y modo
  sin modelo cargado; 22 paradas, siete recintos y los otros 32 monumentos
  preservados. Los dos huecos de la muralla se dibujan abiertos.

## Procedencia de las imágenes

Las vistas general, naranja y amarilla se han vuelto a exportar y renderizar
con todas las correcciones finales. El agente principal ha revisado y
aprobado las tres. Sus hashes y cámaras figuran en
`renders/render-inspection.json`.

Las 16 vistas restantes se conservan de la inspección aprobada anterior.
Las correcciones posteriores afectaron a cimentaciones ocultas, al acceso
del nido y a senderos exteriores. Su procedencia original se mantiene en
`renders/render-inspection-initial.json`; el manifiesto combinado distingue
ambos grupos de forma explícita.

Los renders son inspecciones **CPU** de los buffers, instancias y texturas
Three.js reales mediante Blender Cycles. No son capturas de WebGL y no
incluyen los controles ni el desplazamiento de encuadre de la interfaz.
La comprobación de interfaz y la compilación final del worker se registran
por separado por el agente principal.
