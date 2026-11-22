# Grau Vell · iteración V32

## Alcance

Esta iteración mejora el Fortín del Grau Vell y el poblado dentro de **SAGUNTUM · Atlas vivo**. Conserva la portada general `#atlas`, los 31 lugares y las seis regiones. Añade una visita detallada al Grau Vell, con lo que hay 27 cuadernos de visita.

La base de comparación es el commit V31 `ec5f6599e3a52d791580743c75e5242db6a8b0e9`. La petición de conservar el agua se trata como una condición de entrega: los archivos del agua, la línea de costa y el Pantalán mantienen sus bytes anteriores. La nueva geometría puede aparecer en los reflejos de la misma superficie marina.

## Resultado implementado

La arquitectura comprende torre, sala alta abovedada, escalera y hueco hacia la terraza, acceso exterior, batería y foso seco, patio, pozo, corral, almacén y recepción. La base de la torre permanece maciza. El almacén incorpora estructura de madera, tablazón, pilares claros sobre basas oscuras y pavimentos minerales; los huecos de las puertas se modelan como aperturas efectivas.

La guía contiene 20 paradas, cinco vistas interiores, cinco ámbitos temáticos, ocho hitos cronológicos y 18 fuentes. Se puede abrir una sección por edificio o del conjunto; desde una cámara interior, el botón de sección cambia a una vista exterior donde el corte resulta visible. Las cámaras interiores mantienen su cubierta. El plano usa la misma cartografía y registro de focos que el modelo, amplía el núcleo al seleccionar una parada y muestra los niveles interiores correspondientes.

El contexto conserva 51 partes catastrales y seis piezas auxiliares OSM: 55 volúmenes y dos espacios abiertos. Se revisan cubierta y fachada de la ermita, antiguo colegio, casas, huecos, calle y accesos. Se mantienen 16 copas localizadas en la ortofotografía y se retira únicamente la vegetación automática que caía sobre la franja de playa observada. Las calles detalladas conservan sus tramos originales exteriores y se ajustan a la malla final del terreno, sin añadir explanaciones generales.

## Evidencia y precisión

Las decisiones arquitectónicas se apoyan en el estudio de la UPV/FORTMED de 2015, las fotografías de la restauración de Balaguer-Vicén de 2020, cartografía de Catastro/IGN/OSM y documentación municipal de 2026. La guía distingue la arquitectura documentada de los alzados, acabados menudos y posiciones interpretadas. Los cinco temas del centro «Sagunt i la Mar» no se convierten en cinco salas tabicadas inventadas. Los soportes y vitrinas se identifican como interpretación de contenidos; el punto del lagar no inventa una prensa o una estancia excavada.

La noticia municipal del 25 de junio de 2026 anuncia apertura pública al día siguiente y advierte que la batería aún no era visitable. La visita digital no afirma condiciones actuales de acceso presencial. Fuentes, fechas, fotografías consultadas y límites se detallan en `grau-research.md`, `grau-model.md` y `grau-context.md`.

## Verificación

Los informes de `validation-v32/` cubren construcción real de la región costera, geometría finita, cámaras en escritorio/móvil/horizontal, vistas cercanas, encaje con el terreno, capas, apertura/cierre de cubiertas, liberación de recursos y reconstrucción al volver a la región. Las pruebas de los controladores ejecutan las funciones y callbacks de producción con adaptadores mínimos de DOM; los planos se dibujan con el Canvas real del módulo.

La revisión visual utiliza doce imágenes CPU de las mallas, materiales, cámaras y terreno exportados de producción. La luz CPU es aproximada, y los interiores tienen una luz de inspección explícita. El agua se representa con un material plano de inspección; esas imágenes no validan la apariencia del shader marino. La conservación del agua se comprueba por comparación de fuentes y datos con V31.

El ensayo del acceso comprueba el interior de los triángulos, no sólo sus vértices. La teselación se adapta a las diagonales del terreno para evitar que el asfalto atraviese la superficie. El informe de clearance se genera contra el terreno de la exportación final.

La vista previa administrada de Sites estaba detenida y no hubo señal de recuperación. **No se afirma una prueba visual en navegador ni una prueba WebGL/GPU de esta iteración.** Las verificaciones CPU, Canvas, regresión e integridad no sustituyen esa comprobación. `browser-limitations.json` conserva este límite junto a la evidencia técnica.

`validate-final-snapshot.py` comprueba que informes e imágenes corresponden exactamente a los archivos que se publican. Los grandes archivos de geometría y los logs son reproducibles y no forman parte del repositorio; se regeneran con `research/validate_coast_v32.mjs --export` usando el loader local de Three.js. El código y los datos de ejecución se empaquetan desde el mismo commit que guarda Sites.
