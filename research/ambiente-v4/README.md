# El Mediterráneo y el cielo en WebGL 2 y WebGPU

El simulador utiliza el polígono marino, sus islas y las líneas de costa de `dist/assets/territory/world.json` en ambos motores. El campo de distancia a la orilla, las normales del agua y las cinco longitudes de onda proceden de los recursos del pantalán. La profundidad visual, las olas, la espuma y el color son interpretaciones ópticas. La imagen de nubes procede del recurso ya distribuido con el simulador.

WebGPU calcula el reflejo con una cámara especular de la escena. Actualiza la textura según el desplazamiento, el perfil gráfico y los cambios de luz. La sonda PMREM usa el mismo cielo que la cámara para calcular la iluminación ambiental de los materiales físicos. El pase de contacto toma doce muestras de profundidad a distancias métricas y usa una textura de profundidad de una sola muestra en el motor nativo. [ReflectorNode de Three.js r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/ReflectorNode.js) · [PMREMGenerator de Three.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/extras/PMREMGenerator.js)

## Comprobación en navegador

La prueba carga en Chrome el polígono marino de producción, la malla que lo prolonga en el horizonte y los módulos que usa el simulador. Sitúa la cámara frente al pantalán, con el mismo encuadre, tiempo de ola y luz en ambos motores. Aísla el cielo y el agua para que la llegada asíncrona de edificios, terreno y vegetación no influya en la medida. Un oclusor de calibración comprueba que el agua recibe sombras proyectadas. [Prueba reproducible](../test-territory-environment-v4.py)

En Windows con una GeForce RTX 3090, ambos motores dibujaron 611 triángulos de superficie marina por vista. La sombra del oclusor oscureció 3.260 píxeles en WebGL 2 y 3.231 en WebGPU. El corte de inspección y el cambio a noche produjeron cambios visibles en ambas imágenes. Ambos motores compilaron y ejecutaron los pases sin errores registrados de navegador o de dispositivo. [Resultados y configuración](environment.json)

Una esquina de calibración permite medir por separado la oclusión de contacto. Al activar el pase, 743 píxeles del encuadre de medición se oscurecieron en WebGL 2 y 584 en WebGPU, con un umbral superior a tres niveles RGB. El render de WebGL 2 utilizó cuatro muestras por píxel y el de WebGPU, una.

Al superar la distancia de sombras, la prueba introduce otro material, vuelve al encuadre próximo y recupera el material anterior. Los dos motores pasaron de sombras desactivadas a un mapa de 2.048 píxeles sin perder el material de agua ni sus texturas.

| Vista fija de 500 × 320 | Diferencia media por canal, de 0 a 255 | Percentil 95 |
| --- | ---: | ---: |
| Sol de mediodía | 0,376 | 1 |
| Noche solar | 0,299 | 1 |
| Luz dorada del Atlas | 0,189 | 1 |
| Corte de inspección sobre el mar | 0,383 | 1 |
| Sol con el pase de contacto activo | 0,815 | 3 |

Las diferencias se calculan sobre las capturas PNG del framebuffer antes de crear los archivos JPEG de consulta. La prueba cubre la respuesta óptica en este encuadre. Las cifras de tiempo de fotograma, la paridad arquitectónica y el comportamiento en dispositivos móviles requieren las pruebas del simulador completo.

| Motor | Mediodía | Luz dorada |
| --- | --- | --- |
| WebGL 2 | [Captura](webgl2-solar.jpg) | [Captura](webgl2-atlas.jpg) |
| WebGPU | [Captura](webgpu-solar.jpg) | [Captura](webgpu-atlas.jpg) |

## Visitas dentro del simulador completo

Las dos visitas se abrieron con su enlace directo en cada motor. Se comprobó el identificador de parada tras cargar el patrimonio y se registró el motor que dibujó el último fotograma. Las cuatro sesiones terminaron sin errores de consola, errores JavaScript ni recuperación a otro motor.

| Parada del Atlas | WebGL 2 | WebGPU | Diferencia media de los JPEG |
| --- | --- | --- | ---: |
| Pérgolas del paseo | [Imagen](mundo-webgl2/pantalan.jpg) · [Datos](mundo-webgl2/vistas.json) | [Imagen](mundo-webgpu/pantalan.jpg) · [Datos](mundo-webgpu/vistas.json) | 3,75 / 255 |
| Trípodes marítimos | [Imagen](tripodes-webgl2/maritimo.jpg) · [Datos](tripodes-webgl2/vistas.json) | [Imagen](tripodes-webgpu/maritimo.jpg) · [Datos](tripodes-webgpu/vistas.json) | 1,09 / 255 |

En la vista de paseo se observan las celosías, las palmeras, la escollera y las fachadas portuarias. En la segunda vista se distinguen los trípodes y su reflejo en ambos motores. La sombra proyectada sobre la superficie es más marcada en WebGPU. Estos encuadres utilizan la carga progresiva y el reloj de olas de la aplicación. Los píxeles pueden variar entre ejecuciones.

## Reproducción

Se necesitan Chrome con acceso a GPU, Python, Playwright, Pillow y NumPy. Desde la raíz del proyecto, sirve `dist` con el comando siguiente.

```sh
python -m http.server 8492 --directory dist
```

En otra consola ejecuta la prueba.

```sh
python research/test-territory-environment-v4.py --base http://127.0.0.1:8492 --out research/ambiente-v4
```
