# Santa María · concordancia de cámaras Atlas / Simulador

Se actualizaron únicamente las entradas `santa-maria` de `dist/assets/territory/visit-cameras.json` y `dist/assets/territory/atlas-frames.json`.

Las cámaras anteriores de naves, bóvedas y capillas alejaban la observación por encima del templo y conservaban `requiresSection: true`. Las tres entradas ahora reproducen las posiciones interiores del modelo actual, con `interiorView: true`, `requiresSection: false` y aperturas de 70°, 72° y 67°, respectivamente. Sus ojos, destinos y aperturas son idénticos en escritorio y móvil.

## Método reproducible

```sh
node research/validation-v48/export-santa-maria-cameras.mjs
node research/validation-v48/export-santa-maria-cameras.mjs --check
```

El exportador utiliza los mismos datos, `createHeightSampler` y proyección que `build-santa-maria-plan.mjs`, y completa después el registro en suelo de `export-urban-geometry.mjs`: `createCivicHeritage`, `createSacredHeritage`, `createUrbanSurface`, `buildTerrainGeometry` y `bindGround(terrain.meshHeightAt)` de Plaza e iglesia. Sólo entonces lee los focos y calcula las cámaras. Esto incorpora las cotas y los desplazamientos que el entorno recibe al terminar el terreno; `frame.ground` conserva la referencia del muestreador IGN original.

Utiliza Three.js incluido en el producto y ejecuta, sin iniciar la app, el cuerpo **literal del `preset()` actual de `app.js`**, con `editorialSceneFrame` abierto. No mantiene una segunda fórmula de encuadre ni emplea un navegador. El informe numérico registra también cuánto cambió cada foco al vincularse al terreno y comprueba que las tres cámaras interiores permanecen inmóviles durante ese registro.

Se distinguen la vista general sin parada seleccionada, que utiliza los límites del conjunto y el desplazamiento general de iglesia, y la parada `santa-maria-conjunto`, que tiene su propio desplazamiento. La vista exterior sigue siendo `santa-maria-cavallers` y conserva la estructura y etiqueta del archivo existente.

## Resultado

| Verificación | Resultado |
| --- | --- |
| 16 paradas a 1440 × 900 y 390 × 844 | 32 poses concordantes con `preset()` y los focos reales. |
| Vista general y exterior, en ambos tamaños | 4 poses concordantes; total **36**. |
| Encuadres ajustados a límites | Los puntos de encuadre permanecen dentro de la escena útil con el panel abierto. |
| Registro sobre el terreno final | Se incorporaron cambios de destino en cuatro paradas del entorno: Plaça Major, Cavallers, Sagrario y Berenguer. El mayor ajuste fue de **1,2631 m** en la parada de Berenguer perteneciente a la visita de Santa María. Los tres interiores no cambiaron durante `bindGround`. |
| Tres interiores | Ojo y apertura constantes entre aspectos, sin ajuste automático a límites ni apertura de sección obligatoria. |
| Adaptador `stopCamera()` | Transformación real a ETRS89 / UTM 30N y corrección vertical común de ojo/destino verificadas, con una diferencia de terreno conocida de 7,25 m. Error observado: **0 m** respecto a la transformación esperada. |
| Interiores en aspectos 0,3; 0,85 y 2,4 | Cámara estable también en interpolación y fuera de los dos aspectos de referencia. |
| Redondeo de los archivos | Error máximo por componente: **0,0004993 m**, dentro de la precisión existente de los encuadres generales. |
| Resto de monumentos | Sin cambios: el exportador sustituye sólo el valor JSON de Santa María y conserva los demás bytes. La comparación adicional con Git también identifica únicamente `santa-maria` en los dos archivos. |

El informe numérico completo, las huellas de las entradas y los errores de cada pose se guardan en `santa-maria-cameras-qa.json`. Tras congelar la geometría definitiva de Santa María, se repitieron la exportación con el terreno final y el modo `--check`: ambos pasaron. Los archivos guardados coinciden con los focos ya registrados en suelo. `git diff --check` también pasó.

Este exportador no modifica el worker, el plano ni `visit-stops.json`. Las pruebas son de construcción y geometría de cámara por CPU; no constituyen una nueva revisión visual WebGL.
