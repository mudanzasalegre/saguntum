# Contexto costero del pantalán · modelo V31

`dist/js/pantalan-context.js` interpreta los datos documentados en `dist/assets/data/pantalan-context.json` y `research/pantalan-context.md`. La fábrica es `createPantalanContext({contextData,project,heightAt})`.

## Edificios

Se representan las once huellas catastrales y OSM seleccionadas sin modificar sus contornos ni sus posibles patios, más una envolvente occidental leída de la cubierta en la ortofotografía. Esta última conserva la categoría explícita de aproximación y recibe una forma sencilla: no se le atribuye nombre histórico, distribución interior ni patrón de puertas.

Las cuatro naves cartografiadas frente al paseo incorporan zócalos, cornisa metálica, juntas verticales y nervios discretos en la cubierta. Los colores de cubierta proceden de los datos del recorte PNOA. La forma de los faldones, las alturas de visualización, los alzados y los detalles menores siguen siendo interpretativos. No se presentan como fachadas levantadas. Las cubiertas se conservan dentro del contorno registrado; los agujeros de patio se respetan físicamente.

## Suelo y propiedad del espacio

Las doce superficies de caminos y viales parten de los polígonos de datos. Se triangulan con sus huecos, se recortan contra la franja del modelo del paseo —cadena −130 a 480 m, desplazamiento transversal −24 a +15 m— y contra el corredor estrecho del acceso peatonal desde la playa. No se usa toda la caja conservadora de acceso, porque cortaría parte de la rotonda exterior que no posee el modelo del paseo.

La subdivisión de las caras limita sus aristas largas a aproximadamente 2,8 m antes de adaptarlas al terreno. Se conservan los pequeños desplazamientos de visualización del pavimento sobre la malla. Las dieciocho líneas de bordillo siguen también el terreno y omiten los trozos dentro de la franja reservada. La playa conserva su capa de suelo original: no se añade una segunda plataforma de arena, ni se deduce batimetría.

La fábrica pasa `roadReplacements` sin modificar, de manera que la integración puede sustituir sólo las porciones realmente detalladas de cada vía y conservar los tramos exteriores del vial portuario. Los doce identificadores de edificios propios se devuelven como conjunto para evitar duplicados con la ciudad genérica. El quiosco OSM 1430889843 es propiedad de `coast-pier.js` y no se vuelve a construir aquí.

Los seis árboles de contexto proceden de la lectura visual de la ortofoto. Su posición está documentada en el JSON; las especies, dimensiones y copas son interpretativas. No se añade mobiliario, vehículos ni maquinaria portuaria sin soporte.

## Adaptación al terreno final y recursos

`bindGround(finalSampler)` reconstruye la geometría con el muestreador de la malla costera final. Los muros arrancan sobre las cotas de sus vértices; cada cubierta mantiene un plano o faldones coherentes sobre su edificio. Las superficies vuelven a muestrear el terreno. No se generan parches de aplanamiento ni se modifica la costa.

Las mallas anteriores se liberan al reconstruir. Las siete familias de material y cinco texturas procedurales RGBA de 128 × 128 son propiedad de la instancia y se reutilizan entre reconstrucciones. `dispose` es idempotente. Se exponen grupos separados `buildings`, `surfaces`, `details` y `vegetation`, para que la integración conserve los controles de capas del atlas.

## Comprobación

`research/validation-v31/validate-pantalan-context.mjs` verifica catorce condiciones sobre la fábrica real:

- atributos geométricos finitos;
- doce envolventes, seis árboles y exclusiones de los edificios propios;
- ausencia de mutaciones en las huellas y metadatos de entrada;
- paso intacto de los remanentes de vías;
- ausencia de pavimento dentro de la franja del paseo;
- reconstrucción sobre una nueva muestra de terreno y liberación de las mallas anteriores;
- conservación de materiales entre reconstrucciones;
- hueco de patio físicamente abierto mediante una prueba de intersección;
- presupuesto de geometría y liberación idempotente.

Resultado: **14 de 14 pruebas aprobadas**, ocho mallas combinadas y 84.385 triángulos para el conjunto de datos actual. El informe incluye la huella SHA-256 del módulo en `research/validation-v31/pantalan-context-results.json`. Las cámaras y el aspecto con la ciudad completa se revisan en la validación integrada V31; estas pruebas geométricas no sustituyen la comprobación WebGL.

## Auditoría de integración de producción

La revisión de `coast.js` y `app.js` confirma que el contexto pertenece al mismo grupo regional, aporta sus doce identificadores a la exclusión de la ciudad automática y recibe `coastTerrain.meshHeightAt` después de construir el terreno. `applyCoastContextRoads` conserva cada remanente con los metadatos de la vía original. La recolección regional de recursos usa conjuntos para evitar duplicar materiales y texturas compartidos.

El validador integrado `research/validate_coast_v31.mjs` ejecuta el constructor real de producción y captura los argumentos efectivos de `createCity`. Comprueba el encaje de los doce edificios sobre el terreno final, las exclusiones y la conservación de longitudes y metadatos al repartir las vías. También ejecuta la función real `applyRegionVisibility` con las casillas de ciudad, monumentos y vegetación, y comprueba el ocultamiento de la región y la recuperación de las capas al volver. Después de exportar la geometría, ejecuta `disposeRegion` de producción y comprueba que todos los recursos del pantalán y su contexto se liberen una sola vez, también cuando las texturas se han desvinculado al activar la lectura por elementos. El resultado de esa ejecución pertenece al informe integrado, no al informe unitario de contexto.
