# Plaza Mayor: cierre porticado junto a Santa María

Revisión: 26 de noviembre de 2026. Esta corrección parte de la captura del usuario, contrastada con documentos municipales y fotografías. Las fotografías consultadas tienen sus propias fechas; la revisión no equivale a un levantamiento del estado exacto de noviembre de 2026.

## Qué faltaba en la maqueta

La fachada rodeada en la captura corresponde a los números **7–8 y 9**, en el lado corto de la plaza. Es el cierre junto a Santa María, separado del templo por el retorno del Sagrari hacia Cavallers. El alzado especializado de Plaza Mayor ya representaba los números 1–5 y 10–17. Los dos frentes restantes pertenecían al contexto de Santa María, que generaba paredes opacas y huecos domésticos repetidos a partir de los cuerpos catastrales. Por eso desaparecían los soportales y se acumulaban demasiadas filas de ventanas en el frente.

La identificación se comprueba en la ficha y el plano de las parcelas **3558302 (7–8)** y **3558301 (9)**, incluidos en el [expediente municipal de 30 de septiembre de 2010, pp. 30–39](https://aytosagunto.es/media/lkunpbcv/pl100930.pdf). La foto conjunta de la página 38 muestra ambos edificios y sus apoyos. El texto distingue una planta baja porticada y dos superiores. También explica que el lado corto es prácticamente horizontal, a diferencia de los lados largos, que siguen la pendiente.

## Contraste de evidencias

| Evidencia | Qué aporta | Límite aplicado |
| --- | --- | --- |
| Expediente de 2010, ficha del nº 9, p. 35; foto conjunta, p. 38 | Identidad parcelaria, dos ejes del nº 9, soporte central y laterales, balcón corrido inferior y dos plantas sobre el soportal | Las fotos históricas y el primer proyecto del nº 7–8 no se consideran prueba del acabado actual |
| [Expediente de 27 de diciembre de 2011, p. 66](https://aytosagunto.es/media/rb2mpsep/pl111227.pdf) | Alzado de integración y planta de soportales: dos ejes en 7–8 y 9, paso cubierto continuo, nº 6 retranqueado | Un proyecto aprobado no demuestra por sí solo su ejecución; se contrasta con fotografías |
| [Rutas Jaume I, fotografía 13](https://www.rutasjaumei.com/images/C53/PAT/P220/13SAGUNTO-PLAZA-MAYOR.jpg) | El cierre porticado en relación con la iglesia, el nº 9 blanco y el vecino ocre | La galería no proporciona fecha de toma |
| [Fotografía directa de Gary y Josie, publicada el 20 de enero de 2019](https://www.gotaway.ca/spain/valencia/sagunto/) | Corrobora el nº 7–8 ocre con cubierta de teja y dos ejes; nº 9 blanco, dos ejes, balcón corrido inferior y azotea | Acredita el aspecto fotografiado en 2019, no una inspección de 2026; los eventos, banderas y mobiliario temporal no se incorporan |
| Cuerpos Catastro INSPIRE ya incluidos en SAGUNTUM | Posición y forma individual de los ocho cuerpos de ambas parcelas, incluida su organización posterior | Los niveles catastrales y alturas IGN no se convierten automáticamente en un número de ventanas de fachada |

El proyecto inicial de 2010 dibujaba una alternativa de tres ejes para 7–8. La corrección utiliza los **dos ejes** del alzado de integración de 2011, corroborados por la fotografía de 2019. El nº 6 queda como fondo retranqueado; no se le añade un soportal.

## Representación geométrica

Los frentes `core-3558302YJ3935N` y `core-3558301YJ3935G` usan el polígono original `part4` de cada parcela. La arista norte que da a la plaza se registra expresamente como `frontEdgeIndex: 2`, evitando que una regla pensada para los lados oriental y occidental coloque la galería en una medianera.

Cada frente tiene dos plantas superiores y dos ejes. En el nº 9, el balcón de la primera planta es corrido y los superiores son independientes; el remate es de azotea. El nº 7–8 distingue el revoco ocre, los balcones separados y la cubierta de teja. Se modelan apoyos de sección cuadrada con base y remate, sin atribuirles procedencia romana. Sus anchuras, las molduras, la altura representada de 9,85 m y la profundidad de galería de 3,30 m son aproximaciones visuales registradas sobre la cartografía.

Los soportales forman cuatro vanos abiertos y cinco apoyos: la pared doméstica queda al fondo, los apoyos son independientes y el suelo y el techo continúan entre ambos frentes. No se utiliza una textura oscura para simular un hueco. La junta emplea una única cota de terreno en `[-0.2786444, 39.679178]`, de modo que el paso no queda interrumpido por un escalón artificial. El apoyo común se emite una sola vez.

El espesor inferior del suelo de las galerías se prolonga hasta entrar en la cimentación, manteniendo su cota de paso y su huella. Así se cierra la ranura que dejaba la antigua losa de 10 cm, suspendida 14 cm sobre el apoyo del terreno. Es un detalle de continuidad de la maqueta, no una medición de la cimentación histórica.

Los tres cuerpos posteriores de cada parcela conservan sus coordenadas originales y sus alturas de referencia; continúan como volúmenes esquemáticos. No se sustituye la parcela por una caja envolvente, no se rellena su geometría con una unión convexa y no se inventan interiores privados.

## Propiedad compartida e integración

`plaza-mayor-context.json` declara `replacedSantaMariaBuildingIds` con los ocho identificadores de origen y `sharedFrontages` con el propietario `plaza-mayor`. El ensamblaje de Santa María omite exactamente esos cuerpos cuando carga la pareja compartida. Sus registros de origen permanecen en `santa-maria-context.json` para trazabilidad y no se dibujan simultáneamente con los nuevos modelos.

La geometría incorpora los componentes `soportal-7-8` y `soportal-9` al plano y a las lecturas de la plaza, con fuentes propias. Las 16 paradas y todos sus identificadores se conservan. Se amplía la bibliografía y las indicaciones del conjunto, los apoyos y la relación con Santa María. La parada del Almudín mantiene su dirección actual nº 17.

## Verificación de esta corrección

`node research/validation-plaza-sur/validate_southern_porticoes.mjs` comprueba la identidad de los ocho cuerpos, la conservación exacta de sus coordenadas, las exclusiones declaradas, la orientación del frente, el número de plantas, la cota común, las fuentes y la geometría finita. Lanza 45 rayos a través de los cuatro vanos y del paso transversal compartido. Otros cuatro rayos a la cota de cimentación comprueban que el borde del suelo ya no flota. Resultado registrado: **34 comprobaciones correctas; 45 rayos sin obstáculos estructurales**.

El plano está regenerado desde el modelo. `render_southern_porticoes.mjs` y `render_southern_porticoes.py` permiten inspeccionar las mismas mallas en Blender con iluminación neutra. Estas imágenes son una revisión aislada de geometría; la comprobación final del relieve, la visibilidad, las colisiones y la carga conjunta en Atlas/Simulación se realiza con el ensamblaje completo.

## Junta del pavimento con Cavallers y Sagrari

La revisión del conjunto detectó un segundo problema independiente de las fachadas: el módulo de Plaza descartaba las celdas de calle según su centro. Una celda que cruzaba el contorno podía conservar media superficie superpuesta o eliminar una cuña necesaria. Los restos de las cintas de los ejes 22922647, 441656289 y 1365045248 invadían además el borde que debía cubrir el corredor de Santa María.

`areaPavedRoadIds` asigna ahora el suelo visible de esos tres ejes al área de la plaza y al corredor complementario de la iglesia. Sus geometrías de navegación, componentes de plano y exclusiones de vías genéricas permanecen. Las demás celdas se recortan contra los triángulos del área antes de dibujarse. El recorte conserva los bordes originales de calle expuestos, pero no añade un bordillo dentro de una junta entre pavimentos. Ambos módulos utilizan el terreno final más 0,105 m.

Las áreas y las cintas recortadas de ambos contextos se teselan sobre una misma retícula de 0,5 m y su campo de alturas lineal por triángulos. La diagonal coincide con la del terreno. Cada reconstrucción usa una sola instancia de `createPavingTessellator`; las caras dejan de elevarse de forma independiente. Este cambio elimina los pequeños saltos entre vértices compartidos y encuentros de aristas sin alterar los contornos.

El contorno cartográfico de `plaza-pavimento-0` permanece inalterado durante esta corrección del recorte de cintas. El pavimento de Santa María se recorta contra ese mismo contorno; de ese modo, cada superficie tiene un único propietario.

`node research/validation-plaza-sur/validate_shared_paving.mjs` lanza rayos sobre 2.698 posiciones en la desembocadura. La superposición interna de Plaza pasa de 28 posiciones detectadas a cero, sin perder cobertura de los puntos interiores del área. Comprueba también que los tres ejes siguen presentes en los datos, el plano y las exclusiones. La [validación completa de la pareja](validation-v47/ensemble-qa.json) confirma la continuidad con el corredor complementario y su pendiente; el [render conjunto definitivo](validation-v47/plaza-cierre-sur.jpg) permite inspeccionar ese encuentro.
