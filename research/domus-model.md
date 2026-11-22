# Domus dels Peixos · criterios para la maqueta

Revisión: 20 de noviembre de 2026.

## Qué representa cada modo

| Modo | Criterio |
| --- | --- |
| Ciudad actual | Situar el acceso y la manzana, relacionar fachadas, aceras y entorno con el yacimiento. |
| Corte | Hacer legible la evidencia arqueológica con muros bajos, apoyos, pavimentos y revestimientos. |
| Vista histórica | Explorar una propuesta de volumen, decoración y uso. Las alturas, cubiertas, carpinterías, objetos y agua se consideran restituciones. |

La comparación entre modos es parte de la explicación: se evita que una superficie completa en la vista histórica parezca conservada en la excavación. El color de las capas identifica temas de lectura y no sustituye a una matriz estratigráfica.

## Planta, proporción y georreferencia

El esquema del [informe de 2002](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/321_06_noticia_preliminar.pdf) se contrasta con la planta más completa reproducida en [Hurtado Mullor, 2021, fig. 1.2](https://www.museunacional.cat/pdf/Interactivo_XVI_CONGRESO_NACIONAL_DE_NUMISMATICA_1r_TOMO.pdf). Las dimensiones publicadas quedan recogidas en los hechos de `domus-atrio`, `domus-impluvium`, `domus-columnas`, `domus-taberna`, `domus-cocina`, `domus-balneum`, `domus-tablinum` y `domus-umbrales`.

Las dimensiones de las estancias no convierten toda la maqueta en un levantamiento métrico. La ubicación de muros no acotados, bordes perdidos, pasarelas y estructura contemporánea sigue siendo aproximada. Tampoco se equipara la envolvente del edificio actual con la extensión excavada o con la totalidad de la casa antigua.

`domus-plan.json`, los focos 3D y `domus-visit.json` deben compartir el registro final producido por `createDomus`. No se debe mantener para unos archivos la orientación inicial y para otros la revisada. La georreferencia se etiqueta siempre como aproximada, aunque las coordenadas estén almacenadas con muchos decimales.

## Cotas interpretativas

La referencia de [Civera, 2004, pp. 107–108](https://www.centroarqueologicosaguntino.es/uploads/descargas/397_05_aproximacio_a.pdf) permite contextualizar la poca profundidad del hallazgo. No constituye un punto altimétrico de excavación que pueda extrapolarse a todo el solar.

El desplazamiento del suelo romano respecto al terreno, la altura libre museográfica, la profundidad visual del corte y la relación con los forjados se utilizan para que la escena sea legible. Son parámetros interpretativos. El relieve exterior, por su parte, debe seguir el terreno del atlas para evitar aceras flotantes o accesos enterrados.

## Materiales y completamientos

- Los peces se leen como pintura sobre enlucido. Los trazos procedurales son originales y dejan visibles lagunas y soporte.
- Los pavimentos muestran técnicas distintas sin llenar de mosaicos figurativos las superficies incompletas.
- Los fragmentos de columnas y sus reintegraciones superiores deben diferenciarse entre modos. Un recuento de piezas no demuestra un número idéntico de columnas completas.
- El recinto hidráulico mantiene una forma compatible con su evidencia sin convertir la hipótesis funcional en una instalación de termas.
- La cocina no recibe un horno monumental acreditado; los objetos opcionales se leen como ejemplos.
- La restitución de cubierta permanece separada y reversible. Su forma no resuelve por sí misma el debate tipológico del patio.
- El museo contemporáneo se aproxima desde fotografías publicadas. Las barandillas, luminarias y apoyos virtuales no certifican el detalle constructivo del edificio.

Estas decisiones se apoyan en los estudios enumerados en `domus-history.md` y en las referencias de cada parada. Las fotos académicas sirven como contraste y no se distribuyen como activos de la web.

## Correspondencia de la visita

Las cinco capas son `residencial`, `reforma`, `pintura`, `interpretacion` y `contemporanea`. Los 20 identificadores de paradas mantienen el prefijo `domus-` para preservar enlaces directos. Los focos de cubierta y restitución recomiendan el modo histórico; los del acceso y entorno recomiendan la ciudad actual. La escena del museo puede observarse desde un foco interior del nivel arqueológico.

Antes de publicar, comprobar que texto, plano, foco y modo recomendado coinciden. Los cambios de registro geográfico se sincronizan desde el modelo, no mediante correcciones independientes en cada archivo.
