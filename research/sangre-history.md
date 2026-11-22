# Ermita de la Sangre, plaza de Sang Nova y entorno

Investigación de V15 para **SAGUNTUM · Atlas vivo**. Revisión documental: **20 de noviembre de 2026**. El contenido de la visita se mantiene en `dist/assets/data/sangre-visit.json`: **16 paradas, 5 ámbitos, 39 hechos vinculados a fuentes, 22 referencias y 17 hitos cronológicos**.

## Alcance

La visita profundiza en un edificio, su espacio público inmediato y la relación con el barrio. El título y la identidad general siguen siendo **SAGUNTUM · Sagunto y Puerto de Sagunto**. Las fuentes permiten explicar el conjunto y orientar un modelo con secciones; las dimensiones no comprobadas permanecen aproximadas.

La escena representa el edificio documentado, con referencias de distintas fechas contrastadas entre sí. No se fija ficticiamente todo el conjunto en 1607 ni se convierten objetos contemporáneos en elementos originales. Las imágenes históricas se consultan para investigación, sin incorporar una galería a la aplicación.

## Evidencia que cambia la representación

### Planos publicados

El volumen [Setmana Santa Saguntina 2001](https://semanasantasagunto.com/wp-content/libros/llibre_2001_opt.pdf) contiene dos apoyos complementarios: el trabajo de Francisco J. Ribelles Villar y equipo, con **planta, cubiertas, cortes y alzados en las páginas impresas 166–170**, y el estudio de Valentín Cabrera Fombuena, páginas 175–190. Los números del visor PDF están desplazados una página: PDF 165 corresponde a la impresa 166.

Estas láminas permiten contrastar la forma espacial del modelo. No acreditan por sí mismas la conservación actual de un revestimiento o la distribución de mobiliario.

### Estado posterior a la restauración de 2024

El estudio [La clau de la Sang, Ignasi Corresa, 2025](https://www.academia.edu/129476628/La_clau_de_la_Sang) documenta la actuación de Conservart SL en 2024. Explica el tratamiento de humedades, los grises recuperados y la nueva clave de la cúpula. Describe también la retirada de la antigua cadena y cambios en los nichos del crucero. La lectura digital toma ese estado como referencia para los acabados, con simplificación ornamental.

La [fotografía original de Icorresa del 26 de septiembre de 2024](https://commons.wikimedia.org/wiki/File:Detall_de_la_clau_de_la_c%C3%BApula_de_l%27ermita_de_la_Sang_de_Sagunt.jpg), inspeccionada a resolución completa, corrobora visualmente el remate. Muestra un casquete claro, cartelas radiales, un centro lobulado con ornamentación dorada y el motivo del cáliz. No aparece una lámpara suspendida. La ficha acredita autoría y fecha; su licencia es CC BY-SA 4.0. Se utiliza sólo como referencia, no como textura.

Las [fotografías municipales de diciembre de 2023](https://aytosagunto.es/es/actualidad/finaliza-la-adecuacion-de-la-iluminacion-y-sonido-del-interior-de-la-ermita-de-la-sang/) son útiles para comprender el espacio y la iluminación, pero preceden a esa restauración.

## Formulaciones y límites

| Cuestión | Tratamiento acordado | Fuente de contraste |
|---|---|---|
| Construcción y uso | Diferenciar las fechas del edificio, su consagración y sus bienes. | Cofradía: [edificio](https://semanasantasagunto.com/ermita-de-la-sangre/) e [historia](https://semanasantasagunto.com/historia/). |
| Antigua sinagoga | Mantener cautela sobre su identificación; no situarla bajo la ermita actual. | Cabrera, 2001, p.175; descripción municipal Xiuxiueig. |
| Portalet de la Sang | Es otro lugar del atlas, con su propia visita. | Registro separado de monumentos y cartografía del proyecto. |
| Pinturas históricas | Conservar el carácter de atribución; no resolver la autoría mediante el modelo. | Ficha de la Cofradía. |
| Bóveda y cúpula | Distinguir la pintura de cabecera de la clave del crucero. | Cofradía; Corresa, 2025. |
| Vera Cruz y Cristo | No confundir la cruz procesional con el crucificado de la capilla. | [Ficha de la Vera Cruz](https://semanasantasagunto.com/santisima-vera-cruz/) y ficha del edificio. |
| Santo Cáliz | Presentar la pieza custodiada como reproducción. | [Cofradía, Ruta del Grial](https://semanasantasagunto.com/ruta-grial/). |
| Museo y sacristía | Mostrar sus volúmenes; reconocer que el inventario y su colocación pueden cambiar. | [Museo](https://semanasantasagunto.com/museo-de-la-sangre/), planos y balance institucional de 2021. |
| Acceso | Todos los desplazamientos son virtuales. No se publica una promesa de apertura física. | Decisión de producto. |

No se añade un coro, cripta, túnel o estructura arqueológica basándose solamente en una tipología habitual de iglesias. Las superficies pintadas son indicativas y no se presentan como copias de frescos. Las figuras y vitrinas del modelo deben conservar su carácter esquemático.

## Plaza, terreno y casas

La [ficha de la Ruta del Grial de Turisme](https://www.activo.comunitatvalenciana.com/ruta-del-grial/recursos/ermita-de-la-sang) sitúa la pequeña plaza en Sang Nova, junto al recorrido hacia la calle del Castillo. Se registra el vacío entre las huellas de los edificios y su enlace con las calles; no se impone una plaza rectangular idealizada.

La cartografía utiliza las huellas y cuerpos catastrales, el callejero OSM y el relieve oficial ya presente en el atlas. Las fachadas contiguas, los balcones, canalones, texturas y pavimentos son aproximaciones visuales. La resolución de los modelos de terreno no convierte un peldaño o un umbral en una medición exacta.

El [estudio de Corresa de 2012](https://www.academia.edu/108823233/Lermita_de_la_Sang_de_Sagunt_temple_i_Monument_alhora) relaciona la arquitectura con la roca aflorante y distingue la fábrica revocada de las piezas de piedra. Este contraste orienta el tratamiento material sin sustituir un estudio constructivo del estado actual.

El contexto inmediato se documenta en `dist/assets/data/sangre-context.json` y en el informe cartográfico de V15. Los focos de plaza y entorno se comparten entre ese modelo y el cuaderno.

## Recorrido estable

| Orden | Identificador | Ámbito | Lectura principal |
|---:|---|---|---|
| 1 | `sangre-conjunto` | Llegada | Relación de volúmenes |
| 2 | `sangre-plaza` | Llegada | Espacio público |
| 3 | `sangre-escalinata` | Llegada | Desnivel y acceso |
| 4 | `sangre-portada` | Fachada | Materiales y composición |
| 5 | `sangre-espadana` | Fachada | Remate y campana |
| 6 | `sangre-nave` | Interior | Eje y bóveda |
| 7 | `sangre-capillas` | Interior | Devoción lateral |
| 8 | `sangre-crucero` | Interior | Estructura y anexos |
| 9 | `sangre-cupula` | Arte | Forma y clave |
| 10 | `sangre-pechinas` | Arte | Pintura y atribución |
| 11 | `sangre-presbiterio` | Arte | Cabecera y etapas |
| 12 | `sangre-veracruz` | Arte | Diferenciar piezas |
| 13 | `sangre-sacristia` | Memoria | Dependencias de servicio |
| 14 | `sangre-museo` | Memoria | Patrimonio reunido |
| 15 | `sangre-conservacion` | Memoria | Intervenciones recientes |
| 16 | `sangre-entorno` | Llegada | Barrio e identidades |

Las cinco capas son `exterior`, `architecture`, `art`, `memory` y `context`. Son categorías temáticas; no asignan una datación común a todo lo coloreado. Las coordenadas son focos interpretativos, con confianza `approximate` y registro compartido con el modelo.

## Verificación documental

Cada hecho y cada hito resuelven a una fuente del mismo archivo. Se revisan la singularidad de identificadores, los enlaces HTTP(S), la pertenencia a ámbitos y capas, los límites de coordenadas y la separación del progreso de esta visita respecto a las anteriores. La validación del controlador utiliza un adaptador DOM mínimo; la cámara, WebGL, composición y uso real se comprueban en la revisión visual de integración.

Los resúmenes son breves y se distribuyen entre fuentes independientes. La aplicación enlaza las páginas originales para ampliar cada tema; no reproduce capítulos ni imágenes del libro. El informe automático se guarda en `research/validation-v15/sangre-visit-results.json`.

