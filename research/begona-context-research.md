# Begoña y la Alameda — registro del entorno, V27

## Qué se modela

El nuevo contexto cubre la explanada ante la iglesia, el paseo longitudinal, el
área de juegos, el espacio abierto al sur del paseo, alineaciones de arbolado y
el frente de viviendas al otro lado de la avenida. La iglesia, Casa Abadía,
dependencias anexas y escalinata inmediata pertenecen a `begona.js`.

La ortofoto PNOA descargada para esta iteración está conservada en
`research/validation-v27/begona-context-orthophoto-reference.jpg`. Sus límites son
O −0.22225, E −0.21850, S 39.65710, N 39.65950; 1800 × 1488 píxeles. El servicio
es PNOA Máxima Actualidad, pero **no se ha verificado la fecha del vuelo**. No se
presenta como un levantamiento topográfico ni como inventario de estado actual.

La configuración del suelo se registra en píxeles reproducibles de la ortofoto.
Los bordes se convierten al mismo sistema métrico que el atlas. Cada superficie
se corta contra los triángulos de la malla de terreno de 5 m antes de dibujarse.
El levantamiento de 0,041 m evita solapamiento con el terreno sin crear una
plataforma horizontal ficticia.

El terreno conservado es el de IGN que ya utiliza el atlas. Se respetan las
huellas de Catastro y los ejes viarios previamente contrastados con OSM. Las
alturas del frente urbano reutilizan las estimaciones MDSnE/plantas existentes;
los ritmos de ventanas y pequeños detalles de fachada son interpretados.

## Propiedad de geometría y continuidad

- Se refinan 64 partes de edificio de 28 parcelas del frente urbano que antes
  pertenecían a la ciudad genérica. No coinciden con ningún identificador de
  edificio de los cinco contextos detallados anteriores.
- Se reutilizan 90 partes próximas de otros propietarios para plano y
  comprobación de copas, sin crear de nuevo su geometría.
- Todas las calles mantienen sus propietarios. No se agregan nuevos registros
  de calzada ni se cambia la exclusión de sus identificadores.
- Un único traspaso acotado mueve 3640,32 m² de suelo interior de la Alameda desde
  el contexto general del Museo Industrial a Begoña. Se retiran los diez árboles
  anteriores dentro de ese mismo ámbito y se recorta un bordillo. No se mueve
  ningún edificio, carretera, foco de visita, cimiento, farola o paso de peatones.
- El contexto de Gerencia, el Casino y Talleres conserva íntegra su propiedad.
  No se reproduce la embarcación ni la locomotora en una localización deducida
  erróneamente de la avenida.

El dominio inicial de nuevas superficies suma 9253,05 m²; el remate lateral
documentado al final de esta nota lo amplía a 9347,38 m². Los caminos, alcorques,
plantaciones y espacios de juego son regiones disjuntas. Se comprueba tanto la
cobertura del antiguo polígono de la plaza como la de todo suelo transferido.

### Corrección documental relevante

Los volúmenes catastrales `cat-8338802YJ3983N_part1-0` y
`cat-8338802YJ3983N_part2-0` ya se habían dejado sin extrusión en V24 porque la
ortofoto muestra terreno abierto. La primera revisión V27 detectó que conservar
estos polígonos como obstáculos cortaba erróneamente 614,59 m² del suelo
transferido. La preparación final respeta su condición de volúmenes retenidos
sólo como evidencia: no son edificios dibujados, obstáculos ni huecos de
pavimento. Tampoco se reconstruye la desaparecida escuela de 1911 como parte del
paisaje contemporáneo.

## Arbolado y mobiliario

Se registran 37 centros de copa visibles en la ortofoto, con formas visuales de
palmera y árbol de hoja ancha. No se afirma un inventario botánico ni una altura
medida. La envolvente completa de cada copa se limita para mantener una
separación mínima de 0,45 m respecto a edificios y escalinata. El tamaño
representado en el plano corresponde a esa misma envolvente.

Once bancos, siete luminarias y un pequeño conjunto de columpios completan la
lectura de escala. La ubicación y las medidas de estos elementos son una
interpretación de las imágenes, no un inventario de mobiliario de 2026. Los
materiales del paseo son grises, con juntas discretas; la zona de juegos conserva
la lectura de sus dos paños de color. El suelo abierto no se convierte en una
escuela ni en un jardín restaurado sin evidencia.

## Memorial obrero

Las fuentes de la Fundación del Patrimonio Industrial sitúan el memorial de
acero corten en el sector sureste de la Alameda e indican su inauguración el
17 de diciembre de 2017. El Ayuntamiento documenta la ampliación de sus placas
en julio de 2025. Se representa un conjunto esquemático de panel central,
placas laterales y plano inferior inclinado en ese sector. **La coordenada exacta,
las medidas y el calado son interpretativos.** No se generan nombres personales
ni inscripciones falsas.

La noticia municipal de marzo de 2026 anuncia dos esculturas futuras vinculadas
a la Escuela de Aprendices, con previsión para diciembre. No prueba su instalación
y esas piezas no aparecen como elementos existentes en la escena.

## Fuentes principales

1. IGN/CNIG, PNOA Máxima Actualidad, petición georreferenciada conservada en
   `begona-context.json`, consultada el 21 de noviembre de 2026.
   https://www.ign.es/wms-inspire/pnoa-ma
2. Dirección General del Catastro, INSPIRE edificios, municipio 46222. Datos ya
   conservados en el atlas con fecha de metadatos 21 de agosto de 2026.
   https://www.catastro.hacienda.gob.es/webinspire/index.html
3. Fundación del Patrimonio Industrial y Memoria Obrera, *Rutas por la memoria
   obrera*, 2023, «La Alameda», p. 52.
   https://www.relatsiberoamerica.com/documentos/Beneyto/2023Beneytocoord.Rutas2.pdf
4. Ayuntamiento de Sagunto, «El Consistorio incorpora nuevas placas en el
   monumento a las personas fallecidas en la Fábrica», 18 julio 2025.
   https://aytosagunto.es/es/actualidad/2025-07-18-el-consistorio-incorpora-nuevas-placas-en-el-monumento-a-las-personas-fallecidas-en-la-fabrica/
5. Ayuntamiento de Sagunto, homenaje y fotografía del memorial actualizado,
   12 agosto 2025.
   https://aytosagunto.es/es/actualidad/2025-08-12-acto-de-homenaje-a-las-personas-fallecidas-en-altos-hornos-del-mediterraneo-y-en-la-compania-minera-sierra-menera/
6. Ayuntamiento de Sagunto, licitación de esculturas de la Escuela de
   Aprendices, 13 marzo 2026.
   https://aytosagunto.es/es/actualidad/2026-03-13-sale-a-licitacion-la-construccion-de-dos-esculturas-que-evocan-la-formacion-profesional-de-la-antigua-fabrica-siderurgica/
7. Ayuntamiento, instalación de la embarcación Virgen de Begoña, 15 julio 2024,
   y traslado del trenillo, 11 diciembre 2025. Fotografías consultadas para evitar
   situarlos erróneamente en la plazoleta de la iglesia.
   https://aytosagunto.es/es/actualidad/el-ayuntamiento-de-sagunto-instala-la-embarcacion-virgen-de-begona-en-la-rotonda-de-la-calle-adolfo-suarez/
   https://aytosagunto.es/es/actualidad/2025-12-11-el-ayuntamiento-traslada-la-locomotora-de-el-trenillo-para-exponerla-en-la-avenida-adolfo-suarez-de-puerto-de-sagunto/

## Validación reproducible

`prepare_begona_context.py` produce los polígonos y diez comprobaciones de fuente,
cobertura y ausencia de solapes. `transfer_begona_alameda_ownership.py` produce un
candidato revisable y dieciocho comprobaciones; sólo `--apply` escribe el
contexto del museo. `validate_begona_context.mjs` ejecuta el módulo de producción,
reconstruye el terreno, comprueba geometría, copas, cámaras, lectura temática,
registro de cinco paradas y liberación de recursos.

Tras aplicar esa transferencia, `refine_begona_sidewalk.py` completa únicamente
la franja pavimentada observada junto al costado noreste del templo, hacia
9 d'Octubre. Antes quedaba visible allí el terreno con ortofoto: la banda de
aproximadamente 2,55 m ya existía entre la parcela y el pavimento del viario.
El nuevo paño añade **94,34 m²** de acabado pétreo neutro, con límites derivados
de Catastro y de las superficies viarias conservadas. El acabado es una
interpretación; no se afirma una medición del pavimento ni una fecha de vuelo
comprobada. El total final de suelo del contexto es **9.347,38 m²**.

Este refinamiento no cambia la máscara ni la evidencia de la transferencia,
ningún archivo de los contextos anteriores, las carreteras, los edificios ni
los 37 árboles. Su comprobación conserva los diez criterios de fuente y añade
cinco controles de acotación, permanencia y ausencia de solapes. El resultado
queda en `begona-sidewalk-refinement-qa.json`, y la validación de producción
mantiene sus 43 comprobaciones. El script es idempotente y se ejecuta al final
de una regeneración completa del contexto, **sin repetir la transferencia ya
aplicada**.

Estas comprobaciones y las imágenes de CPU del proyecto verifican la estructura
y la composición. No equivalen a una medición del rendimiento WebGL en un
navegador real.
