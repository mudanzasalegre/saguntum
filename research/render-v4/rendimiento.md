# Navegación sostenida en el simulador V4

La corrección de retención de WebGPU redujo a 2,4 MiB la diferencia de heap JavaScript entre el primer y el tercer retorno al panorama. Las visitas conservaron la cámara en ambos motores. WebGL 2 sigue ofreciendo tiempos de fotograma más estables al cargar zonas y patrimonio. [Mediciones y cámaras](rendimiento.json) · [Ensayo anterior a la corrección](retencion-anterior.json)

## Circuitos

Chrome 156 en Windows, GeForce RTX 3090, área de 1.000 × 640 píxeles y escala 1. Cada motor utilizó una sesión propia con tres circuitos en el mismo documento. Cada circuito incluyó paseo, carrera, giro con ratón, salto, vuelo local y cinco teletransportes por Sagunto histórico, Puerto de Sagunto y Grau Vell. Se abrieron las paradas del Alto Horno y el Fortín, se cambió de mediodía a noche y de calidad alta a media, y se volvió al panorama con calidad alta y luz de mediodía.

| Sesión | Duración total | Intervalos rAF medidos | Mediana | P95 | Intervalos > 100 ms | Intervalo máximo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| WebGL 2 | 150,2 s | 4.615 | 16,7 ms | 33,4 ms | 84 | 5.685,3 ms |
| WebGPU | 245,4 s | 3.456 | 16,7 ms | 183,4 ms | 222 | 3.434,4 ms |

En WebGL 2 la pausa más larga ocurrió en los teletransportes del primer circuito. Los máximos del segundo y tercero bajaron a 683,5 y 733,6 ms. En WebGPU el máximo del primer circuito fue 3.267,8 ms en la entrada al patrimonio diurno. Los teletransportes produjeron pausas de 3.134,4 y 3.434,4 ms en los circuitos segundo y tercero. Se conservaron los intervalos largos registrados por el navegador. La duración total incluye las transiciones de documento y los controles de memoria fuera del muestreo rAF.

Después del tercer circuito, ambos motores abrieron la visita del Fortín en el Atlas y regresaron a su mismo enlace. La desviación medida de la cámara fue 0,0 m en los dos casos. Las sesiones finalizaron con el motor solicitado y sin errores de consola ni excepciones JavaScript.

## Recursos al volver al panorama

Se tomaron tres muestras tras forzar una recogida de basura de V8 fuera del intervalo cronometrado. Las cifras de heap proceden de Chrome DevTools Protocol. Las geometrías y texturas son los contadores del renderizador. La memoria física del dispositivo gráfico queda fuera de esta medida.

| Motor | Geometrías, circuitos 1 → 2 → 3 | Texturas | Heap JS tras GC |
| --- | --- | --- | --- |
| WebGL 2 | 179 → 177 → 170 | 27 → 27 → 27 | 45,0 → 43,0 → 46,1 MiB |
| WebGPU | 172 → 185 → 194 | 34 → 34 → 34 | 57,2 → 60,4 → 59,6 MiB |

Los seis retornos coincidieron en posición. En todos se habían descargado los sectores de calles y edificios, las visitas patrimoniales y los bloques de fachada. En WebGPU la cantidad de geometrías aún aumentó en 22 unidades entre los retornos primero y tercero. Los contadores permiten comprobar la evolución durante estos tres circuitos.

En el ensayo anterior a la corrección, los dos primeros retornos nativos, con cámara idéntica, retenían 274,4 y 498,1 MiB tras GC. En la tercera muestra se alcanzaron 721,0 MiB cuando todavía faltaban 584,8 m para terminar la animación del panorama. Tras corregir la liberación de objetos de renderizado, samplers y buffers se repitió únicamente WebGPU y se verificó el retorno a menos de 0,1 m. La medición aprobada de WebGL 2 conserva su huella SHA-256. [Referencia anterior](retencion-anterior.json)

En ambos motores se observaron como máximo 28 bloques de fachada retenidos, 4 modelos patrimoniales residentes y 2 precargas patrimoniales simultáneas. Ninguna muestra superó el límite de 48 bloques ni el presupuesto activo de bytes de fachada.

## Vuelo por el corredor Sagunto–Puerto

Una sesión complementaria partió de la misma posición y orientación, con luz de mediodía y calidad alta. Se mantuvieron avance y aceleración durante 11,5 s en la velocidad territorial. Ambos motores alcanzaron 540 m/s y atravesaron varios kilómetros de cartografía. Las pausas afectan a la distancia recorrida porque la simulación limita la duración de cada paso de movimiento a 0,1 s.

| Motor | Distancia | Mediana rAF | P95 | Intervalos > 100 ms |
| --- | ---: | ---: | ---: | ---: |
| WebGL 2 | 5.162,4 m | 16,7 ms | 33,4 ms | 3 |
| WebGPU | 4.666,6 m | 16,7 ms | 66,7 ms | 16 |

## Reproducción

Con `dist` servido en el puerto 8492 y Chrome disponible para Playwright, ejecuta esta prueba en solitario. [Guion de navegación](../check-navigation-benchmark-v4.py)

```sh
python research/check-navigation-benchmark-v4.py --base http://127.0.0.1:8492 --out research/render-v4/rendimiento.json
```
