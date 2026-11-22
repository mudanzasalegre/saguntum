# Pantalán · revisión de geometría V31

Fecha de revisión: 21 de noviembre de 2026. Archivos propios: `dist/js/coast-pier.js`, `dist/assets/data/coast-pier.json` y los dos `pantalan-*-plan.json`. La implementación conserva el eje cartográfico y la separación temporal fundamentados en V5, descritos en `research/coast-pier.md`.

## Cambios concretos

El paseo actual incorpora materiales procedurales con escala métrica para hormigón, piedra, pavimentos, madera, acero pintado y metal envejecido. Se corrigió la proyección de UV: las caras orientadas en sentido longitudinal podían presentar coordenadas de textura degeneradas. Cada cara usa ahora sus dos ejes dominantes. Las 600 lamas de las siete pérgolas siguen produciendo sombras geométricas; sus vigas sinuosas tienen segmentos más cortos y las alturas varían dentro del rango publicado como altura de 7–11 m. No se interpreta ese dato editorial como una serie de cotas absolutas de un levantamiento.

El antiguo modelo dejaba el carril bici como una superficie separada de la plataforma elevada. Se añadió el talud que físicamente une ambas superficies y su plantación interpretativa. Las palmáceas forman un componente de vegetación separado para respetar el control de capas. La torre de juegos genérica de madera se sustituyó por la estructura tubular metálica observada en la fotografía municipal de 2024, con cuerpo cilíndrico, cerramiento perforado interpretativo, red inferior y tobogán tubular cerrado y curvo. También se ampliaron los descansillos de la escalinata, se corrigió la altura del muro lateral de acceso para que disminuya respecto a la rampa, y se incorporaron orientación podotáctil y desagües. El mirador conserva la llegada a +8,80 m, la tarima y los aparcamientos de bicicletas; sus asientos redondeados blancos, amarillos y oscuros se interpretan de las fotografías municipales de la inauguración. La escollera tiene rocas de escalas variadas y una escalera pública, cuya posición exacta sigue siendo interpretativa.

La tolva conserva su interior abierto, chapas inclinadas, bastidor, ruedas, escalera y cinta auxiliar. Se añadieron herrajes y un acabado pintado que se diferencia del metal histórico. No se añaden cargas de mineral ficticias a la tolva expuesta. Los paneles museísticos son envolventes geométricas neutrales: no se fabrican fotografías de archivo.

El quiosco cartografiado OSM 1430889843 se incorpora al propio paseo porque su huella cae dentro de la zona excluida del contexto automático. Se conserva el polígono original de aproximadamente 23 m² y se interpreta una envolvente de 2,8 m y techo gris. La fuente no ofrece altura ni acredita que el establecimiento esté abierto; no se construye un interior comercial ni una cartelería inventada.

En el tramo marítimo, los 21 apoyos principales actuales conservan sus coordenadas registradas y sus huecos. Se corrigió un defecto concreto del modelo anterior: los seis apoyos de transición no aplicaban el desplazamiento transversal de cada punto cartográfico. Ahora se conserva tanto la cadena longitudinal como ese desplazamiento. El hormigón, las juntas, los apoyos de viga y la corrosión localizada mejoran su lectura; la corrosión es una interpretación gráfica, no un mapa patológico del estado de cada pilote. La plataforma actual continúa aislada y sin tablero de acceso.

La fase histórica mantiene la restitución de aproximadamente 1984–1987, con el transportador al norte del tablero, el vial de servicio al sur, la transferencia, el cargador, cinco tolvas y la pasarela final. Ninguno de esos elementos se transforma en una rehabilitación marítima actual. La vista baja bajo la plataforma ayuda a leer la losa, sus tres nervios y las filas de pilotes desde una cámara sobre el mar; no equivale a un acceso público, inspección física ni restitución batimétrica.

## Datos que sustentan la forma

- **APV, descripción accesible del paseo:** programa, siete pérgolas, unas 600 lamas de 7,5 m, viga sinuosa, columnas triangulares achaflanadas, tres tramos de escalera, rampa próxima al 4 %, carril bici con talud, 400 m de tránsito y plaza ascendente de unos 100 m, cotas +5,60/+8,80 m. <https://www.valenciaport.com/maqueta-tiflologica-del-nuevo-paseo-maritimo-del-puerto-de-sagunto/>
- **Ayuntamiento, inauguración de 19-07-2024:** fotografías de pavimentos, pilares, tolva, carril bici, mobiliario y restos sobre el mar. <https://aytosagunto.es/es/actualidad/el-nuevo-paseo-del-puerto-de-sagunto-se-ha-abierto-a-la-ciudadania/>
- **FHECOR / ACHE, estudio estructural:** cinco secciones, luces de 30 m, pilotes de 762 mm, inclinación 1:4, plataforma 272 × 20 m, losa de 40 cm y tres nervios; pilotes exteriores verticales a 6 m y parejas centrales inclinadas. <https://www.congresoache.com/descargas2022/2362.pdf>
- **Fundació, síntesis de planos y certificaciones de ejecución:** anchos, vigas, separación de cinta y vía de servicio, transferencia y maquinaria. Se distingue el anteproyecto de EPTISA de la solución ejecutada. <https://fundacioportdesagunt.com/wp-content/uploads/2011/05/resumen-informacic3b3n-previa-del-pantalc3a1n.pdf>
- **APV, Memoria de Sostenibilidad 2025, p. 17:** retirada de tableros de los tramos 1–2, pasarelas finales y tolvas en 2022–2023; conservación de trípodes y plataforma del tramo 3. <https://www.valenciaport.com/wp-content/uploads/SOSTENIBILIDAD-2025.pdf>
- **OSM y PNOA:** eje, apoyos actuales, tolva, juegos, mirador y quiosco. La fecha de consulta de PNOA no se presenta como fecha de vuelo.

## Contrato para las dos visitas

`createCoastPier` mantiene su API e incorpora los parámetros opcionales `pantalanPaseoVisit` y `pantalanMaritimoVisit`. Cada sitio devuelve `visit`, cuyo `overviewId` y diez `focuses` usan el prefijo del lugar. Cada foco aporta objetivo mundial, coordenadas geográficas, objetivo local, cota, desplazamientos de cámara, límites de encuadre, fase admisible y categoría editorial. Los aliases antiguos continúan en `site.focuses`, fuera de `visit.focuses`.

Las visitas ofrecen selección, lectura por elementos, consulta de estado y liberación de recursos. Las categorías editoriales comunes son `edificio`, `espacios`, `construccion`, `memoria` y `entorno`. La sincronización de las fases de ambas mitades sigue siendo responsabilidad de `coast.js`.

Los planos derivan del mismo eje y los focos del modelo. Incluyen polígonos GIS de componentes, cadena y nivel, perfil longitudinal, apoyos conservados, apoyos históricos ausentes (`current:false`), auxiliares diferenciados, y paradas. El mapa no debe representar las partes `historical` en el estado actual. Generación:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v31/build-pantalan-plans.mjs
```

## Propiedad de recursos y comprobación

Las texturas, materiales y geometrías se crean por instancia de la fábrica. Se elimina la caché global anterior, que podía conservar materiales ya liberados al reconstruir la región. La liberación compartida por ambas visitas es idempotente. Las once texturas procedurales son `DataTexture` RGBA de 128 × 128 píxeles; para una exportación CPU se debe leer `texture.image.data`, además de las texturas Canvas que usan otros monumentos.

La validación ejecuta 145 comprobaciones significativas sobre la geometría real de Three.js: atributos finitos, normales, UVs, fase inicial, focos y cámaras, separación de los vanos actuales, continuidad de los históricos, presencia en los 21 puntos registrados, plataforma, ausencia actual de pasarela final, talud sólido, cámara peatonal a 1,65 m y propiedad/liberación de recursos. Los resultados y la huella del módulo están en `research/validation-v31/pantalan-model-results.json`. La revisión de encuadres con el terreno y el nuevo entorno costero corresponde a la validación integrada V31. Esa comprobación detectó que el objetivo de escollera quedaba bajo el terreno IGN; se elevó de 3,4 a 4,4 m, conservando su posición horizontal.

La ejecución CPU comprueba la geometría, pero no certifica la iluminación o el sombreado WebGL del navegador. El agua se implementa y valida por separado en `coast-environment.js` y su documentación.

## Reparaciones localizadas tras la revisión visual CPU

La vista de la tolva mostraba una palmácea delante del embudo y el bastidor. Se conserva la geometría registrada y se cambia únicamente el desplazamiento local de cámara a `[-20, 5.2, -21]`; el plano y `cameraOffset` de la guía se actualizan desde ese foco.

El carril bici se incorpora por el margen derecho a la plaza inclinada, como describe la APV. La revisión detectó que la barandilla heredada atravesaba esa unión y que el último pavimento quedaba parcialmente enterrado o coplanar con la plaza. Se conserva su planta y la cota documentada del mirador: se abre el paso entre estaciones 438–449 y la rasante final del carril converge a la del paseo con una separación gráfica de 35 mm. Se incorpora el punto de estación 443 y el plano recoge ahora el corredor y perfil reales del modelo, incluida su llegada. Cinco intersecciones verticales verifican que el carril queda sobre el pavimento; una intersección horizontal comprueba que no existe barandilla cruzando la entrada. El resultado actualizado es 145 de 145 pruebas aprobadas.
