# Puerta de Almenara · revisión de v51

## Qué se ha comprobado visualmente

Se han leído las imágenes, no sólo sus pies: la postal digitalizada BIVALDI JH 4/388; la fotografía del dossier de SERANCO, p.43; las dos caras del acceso en el reportaje Ricsol (`sagunto-19.jpg`, frontal; `sagunto-20.jpg`, posterior); las fotografías municipales de obras de septiembre de 2017; y la figura 10 de FORTMED 2020.

El cambio central es separar el frontis occidental alto del cuerpo bajo abovedado. El frontis tiene un arco apuntado y dos óculos con tres lóbulos. La cámara posterior tiene un arco rebajado más pequeño, tres estrechas aberturas verticales encima y hojas de madera. El reverso muestra la terraza de este cuerpo bajo y una escalera lateral de fábrica. La versión v50 extruía el frontis y sus dos óculos 6,4 m, convirtiéndolos en túneles uniformes; eso no coincide con las fotografías.

### Rasgos trasladados al modelo

| Rasgo | Evidencia y tratamiento |
|---|---|
| Arco exterior apuntado | Se conserva la silueta observada y se añaden dovelas de ladrillo independientes. |
| Dos óculos trilobulados | Huecos reales en una pantalla independiente, con aro exterior de piedra claro. No se perfora el cuerpo entero. |
| Bóveda detrás de la portada | Superficies propias de intradós/extradós, con salida abierta. |
| Arco interior rebajado | Segunda pieza, más baja; jambas de anchuras diferentes y ligero desplazamiento del eje. |
| Tres aberturas verticales | Tres huecos reales sobre el arco interior; visibles también en la postal. |
| Bases ataludadas | Se modelan ambos lados, con alturas y reparaciones distintas. |
| Coronación irregular | Perfil roto de fábrica; se evita una batería de almenas regulares inventadas. |
| Madera | Tablas verticales, travesaños y clavos; hojas abiertas para conservar el paso. Su ángulo exacto es una decisión de visualización. |
| Reverso | Cuerpo bajo, espacio abierto tras el frontis alto y escalera lateral de fábrica. |
| Materiales | Mampostería menuda con mortero, ladrillo, sillares localizados, restos discretos de revoco, madera y metal. |

## Qué NO es una medición documental

La planta se mantiene anclada a la intersección del muro y el paso cartográficos del proyecto. Ninguna de las dimensiones arquitectónicas nuevas se presenta como levantamiento métrico. Se retienen las dimensiones visuales de partida: ancho de entrada 3,15 m, altura de clave 5,2 m, profundidad 6,4 m, ancho del frontis 9,6 m y altura máxima aproximada 8,9 m. La pantalla de 0,78 m, arco interior de 2,72 × 3,25 m, escalera, jambas, huecos y diferencias de cota son estimaciones de modelado para aproximar las fotografías y permitir una circulación estable.

El perfil nuevo del suelo, incluido el desnivel frontal-posterior de aproximadamente 0,55 m, lo suministra `castle.js` mediante `g.floorAt(u,v)`. Es una corrección interpretativa de la malla del terreno, no una cota arqueológica publicada. La madera no usa la malla fotogramétrica de FORTMED: sólo se han consultado su ortoimagen y dibujo publicados.

## Cronología y cautelas de lectura

La postal de la Biblioteca Valenciana es **sin fecha**. No debe rotularse 1900, 1908 u otro año sin dato adicional. Su inscripción «Puerta de Almenara» y el estado antiguo de las hojas no se copian automáticamente como estado actual.

El reportaje Ricsol se publicó el 6 de marzo de 2022, pero no fecha individualmente cada toma. Es una referencia visual de ambas caras, no prueba de que cada fotografía sea de 2022. Sus descripciones tipológicas genéricas no se usan para decidir el perfil del arco.

Las comunicaciones municipales de 2017 documentan pérdida de material en la clave y la consolidación de arco, bóveda, óculos y fachadas. El modelo no reproduce deliberadamente el estado de riesgo previo como si fuera el actual. Las fotos del dossier de SERANCO complementan las imágenes de las obras.

La crónica ARSE 53, pp.194–195, recoge que las obras permitieron interpretar un ensanche y descentramiento efectuados durante la ocupación francesa para la artillería. Es una reseña que remite a prensa y comunicaciones municipales, no una memoria arqueológica de excavación. En el modelo la asimetría se apoya sobre todo en su presencia visible; no se reconstruye una supuesta puerta medieval íntegra.

## Fuentes y enlaces

1. **Biblioteca Valenciana Digital, registro JH 4/388**, *Puerta de Almenara: Sagunto*, editor L. Crumière, Alrededores de Valencia n.º27, s.a., postal 14 × 9 cm. Dominio público. [Registro](https://bivaldi.gva.es/es/consulta/registro.cmd?id=9135) · [Objeto digital](https://bivaldi.gva.es/es/catalogo_imagenes/grupo.do?path=1015689) · [Imagen consultada](https://bivaldi.gva.es/es/catalogo_imagenes/imagen_id.do?formato=jpg&idImagen=10790382&registrardownload=0).
2. **Sánchez Corrochano, Martínez Sierra, Greco y Besana**, FORTMED 2020, DOI [10.4995/FORTMED2020.2020.11387](https://doi.org/10.4995/FORTMED2020.2020.11387), pp.455–462. [PDF UPV](https://riunet.upv.es/server/api/core/bitstreams/be75bcef-e0c5-40b7-a0ee-07a2003e9627/content). La fig.10 de p.461 es de los elementos de madera de la puerta, no un plano métrico del frontis.
3. **Ayuntamiento de Sagunto**, 13 septiembre 2017: [Las obras de la Puerta de Almenara están finalizando](https://aytosagunto.es/es/actualidad/las-obras-de-la-puerta-de-almenara-estan-finalizando/). Fotografías consultadas.
4. **Ayuntamiento de Sagunto**, 24 octubre 2017: [Visitas al proceso de restauración](https://aytosagunto.es/es/actualidad/el-ministerio-organiza-visitas-gratuitas-al-castillo-de-sagunto-para-explicar-su-proceso-de-restauracion/). Consolidación de arco, bóveda, óculos y grietas con técnicas compatibles.
5. **Ayuntamiento de Sagunto**, 11 mayo 2017: [Obras de emergencia](https://aytosagunto.es/es/actualidad/el-ministerio-de-cultura-destina-casi-un-millon-de-euros-a-obras-de-emergencia-en-el-castillo-de-sagunto/).
6. **Pablo Perales Cabrejas**, ARSE 53, reseñas de 2019, pp.194–195: [PDF del Centro Arqueológico Saguntino](https://centroarqueologicosaguntino.es/wp-content/uploads/2021/03/art.pablo_perales-1.pdf).
7. **Castillos Ricsol**, reportaje publicado 6 marzo 2022: [Castillo de Sagunto](https://castillosricsol.es/castillo-de-sagunto/). [Cara occidental](https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-19.jpg) · [Cara oriental](https://castillosricsol.es/wp-content/uploads/2022/03/sagunto-20.jpg). Fecha individual de las fotografías desconocida.
8. **SERANCO**, [dossier de restauraciones 2019](https://seranco.es/wp-content/uploads/2019/07/Dossier-SERANCO-2019.pdf), p.43. Se ha inspeccionado su fotografía, que muestra el frente apuntado, los dos óculos y la coronación irregular. El borde inferior de la fotografía recorta el terreno: permite contrastar proporciones generales, pero no deducir una altura o cota exacta.

No se han incorporado fotografías ajenas como texturas. Las texturas y geometría siguen siendo procedurales.

## Contrato de control geométrico

`qa.almenara` y `qa.portals[]` incluyen un origen en suelo, centro del frontis, su grosor real, línea transitable con cota de suelo, ancho libre, dos centros de óculo con normal y grosor, y tres centros de abertura estrecha con ancho y altura. El auditor puede comprobar los huecos con rayos reales, la altura libre para una persona y el encuentro con terreno; no basta comprobar que la metadata diga «opening: true».

## Contraste visual de los primeros renders

La inspección de las mallas exportadas se ha hecho con renders de CPU; no son capturas WebGL de la aplicación. Al comparar el reverso con la fotografía se corrigió el lateral de la escalera: debe aparecer a la izquierda cuando se mira la cara oriental, y a la derecha en coordenadas locales vistas desde el frente occidental. Los dos óculos se bajaron 0,35 m para aproximar su posición relativa entre la clave y la coronación; el diámetro del aro se ajustó a 1,20 m y la envolvente del hueco a 0,95 m. Son ajustes proporcionales interpretativos, no medidas extraídas de un levantamiento.

La relación del ancho del hueco al frontis, 3,15/9,6 ≈ 0,33, es compatible con las fotografías. La imagen del reverso no tiene resolución suficiente para reconstruir una posible reducción o reparación interior del hueco de los óculos. Por eso se conserva una abertura continua y se declara la limitación, sin añadir rellenos especulativos.

El validador editorial y de navegación de V51 verifica 56 condiciones con resultado correcto: 18 paradas, 7 recintos, 35 fuentes y 185 referencias bibliográficas resueltas. Comprueba las coordenadas y alias con el modelo y conserva las 32 visitas del atlas y el contenido de las otras 31. Su comparación usa el objeto Git fijo de Site50, no el estado modificado de trabajo. La validación de enlaces comprueba su estructura; no afirma que cada servidor externo haya respondido durante esta prueba.
