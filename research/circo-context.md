# Puerta del Circo Romano: entorno actual y registro cartográfico

Iteración 20 · 20 de noviembre de 2026.

La visita incorpora el entorno actual de la puerta entre Huertos y Remedio: el recinto arqueológico abierto al cielo, la plaza arbolada inmediatamente al norte, la calzada y las aceras, y las parcelas residenciales que lo rodean. La representación del circo antiguo pertenece al modelo arqueológico y se presenta por separado de estas construcciones actuales.

## Registro y evidencia

| Elemento | Base empleada | Tratamiento |
| --- | --- | --- |
| Recinto actual | [OSM203085829](https://www.openstreetmap.org/way/203085829), ya incluido en la cartografía del atlas | Se conserva su polígono irregular. Su área calculada en la proyección local es 119,58 m². No se convierte en un recinto rectangular mayor. |
| Plaza al norte | [OSM566703073](https://www.openstreetmap.org/way/566703073), clasificado como parque en la fuente | Se conserva el perímetro de 256,82 m² calculados. El pavimento y los alcorques son una interpretación de las fotografías, no un plano de urbanización. |
| Calles | Ejes OSM de Huertos, Remedio y sus continuaciones, conservados en `cartography.json` | Se recortan únicamente los fragmentos del entorno. Las anchuras y los bordillos son aproximados. |
| Edificios | [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/), fuente ya incorporada al atlas con fecha 21-08-2026 | Se conservan las coordenadas originales, patios, identificadores y atributos de las 91 partes de 21 parcelas seleccionadas. |
| Alturas | Valores explícitos, [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y plantas catastrales, en ese orden | Tres conflictos entre una planta cartografiada y una estimación de superficie muy alta se anotan en `heightReview`; la altura de visualización de esas partes se interpreta como 3 m. No se alteran los valores de origen. |
| Medianera oeste | [Fotografías públicas de Rutas Jaume I](https://www.rutasjaumei.com/es/que-ver-en-sagunto/223/sagunto-puerta-del-circo-romano.php), imágenes 01, 03 y 05 | Se evita generar huecos automáticos en la medianera ciega junto al recinto. Se conserva el contorno catastral. |
| Arbolado y elementos menores | Las mismas fotografías muestran árboles, bolardos y espejo vial en la esquina | Se modelan cinco árboles, cinco bolardos y un espejo con posiciones y dimensiones interpretativas. No se atribuye a la fuente un inventario o fecha de actualización que no publica. |

Las áreas indicadas son cálculos sobre los polígonos disponibles, no mediciones topográficas. La ortofotografía PNOA ya incluida en el atlas se usa como comprobación de encaje general, sin atribuirle una fecha de vuelo que no consta en este conjunto de datos. Las fotografías consultadas no se redistribuyen como activos del sitio.

La investigación arqueológica de referencia es López, Sañudo y Verdasco, [«La intervención arqueológica previa para la puesta en valor de los restos arqueológicos de la puerta del circo romano de Sagunto»](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/8.-La-intervenci%C3%B3n-aequeol%C3%B3gica-previa-para-la-puesta-en-valor-de-los-restos-arqueol%C3%B3gicos-de-la-puerta-del-circo-romano-de-Sagunto.pdf), ARSE 51 (2017), pp. 103–123. Describe la intervención vinculada a la plaza pública y el muro de contención moderno junto al Remei. La cota +47,30 m citada para un relleno protegido corresponde a esa intervención concreta y no se traslada automáticamente al terreno de todo el modelo.

## Marco compartido con el modelo arqueológico

El ancla es `[-0.275518, 39.681049]` y el giro local es `−0.307 rad`. La coordenada mundial del ancla es aproximadamente `[212.6468765, −228.0946800]` en el plano x/z del atlas. El centro gráfico de la puerta se sitúa en `[-4.25, 1.3]` dentro del marco local: es un ajuste visual a las fotografías y al recinto, no un levantamiento de la fábrica.

La profundidad aproximada de 2,25 m bajo la superficie actual se documenta como interpretación visual. El modelo arqueológico es propietario de los restos, muros de retención, vallado azul inmediato, tarima y escaleras. El contexto es propietario del suelo exterior, la plaza, los árboles, el mobiliario vial y el caserío. No hay una cubierta de museo sobre este recinto.

El recorte rectangular del terreno empleado por el controlador mide 16,4 × 8,9 m y tiene centro local `[-0.48, -0.33]`. La diferencia entre ese rectángulo y el recinto irregular se rellena a la cota de la calle: **26,38 m² de superficie exterior**, guardados como `surfaceApron` y renderizados en el grupo `circo-apron`. Así el mecanismo de recorte no ensancha visualmente la excavación ni elimina el pavimento intacto.

## Construcción del entorno

Se seleccionan parcelas completas alrededor de un radio gráfico de 42 m desde el recinto. Se preservan los seis patios catastrales registrados y no se rellenan con pavimento público. El generador compara la propiedad de edificios, calles y pavimentos con los diez contextos anteriores: Santa María, Plaça Major, Judería, Calvario, Berenguer, Sangre, Salvador, Museo, Pòrtic y Domus. En esta selección no es necesario transferir ni duplicar geometría de ninguno de ellos.

Los ocho fragmentos de calle mantienen sus ejes y referencias de origen. Solo dos sustituyen un elemento OSM completo; el resto utiliza máscaras locales que no eliminan la continuación de la calle fuera de la escena. Las calzadas, aceras, plaza, alcorques y superficie de cierre del recorte forman regiones sin solape. Se sustraen todos los edificios cartografiados, patios, pavimentos anteriores y el recinto arqueológico antes de triangular.

La franja pública entre el borde oriental del recinto/plaza y el eje de Remedio se une expresamente a la acera. Esta unión resuelve la separación entre dos conjuntos cartográficos independientes: un ancho de acera constante dejaba aparecer una banda de ortofotografía junto a la plaza. El área añadida, de 35,13 m², conserva ambos trazados fuente y sustrae la calzada y todos los obstáculos. La comprobación exige también cobertura completa de esta franja pública.

Cada cara de pavimento queda dentro de un triángulo de la cuadrícula de terreno de 2,5 m. Sus vértices se elevan sobre el terreno definitivo durante `bindGround`, sin explanación del barrio. Los bordillos se muestrean a intervalos máximos de 0,8 m. Los árboles propios de la plaza tienen una exclusión de vegetación específica para impedir que se superpongan árboles genéricos del atlas.

Las ventanas y cubiertas domésticas siguen el lenguaje de las visitas anteriores y son interpretativas. La medianera oeste recibe una excepción basada en fotografía: una banda de oclusión usada solo al decidir dónde generar ventanas suprime los huecos inventados. Esa banda nunca se dibuja, nunca se añade como edificio y nunca altera las exclusiones o la cartografía fuente.

## Interacción e integración

`createCircoContext()` devuelve el grupo, máscaras, identificadores de reemplazo, focos, plano, recursos y métodos de la misma API usada en Domus y Pòrtic. Añade `vegetationExclusions`, `detailBounds`, `contains`, `getElevation`, `focusBounds` y `plan.contextOutline`.

Los focos preparados son:

- `circo-acceso`: desde el espacio público de Remedio hacia el borde de la excavación y la plaza norte.
- `circo-entorno`: desde Huertos hacia el cruce y los frentes urbanos que encuadran la puerta.

Las dos posiciones de cámara y sus segmentos hacia el objetivo se comprueban contra todas las huellas catastrales. Los ojos de cámara se colocan a 2,15 m sobre el terreno muestreado. Ambas paradas recomiendan el modo Actual, sin tratarse como interiores subterráneos.

El módulo no oculta el barrio por su cuenta. En el modo Histórico, el controlador del atlas aplica la máscara del trazado del circo a la geometría contextual que realmente interfiere con esa reconstrucción. Al volver a Actual restaura el contexto. La lectura por épocas cambia materiales sin alterar las geometrías ni la propiedad de los recursos.

## Reproducción y comprobación

El generador `research/validation-v20/prepare_circo_context.py` usa únicamente los archivos de datos del repositorio y requiere Shapely 2.1 o posterior. Produce `dist/assets/data/circo-context.json` y `research/validation-v20/circo-context-geography-qa.json`.

La comprobación geográfica verifica:

- conservación exacta de todos los contornos y patios fuente;
- ausencia de intersección del caserío con el recinto arqueológico o edificios de contextos anteriores;
- ausencia de pavimento sobre edificios, patios privados, recinto y pavimento anterior;
- ausencia de caras duplicadas y cobertura completa de las superficies objetivo, con tolerancia de 0,001 m²;
- árboles dentro de la plaza fuente y troncos fuera de edificios;
- ojos y segmentos de las dos cámaras fuera de edificios.

El resultado contiene 2.289,11 m² de pavimento, 1.752 vértices y 2.755 triángulos. Los residuos geométricos derivados de redondear vértices a seis decimales son inferiores a la tolerancia. Las huellas y los ejes, aunque procedan de cartografía registrada, no convierten los detalles interpretativos de esta escena en un levantamiento arquitectónico.
