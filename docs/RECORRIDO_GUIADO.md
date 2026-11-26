# Atlas en orden y recorrido territorial guiado

Revisión del 26 de noviembre de 2026 para **SAGUNTUM · Atlas vivo**.

## Numeración compartida

El catálogo completo se ordena después de registrar todos sus lugares, utilizando `dist/js/atlas-order.js`. Atlas y Simulador consumen la misma regla. Los resultados de búsqueda y los filtros mantienen el número general de cada lugar.

| Ámbito | Visitas | Límites del grupo |
| --- | --- | --- |
| Sagunto | 1–16 | Santa María → Glorieta |
| Puerto de Sagunto | 17–25 | Alto Horno → Sanatorio |
| Costa y paisajes | 26–32 | Paseo del Pantalán → Río Palancia |

Teatro Romano, Castillo y Glorieta quedan dentro del primer bloque con los números 14, 15 y 16. El catálogo presenta títulos de grupo, cantidades y etiquetas accesibles. Los nombres del buscador del Simulador también muestran el número general.

Los identificadores de monumentos, rutas `#id`, enlaces `#simulador/id/parada`, coordenadas e inventarios conservan su identidad. Los números de las paradas interiores de cada visita tienen su propia secuencia y no se alteran.

## Uso del recorrido

1. Abrir el Simulador y pulsar **Recorrido territorial**.
2. Elegir **Todo el territorio**, **Sagunto**, **Puerto de Sagunto** o **Costa y paisajes**.
3. Pulsar **Iniciar recorrido**. El panel identifica el lugar actual, su número general, su posición dentro de la ruta y el siguiente destino.
4. Usar **Pausar/Reanudar**, **Anterior** y **Siguiente**. **Explorar este lugar** aparece al llegar y devuelve el control de la cámara conservando el encuadre.

También se puede arrastrar la escena, elegir otro lugar, cambiar de modo de cámara o cerrar el panel para terminar el recorrido. Abrir mapa, búsqueda o ajustes pausa el reloj; se reanuda de forma explícita. Cambiar a otra pestaña pausa la visita. Al terminar la última parada, permanece la vista final hasta que el usuario decide repetir o explorar.

## Ritmo y transiciones

- Cada parada tiene **14 segundos de observación**, contados después de la llegada y de la preparación del destino.
- Los acercamientos próximos duran **7–35 segundos**, con aceleración y frenado suaves y elevación sobre el relieve intermedio.
- Los cambios de ámbito, desplazamientos de cámara superiores a **1.800 m** o inversiones de orientación utilizan un fundido de **0,7 segundos por lado**. El encuadre cambia mientras la cobertura es opaca; el destino se prepara antes de descubrirlo. La interfaz muestra el nombre del traslado y mantiene disponibles sus controles.
- La preparación espera hasta **8 segundos**. Si se supera ese tiempo, la vista vuelve a mostrarse y la carga normal del territorio puede continuar, sin dejar la interfaz bloqueada.
- Con **movimiento reducido**, los vuelos interpolados se sustituyen por fundidos breves de **0,25 segundos por lado**.
- El reloj avanza con tiempo de fotogramas visibles y limita los saltos temporales: una pestaña suspendida no consume de golpe las paradas.

`territory-tour.js` controla la secuencia y las poses; `territory-tour-panel.js` presenta los controles; `territory-camera.js` conserva la continuidad al entrar y devolver el control manual. La integración en `territory.js` coordina carga, selección, mapa y cobertura visual. El recorrido es una visita virtual y no calcula un trayecto peatonal.

El mapa conserva las carreteras, los lugares y los planos de las visitas, y deja de dibujar la línea del circuito automático anterior, que no corresponde al nuevo itinerario. Al abrirse, queda por encima del panel del recorrido para permitir la consulta en pantallas pequeñas.

## Validación reproducible

Desde la raíz del repositorio, con Node compatible con `node:module.registerHooks` (verificado en Node 24.22.3):

```bash
node research/test-atlas-order.mjs
node research/test-territory-tour.mjs
node research/test-territory-tour-panel.mjs
node research/test-territory-tour-navigation.mjs
```

No requieren instalar Three.js: `research/three-test-loader.mjs` utiliza los módulos incluidos en la distribución.

La prueba del Atlas registra las **32 visitas reales** y compara su orden, sus números y sus enlaces con el catálogo real del Simulador. Las pruebas del recorrido cubren tiempos, preparación, pausa, cambios de parada, final sin bucle, movimiento reducido y cambio de encuadre bajo cobertura opaca. La integración utiliza **Three.js y OrbitControls reales**, con sustitutos mínimos del DOM, para comprobar entrada desde los tres modos de cámara, arrastre residual y cancelación desde una mirada elevada o una vista subterránea.

El muestreo adicional `node research/check-territory-tour-frames.mjs` recorre las 32 vistas originales con el MDT base, detalle y relieves regionales a 60 pasos por segundo. En esta revisión terminó ambas orientaciones sin valores no finitos, degeneración cámara–objetivo ni cámara bajo el terreno. El recorrido completo, sin espera de carga ni pausas del usuario, duró **11 min 06 s en horizontal** y **11 min 46 s en vertical**. Los giros visibles máximos medidos fueron 33,98°/s y 22,52°/s. Se detectó y corrigió la inversión brusca Alto Horno → Talleres mediante la regla general de fundido por cambio de orientación. Este muestreo no comprueba intersecciones con edificios ni renderizado GPU.

La comprobación de navegador verificó el catálogo agrupado y que buscar Castillo conserva el número 15. Este navegador no pudo crear un contexto WebGL 2 y abrió la alternativa en plano. Por tanto, las pruebas de esta revisión no acreditan FPS, calidad visual de los fundidos ni renderizado WebGPU/Safari en hardware real.

## Base de publicación

Se parte de la fuente de Sites 45 (`756e37ae100aa80dd08d35dee86b93281a0c7e5f`). Al sincronizar con GitHub también se incorporan las mejoras visuales ya publicadas en esa versión, preservando la documentación posterior que GitHub contenía sobre Sites 44. Se mantiene el proyecto original, su marca y su audiencia pública.
