# Sector oriental · integración y comprobaciones

Base: Sites v53, `3d3d523247d827acbec8b0debc333a1a85114019`. Se conservan las 33 visitas del Atlas y los siete recintos del Castillo. Las 18 paradas anteriores del Castillo mantienen sus identificadores y orden relativo; cuatro nuevas paradas orientales después de Almenara amplían el recorrido a 22.

## Diagnóstico de la base

El modelo de la Puerta de Almenara ya tiene un suelo propio y un corredor comprobado. El terreno de `castle-ground.js` corrige el Foro y ese paso, pero no el conjunto del recinto oriental. Las cuatro ruinas orientales cartografiadas se representan inicialmente como anillos de muro genéricos, sin un contrato específico de suelos o espacios interiores.

Sobre la malla final de v53 se muestrearon las rutas OSM a intervalos de un metro como máximo. El circuito `180732342` presenta un máximo de pendiente de 0,756 y el eje `733215256` uno de 1,096. Son gradientes del modelo, no mediciones de la accesibilidad física. Los puntos extremos quedan dentro del polígono del Castillo y se concentran en el encuentro del paso con el patio y en el extremo oriental. El registro de partida se conserva en [east-before.json](east-before.json).

La cámara de detalle de Almenara permanece inicialmente a unos 103 m por encima de su punto objetivo. Su definición genérica explica la escasa cercanía visual del recinto. Los encuadres de v54 se comprobaron contra el modelo final y la función real `preset()` de la aplicación.

## Contratos que comparten Atlas y Simulador

- `createCastleGround().surfaceHeight/sample`: perfil idempotente aplicado antes de construir la malla del Atlas y por `heritageRelief` en el Simulador.
- `ground.bounds`: debe abarcar todos los perfiles orientales para que el Simulador no recorte las modificaciones de terreno.
- `ground.pregraded`: sus sondas deben cubrir también el este para reconocer correctamente una malla ya preparada.
- `mesh.userData.publicWalkingSurface`: identifica únicamente pisos públicos transitables, sin convertir coronaciones o fondos de cisternas en caminos.
- `visit.qa.east`: aporta ubicaciones de comprobación de las nuevas estructuras y rutas. Las pruebas deben consultar las mallas y las colisiones reales, no aceptar el contrato como evidencia de éxito.
- `focus.closeScale=false`: conserva las cámaras de detalle escritas al cambiar de proporción de pantalla; la vista general mantiene el encuadre adaptable.

El adaptador nativo ya incorpora las superficies marcadas al pavimento y a la cubierta peatonal. Los caminos y los escalones existentes conservan sus condiciones de selección. Las barreras se obtienen de la geometría y el suelo efectivo del modelo.

## Archivos de comprobación

`castle-scene.mjs` monta el constructor distribuido sobre el terreno final. `validate-castle-simulator.mjs` conserva las regresiones del Foro y del paso de Almenara, y compara el Atlas con los dos caminos de carga del Simulador: malla ya graduada y MDT original. `export-castle-cameras.mjs` calcula los encuadres mediante la función real de la app y el adaptador métrico nativo.

El exportador sólo reemplaza la clave `castle` de los índices territoriales. [east-integration-baseline.json](east-integration-baseline.json) guarda los identificadores y hashes de las otras 32 visitas antes de la revisión.

## Integración terminada

`castle-east-cameras.js` aporta cinco ojos cercanos: Almenara y las cuatro paradas añadidas. El ojo del depósito está a 2 m del terreno y mira al piso real más 0,25 m, con FOV de 58°. Su vista general es más cenital para mostrar el hueco. La cámara de dependencias observa desde el camino al suroeste, evitando el muro alto del retorno norte. Los demás ojos están a 1,9 m de la malla; el pavimento visible puede elevar ligeramente el apoyo efectivo del visitante. Las cinco vistas mantienen exactamente su posición al cambiar de proporción de pantalla.

El mapa muestra las estructuras de `visit.plan.east`, amplía automáticamente el sector oriental y conserva la numeración completa del itinerario. Su regla cambia de 100 m a 50 m en la ampliación. En móvil se omite el título duplicado dentro del lienzo para dejar espacio a los marcadores. El modo alternativo sin modelo conserva la planta compartida. Los dos caminos orientales usan la misma definición efectiva que el constructor 3D, incluido el ajuste interpretativo del enlace junto a la puerta; la fuente OSM permanece intacta.

El adaptador nativo transporta los `currentMasks` del Castillo al relieve territorial. El hueco del depósito se recorta físicamente en el terreno del Atlas y se registra como dos triángulos de exclusión en el Simulador. Su fondo no se marca como cubierta peatonal.

Los tres índices territoriales se han regenerado únicamente bajo la clave `castle`. La comprobación contra la base v53 conserva los hashes de las otras 32 visitas en cada archivo y mantiene los 33 números globales.

## Resultados finales

| Comprobación | Evidencia |
| --- | --- |
| Constructor nativo real | [castle-simulator-qa.json](castle-simulator-qa.json): 672 comprobaciones correctas, 160 mallas, error de buffers y registro métrico de 0. Se ejecutaron los constructores con terreno final del Atlas y con MDT original. |
| Paso de Almenara | 207 muestras en la carga desde MDT: sin bloqueo, sin techo invasivo, sin suelo enterrado; error máximo de apoyo 0,107 m. Se conservan las comprobaciones del Foro y los sectores exteriores. |
| Caminos del este | 219 muestras por constructor: sin bloqueo y sin entrada en el depósito. Error máximo del apoyo respecto de las superficies realmente renderizadas: 0,125 m. Dos celdas vacías en esquinas agudas usan el terreno como apoyo y se conservan explícitamente en el informe. |
| Depósito abierto | Un hueco permanente; 22 triángulos del terreno retirados durante la triangulación; fondo visible y dos triángulos de exclusión en cada constructor nativo. |
| Cámaras e índices | [castle-cameras-qa.json](castle-cameras-qa.json): 48 encuadres normales y 10 cercanos. Todos respetan el terreno, el encuadre adaptable y la conversión nativa. Las cinco miradas cercanas están fuera del hueco, libres de colisión y sin estructuras delante del objetivo. |
| Terreno | [east-ground-qa.json](east-ground-qa.json): 17.441 muestras, error de idempotencia 0 y detección correcta de la malla ya graduada. El paso v51 conserva exactamente su perfil. |
| Contacto de dependencias | [east-wall-contact-qa.json](east-wall-contact-qa.json): 110 aristas inferiores reales y 550 muestras, incluidas ambas caras del muro. Ningún hueco: margen mínimo de enterramiento 0,162 m. |
| Mapa | [east-map-qa.json](east-map-qa.json): nueve escenarios con el plan real y sin modelo, en miniatura, escritorio y móvil. Marcadores sin solapamiento de discos, selección correcta y retorno del detalle oriental al Castillo completo. |
| Catálogo | [east-catalogue-qa.json](east-catalogue-qa.json): 22 paradas y siete recintos; las otras 32 visitas permanecen intactas en los tres índices. `research/test-atlas-order.mjs` confirma 33 visitas: 17 Sagunto, nueve Puerto y siete restantes, con números iguales en Atlas y Simulador. |

El circuito efectivo conserva un gradiente máximo de 0,480 junto al banco de la curia; el eje oriental baja a 0,213 frente a 1,096 en la base. Son gradientes del modelo digital, no un estudio de accesibilidad real. Los bancos arqueológicos interpolan celdas de terreno de tamaño finito; se registran sus diferencias sin alterar las estructuras del Foro para forzar un resultado plano.

### Reproducción

```sh
node research/validation-v54/validate-east-ground.mjs
node research/validation-v54/validate-east-contact.mjs
node research/validation-v54/validate-castle-simulator.mjs
node research/validation-v54/export-castle-cameras.mjs --check
node research/validation-v54/validate-east-map.mjs
python research/validation-v54/validate-east-catalogue.py
node research/test-atlas-order.mjs
```

El exportador sin argumentos escribe sólo los tres valores `castle`; `--dry-run` comprueba los encuadres sin escribir índices y `--check` comprueba también que los índices almacenados sean los actuales.

Estas pruebas usan geometría, rayos, superficies y colisiones reales de los constructores distribuidos, además del rasterizador de mapas Canvas. No atribuyen al entorno ninguna captura WebGL ni medición de rendimiento GPU. Los renders finales se documentan por separado.
