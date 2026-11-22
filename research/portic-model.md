# V18 · Modelo de la Vía del Pòrtic

## Alcance y criterio

La Vía del Pòrtic se incorpora como un espacio arqueológico musealizado bajo dos edificios actuales de la Morería. El modelo ofrece una visita interior, una sección que desplaza el edificio superior y una interpretación del paisaje romano del siglo II d. C. Conserva la identidad y la portada general de **SAGUNTUM · Atlas vivo**.

La reconstrucción es documental e interpretativa. No se ha obtenido una nube de puntos, una fotogrametría ni un levantamiento georreferenciado de los restos o de las instalaciones visitables. Las huellas actuales proceden de la cartografía del proyecto; la disposición arqueológica se registra proporcionalmente dentro de esas huellas a partir de la planta publicada y de las medidas de los excavadores. La altura del subsuelo, cada piedra, las cotas de los muros conservados, la posición exacta de las pasarelas y el detalle de las fachadas actuales son aproximaciones expresamente identificadas.

## Fuentes empleadas para la geometría

| Fuente | Información incorporada | Límite de la aplicación |
| --- | --- | --- |
| [Melchor y Benedito, ARSE 39, 2005](https://www.centroarqueologicosaguntino.es/uploads/descargas/381_03_la_excavacion_del_solar.pdf) | Longitud y anchuras de la calzada, cambio de dirección septentrional, cloaca, apoyos de los pórticos, cimentaciones y depósitos | La planta se ha interpretado proporcionalmente; las piedras individuales no están inventariadas en el modelo |
| [Járrega, 2020, fig. 3, planta según Melchor 2013](https://repositori.uji.es/bitstreams/7405b56c-2661-41c7-820e-3a9bab0053d2/download) | Relaciones entre calzada, inflexión, edificio monumental y espacios adyacentes; escala gráfica de 5 m | El plano publicado no proporciona puntos de control geodésicos para este modelo |
| [Pyrenae 53.2, 2022](https://doi.org/10.1344/Pyrenae2022.vol53num2.6) | Revisión de la secuencia doméstica y de la propuesta del arco | La luz propuesta para el arco difiere de una publicación anterior; la guía conserva esa discrepancia |
| [Estudios Patrimoniales, Vía del Pórtico](https://www.estudiospatrimoniales.es/portfolio/via-del-portico/) | Aspecto de la musealización: apoyos y vigas oscuros, grava clara, tarima, barandillas metálicas y acristaladas | Fotografías como referencias visuales, sin incorporar una galería ni usarlas como texturas |
| [Ayuntamiento de Sagunto, accesibilidad, 2022](https://aytosagunto.es/es/actualidad/sagunto-inaugura-las-mejoras-de-accesibilidad-en-la-via-del-portic/) | Materiales y continuidad del itinerario adaptado | La recreación no certifica medidas de accesibilidad, evacuación ni un itinerario físico exacto |
| [Global Mediterránea, musealización, 2013](https://www.globalmediterranea.es/musealizacion-via-portic/) | Existencia del segundo sector y carácter del trabajo museográfico | No se ha reutilizado su escaneado láser; únicamente la documentación pública |

La guía histórica contiene el inventario completo de referencias, sus fechas y el grado de confianza de cada parada. Las propuestas municipales de nuevos recursos inmersivos no se representan como instalaciones ejecutadas.

## Registro espacial

El marco del yacimiento se calcula desde el rectángulo mínimo de la parcela septentrional `4059201YJ3945N`. En las coordenadas métricas del atlas, su origen es aproximadamente `(466.94495, -77.61230)` y su giro `-0.6477218059` radianes. El edificio septentrional tiene una planta trapezoidal; el extremo este se estrecha hacia el norte. Los depósitos, el podio, las fábricas de esa zona y la pasarela oriental respetan esa envolvente.

Las dos parcelas contenedoras son `4059201YJ3945N` y `4059202YJ3945N`. Se conservan las 27 partes catastrales y los huecos de cubierta incluidos en los datos de contexto. El bloque superior se genera sobre esas huellas, con alturas de la información disponible y una revisión de partes de una planta con señales de altura incompatibles. En tales casos se usa una altura de planta en vez de convertir un patio o una cubierta baja en una torre. Los huecos y balcones de fachada siguen un ritmo tipológico.

La profundidad general se estima en 3,45 m respecto de la muestra de terreno del origen. La pasarela queda 0,43 m por encima de la referencia del pavimento antiguo y el forjado a 0,18 m bajo la cota de superficie. Estas cotas permiten una visita coherente y se identifican como interpretativas; no son cotas de un levantamiento del museo.

El contexto vecinal se incorpora mediante `portic-context.js`. Sus tres focos exteriores reemplazan los del constructor base, y el generador de `portic-plan.json` reproduce esa misma fusión para evitar que el plano, los textos y la escena señalen lugares diferentes.

## Restos y restitución

| Elemento | Representación |
| --- | --- |
| Calzada | 60 m con inflexión al norte; anchura de 4,10 m en el tramo septentrional y 5,40 m en el meridional |
| Losado | 165 piezas conservadas interpretativas, en 49 hiladas de profundidad variable; anchos desiguales y contornos quebrados. Estos recuentos describen la geometría digital, no un inventario arqueológico |
| Pórtico occidental | 9 apoyos; intervalos publicados de 2,95, 4,04, 4,20, 3,20, 2,83, 3,08, 3,11 y 1,92 m |
| Pórtico oriental | 5 apoyos; intervalos publicados de 3,14, 3,50, 3,45 y 2,90 m |
| Basas | Tamaños comprendidos entre 0,60 y 0,75 m, con alturas conservadas interpretadas |
| Cloaca | Conducto hueco de 0,68 m de ancho libre y 1,25 m de profundidad libre modelada; suelo y paredes independientes. Un tramo del pavimento se retira en sección |
| Edificio monumental | Frente de 24,35 m y anchura de cimentación de 1,53 m como referencias publicadas; restos bajos en la escena actual y restitución parcial del podio en la histórica |
| Posible arco | Cimentaciones de 3 × 3 m y 2,80 × 3,50 m; alzado completo opcional y translúcido. Luz de 3,50 m basada en la revisión de 2022; la guía explica la propuesta anterior de 2,50 m |
| Depósitos | Recintos secos con fábricas y revestimientos, sin sugerir que actualmente conservan agua |
| Ocupaciones posteriores | Umbrales, habitaciones, letrinas, desagües, recintos funerarios, reutilizaciones tardías y fábricas medievales diferenciadas por lectura |
| Segundo sector | Suelo y envolvente registrados; muros domésticos bajos de carácter tipológico. No se presentan como una copia de una planta de excavación exacta |

Las partes altas del arco y del edificio monumental se mantienen en un grupo de hipótesis independiente. Su orden arquitectónico, altura y remate no se afirman como hechos. La escena histórica utiliza suelo de tierra y pavimentos romanos, sin grava museográfica blanca, apoyos modernos ni ocupaciones funerarias tardías o medievales superpuestas.

## Presentaciones y controles

- **Actual:** restos conservados, recinto de exposición, edificio superior, pasarelas y barandillas. Diez paradas tienen cámaras interiores entre la tarima y el forjado. Ocho luces puntuales sin sombras se activan sólo cuando la Vía del Pòrtic está seleccionada en este modo.
- **Corte:** el edificio superior y el forjado se desplazan conjuntamente, con interpolación y transparencia, para revelar el subsuelo. Se puede ocultar la cubierta levantada. La museografía permanece y se abre el tramo diagnóstico de la cloaca.
- **Histórica:** interpretación del siglo II con cubiertas del pórtico y alzados hipotéticos controlables. Los restos de fases posteriores y las estructuras contemporáneas dejan de mostrarse.

Los modos reutilizan el panel arqueológico del atlas. La guía no duplica el interruptor de sección. Cada foco indica un modo recomendado; después se puede cambiar de presentación mediante los controles generales. La vista de conjunto adapta su cámara al museo bajo la ciudad cuando se elige corte o histórica.

El plano distingue la planta de ciudad (`0`) y el espacio arqueológico (`-1`). El conjunto actual puede mostrar ambas; el conjunto en corte o histórica muestra el nivel arqueológico. La leyenda cromática de seis temas se toma de `visitData.readingLegend` y se comparte entre modelo, guía y plano. Son temas de lectura: no implican que todos los elementos de una misma capa sean contemporáneos entre sí.

## Terreno y límites de navegación

La máscara de excavación es temporal y no recorta los edificios del contexto. Para compensar su forma rectangular, se añade una superficie de terreno que cubre la diferencia entre el rectángulo y la unión de los dos edificios contenedores. Esta pieza se genera desde las huellas y contiene 1053 triángulos; sus alturas se ajustan al muestreador final del terreno.

`containsSubsurface(x,z)` permite bajar la cámara únicamente dentro de las huellas de los dos contenedores. La plaza exterior cubierta por esa superficie no se trata como espacio subterráneo. Las ruinas no quedan suspendidas sobre un hueco rectangular que alcance las calles vecinas.

## Archivos y contrato

- `dist/js/portic.js`: constructor `createPortic`, fábrica arqueológica, museo actual, edificios superiores, iluminación, focos y modos.
- `dist/js/portic-map.js`: plano interactivo por nivel y tema, con marcadores de las veinte paradas.
- `dist/assets/data/portic-plan.json`: geometría cartográfica derivada del constructor y del contexto final.
- `research/validation-v18/build-portic-plan.mjs`: generación reproducible del plano y metadatos.
- `research/validation-v18/validate_portic_architecture.mjs`: comprobaciones de arquitectura y contrato.

El resultado de `createPortic` expone los grupos `remains`, `modern`, `host`, `ceiling`, `reconstruction` e `hypotheses`; las máscaras temporal e histórica; `setPresentation`; `containsSubsurface`; y `visit`. La visita contiene `focuses`, `getFocus`, `selectFocus`, `setReadingMode`, `setSection`, `bindGround`, `plan`, `stats` y `qa`. No se modifica el formato de los otros yacimientos. Los materiales, geometrías y texturas del modelo se registran como recursos propios.

## Validación

El modelo final contiene **93 mallas y 170290 triángulos**, incluyendo los tres estados y sus elementos ocultables. La agregación por material, componente y tema reduce objetos independientes. Las ocho luces carecen de sombras y desaparecen de la escena activa al salir de la visita o al usar la presentación histórica.

El informe `portic-architecture-qa.json` registra **156 comprobaciones superadas**: dimensiones publicadas, nueve y cinco apoyos, espaciados asimétricos, hueco real de la cloaca, recursos propios, atributos finitos, modos y restauración de materiales, seis colores alineados con la leyenda y activación selectiva de luces. Incluye 60 configuraciones de cámara interior (diez paradas, dos distancias y tres proporciones de pantalla), con niveles de observación y comprobación del volumen próximo; además verifica que los triángulos exteriores del terreno no concedan acceso bajo la plaza.

La comprobación integrada del atlas corresponde al informe regional de V18: evalúa también edificios vecinos, terreno final, cámaras exteriores y comportamiento de la aplicación. Las imágenes de inspección renderizadas por CPU sirven para revisar geometría y encuadre; no se presentan como una medición del rendimiento ni de la iluminación exacta de un navegador con WebGL.
