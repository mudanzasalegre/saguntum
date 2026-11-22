# Necrópolis judía e hipogeos · entorno de la versión 21

Fecha de documentación e implementación: 20 de noviembre de 2026.

## Dos lugares de la ladera

La escena conserva dos sectores independientes: el pequeño recinto funerario cartografiado junto a las murallas y las bocas rupestres situadas frente al teatro. Las coordenadas del atlas los separan **193,56 m**. Las selecciones gráficas de 42 m y 35 m sirven para delimitar el detalle; no representan límites arqueológicos ni un recinto protegido oficialmente delimitado. No se dibuja una excavación, terraza o plataforma continua que los una.

El polígono OSM `way/203325111` usado para el núcleo del cementerio tiene **110,69 m²** en la proyección del atlas. Esa cifra describe el polígono cartográfico de la escena, no la extensión total del cementerio histórico. El núcleo rupestre y su superficie de roca tienen otro propietario geométrico: `necropolis.js`. Este módulo de contexto respeta sus huecos, tumbas, cámaras y cierres.

El relieve se apoya en el MDT ya incorporado al atlas. Los pavimentos se triangulan con las mismas celdas de 2,5 m y reciben sus cotas de `heightAt` al construirse y al volver a enlazarse con el terreno. No se añaden parches horizontales de nivelación. Un pequeño desplazamiento de 0,035 m evita interferencias entre el pavimento y el suelo; no representa una cota medida.

## Arquitectura que conserva su propietario

El inventario cartográfico encuentra tres cuerpos edificados próximos: el pabellón/acceso del castillo y dos partes del edificio asociado al teatro. Los modelos del castillo y del teatro siguen dibujándolos. El contexto nuevo no crea casas ni duplica esos volúmenes. Se conservan también cuatro trazados viarios o peatonales que ya tienen propietario en esos modelos.

Se consultan los once contextos detallados anteriores —Santa María, plaza Mayor, Judería, Calvario, Berenguer, Sangre, Salvador, Museo, Pòrtic, Domus y Circo— para respetar sus edificios, exclusiones y pavimentos. Sus archivos no se modifican. El generador registra hashes de esas entradas, de la cartografía, del relieve y del registro arqueológico.

La puerta medieval documentada por Pascual y Aranegui pertenece al **castillo**. La documentación no permite convertirla en un portal judío monumental. Su construcción continúa siendo responsabilidad del modelo existente del castillo. La menorá de hierro visible en las fotografías corresponde a un cierre contemporáneo de una boca rupestre y pertenece al modelo del núcleo, no a este contexto.

## Caminos, calle y contenciones

Se representan seis fragmentos de caminos o calle a partir de sus ejes OSM. Los recorridos se recortan a cada ámbito, a las huellas arqueológicas y edificadas y a los pavimentos que ya dibuja otro módulo. Las anchuras sin una medición explícita se declaran interpretadas: 1,25 m para senda, 1,60 m para camino peatonal, 2,20 m para pista y 4,10 m para la calle de servicio. No se altera el eje para favorecer la composición.

Los fragmentos principales derivan del acceso meridional al cementerio (`203325144`), las sendas de ladera (`523551302`, `523551303`), la Senda dels Lladres junto a los hipogeos (`1365045236`) y la calle del Castillo (`163560117`, `1365045237`). Las superficies ocupan **556,54 m²** y usan **720 vértices y 819 triángulos**. Las partes de un trazado que continúan fuera del ámbito mantienen su representación genérica; las máscaras retiran únicamente los fragmentos sustituidos.

La Senda dels Lladres pasa por el lado occidental del relleno de terreno que rodea las cámaras. El acuerdo entre módulos mantiene el paso sobre ese borde, mientras que la roca y las cámaras ocupan la parte oriental. La máscara visual rectangular del hipogeo no se usa como una prohibición de dibujar la senda. En el cementerio, las superficies exteriores respetan el polígono funerario irregular; no toman como límite histórico la ventana rectangular necesaria para reemplazar el terreno.

Se mantienen dos alineaciones de contención cartografiadas, `733246631` y `1419279910`. La segunda queda junto a la calle próxima a los hipogeos. La posición de un muro cartografiado tiene prioridad sobre una anchura de calzada inferida: se recorta la banda de pavimento junto a él, en lugar de eliminar el muro por el solapamiento de ambos buffers. El aparejo, espesor, coronación y altura sobre rasante de 0,62 m son aproximaciones visuales, no un levantamiento ni una datación funeraria. Cada pequeño tramo toma la cota local, con una base que llega al terreno de ambos lados.

## Paisaje y materiales

Las fotografías de la guía de la Red de Juderías y de la visita de la UPV muestran caminos estrechos, piedra, cipreses y vegetación de ladera. El contexto incorpora siete cipreses junto al exterior del borde norte del cementerio. Los quince pinos restantes se colocan dentro de las manchas de arbolado de la cartografía; hay diez en el ámbito del cementerio y cinco en el de los hipogeos. Sus posiciones individuales, altura y forma son interpretaciones para expresar ese paisaje, no árboles inventariados.

Los 180 detalles bajos —110 matas y 70 piedras— se distribuyen de forma determinista. Se excluyen las tumbas, cámaras, ejes pavimentados, muros y proximidades inmediatas de troncos. Las copas de los pinos también guardan separación del núcleo y de los caminos. La vegetación genérica se retira dentro de los dos ámbitos para que no se acumule con estos elementos.

Las texturas de tierra, asfalto y caliza se generan mediante código. No se reutilizan fotografías de los documentos como texturas. Las geometrías se agrupan por sector, función y material: **11 mallas y 37.691 triángulos** en total para el contexto. La lectura por capas usa `rupestre` para piedra y paisaje y `contemporanea` para pavimentos y contenciones; al volver a materiales se restauran texturas, mapas de relieve y colores de vértice.

## Paradas e integración

Este módulo proporciona tres observaciones de entorno:

| Identificador | Sector | Objeto de la vista |
| --- | --- | --- |
| `necro-acceso` | `cementerio` | Llegada por el camino y relación con el recinto |
| `necro-ladera` | `cementerio` | Relieve, vegetación y relación con el castillo |
| `necro-contexto` | `hipogeos` | Senda, bocas rupestres y posición frente al teatro |

Los valores de `archFocus`, `mapScope` y `scope` coinciden para cada parada. Todos los componentes de planta llevan su sector. Las coordenadas se expresan en el sistema mundial del atlas; el grupo se añade sin un desplazamiento local adicional. `bindGround` reconstruye superficies y vegetación con el suelo final y actualiza los objetivos de cámara. Las posiciones de cámara incluyen una comprobación de separación respecto al terreno; el encuadre con los modelos vecinos se verifica además en la integración visual del atlas.

`createNecropolisContext` expone los grupos, focos, planta, exclusiones de superficies y vegetación, estadísticas, recursos propios, `bindGround`, `selectFocus`, `setReadingMode` y `dispose`. La reconstrucción libera las geometrías y materiales anteriores. La eliminación final libera también las tres texturas y admite llamadas repetidas.

## Verificaciones reproducibles

El generador requiere Python con Shapely 2.1 o posterior, porque usa triangulación restringida. Se ejecuta desde la raíz del proyecto:

```sh
python research/validation-v21/prepare_necropolis_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v21/validate_necropolis_context.mjs
```

La prueba JavaScript utiliza el cargador de Three.js existente y el Canvas nativo del entorno de validación. Los resultados se guardan en `necropolis-context-geography-qa.json` y `necropolis-context-model-qa.json`, dentro de `research/validation-v21`.

La comprobación geográfica verifica que los dos ámbitos no se solapan, que no entran pavimentos en los núcleos ni en geometrías retenidas, que las contenciones quedan libres y que no aparecen plantas dentro de tumbas, cámaras o caminos. El error de área sin cubrir o sobrante es inferior a 0,0001 m², correspondiente a la precisión numérica de triangulación, y todos los solapamientos geométricos comprobados quedan por debajo de 0,001 m². No hay plantas en los núcleos ni en los pavimentos.

Las catorce comprobaciones del módulo confirman coordenadas finitas, ausencia de triángulos degenerados, propiedad de los sectores, contrato de las tres paradas, ausencia de edificios duplicados, siete cipreses, adaptación al cambio de terreno, liberación de recursos y restauración de materiales. La diferencia máxima entre los vértices de los caminos y el suelo analítico de prueba es inferior a 0,000004 m.

Estas pruebas comprueban la coherencia geométrica y técnica del modelo. No convierten anchuras interpretadas, plantas individuales, alturas de contención o formas estilizadas de roca en un levantamiento arqueológico.

## Fuentes

- Cartografía OSM del atlas: [acceso al cementerio](https://www.openstreetmap.org/way/203325144), [Senda dels Lladres junto a los hipogeos](https://www.openstreetmap.org/way/1365045236), [contención de la calle del Castillo](https://www.openstreetmap.org/way/1419279910) y [mancha de arbolado de ladera](https://www.openstreetmap.org/way/733331823). © OpenStreetMap contributors, ODbL 1.0.
- [Red de Juderías, guía oficial de Sagunto](https://caminosdesefarad.com/wp-content/uploads/2023/05/Sagunto-web.pdf), pp. 30–31: paisaje funerario, muros, caminos y cipreses.
- [UPV, Visita al casco histórico artístico de la ciudad antigua de Sagunto](https://riunet.upv.es/server/api/core/bitstreams/0605b555-9fb5-410d-9fe7-096d2c8677e4/content), pp. 61 y 65: cierre de la boca rupestre, afloramiento y entorno del cementerio.
- [FEMECV, sendero SL-CV 42](https://senders.femecv.com/es/sendero/ver/sl-cv-42): recorrido de la ladera por el castillo, el cementerio y el sector de los hipogeos.
- [Pascual y Aranegui, 1993, repositorio de la Universitat de València](https://roderic.uv.es/server/api/core/bitstreams/e5434d4a-f139-4446-abe5-2238b2649331/content), pp. 189–193: puerta medieval del castillo y contexto de los enterramientos.
- Relieve IGN ya integrado en `elevation.json`: se conserva su registro de procedencia y atribución del atlas.
