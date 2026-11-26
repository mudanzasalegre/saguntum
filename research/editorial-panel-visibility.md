# Panel de visita plegable

El control **Ocultar información** comparte cabecera con **Vista general**. La cabecera permanece disponible al desplazarse por el texto. Al plegar el panel aparece **Mostrar información** fuera del contenido oculto: arriba a la izquierda en escritorio y en el borde inferior en móvil.

La preferencia se conserva durante la sesión del navegador y se aplica a las visitas de monumentos y paisajes. La portada siempre mantiene su presentación normal. El catálogo y el recorrido guiado conservan sus propios controles y no muestran un segundo botón flotante encima.

El panel permanece montado. Se conserva la pestaña, la selección de parada, la sección arquitectónica y el desplazamiento del texto. Ocultarlo no cambia la ruta ni llama a la navegación de cámara. El encuadre utiliza el espacio recuperado mediante la proyección, conservando posición, orientación, distancia y destino de la cámara.

Los botones usan `aria-controls` y `aria-expanded`. El panel oculto es `inert` y queda fuera del árbol accesible; el foco pasa al control de reapertura. Al mostrarlo, vuelve al control de plegado sin desplazar el texto. La animación respeta la preferencia de movimiento reducido. El control funciona también en el plano 2D.

## Verificación

`node research/test-editorial-framing.mjs` comprueba con la cámara real de Three.js seis tamaños de escritorio, móvil y tableta. En todos aumenta el área disponible y se conserva la pose de cámara al plegar y volver a desplegar el panel.

### Comprobación en navegador · 26 de noviembre de 2026

Se utilizó la vista managed de Sites con el navegador CUA autorizado. Para evitar que las ediciones paralelas recargasen la página durante las comprobaciones de estado, se sirvió una copia temporal del `dist/` mediante el mismo `sites-preview`. La copia y el marco de prueba responsive se retiraron después; no forman parte del producto.

| Comprobación | Resultado observado |
| --- | --- |
| Escritorio, 1363 × 936 | Los controles caben junto a «Vista general» y la cabecera permanece accesible al desplazar el texto. |
| Teclado | Tab alcanza «Ocultar información»; Enter oculta y lleva el foco a «Mostrar información». Al reabrir, el foco vuelve al control de ocultar. |
| Contenido oculto | `inert` y `aria-hidden="true"`; los controles desaparecen del árbol accesible. Tab desde el botón de reapertura salta a `map-open`, fuera del panel. |
| Pestaña y lectura | Cronología permaneció seleccionada, con `scrollTop=882` antes, durante y después de ocultar/mostrar. La ruta de la parada no cambió. |
| Parada en móvil, 375 × 812 | La primera parada de Santa María, la pestaña Recorrido y `scrollTop=402` se conservaron al plegar y recuperar. |
| Móvil estrecho, 320 × 568 | Los textos se adaptan a dos líneas sin salir del panel; el botón de reapertura mide 175,7 × 44 px, a 16 px del borde inferior y lateral. |
| Catálogo | «Mostrar información» se oculta mientras Lugares está abierto; el buscador recibe el foco. |
| Cambio de monumento | Con el panel plegado, cambiar de Santa María a Plaça Major mantiene la preferencia y ofrece el botón de reapertura. |
| Portada y sesión | Volver al inicio muestra la portada normal y retira `inert`; al entrar de nuevo en un monumento se recupera la preferencia de sesión. También se observó conservación tras recargar. |

La prueba descubrió un fallo de foco al reabrir durante la transición de `visibility`. Se corrigió haciendo visible el panel inmediatamente al abrir y posponiendo el foco al siguiente cuadro. También se ajustó el desplazamiento de la cabecera fija al relleno de cada tamaño, evitando que apareciese texto por detrás en su borde superior.

**Límite de verificación:** el navegador de prueba informa «El atlas necesita WebGL». Las comprobaciones visuales y de interacción se realizaron en el modo plano 2D; la conservación de cámara 3D se verificó numéricamente con Three.js, pero no se comprobó visualmente una escena WebGL en este navegador.

Los cambios están en `dist/js/editorial-visibility.js`, `dist/editorial-visibility.css`, el encabezado de visita de `dist/index.html` y las llamadas de integración en `dist/js/app.js`.
