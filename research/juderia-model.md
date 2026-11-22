# Judería y Portalet de la Sang · modelo V11

## Criterio de representación

Esta ampliación modela los exteriores conservados del barrio histórico. La geometría no pretende fijar una escena medieval completa: las fachadas domésticas actuales acumulan transformaciones y el permiso de cierre de la judería de 1321 no fecha todas las piedras visibles del portal. Los elementos antiguos y las intervenciones contemporáneas se distinguen en la lectura por capas.

El punto principal es el Portalet de la Sang, paso entre Carrer del Castell y Sang Vella, OSM way 733421700. Se diferencia expresamente del arco apuntado frente al Museo Histórico (way 1303697035) y del portillo meridional (way 733421698). El texto municipal del proyecto Xiuxiueig identifica el Portalet de la Sang como el acceso auténtico conservado; los otros dos arcos se representan como elementos actuales sin adjudicarles automáticamente esa misma autenticidad.

## Evidencia visual y territorial

- Ayuntamiento de Sagunto, señalización del conjunto patrimonial judío, 8 de septiembre de 2020: fotografía frontal del Portalet, jambas, dovelas, revoco, cerámicas y umbral. https://aytosagunto.es/es/actualidad/el-conjunto-patrimonial-judio-de-sagunto-ya-cuenta-con-la-senalizacion-de-la-red-de-juderias-de-espana/
- Rutas Jaume I, «Judería de Sagunto»: fotografías 01, 03, 04, 05, 07 y 09. La foto 04 documenta el arco apuntado de la Placeta de la Jueria; 01, 07, 09 muestran el Portalet y las fachadas contiguas. https://www.rutasjaumei.com/es/que-ver/218/-juderia-de-sagunto.php
- Ayuntamiento, proyecto Xiuxiueig, «Barri de la Jueria»: distinción entre accesos y recorrido urbano. https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/barri-de-la-jueria/
- Catastro INSPIRE Buildings y OpenStreetMap, capas ya adquiridas para el atlas y enlazadas en juderia-context.json.
- IGN MDSnE2.5 para estimaciones de altura por cuerpo, con número de plantas cuando no hay una estimación útil.

Las fotografías se consultaron para investigación. No se incorporan como texturas ni como galería a la aplicación. Su fecha no acredita el estado de la pintura o de cada señal en noviembre de 2026.

## Arquitectura

### Portalet

La envolvente se ajusta a la huella OSM: 4,36 m de extensión y unos 0,71 m de espesor proyectado. El hueco de medio punto se construye con una apertura real en la malla, no con una superficie oscura. Se diferencian el revoco encalado, el anillo de piedra, las dovelas individualizadas, las hiladas de las jambas y los esquinados, la coronación estrecha y el drenaje metálico del umbral. El alzado de 4,03 m y el hueco de 2,48 × 3,55 m son estimaciones visuales, no mediciones in situ.

El muro blanco se enlaza con las casas vecinas; no se añade un frontón, almenas, torre o cubierta monumental. Las pequeñas placas se tratan como elementos contemporáneos. La placa de calle reproduce únicamente el texto legible «PORTALET / DE LA / SANG». La cerámica geométrica inferior utiliza el patrón triangular visible; el panel superior se representa de forma esquemática sin inscripciones inventadas. No se añade una mezuzá a ninguna vivienda sin identificación segura.

### Calles y viviendas

El núcleo utiliza 12 parcelas catastrales, conservando sus 40 cuerpos y sus alturas diferenciadas. Las huellas no se sustituyen por bloques rectangulares ni por una única altura por parcela. Los huecos de las fachadas expuestas, carpinterías, persianas, rejas, balcones, zócalos y evacuación de aguas son una interpretación de la arquitectura doméstica observada; no se presentan como un inventario medido de cada casa.

Los tejados se triangulan sobre las plantas reales, incluidas sus concavidades. Cada triángulo se corta por la cumbrera y cada hastial también se divide allí, de forma que el cierre vertical alcanza la cubierta. Los patios conservan sus huecos. Las partes pequeñas o de cubierta clara se representan con terraza; las cubiertas inclinadas llevan canales de teja y aleros.

El contexto cartográfico independiente conserva las edificaciones de Santa María, Plaça Major, Casa dels Berenguer, Museo Histórico y Ermita de la Sangre. No se reconstruye el interior hipotético de la sinagoga, del posible baño ritual o de viviendas particulares. La parada sobre las casas explica la discrepancia de numeración 32/38 de la supuesta huella de mezuzá, sin resolverla mediante una asignación ficticia.

## Visita y comprobación

El módulo aporta siete focos: conjunto, Portalet, dovelas, Sang Vella, casas, arco frente al museo y portillo hacia el castillo. El contexto aporta los otros nueve. Las coordenadas se exportan al plano de la aplicación, y el controlador utiliza los mismos destinos en sus vistas de conjunto y detalle.

El verificador trabaja con las mallas Three.js y el terreno final: atributos finitos, pasos realmente abiertos, cubierta de cada cuerpo, cierre horizontal de hastiales y líneas de cámara en tres proporciones de pantalla. Las pruebas no desplazan edificios para despejar una vista. La selección y lectura por capas deben restaurar los colores y texturas originales; los recursos pertenecen a cada instancia y al ciclo de descarga regional del atlas.

Los renders de inspección se generan con Blender Cycles CPU a partir de la exportación de las mismas mallas. Sirven para revisar la geometría y el entorno. No son capturas WebGL ni una medida de rendimiento GPU; las texturas procedurales y la respuesta de luz pueden diferir del navegador.

## Resultados del núcleo

La validación específica pasa 619 comprobaciones. Incluye 96 variantes de cámara, 27 rayos por los tres pasos abiertos, 1.518 muestras verticales de las 40 cubiertas, 150 rayos horizontales de cierre de hastiales, nueve rayos que comprueban la continuidad del paño bajo la coronación de los arcos y nueve sondeos verticales del pavimento bajo el Portalet. Los controles de relieve y pavimento se registran aparte con el contexto, porque un rayo de distancia al suelo no basta por sí solo para garantizar continuidad entre triángulos adyacentes.

El núcleo utiliza 386 mallas y 142.196 triángulos. Las 40 envolventes domésticas tienen alzados interpretativos, no se presentan como 40 fachadas medidas o documentadas individualmente.

## Continuidad de Sang Vella

La inspección CPU reveló crestas triangulares en el pavimento que las pruebas de encuadre no detectaban. La causa eran los parches horizontales de cimentación de las 40 casas: al recortar las celdas de terreno de 2,5 m, invadían las calles estrechas. La comparación a intervalos de 0,25 m confirmó depresiones de hasta 1,361 m; retirando esos parches la desviación máxima respecto al MDT quedó en 6,7 cm. Se conservan las huellas, alturas, paredes y exclusiones de edificios, y los interiores cerrados no necesitan un suelo de visita horizontal. El pavimento del contexto utiliza ahora una misma cota sobre el terreno para todos sus vértices, sin elevaciones independientes por triángulo. Esta corrección no aplana el barrio ni elimina su pendiente.

Una segunda revisión visual aisló huecos en la cobertura de las calles. Las tiras de pavimento de segmentos consecutivos terminaban con normales diferentes en los cambios de dirección, dejando cuñas abiertas. El trazado en planta y el raycast de píxeles de los renders confirmaron que aquellas cuñas mostraban el terreno sin pavimento; no procedían de los suelos domésticos ni de la exportación a Blender. La unión poligonal de los tramos cierra esas cuñas, con caras ajustadas a los triángulos del terreno. En el tramo principal de Sang Vella también se completa la franja entre el ancho aproximado de la calle y las fachadas, sin invadir patios ni desplazar los edificios. Esta comprobación de cobertura es distinta de la prueba de altura de los vértices y se registra en la validación del contexto.

El umbral del Portalet requirió una comprobación separada: el hueco de una extrusión cerrada dejaba una cara plana bajo el arco, coincidente con la base del anillo de piedra. Esa superposición producía una mancha triangular negra. El contorno se construye ahora como una U abierta por abajo, tanto en el muro como en el anillo; los nueve sondeos ven el pavimento continuo a 10,5 cm sobre el terreno final. La rejilla sigue esa pendiente y no introduce un escalón horizontal.

## Renders finales

Se inspeccionaron tres renders de las mallas exportadas —conjunto del barrio, Portalet y Sang Vella— a 1.440 × 1.080 píxeles y 64 muestras CPU. La revisión final confirma el cierre de coronación, cubiertas y hastiales, el paso abierto hasta el suelo y la continuidad del pavimento en los puntos corregidos. `validation-v11/juderia-visual-review.json` conserva las cámaras, hashes de código/datos, exportación y PNG, junto con los límites de esta inspección.

Los PNG no reproducen todas las texturas Canvas del navegador: por ejemplo, la placa del Portalet lleva su texto en la aplicación pero aparece sin letras en el render de inspección. La vista de conjunto exporta los vecinos dentro de 220 m; la escena regional de la aplicación es más extensa.
