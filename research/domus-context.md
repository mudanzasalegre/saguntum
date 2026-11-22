# Domus dels Peixos: contenedor moderno y entorno inmediato

Revisión: 20 de noviembre de 2026. El contexto pertenece a **SAGUNTUM · Atlas vivo** y conserva la identidad y la entrada general del atlas.

## Qué está documentado

La dirección pública de la Domus es **Carrer de València, 2**. El solar arqueológico también aparece en la bibliografía como «calle Valencia núm. 2 – calle Josefa Daroqui s/n»: corresponde al antiguo cine Marvi y llega a ambas calles. La mención arqueológica a una entrada occidental no demuestra que ese fuera el acceso del museo contemporáneo.

- [Hurtado Mullor, actas del XVI Congreso Nacional de Numismática, pp. 311–330](https://www.museunacional.cat/pdf/Interactivo_XVI_CONGRESO_NACIONAL_DE_NUMISMATICA_1r_TOMO.pdf): dirección del solar, excavaciones y conservación bajo el edificio posterior. Su plano arqueológico es una fuente distinta de la huella moderna.
- [Sagunto Turismo, Museo Vía del Pórtico y Domus dels Peixos, 2018](https://saguntoturismoblog.wordpress.com/2018/01/31/via-del-portico-y-domus-dels-peixos/): ubicación en calle València y fotografía del museo cerrado bajo viviendas. La página agrupa dos yacimientos; sus referencias generales a descubrimientos de 1991 no deben trasladarse a la excavación de la Domus de 2002.
- [Valencia Turismo, Qué ver en Sagunt, 2023](https://turisme.dival.es/que-ver-en-sagunt/): distingue la Domus de calle València de la Vía del Pòrtic de la plaza de la Antigua Morería y explica el hallazgo al sustituir el cine por viviendas.
- [OpenStreetMap, edificio 203064322](https://www.openstreetmap.org/way/203064322): huella cartográfica del museo con uso residencial. El centro orientativo de ese objeto es aproximadamente 39.67743 N, 0.27238 O; no representa la puerta ni el centro de un levantamiento arqueológico.

## Observaciones fotográficas

La [fotografía de Sagunto Turismo](https://saguntoturismoblog.wordpress.com/wp-content/uploads/2018/01/481007_632287010146673_957591531_n.jpg) muestra pilares modernos oscuros de sección rectangular, instalaciones visibles bajo un techo cerrado, tuberías rojas, iluminación cálida y pasarelas periféricas con tablero marrón, varillas verticales finas y pasamanos de madera. La presentación del estado actual debe mostrar esa estructura protectora; la cubierta romana pertenece a la hipótesis histórica.

La [fotografía de visita publicada por Nino el 5 de junio de 2019](https://valenciadecartonpiedra.blogspot.com/2019/06/domus-dels-peixos-casa-de-los-peces-en.html) muestra un arco de dovelas pétreas integrado en una pared de ladrillo, detrás de carpintería acristalada de color oscuro, con aplacado gris oscuro en el lateral. Es evidencia visual primaria de su autor, no un levantamiento municipal. No se asigna al arco una cronología por la mera descripción del blog. Tampoco acredita las dimensiones exactas o la posición geodésica de cada hueco.

Las fechas anteriores son fechas de publicación. No se afirma haber realizado una inspección física en 2026. Las fotografías se han consultado como referencia; no se distribuyen con el sitio.

## Registro del edificio contenedor

El contexto utiliza las partes originales de `cartography.json`, derivadas de **Catastro INSPIRE Buildings**, con fecha de fuente 21 de agosto de 2026 y procedencia conservada en `building-footprints.json`. Se mantiene la parcela **4057108YJ3945E** y sus diez partes de edificación, sin modificar ninguna secuencia de coordenadas ni patio.

| Dato | Resultado |
| --- | --- |
| Partes del contenedor | 10 |
| Área de su unión | 759.484 m² |
| Componente principal | 755.291 m² |
| Pieza separada de la misma parcela | 4.193 m² |
| Rectángulo mínimo del conjunto | 58.333 × 23.437 m |
| Centro de ese rectángulo | longitud −0.272577532, latitud 39.677443363 |
| Centro en coordenadas del atlas | x 464.573271 m; z 173.284886 m |
| Giro del contenedor | −0.114523715 rad |

El contenedor tiene un cuerpo oriental más ancho y una prolongación occidental estrecha hacia Josefa Daroqui. Sus partes conservan distintas alturas de fuente y número de plantas. Por eso no se sustituye por una caja uniforme ni se confunde toda la parcela con la superficie excavada romana.

Los campos `coreBuildings`, `coreOutline` y `coreOutlines` se entregan al modelo arqueológico, que es el único propietario de la representación del contenedor. Este módulo no genera una segunda fachada del museo.

### Registro interpretativo de la planta arqueológica

Se proporciona un registro independiente del contenedor: longitud -0.272419372398433, latitud 39.677443815520924, equivalente a x 478.123701980 m y z 173.234456211 m; giro local 0.25 rad. La orientación sirve al esquema publicado de acceso occidental y recepción oriental. Es un ajuste gráfico dentro del cuerpo oriental, sin puntos de control topográfico de la excavación.

El registro final incorpora un ajuste gráfico de +0.50 m en z local, equivalente a +0.123701980 m en x y +0.484456211 m en z del atlas, para alojar el muro septentrional completo de la cocina después de revisar la relación entre cocina y baño. Este ajuste afecta sólo al núcleo arqueológico interpretativo: mantiene intactos el contenedor, el corte, la puerta moderna y las geometrías vecinas. La verificación del encaje se realiza sobre los recintos y muros del modelo integrado, no sobre un rectángulo tratado como planta documentada. El lecho, los recintos y sus cotas pertenecen a `domus.js` y a su documentación específica.

`baseDepth: 1.15` transmite la referencia aproximada utilizada por la investigación arqueológica. No establece una cota absoluta para todas las habitaciones ni para la totalidad de la calle moderna. `archaeologicalSurvey: false` deja explícita esta limitación.

### Acceso actual y fachada

El frente catastral que mira a València va de [−0.2723742, 39.6773194] a [−0.2722237, 39.677518]. `entry.frontage` conserva esos puntos. El punto de puerta aproximado [−0.27229872, 39.677419] es una elección de representación sobre ese frente, señalada con `interpretiveDoorPosition: true`; no es una coordenada medida de la puerta.

`domus-acceso` mira esa fachada desde la calle. `domus-entorno` permite entender la prolongación hacia Josefa Daroqui. Ambos focos son del estado actual, planta 0, y usan terreno del atlas para ajustar la altura de cámara. La entrada romana occidental se explica dentro del modelo histórico.

## Edificios y calles del entorno

La selección gráfica es un entorno de 20 m alrededor del contenedor, suficiente para dar continuidad a València, Josefa Daroqui, el tramo próximo de Pare Morató y Vicente Fontelles. No es un perímetro de protección patrimonial.

- Se añaden **54 partes catastrales de 19 parcelas vecinas**, con dos patios registrados.
- Se reutilizan visualmente **19 partes** y **tres fragmentos de calle** ya propiedad de contextos anteriores.
- Los nueve contextos existentes conservan sus datos y geometrías; cinco parcelas que ya tenían propietario se excluyen de la nueva selección.
- Se excluye el objeto OSM 1418994372 de la capa genérica porque ya está representado por geometría catastral seleccionada.
- Se incorpora una revisión de altura donde la muestra de superficie de IGN entra en conflicto con el número de plantas; el dato original se conserva y la altura de representación queda marcada como interpretación.
- Las ventanas, balcones, zócalos y acabados del caserío usan el motor existente `createJuderiaContext`. Son detalles visuales interpretativos sobre huellas y alturas documentadas, no reproducciones medidas de cada fachada.

Dolz de Castelar está aproximadamente 130 m al sur y permanece en la cartografía general. Extender hasta ella habría duplicado buena parte del entorno de El Salvador y ampliado innecesariamente esta escena.

## Pavimentos, cotas y propiedad

Los ejes OSM se recortan a la selección y se restan las superficies anteriores, los edificios, sus patios y el contenedor. Los tramos conservan `sourceId` y `sourceCoordinates`. Se obtienen diez fragmentos de calle; sólo dos reemplazan completamente su eje genérico. El resto utiliza máscaras locales para no eliminar continuaciones ajenas a la visita.

Las bandas de calzada y acera tienen una anchura inferida cuando OSM no la proporciona. Los bordillos se derivan de la frontera compartida entre esas bandas. No se añaden bancos, árboles o mobiliario sin una localización contrastada. La nueva superficie se triangula sobre la misma cuadrícula de terreno de 2.5 m que usan los contextos anteriores, y cada vértice toma su cota mediante `bindGround`. No se aplana el barrio.

| Comprobación geométrica | Resultado |
| --- | --- |
| Pavimento nuevo | 850.136 m² |
| Calzada | 660.912 m² |
| Acera | 189.224 m² |
| Vértices / triángulos | 868 / 1,200 |
| Solape con pavimento anterior | 0.0000000038 m² |
| Solape numérico con edificios | 0.0000142 m² |
| Solape numérico con contenedor | 0.0000051 m² |
| Área sin cubrir por la triangulación | 0.0000504 m² |
| Resultado con tolerancia de 0.001 m² | Aprobado |

Los pequeños residuales numéricos anteriores proceden de la precisión de triangulación. Por separado, las propias huellas catastrales de ciertos vecinos tienen **0.174060 m²** de solape total con el contenedor, en sus bordes. Se conserva y registra este residual de fuente en `sourceResiduals`; no se desplazan polígonos ni se presenta una exactitud inexistente.

### Complemento exterior del corte

El shader de excavación utiliza un rectángulo girado. Se calcula su complemento exacto respecto de la unión del contenedor para restaurar el terreno fuera de la huella real y evitar un foso rectangular alrededor del edificio. `surfaceApron` tiene 724.104 m², 468 vértices y 584 triángulos; el solape numérico con la huella es 0.0000182 m², dentro de la misma tolerancia. Lo representa el modelo arqueológico, una sola vez.

## Integración y verificaciones realizadas

Archivos de esta subtarea:

- `dist/assets/data/domus-context.json`: datos originales, selección, propietario, registro, focos, mallas, procedencia y QA.
- `dist/js/domus-context.js`: exporta `createDomusContext` con la misma interfaz del contexto de la Vía del Pòrtic; reutiliza `createJuderiaContext` y añade tratamiento de asfalto y bordillos.
- `research/domus-context.md`: este documento.

Se comprobó la sintaxis del módulo con `node --check`, la conservación exacta de coordenadas y patios de todas las partes seleccionadas, la ausencia de identificadores nuevos ya asignados a contextos anteriores y las coberturas geométricas descritas. `inputHashes` conserva las huellas de los datos de entrada y de los nueve contextos anteriores. La validación integrada de navegación, cámaras, corte y render corresponde a la tarea principal.

Fuentes cartográficas generales: [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/), [OpenStreetMap](https://www.openstreetmap.org/way/203064322), [IGN MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma). La fecha de descarga de PNOA, 19 de noviembre de 2026, no es la fecha de vuelo de la imagen.
