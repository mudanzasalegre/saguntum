# Simulador: detalle visual local v3

Esta rama acumula la iteración v2 (precarga predictiva) y una segunda iteración que modifica únicamente el simulador, salvo la capa de datos compartida ya introducida en v2. No cambia geometrías originales, cartografía, visitas, agua ni backend gráfico.

## Implementación

- Fachadas de máximo detalle: partición determinista por celdas de 24 m y lotes de hasta seis partes catastrales. Una petición de detalle a la vez; prioridad por distancia a huella y dirección de cámara. Radio de histéresis del 15 % para lotes ya activos. No se cambia la posición de ninguna construcción.
- Conservación de lotes en caché mientras su sector fuente siga activo; presupuesto para arrays de geometría de 5–15 MiB en equipos compactos y 9–32 MiB en escritorio según perfil, hasta 48 lotes en caché (el límite de bytes suele ser más restrictivo) y hasta 9/18 lotes visibles según dispositivo. Son límites del subsistema de fachadas, no del consumo total del navegador. Se mantienen las mallas catastrales de respaldo y se ocultan sus partes al activar detalle.
- Las mallas de sectores recién recibidos esperan la aplicación de máscaras; no se muestra una nueva versión sobre la anterior. Los sectores del worker siguen sujetos al límite de fuentes y se protegen los que están activos/en cola.
- Fachadas instanciadas: índice espacial de ocupación, prioridad de vista y límite de piezas por perfil.
- Calles: muestreo más fino en pendientes y cambios de rasante; tercera columna en calzadas anchas para seguir mejor el terreno. No se alteran los datos de OSM ni se inventan aceras.
- Calidad automática: primero resolución de render, después presupuesto periférico (sectores, vegetación y tráfico), finalmente calidad local bajo presión sostenida. Los perfiles manuales se conservan; los presupuestos de detalle siguen acotados.
- Patrimonio: precarga inmediata al seleccionar paradas, timeout del worker y reinicio tras cierre. Se mantienen los modelos originales y las máscaras. El límite existente de monumentos activos sigue vigente.

## Pruebas y publicación

Ejecutar `node research/test-territory-stream-policy.mjs` y `node research/test-territory-local-detail.mjs`, comprobar sintaxis de los módulos modificados y validar integración WebGL en el navegador real. Inspeccionar `window.territoryStatus`: `fabric.bytes`, `fabric.byteLimit`, `fabric.chunks`, `fabric.cached`, `fabric.hits`, `fabric.builds`, `fabric.refused`, `frameMs`, `frameP95Ms`, `localQuality`, `peripheralQuality`, `pixelScale`, `heritage` y `pending`. Comparar contra la misma versión anterior, misma cámara y perfil, con pruebas de recorridos repetidos. La rama no acredita tasas FPS ni mejoras visuales medidas: falta verificación con GPU real. Mantener WebGL 2 hasta disponer de una migración compatible de materiales. Integrar en el Site original con diff y preservar cualquier cambio posterior. No desplegar antes de las comprobaciones esenciales.

## Comprobación adicional y acabados

Ejecutar también `node research/test-territory-local-cache.mjs`. El arnés sustituye el worker y la API geométrica por dobles deterministas, y comprueba el controlador real: publicación atómica de máscaras, reutilización, retirada y vuelta de la silueta, máscara patrimonial y rechazo de lotes sobredimensionados. Los datos de un único lote pueden estar temporalmente pendientes de publicación; `fabric.stagedBytes` los distingue del límite de arrays de la caché. `fabric.hits` sólo cuenta reactivaciones de lotes ya mostrados. Se incorporó alternativa entre texturas normales/compactas, anisotropía adaptada y variación material sutil. Estas pruebas no validan shaders en GPU ni el resultado visual real.
