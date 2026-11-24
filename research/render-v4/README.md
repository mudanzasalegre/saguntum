# Comprobación visual del simulador V4

Las 60 capturas proceden de los renderizadores de la aplicación, en Chrome de escritorio sobre Windows. Cada fila reúne una vista del Atlas original V41, el simulador V41 y los motores WebGL 2 y WebGPU del simulador V4. La comparativa incluye el conjunto territorial, calles y jardines, diez conjuntos patrimoniales y una sección arqueológica. [Abrir la lámina completa](comparacion.jpg)

## Cámaras y mediciones

El visor se abrió con enlaces directos y una ventana de 1000 × 640 píxeles a escala 1. Se esperó a que la escena solicitada y sus sectores estuvieran disponibles. Las dos versiones del simulador emplean las cámaras registradas de las visitas, con luz y terreno automáticos. El Atlas original tiene su propio encuadre para dejar espacio a los paneles. Se ocultó su interfaz para capturar el lienzo. En la primera fila el Atlas muestra el modelo regional de Sagunto y el simulador el territorio hasta el mar.

En las 15 parejas V4 coinciden posición del ojo, pivote y campo visual a la precisión registrada. Las capturas conservan el detalle adaptativo de una sesión normal. Los informes guardan el perfil efectivo. Tráfico, agua, fuentes y viento siguen animados, por lo que la diferencia de píxeles incluye movimiento. La diferencia media absoluta RGB entre motores, en niveles de 0 a 255, va de 1,27 en los trípodes a 8,88 en los jardines de la Glorieta. La panorámica mide 2,30 tras corregir el orden de mezcla de la bruma. [Diferencias por vista](diferencias.json) · [Atlas original](atlas/vistas.json) · [Simulador anterior](previo/vistas.json) · [WebGL 2](webgl2/vistas.json) · [WebGPU](webgpu/vistas.json)

Los encuadres permiten reconocer el monumento a Romeu, el arbolado y los surtidores de la Glorieta en los tres simuladores. El salón del Casino conserva la distribución de mobiliario y huecos. En el pantalán se ven las sombras y los reflejos de las pilas. Persisten diferencias en el filtrado de sombras del arbolado, las juntas y los bordes de las fachadas. Las fachadas individuales sin documentación de alzado mantienen acabado interpretativo. Los datos cartográficos, la geometría patrimonial y las cámaras son compartidos.

## Pruebas independientes

En una sola sesión WebGPU se dibujó una parada de cada uno de los 32 lugares. En el plano se abrieron las 529 rutas. El retorno desde el Casino restauró la cámara con una diferencia de 0 m. La prueba también cambió capas y recorrió el historial y el mapa. Una visita sintética adicional comprobó registro, liberación, escala y orientación, junto con una ficha inválida y un identificador duplicado. [Recorrido de las rutas](rutas-webgpu.json) · [Prueba de nuevas fichas](../validate-heritage-registry.py)

- Las pruebas de suelo leen píxeles de los dos motores sobre el MDT real, con ortofotografía y ventanas de excavación y pavimento. [Suelo y cortes](../dual-v4/suelo.json)
- Las pruebas de materiales comparan fachada, vidrio, pavimento, follaje y mobiliario sobre texturas de producción. La silueta de sombra de una copa presenta diferencias de filtrado entre motores. [Materiales urbanos](../dual-v4/materiales-urbanos.json)
- El ensayo litoral usa los polígonos del pantalán, el campo de costa, el mismo cielo y sonda de entorno. El expediente distingue estos ensayos de las dos paradas completas dibujadas con ambos motores. [Óptica costera](../ambiente-v4/README.md)
- Los 13 casos de recuperación incluyen pérdida de un dispositivo real, fallos de compilación y disponibilidad inducidos, recuperación mediante WebGL y plano, reintento explícito y conservación de la cámara al cambiar de motor. [Recuperación](recuperacion.json)
- Se probaron Firefox con WebGL y los controles táctiles con emulación móvil. Queda pendiente el ensayo nativo de Safari en hardware Apple. [Matriz de navegadores](compatibilidad.md)

## Repetir la comparativa

Servir la versión V41 en un puerto y la revisión V4 en otro. Instalar Python, Playwright, Chrome, Pillow y NumPy. La primera ruta del ejemplo sirve el archivo de la versión 41. La segunda sirve el directorio `dist` de esta revisión.

```sh
python research/check-renderer-world-v4.py --base http://127.0.0.1:8491 --engine atlas --out research/render-v4/atlas
python research/check-renderer-world-v4.py --base http://127.0.0.1:8491 --engine previo --out research/render-v4/previo
python research/check-renderer-world-v4.py --base http://127.0.0.1:8492 --engine webgl2 --out research/render-v4/webgl2
python research/check-renderer-world-v4.py --base http://127.0.0.1:8492 --engine webgpu --out research/render-v4/webgpu
python research/compare-renderer-v4.py
```

Los intervalos guardados junto a las capturas sirven para comprobar que cada vista dibujó varios fotogramas. Estas sesiones coincidieron con otras pruebas. Para medir fluidez y retención hay un recorrido independiente que ejecuta los motores de forma sucesiva. [Programa del recorrido](../check-navigation-benchmark-v4.py)
