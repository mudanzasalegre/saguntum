# Casino Recreativo y Cultural · jardín y entorno · V26

## Criterio y resultado

El contexto se ha reconstruido como una lectura del jardín histórico documentado del Casino, registrada sobre la ortofoto PNOA ya usada para la Gerencia. La escena muestra las isletas plantadas, la pista descubierta, el escenario meridional con pérgola, las palmeras, el mobiliario y el cierre con taquilla. El edificio y sus terrazas pertenecen al módulo arquitectónico `casino.js`; este módulo no los duplica.

La noticia municipal de **6 de octubre de 2026** documenta obras de rehabilitación en curso. Las fotografías institucionales del jardín son históricas y no tienen fecha suficientemente comprobada. Por ello, esta composición **no afirma ser el estado final de las obras ni una apertura pública acreditada en noviembre de 2026**. Los detalles, alturas, especies y posiciones de mobiliario que no han sido levantados se indican como interpretativos en el registro de datos.

## Fuentes que condicionan la geometría

| Fuente primaria | Evidencia utilizada | Límite de la evidencia |
|---|---|---|
| [Universitat de València · Conjunto Histórico de la Gerencia, apartado 4](https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html) | Recinto ajardinado aproximadamente cuadrangular, islas de vegetación alrededor de una pista descubierta, pérgola y escenario al sur, bancos y mesas, taquilla en el muro a la calle. | Descripción histórica de la ficha patrimonial; su tiempo presente no acredita una apertura o un estado actual. |
| [Casino Recreativo y Cultural · instalaciones](https://www.casinopuertosagunto.com/portfolio/instalaciones/) | Isletas rectangulares y ovales con bordillo ocre bajo; palmeras de diferentes portes, arbolado columnar periférico, bancos azules, urna ornamental y escenario de estructura ligera con estrellas azules en su frente. | Fotografías institucionales sin datación fiable; las imágenes no ofrecen cotas ni un inventario botánico. |
| [IGN/CNIG · servicio PNOA de máxima actualidad](https://www.ign.es/wms-inspire/pnoa-ma) | Registro espacial de edificio, jardín, pista, cubierta del escenario, vegetación y relación con el Economato y la calle. | Fecha del vuelo no verificada; resolución de referencia aproximada de 0,23 m por píxel. Los bordes digitizados son una lectura visual. |
| [Catastro · INSPIRE edificios](https://www.catastro.hacienda.gob.es/webinspire/) | Componentes reales de edificios próximos, huecos y perímetros que ya integraba la cartografía del atlas. | Se reutiliza la geometría disponible, sin atribuir al modelo una precisión de fachada o un estado constructivo actual. |
| [Ayuntamiento · avance de la rehabilitación, 6 de octubre de 2026](https://aytosagunto.es/es/actualidad/2026-10-06-avanzan-las-obras-de-rehabilitacion-del-casino-de-la-gerencia/) | Estado fechado de las obras. | No se deduce una finalización posterior ni se representa una intervención proyectada como terminada. |

Las cuatro fotografías de apoyo se conservan en `research/validation-v26/jardin.jpg`, `jardines.jpg`, `barra-jardin.jpg` y `vista-entrada.jpg`. La ortofoto original es `research/validation-v25/gerencia-context-orthophoto-reference.jpg`. Son evidencia para revisión; las texturas de la escena son procedurales y no reutilizan las fotos como materiales.

## Registro y composición

Se mantiene el sistema métrico global del atlas:

```
x = (longitud + 0.278) × 111320 × cos(39.679°)
z = (39.679 − latitud) × 111320
```

La imagen PNOA de 1.800 × 1.215 píxeles cubre longitudes −0.2255 a −0.2207 y latitudes 39.65775 a 39.66025. Los píxeles de referencia de las plantas se conservan en el JSON y en el generador.

Las exclusiones del edificio usan la huella catastral existente. Las de la terraza y escalera coinciden con el marco final del módulo arquitectónico: giro −0,5914002348580363 radianes y origen desplazado −0,11394856798006041 m en x y −0,22876259994472958 m en z respecto al punto del registro. Se recortan las superficies contra las terrazas norte y este, su conexión y el sector de la escalera concéntrica. Los senderos se recortan por su **anchura completa**, con márgenes, para evitar que sus bordes entren en el edificio aunque su eje estuviera fuera.

La composición contiene:

- **Tres isletas**: una rectangular, una oval y una menor junto al frente urbano. Bordillos ocres bajos distinguen la vegetación del paso.
- **Pista descubierta**, con pavimento claro y pequeñas piezas oscuras interpretadas a partir del patrón visible en la ortofoto.
- **Pérgola y escenario al sur**, sobre una huella trazada de aproximadamente 44,30 m². Seis montantes esbeltos, cerchas laterales, travesaños y franjas ligeras de sombra permiten leer la estructura desde arriba. El frente incorpora el motivo azul visible en las fotografías, y una corta escalera lateral permite entender el acceso.
- **Doce árboles** en posiciones procedentes de la imagen: ocho palmeras y cuatro formas columnares. Las alturas y radios son interpretativos. Se mantiene la posición de cada tronco; una copa se reduce para respetar la terraza. Las demás conservan su porte de referencia.
- **Cinco bancos azules** y una urna ornamental. Se reproduce su tipo y carácter a partir de las imágenes; no se afirman posiciones actuales medidas.
- **Cierre a la calle con vano real de taquilla**. Se modelan jambas, alféizar, dintel y barrotes finos; el muro no atraviesa el vano. La ubicación exacta de la taquilla dentro del frente es interpretativa.
- **1.442,64 m² de superficies** nuevas del Casino, con 1.007 triángulos antes de descartar los mínimos fragmentos que colapsan al pasar a precisión gráfica Float32.

Todos los suelos se subdividen contra los mismos triángulos de 5 m del terreno regional. Por eso sus vértices y sus interiores permanecen sobre el terreno final incluso después de aplicar las cotas urbanas. La separación superficial es de 0,041 m. Los objetos se vuelven a apoyar cuando el atlas vincula la función de altura final.

## Un único propietario por superficie

La Gerencia V25 ya había mejorado la mayor parte del barrio, los jardines y las calles. Se preserva ese trabajo. No se añaden edificios ni carreteras nuevos en este módulo.

La reserva anterior del Casino era un rectángulo genérico de **724,79 m²**. La nueva delimitación, de **1.450,36 m²**, incorpora el jardín visible y toma su borde norte de la delimitación existente del recinto. El script de transferencia únicamente recorta los suelos de Gerencia y un tramo del cierre que ahora representa el Casino.

Se verificó contra el commit publicado V25 `b069969cf43f93184d006b8ffd00b281067ac059` que permanecen idénticos:

- Los **143 componentes de edificios**, sus identificadores, alturas y huecos.
- Los **24 fragmentos de carreteras** y todos sus registros de origen.
- Los **105 árboles** de Gerencia, todos sus arbustos, bancos, luminarias y acceso.
- Las exclusiones de edificios y carreteras, las colisiones y las plataformas del terreno.

La intersección entre las nuevas superficies de terreno del Casino y las retenidas por Gerencia es **0 m²**. El escenario elevado se apoya parcialmente sobre terreno de Gerencia ya existente: 14,69 m² de su huella están sobre ese suelo, sin una segunda superficie coplanaria. Se conserva el terreno debajo, como bajo cualquier plataforma elevada.

La comprobación de cobertura de la antigua reserva encuentra una diferencia residual de 0,000041 m² tras considerar el margen intencionado de 10 cm junto a la arquitectura. El margen de fachada suma 2,75 m² antes de esa tolerancia y deja visible el terreno regional continuo, sin un hueco del modelo.

El script `transfer_casino_garden_ownership.py` genera primero un candidato y un informe. Solo el parámetro `--apply` escribe los datos de Gerencia. La raíz revisó y aplicó el candidato. No se volvió a ejecutar el generador V25 ni se sustituyeron sus edificios o calles.

## Visita, plano y lectura temática

Los siete puntos exteriores se integran con los trece puntos del edificio:

| Identificador | Enfoque | Capa |
|---|---|---|
| `casino-jardin` | Isletas y organización del jardín | `jardines` |
| `casino-pista` | Pista de baile descubierta | `jardines` |
| `casino-escenario` | Pérgola y escenario sur | `jardines` |
| `casino-arbolado` | Palmas y arbolado periférico | `jardines` |
| `casino-taquilla` | Taquilla y límite urbano | `memoria` |
| `casino-entorno` | Relación con la ciudad factoría | `memoria` |
| `casino-memoria` | Jardín y celebraciones históricas | `memoria` |

Todos son exteriores (`floor: null`). Las cámaras se registran en coordenadas mundiales, se actualizan después de vincular el terreno final y se elevan cuando su posición coincide horizontalmente con una copa. Los radios del árbol en el plano reflejan la envolvente máxima finalmente usada por el modelo.

`plan.outline` abarca el edificio, las terrazas y el jardín. Sus componentes mantienen polígonos reales con huecos, ejes de senderos, cierre, escenario y árboles puntuales. Los edificios vecinos se incluyen como referencia en el plano, con su propiedad externa explícita, y no como una segunda geometría 3D.

## Validación reproducible

Desde la raíz del checkout:

```bash
python research/validation-v26/prepare_casino_context.py
python research/validation-v26/validate_casino_context_ownership.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v26/validate_casino_context.mjs
python research/validation-v26/plot_casino_context.py
```

Los controles propios del contexto pasan:

- **9 de 9 controles de fuente**: exclusión de arquitectura, ancho de senderos, disjunción entre propietarios, áreas de triángulos y conservación de huecos.
- **15 de 15 controles de la transferencia** aplicada: registros protegidos sin cambios y recorte exclusivo del jardín.
- **14 de 14 controles de cobertura y propiedad** frente a V25.
- **55 de 55 controles del constructor de producción**: geometría finita, ausencia de triángulos degenerados, doce centros conservados, copas y frondas fuera de edificios, cámaras exteriores seguras respecto al terreno y sus copas, frente y escalera del escenario orientados hacia la pista con independencia del orden de los vértices, correspondencia temática, liberación de recursos y reapoyo sin acumulación de mallas.

El constructor produce 25 mallas y aproximadamente 34.600 triángulos. Los recursos de geometría, material y textura están registrados, se liberan al reconstruir o eliminar el contexto, y la eliminación es idempotente.

El archivo `research/validation-v26/casino-context-source-alignment.png` compara la ortofoto registrada y las geometrías de producción. Los informes de integración de la raíz añaden la comprobación de las cámaras contra las mallas de todos los edificios y contextos vecinos; los controles locales no sustituyen esa revisión global.

### Comprobación de la terraza arquitectónica final

La arquitectura sustituyó los fragmentos de terraza por una losa continua unida al borde catastral, con la escalera curva enlazada. Se realizó una revisión adicional **sin modificar los datos o el renderizador del contexto**, utilizando los polígonos finales `qa.footprint` y `qa.terraces` de `casino-geometry-metadata.json`, en lugar de dar por suficientes las exclusiones anteriores.

Las doce envolventes completas de las copas mantienen la separación requerida de 0,45 m; la menor distancia libre es **0,4500058 m**. También se comprobaron **43.803 vértices de follaje y frondas del constructor real**, y ninguno ocupa las huellas finales del edificio, la terraza o sus escaleras.

El cambio de perímetro deja aproximadamente **0,16 m²** de la antigua exclusión fuera de la terraza nueva al comparar el JSON redondeado del contexto. La comparación directa de la raíz entre sus dos geometrías obtiene 0,153 m². Casi toda la diferencia se concentra en un pequeño remate junto a la esquina noroeste, con 0,274 m de ancho máximo local; el terreno regional permanece continuo debajo. No aparece un agujero topológico del paisaje. La raíz documenta también 4,60 m² de suelo de jardín que quedan por debajo del plinto elevado, sin coplanaridad con su superficie de paso.

Esta comprobación queda en `research/validation-v26/casino-context-final-terrace-canopy-review.json` y complementa los informes de cobertura anteriores al ajuste arquitectónico.
