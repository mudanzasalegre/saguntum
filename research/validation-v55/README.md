# SAGUNTUM v55 · revisión de Almenara y su ladera oriental

Fecha: 27 de noviembre de 2026. Referencia del encargo: `Image2066.png`, captura del usuario con cinco colores. Esta entrega corrige el estado conservado de la parte oriental del castillo; no representa una restauración completa ni una única fase histórica.

## Resultado de la revisión

| Marca | Cambio aplicado | Evidencia y límite |
|---|---|---|
| Rojo | Dos crujías descubiertas en lugar de plataformas macizas: fachadas perforadas, muros de distinta altura, habitaciones abiertas, adarve estrecho y escalera longitudinal norte. | Fotografías de 2010, 2014 y 2022, Ricsol y huellas cartográficas. Alturas relativas y particiones menores estimadas. |
| Azul | Las tres ruinas tienen composiciones diferenciadas, paredes fragmentarias, retornos bajos y revestimientos; la pareja oriental incorpora dos cuerpos desiguales y una pequeña arcada interior interpretativa. | PNOA/OSM y Civera. La correspondencia de las dos huellas con las cisternas descritas es probable, no definitiva. No se añade un tejado ni se asigna la ruina 260 al polvorín. |
| Lima | Torre circular cerrada y unida a la cortina mediante los extremos cartografiados. Hueco exterior con arco y fondo tapiado a la cota de la ladera. | Fotografía exterior Ricsol 26 y contorno OSM. El tapiado no se presenta como puerta transitable; sus medidas son aproximadas. |
| Naranja | Se elimina el edificio genérico de unos once metros y se incorpora una cámara defensiva baja, abierta, de hormigón, con suelo interior y pequeño acceso posterior. | Inventario municipal, plano 02B, elemento 3, y croquis de Balanzà reproducido en CASVA 7. El corredor acodado completo se explica, pero su posición no se reconstruye sin registro suficiente. |
| Amarillo | Se incorpora la muralla descendente de Tres Castellets, sus quiebros y coronaciones escalonadas; permanecen abiertos los dos huecos actuales del trazado. | Tres líneas OSM contrastadas con PNOA y fotografías. Aproximadamente 205,7 m de fábrica representada; no se completa un recinto desaparecido. |

Los edificios genéricos y los muros que sustituyen los módulos patrimoniales quedan excluidos para evitar duplicaciones. Las bases de los paños se prolongan bajo el terreno real. La revisión de acercamientos detectó y resolvió separaciones locales en las cimentaciones y en la franja del acceso del nido. Los senderos próximos a este último se ajustan de forma localizada a la superficie final.

## Documentación y trazabilidad

- [Correspondencia exacta de las marcas](marked-zones.md), con registro de la captura y diagnóstico del antiguo monolito.
- [Matriz de evidencias arquitectónicas](east-evidence.md): fotografías fechadas, identificación de crujías y límites de las asociaciones con las cisternas.
- [Registro exterior](exterior-evidence.md), con fuentes municipales, croquis, fotografías, trazas OSM y superposición PNOA.
- La guía publicada conserva 22 paradas, 7 recintos y el orden anterior. Contiene 42 fuentes; seis se incorporan en esta revisión. Las nuevas explicaciones se integran en las paradas existentes.
- Los índices del Atlas y del Simulador mantienen los 33 lugares y la numeración global.

## Comprobaciones

Los informes JSON son la evidencia ejecutable de la revisión. Sus límites forman parte del resultado.

- `castle-v55-qa.json` y `castle-simulator-qa.json`: constructores reales del Atlas y Simulador, comparación de buffers, huecos físicos, suelos de habitaciones, exclusión del edificio genérico y continuidad de los recorridos.
- `castle-cameras-qa.json`: cámaras reales de la aplicación, encuadre con panel abierto, puntos de detalle y registro del Simulador.
- `exterior-qa.json`: uniones de torre, pies de fábrica y hormigón contra la malla final, rayos por los dos portillos y visibilidad del suelo del nido sin cubierta.
- `perimeter-contact-qa.json`: 584 aristas reales del pie de los paños y 2.920 muestras. La comprobación detectó una separación de 0,403 m antes del ajuste; tras él, la peor muestra queda 0,311 m bajo el suelo.
- `exterior-paths-qa.json`: 37.160 muestras de los senderos del Atlas y 31.020 del Simulador. La superficie queda entre 0,7 y 4,3 cm sobre el suelo final; el ajuste se limita a tres caminos existentes en un radio de 60 m y conserva sus trazados y etiquetas de acceso.
- `east-map-qa.json`: nueve situaciones del plano, incluyendo tamaños estrechos, vista de recinto y alternativa sin modelo 3D.
- `catalogue-qa.json`: 33 lugares, 22 paradas del castillo, 7 recintos; contenido ajeno al castillo conservado.
- `browser-preview-qa.json`: navegación, textos, selección de parada, mapa ampliado y enlace al Simulador en el navegador de revisión.

Las imágenes de `renders/` proceden de los buffers del constructor publicado y se renderizan por CPU para inspeccionar las cinco zonas señaladas. No son capturas WebGL del navegador. La revisión visual contempla el ángulo aproximado de la captura del usuario, acercamientos a cada color y cámaras reales de visita. Un render anterior puede conservar su geometría visible tras un cambio exclusivamente bajo el terreno; el manifiesto de render identifica la exportación utilizada.

## Límites de precisión

La posición horizontal deriva de cartografía contrastada con ortofoto. Los alzados, espesores menores, deterioros y algunas divisiones interiores son aproximaciones de visualización. Las fotografías disponibles no constituyen una fotogrametría o levantamiento arqueológico. La guía conserva estas diferencias y no atribuye funciones cerradas a las ruinas de identificación incierta.

El navegador de revisión no dispone de un contexto WebGL2 válido: se comprobó su alternativa 2D y la navegación. La igualdad del modelo entre Atlas y Simulador se comprobó con sus constructores y buffers reales; no se afirma una medición de FPS ni una prueba de GPU que no se haya realizado.
