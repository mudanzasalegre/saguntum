# Necrópolis judía e hipogeos — versión 3

> Documento histórico de la versión 3. La implementación activa se sustituyó en V21 por `dist/js/necropolis.js` y su contexto. Véanse [historia y fuentes actualizadas](necropolis-history.md), [entorno](necropolis-context.md) y [verificación V21](validation-v21/README.md). Las cifras y mecanismos descritos abajo corresponden a la versión anterior.

## Alcance y localización

Se representan dos focos independientes. El cementerio visitable se ancla en el polígono OSM `way/203325111` (centro −0.27941510, 39.67643805). Los hipogeos utilizan el punto de visita de [GeoSefarad](https://europeanjewishquarters.wordpress.com/2022/01/19/geolocalizacion-de-cementerios-judios-de-sagunto-sagunto-jewish-quarters-geosefarad/) (−0.2771781, 39.6766811). No hay una excavación continua entre ambos lugares; están separados aproximadamente 194 metros. El segundo punto no localiza con precisión las paredes subterráneas.

La referencia geográfica del cementerio identifica el sector conocido. Las 12 sepulturas representadas forman una muestra tipológica, no un inventario de tumbas excavadas. Las tres cavidades modeladas tampoco reproducen un levantamiento individual. Dimensiones, espesores y disposición son interpretativos; esa limitación se entrega en los datos y en la interfaz del foco.

## Base documental

- [Hinojosa Montalvo, 2008, p. 29](https://revistes.ua.es/medieval/article/view/2008-n15-los-judios-en-el-reino-de-valencia-testigos-de-una-hist), DOI `10.14198/medieval.2006-2008.15.01`. Síntesis de las intervenciones de Matías Calvo. Sirve para la morfología de las sepulturas y la secuencia de dos niveles, no para sus coordenadas individuales. La fase histórica seleccionada corresponde al nivel de los siglos XIV–XV.
- [Civera i Gómez, ARSE 37, 2003](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/09/409_06_la_juderia_de_morvedre.pdf), pp. 67 y 90: relación topográfica con la judería y el castillo, y estado inicial del estudio. Sus propuestas deben entenderse en su fecha de publicación y no sustituir a excavaciones posteriores.
- [Ayuntamiento de Sagunto, itinerario de la judería](https://www.sagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/barri-de-la-jueria/): distingue la zona de cavidades de la subida y el cementerio del acceso al castillo. La atribución de las cavidades se formula siguiendo al investigador Civera.
- [Ayuntamiento de Sagunto, jornadas de 2017](https://aytosagunto.es/es/actualidad/el-arqueologo-josep-vicent-lerma-imparte-una-conferencia-sobre-la-cultura-judia-en-sagunto/): contextualiza el espacio visitable y su cronología medieval.
- [Red de Juderías, guía de Sagunto](https://caminosdesefarad.com/wp-content/uploads/2023/05/Sagunto-Portugues.pdf), pp. 30–31: referencia pública del itinerario y tipos de enterramiento. No se extrapola la recreación local a las hectáreas de la necrópolis.
- [Estudio UPV, «Visita al casco histórico artístico de la ciudad antigua de Sagunto»](https://riunet.upv.es/server/api/core/bitstreams/0605b555-9fb5-410d-9fe7-096d2c8677e4/content), pp. 22–23 y 65: reúne descripciones y reproduce una fotografía municipal de las entradas rupestres y otra del sector de losas. La documentación advierte que las ampliaciones y hornacinas no pueden adscribirse automáticamente a un único uso. No se han redistribuido fotografías ni usado como texturas.

El expediente `Proyecto Salomón` y el capítulo de Calvo en *De Murbiter a Morvedre* figuran en la bibliografía consultada, pero no se obtuvo su planimetría completa. Por ello no se atribuye precisión de excavación a la geometría interna.

## Decisiones de modelado

Materiales y geometrías separan la lectura de fosas, losas, rellenos y roca. Los huecos son cavidades reales; un raycast confirma que las entradas no son superficies negras superpuestas y que al retirar el techo se alcanza el suelo interior. Texturas de roca y tierra son procedurales.

La vista histórica del cementerio es autosuficiente y retira el acondicionamiento moderno. La contemporaneidad de los hipogeos no está demostrada; su restitución sólo ejemplifica un posible uso. Un cierre sencillo se conserva en el grupo explícito de hipótesis. No se inventan nombres, inscripciones, signos religiosos antiguos ni mausoleos completos. No se incluyen restos humanos.

Los paños de roca y tierra visibles por el corte son recursos de lectura. Sus espesores no se presentan como sección geológica medida. El relieve local procede del muestreador IGN existente; la superficie detallada se subdivide para seguirlo y se acomoda alrededor de las tumbas.

## Integración y comprobaciones

`createNecropolisArchaeology({heightAt, project, records})` devuelve un sitio con grupos globales `remains`, `reconstruction`, `hypotheses` y dos `focuses`. Cada foco tiene sus subgrupos, `point`, `views`, `cut` y `cutObjects`. Las cubiertas tienen materiales clonados para que su animación de opacidad no afecte a paredes ni suelos. `reconstruction` e `hypotheses` globales comienzan ocultos.

- Cementerio: corte 25 × 17 m, suelo mínimo de visualización aproximadamente 106,84 m.
- Hipogeos: corte 15,8 × 12,4 m, suelo mínimo aproximadamente 93,61 m.
- Por foco actual: 8 y 7 meshes respectivamente; por foco histórico: 7 y 6, más un mesh si se muestran hipótesis.
- Script de comprobación: `research/qa-necropolis.mjs`.
- Render CPU de geometría exportada: `research/qa-necropolis-render.py`. Es una inspección de la malla con iluminación de Blender, no una captura de WebGL ni un material idéntico al navegador.

La verificación final cubre coordenadas finitas, triángulos no degenerados, independencia de materiales y aberturas auténticas. Los seis renders comprueban cada foco actual cerrado, actual abierto e histórico cerrado.
