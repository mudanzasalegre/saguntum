# Identificación de las marcas de la captura · v55

La correspondencia se ha comprobado con la cartografía de la aplicación, los
buffers reales exportados de v54 y un ajuste manual de cámara con siete puntos
de control. El error cuadrático del ajuste es aproximadamente 4 píxeles. Esta
operación permite identificar las piezas señaladas; no aporta cotas medidas ni
una restitución histórica por sí misma.

Captura de referencia: `Image2066.png`, aportada por el usuario.
Registro: `screenshot-registration.json`.
Cotejo de la muralla exterior: `screenshot-source-overlay.png` y
`screenshot-source-projection.json`.

| Marca | Pieza del modelo v54 | Fuente horizontal | Defecto que debe resolver v55 |
|---|---|---|---|
| Rojo izquierdo | `battery-e` | OSM `733215268` | El constructor cierra el perímetro hasta una sola cota y coloca un piso sobre toda la huella. Produce un bloque macizo y oculta la lectura de crujía abierta y fábrica conservada. |
| Rojo derecho/frontal | `battery-n` | OSM `733215265` | Mismo esquema de plataforma cerrada. La escalera, las distintas alturas, los accesos y las estancias no se corresponden con esa simplificación. |
| Azul superior | `ruin-733215260` | OSM `733215260`, centro aproximado `[-0.27590725,39.676046]` | El recinto se construye como un anillo de muros genérico. Su organización y conservación necesitan cotejo con fotografías. |
| Azul inferior | `ruin-733215261` y `ruin-733215262` | OSM `733215261`, `733215262` | La geometría de ruina genérica no expresa el carácter de las dos estructuras. La identificación tipológica corresponde al contraste documental de v55. |
| Lima | `north-round-projection` | Proyección norte del contorno OSM `1199456161` | Semicírculo de radio fijo y eje fijo; se suprimen segmentos próximos del perímetro sin construir los retornos de unión. La torre queda visualmente separada de la cortina. |
| Naranja | Edificio genérico `1419384279` | OSM, nombre `Niu d'ametralladores`, tipo `bunker` | Al no tener altura, `city.js` aplica la altura de vivienda aleatoria y añade azotea/cornisa. El resultado es el monolito de la captura. |
| Amarillo | Ladera oriental y restos de muralla | OSM `1419384286`, `523549298` y continuación `1419384303` | El terreno y los caminos no bastan para representar la fábrica conservada. Debe modelarse la muralla en su trazado real y mantener los huecos actuales. |

## Comprobación del monolito naranja

El volumen de v54 aparece en los buffers de `Fachadas`, `Azoteas` y `Cornisas`
de `createCity`. Sus fachadas se extienden aproximadamente entre `y=121,01` y
`132,34 m` en las coordenadas de la escena, con azotea en `132,42 m` y cornisa
hasta `132,74 m`. La huella ocupa `x=266,56–269,59` y `z=230,63–234,04 m`.
Su centro de cubierta proyecta a unos 4 píxeles del centro marcado en naranja.
La altura no constituye información documental del puesto defensivo: procede
del valor genérico aplicado a un edificio sin etiqueta de altura.

La corrección acordada usa el mecanismo compartido `castleBuildingIds`: añadir
`1419384279` a los IDs reclamados por el castillo lo excluye tanto de `createCity`
en el Atlas como de las teselas de edificios del Simulador mediante `claims`.
No se añade a `MAPPED_BUILDINGS`, lo que evitará otro volumen genérico dentro
del propio constructor del castillo. La comprobación final debe verificar los
dos constructores y el contexto del exportador CPU.

## Correspondencia de la marca amarilla

El lienzo `1419384286` se proyecta sobre la cabecera de la marca amarilla,
justo bajo el baluarte. La muralla `523549298` desciende por el flanco izquierdo
de la marca y continúa fuera de su extremo inferior. `1419384303` es su
continuación cartografiada más abajo. Los IDs `1419384285`, `1419384288`,
`1419384294`, `1419384295` y `1419384296` son **caminos**, no murallas.

La superposición usa MDT + 0,8 m para hacer visible la línea: esa separación
es exclusivamente gráfica. No se traslada a la altura constructiva del modelo.
Las aperturas `1419384287` y `1419384304` deben permanecer abiertas en el
modelo y en el plano. No se supone un andador visitable a lo largo de toda la
coronación.

## Alcance de las comprobaciones finales

Se mantienen las 22 paradas existentes y su orden. La revisión v55 debe
verificar los nuevos volúmenes, la unión torre/cortina, los huecos de la
muralla, la supresión del edificio genérico, la continuidad de los recorridos
del patio y del paso de Almenara, y la igualdad de la geometría registrada en
Atlas y Simulador. Las vistas CPU usarán el mismo ángulo aproximado de la
captura y acercamientos a cada uno de sus cinco colores, además de las
cámaras de visita que se modifiquen. Los resultados de v54 siguen siendo
históricos y no se presentarán como validación de v55.
