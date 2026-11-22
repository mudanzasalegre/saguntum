# Grau Vell · V32: fábrica y visita registrada

Fecha de trabajo: 21 de noviembre de 2026. Estado representado: conjunto restaurado y centro de interpretación **Sagunt i la Mar**, abierto al público el 26 de junio de 2026. La escena mantiene el agua y el Pantalán de V31.

## Alcance y reparto de geometría

`dist/js/coast-grau.js` construye la torre, batería, foso seco, refugio exterior, patio, corral, pozo, almacén norte y recepción. Conserva las huellas catastrales de las referencias `6910216YJ3961S` y `6910203YJ3961S`. Con `grauContextData`, las otras 51 partes catastrales, la ermita, la plaza, las construcciones auxiliares y el entorno del poblado pertenecen exclusivamente a `grau-context.js`; no se duplican. Sin ese dato, se mantiene el contexto de compatibilidad del módulo anterior.

`dist/js/grau-visit.js` registra 20 paradas sobre la geometría construida, cinco vistas interiores, los edificios, cuatro plantas de lectura por edificio, las aberturas físicas y los componentes semánticos. `dist/assets/data/grau-plan.json` se exporta de esta misma fábrica. La guía se registra a partir de `grau-focus-registration.json` para evitar divergencias entre mapa, cámara y texto.

## Evidencia utilizada

- Gil-Piqueras y Rodríguez-Navarro, **La Torre del Grau Vell en la defensa de la costa de Sagunto**, FORTMED 2015, vol. II, pp. 159–166; DOI [10.4995/FORTMED2015.2015.1736](https://doi.org/10.4995/FORTMED2015.2015.1736). Se inspeccionaron el levantamiento, la planta histórica y las descripciones de pp. 163–165.
- Balaguer y Vicén, [Restauración y adecuación ambiental del Grau Vell de Sagunto, 2020](https://www.balaguer-vicen.es/project/restauracion-y-adecuacion-ambiental-del-grau-vell-de-sagunto-2020/). Fotografías primarias del almacén, patio, pozo, escalera metálica y sala alta de la torre. Son referencias de modelado; las fotografías no se incorporan a la aplicación.
- Ajuntament de Sagunt, [apertura del centro Sagunt i la Mar, 25 de junio de 2026](https://aytosagunto.es/es/actualidad/2026-06-25-el-nuevo-centro-de-interpretacion-sagunt-i-la-mar-ya-es-una-realidad/). Apertura al público al día siguiente; cinco salas temáticas más ámbitos de torre/batería y lagar/recepción. La noticia no equivale a un plano del montaje museográfico.
- Ajuntament de Sagunt, [tematización y réplica de artillería, 7 de mayo de 2026](https://aytosagunto.es/es/actualidad/2026-05-07-la-tematizacion-del-fortin-y-antiguo-almacen-portuario-del-grau-vell-entra-en-su-ultima-fase/). Contenido de la exposición y réplica de El Destruidor. Se conserva una sola pieza interpretada en la batería.
- Catastro, OSM, ortofotografía PNOA, memoria arqueológica de 2008 y documentación de la rehabilitación de 2020 ya registradas en `coast-grau.json` y `research/coast-grau.md`. Las huellas anteriores se conservan; las nuevas fuentes completan la lectura interior.

## Decisiones arquitectónicas

### Torre

La planta baja permanece **maciza**. La bibliografía describe un relleno de bolos, cal y grava: no se ha creado una cámara inferior, cisterna ni estancia subterránea. La torre tiene una única sala alta y una terraza. Se conservan la huella catastral y la altura publicada de 10,70 m; los aproximadamente 6 × 7 m de la fuente no se usan para deformar la cartografía.

La sala alta incorpora una bóveda de cañón, huecos pasantes, el suelo, el paso hacia la batería y la escalera restaurada de madera que aparece en las fotografías de los arquitectos. La bóveda tiene intradós rugoso de mampostería/mortero como se observa en 2020; la descripción académica identifica ladrillo en la estructura. El hueco de subida a la terraza es real en la geometría del suelo y de la bóveda. La escalera tiene largueros, peldaños y pasamanos fino. Su registro exacto y sus dimensiones menores son interpretados.

La terraza conserva parapetos, canecillos y garitón. Su cuerpo de aproximadamente 2,30 × 3,30 m y cubierta de madera/teja siguen la fuente de 2015. No se añaden merlones decorativos. El acceso exterior utiliza dos tramos de escalera metálica y una pasarela, de acuerdo con las fotografías de la restauración.

### Batería y foso

Se mantiene la batería maciza con escarpa ataluzada, sillería, cordón, parapeto, escudo y plataforma. El fondo del foso sigue siendo seco y conserva su parche de terreno excavado. La lectura de unos seis metros entre el fondo interpretado del foso y la coronación se diferencia de una medición actual exacta. Se incluyen dos desagües como rasgo documentado; su registro menor es interpretado.

La réplica contemporánea de artillería queda en la plataforma. La guía no atribuye el libre acceso físico a torre/batería: la noticia de inauguración señalaba que esos ámbitos aún no eran visitables. El atlas permite una inspección virtual y no certifica condiciones de visita actuales.

### Almacén y museo

El almacén conserva la nave longitudinal de la huella cartográfica, con suelo de cantos rodados y fajas de piedra, pilares sobre basas oscuras y fustes de revoco mineral claro sobre fábrica de ladrillo, tornapuntas, vigas, correas y viguetas de madera. Las cubiertas tienen superficie exterior de teja y entablado interior separado: desde dentro se ve madera. Los accesos principales tienen cabezas de arco rebajado y huecos auténticos; las ventanas poseen marcos perimetrales, no planos opacos que cierren el hueco estructural.

La disposición museográfica completa de 2026 **no está levantada**. El proyecto público de tematización y su DOC3 de planos se localizaron pero el portal no permitió su descarga. Por tanto, no se inventan tabiques para simular cinco salas. Cinco soportes independientes y vitrinas bajas de madera/vidrio permiten comprender el programa temático documentado y las fotografías oficiales. Se representan pequeñas réplicas didácticas de ánforas, monedas y un elemento de ancla como contenido interpretativo; sus formas menores y colocación no se presentan como inventario o montaje exactos.

El lagar tiene un punto de lectura aproximado asociado al ala del corral. La función vinícola aparece en la documentación municipal; el modelo no añade una prensa, cuba, bodega romana ni interior no documentado.

## Materiales, selección y sección

Las superficies de mampostería, sillería, teja, madera, cantos, terracota y pavimento se generan proceduralmente. Las variaciones de material no reutilizan fotografías con derechos. Las texturas y materiales pertenecen a una instancia de la fábrica; no existe caché global susceptible de quedar apuntando a recursos liberados tras abandonar la costa.

La agrupación usa 49 componentes semánticos y separa los elementos que pueden retirarse en una sección. En el conjunto, abrir la sección retira cubiertas y partes altas de muros del núcleo. En una parada de edificio, sólo afecta al ámbito correspondiente. Al cambiar de parada o cerrar la sección se restauran las visibilidades de origen. Las cinco cámaras interiores conservan sus techos: la bóveda y la cubierta de madera siguen siendo visibles desde dentro. La sección es didáctica y no cambia de época histórica.

El resaltado de los muros altos y bajos se aplica de forma continua a cada fábrica, evitando que la división técnica de la sección produzca una falsa franja de zócalo. La lectura por colores utiliza los cinco ámbitos de la guía: edificio, espacios, construcción, memoria y entorno. Restaurar el modo realista restituye color, textura y relieve originales.

## Verificación

- `research/validation-v32/validate-grau-model.mjs`: 31 comprobaciones, todas satisfactorias al completar el modelo. Geometría finita; normales no nulas; sin triángulos degenerados; 20 focos; ocho accesos pasantes comprobados por rayos; restauración de colores y visibilidad; materiales y texturas exclusivos de cada instancia; liberación idempotente.
- Núcleo final: **107 mallas combinadas, 44.728 triángulos**, 49 componentes semánticos, 8 puertas y 13 ventanas registradas, una única sala de torre y cinco puntos museográficos interpretados. El contexto tiene sus propias estadísticas y comprobaciones.
- `research/validation-v32/validate-grau-interiors.mjs`: **10 casos** (cinco cámaras interiores, normal y cercana) sin paredes/pilares entre cámara y objetivo ni cámara dentro de una superficie opaca.
- `grau-model-qa.json`, `grau-interior-camera-qa.json` y `grau-focus-registration.json` conservan resultados y datos reproducibles. Las comprobaciones integradas de producción, renderizado y terreno pertenecen al QA V32 del atlas.
- Se revisaron las primeras vistas integradas de conjunto, patio, estructura de madera, sala alta y bóveda. Se suavizó el pavimento mineral del patio/terrazas para evitar un damero que no coincide con las fotografías y se ajustó la cámara de bóveda para incluir el hueco y la escalera. Las diez comprobaciones de cámara interior se repitieron con éxito.
- El render CPU de la geometría real sirve de revisión visual; no es una captura de WebGL. La disponibilidad de una vista previa de Sites se registra por separado y no se infiere del render.

## Contrato de integración

`createCoastGrau({heightAt,project,records,data,grauVisit,grauContextData})` devuelve `{group,sites,stats}`. El sitio `grau-vell` aporta `visit`, `plan`, `roof`, `point`, `views`, `focuses` de compatibilidad, `patches`, exclusiones y `dispose`.

La visita expone `focuses`, `bounds`, `regions`, `plan`, `stats`, `getFocus`, `selectFocus`, `setReadingMode`, `setSection`, `bindGround`, `getState` y `dispose`. Los focos usan `Vector3` y `Box3`. `bindGround` ajusta únicamente el mínimo de altura de las cámaras exteriores contra el terreno definitivo; los edificios conservan sus cotas y parches horizontales. `group.userData.ownedResources` expone colecciones compatibles con el liberador regional del atlas.
