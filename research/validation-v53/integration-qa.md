# Circo · integración v53

## Comportamiento entregado

El Atlas y el Simulador conservan las 33 visitas y los 20 identificadores de parada del Circo. El Circo sigue siendo el lugar 11. La puerta conserva sus 14 paradas; las seis históricas se abren desde «Ver el circo completo» o desde el selector permanente «Puerta actual / Circo completo». Los dos visores permiten regresar a la puerta. En el Simulador esta acción selecciona la parada nativa y conserva el visor.

El cuaderno recibe el modo real, también cuando sólo está disponible el plano. La lectura de materiales/épocas sigue siendo independiente del cambio entre la puerta actual y el edificio histórico. El corte de las protecciones de la puerta permanece disponible en su vista actual. El selector histórico no necesita WebGL para consultar el plano y la documentación.

Los planos históricos muestran seis paradas y la puerta conservada como referencia clicable, con su número original 3. El plano del Atlas admite la lectura por capas; el del Simulador utiliza la misma planta registrada y adapta su encuadre al ámbito actual o histórico. Los edificios y calles actuales se conservan fuera de la huella histórica.

## Visibilidad y restauración

`excavation.js` admite el contorno convexo de 51 vértices en la ventana temporal. Los materiales de contexto se clonan para el recorte y se restauran al cambiar de modo o abandonar la visita. El pozo explicativo utiliza el mismo perímetro y una base triangulada. La rama rectangular de las visitas anteriores se mantiene.

En el Atlas, sólo la ventana histórica del Circo incorpora a los grupos arqueológicos vecinos como posibles oclusores. Su geometría situada fuera del contorno permanece visible; no se oculta la Plaza del Fórum entera. Las preferencias de visibilidad de las capas no se sobrescriben.

El Simulador transforma ese contorno a su sistema métrico y utiliza 49 triángulos. El terreno y los materiales de contexto comparten la máscara tanto en GLSL como en el adaptador TSL de la aplicación. Los materiales de profundidad también la utilizan para evitar sombras de edificios retirados. No se modificó la biblioteca Three.js vendorizada. Los 49 triángulos del Circo y los 10 del Fórum caben simultáneamente en el límite existente de 64.

Los edificios urbanos individuales se retiran cuando sus huellas intersectan el contorno; las mallas de contexto fusionadas se recortan por fragmentos. Las copas, el mobiliario y la iluminación urbana refrescan sus máscaras al cambiar de parada o modo. Los coches y peatones no se dibujan dentro de la ventana histórica.

## Suelo y obstáculos del Simulador

La arena y el relleno histórico se muestrean desde las superficies marcadas por el autor como `publicWalkingSurface`. Al entrar en la vista histórica, ese suelo tiene prioridad sobre los pavimentos contemporáneos dentro del contorno. El estado actual recupera sus pavimentos previos.

Los obstáculos del modelo histórico se conservan. Los segmentos de colisión de los contextos actuales se recortan con los mismos semiplanos convexos que la ventana; los tramos exteriores siguen siendo sólidos. El cierre de la ventana devuelve las matrices originales de barreras. En la prueba nativa, el contexto pasa de 4.256 a 1.208 segmentos, una reducción neta de 3.048. Doce puntos repartidos por ambos lados de la pista permiten un radio de caminante de 0,32 m y coinciden con el suelo histórico con error inferior a 0,03 m.

## Verificación ejecutada

Desde la raíz del checkout:

```sh
node research/validation-v53/export-circo-cameras.mjs
node research/validation-v53/test-circo-simulator.mjs
node research/validation-v53/test-circo-section.mjs
node research/validation-v53/test-circo-simulator-map.mjs
node research/validation-v53/test-circo-fallback.mjs
node research/test-atlas-order.mjs
git diff --check
```

- 42 encuadres comprobados: conjunto y 20 paradas en dos tamaños de pantalla. Separación mínima de cámara respecto al suelo: 1,9785 m. Se proyectaron los puntos de encuadre en el área visible de la pantalla y se comprobó la transformación Atlas → Simulador.
- Actualización exclusiva de la clave `circo` en `visit-cameras.json`, `atlas-frames.json` y `visit-stops.json`. Los otros 32 registros conservan sus contenidos y hashes, registrados en `circo-integration-report.json`.
- Cinco planos del Atlas: 14 paradas actuales o 7 marcadores históricos (6 paradas y la puerta). Todos los marcadores son alcanzables mediante su prueba de selección.
- Tres estados de plano del Simulador: puerta → circo completo → puerta. Los 14 o 7 marcadores correspondientes son seleccionables y conservan el ancla de la puerta.
- Fallback del Simulador con índice de cámaras vacío y sin modelo nativo: entrada directa a la parada 17, dos cambios de ida y vuelta, las seis paradas históricas, ruta, selector, CTA y encuadre correctos. Se verifica con el índice actual y con uno antiguo sin `mapScope`. El modo se deriva de la parada solicitada mediante `visit-presentation.js`, compartido por la interfaz y el plano. El control de mapa sigue operativo y alterna plano local/territorio.
- 20 transiciones de parada del constructor nativo, seis de ellas históricas. Máscara de 49 triángulos y suelo público histórico de 211.351 celdas.
- Tres ciclos completos de restauración de materiales; una capa inicialmente oculta permaneció oculta durante y después de la vista histórica.
- Compilación real de los nodos TSL a WGSL con Three r180 en CPU. Comprobación de los uniformes GLSL, de la máscara de sombras, de la coexistencia con el Fórum y de la rama rectangular anterior.
- Numeración: 33 registros, grupos 17/9/7, números únicos 1–33, catálogos y vínculos coincidentes entre Atlas y Simulador.
- Sintaxis de todos los módulos modificados y `git diff --check` correctos.

## Alcance de estas pruebas

Estas comprobaciones ejecutan los constructores, las cámaras, los controladores, los planos y las colisiones. La compilación WGSL se realiza en CPU y no acredita un fotograma dibujado por GPU. El navegador disponible informó WebGL deshabilitado; la comprobación visual 3D corresponde a los renders CPU del expediente. La publicación y la regeneración final del worker las realiza el agente principal.
