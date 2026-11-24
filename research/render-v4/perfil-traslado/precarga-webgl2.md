# Primer traslado de Sagunto histórico al Puerto

La prueba compara el simulador actual con una precarga experimental en Chrome 156, a 1000 × 640 píxeles, con WebGL 2, calidad alta y sol de mediodía. Cada caso empezó en una sesión nueva. Se utilizó el buscador del simulador para trasladar la cámara desde Sagunto histórico hasta Puerto de Sagunto. Un perfil de CPU a intervalos de 1 ms registró la preparación del Alto Horno.

El prototipo inicia la compilación de las variantes visibles con la iluminación del mundo y el destino de render activo. Consulta `KHR_parallel_shader_compile` mientras la aplicación conserva la última imagen completa. Se midieron tanto las llamadas de animación del navegador como las presentaciones de una nueva imagen.

| Medida durante el traslado | Control | Precarga |
| --- | ---: | ---: |
| Mayor intervalo entre imágenes presentadas | 5.154 ms | Al menos 5.181 ms |
| Mayor intervalo entre callbacks de animación | 5.152 ms | 4.018 ms |
| Tiempo en `getProgramInfoLog` durante el peor fotograma | 4.491 ms | 3.830 ms |

La precarga inició el enlace de 35 programas en varios lotes. Al cerrar la ventana de medición seguía pendiente una presentación, por lo que el intervalo registrado para la precarga es una cota inferior. El prototipo se quedó en investigación porque el visitante siguió viendo el mismo fotograma durante más de cinco segundos.

Se comprobó la vista del acceso al Alto Horno tras finalizar la carga. Las dos sesiones restauraron la misma posición y encuadre. Los 640.000 píxeles RGB coinciden. El informe conserva los hashes, la pose y los contadores. [Resultados](precarga-webgl2.json) · [Captura común](horno-control-precarga.png)

Con el directorio `dist` servido en el puerto 8492, estas órdenes reproducen los dos casos. La variante experimental se inyecta sólo en la página local del ensayo.

```powershell
python research/profile-territory-teleport-v4.py --base http://127.0.0.1:8492 --engine webgl2 --study control --out "$env:TEMP/saguntum-control"
python research/profile-territory-teleport-v4.py --base http://127.0.0.1:8492 --engine webgl2 --study warm --out "$env:TEMP/saguntum-precarga"
```
