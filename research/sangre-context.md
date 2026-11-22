# Ermita de la Sangre · plaza, calles y caserío colindante

## Alcance de esta iteración

El entorno incorpora **152 piezas de 62 parcelas** alrededor de la ermita: **151 partes de Catastro conservadas literalmente** y una porción de huella OSM que completa un edificio cuya cobertura catastral es incompleta en la captura del atlas. Se añaden **13 tramos de calle** y un pavimento continuo de aproximadamente **1.402,07 m²**, incluidos **146,27 m² de espacio de plaza** delante de la fachada.

La selección de 38 m alrededor de la unión del núcleo y sus anexos es un límite de composición y carga. No representa un perímetro histórico, una delimitación patrimonial ni una nueva cartografía oficial. Se conservan las plantas, subdivisiones, alturas de referencia, número de plantas y atribuciones presentes en los datos del atlas. No se ha realizado un levantamiento nuevo de todas las fachadas.

El modelo de la ermita, sus nueve cuerpos catastrales, la escalinata y el interior pertenecen a `sangre.js`. Este contexto representa la plaza general, las calles exteriores y el caserío. Mantiene las escenas de Santa María, Plaça Major, la judería, el Calvario y Berenguer, con sus focos, calles y geometrías previamente asignadas.

## Registro cartográfico y orientación

Se reutiliza la proyección local del atlas, con origen geográfico `[-0.278, 39.679]`, eje x positivo al este y eje z positivo al sur. El anclaje de la ermita es `[-0.27730776, 39.67818601]`, equivalente aproximadamente a `[59.3081, 90.6134]` en metros del atlas. La orientación de su eje principal es 1,23 radianes en el convenio del modelo; la fachada se abre hacia el oeste-noroeste, al espacio público situado alrededor de `[46.3, 85]`.

El núcleo se registra sobre la parcela **`3657314YJ3935H`**. Las nueve filas `cat-3657314YJ3935H_part1-0` a `cat-3657314YJ3935H_part9-0` están en `coreBuildings` sin alterar sus coordenadas ni atributos de procedencia. Las partes 7 y 8 aportan los cuerpos adosados meridionales; la parte 6 registra el cuerpo central del crucero y la cúpula. La asignación arquitectónica de cada volumen se desarrolla y explica en el modelo principal.

`coreExcludedBuildingIds` contiene las **nueve identidades catastrales y las dos identidades OSM**, `203084352` y `1303709333`. Deben excluirse todas de la ciudad genérica para evitar que aparezcan bloques superpuestos a la ermita. Las partes de viviendas exteriores tienen sus exclusiones propias en `excludedBuildingIds`.

No se transfieren partes desde ningún contexto anterior. `withoutSangreClaims` mantiene el contrato inmutable de las iteraciones anteriores, pero en esta selección sus listas de transferencia están vacías y devuelve los contextos originales. Los padres catastrales que intersectan geometrías previamente asignadas se conservan en su propietario anterior, incluidos los casos donde sólo una parte de la parcela había recibido detalle.

El plano de comprobación `validation-v15/sangre-context-source-plan.png` representa el núcleo, la escalinata reservada, la plaza inferida, las viviendas, el residual OSM y los propietarios anteriores. Es un plano de trabajo derivado de las fuentes, no un documento catastral.

## Plaza y conexiones exteriores

La cartografía disponible no aporta un polígono independiente de la plaza. Su contorno se **infiere del espacio libre entre las huellas de los edificios y los ejes de calle**, y se recorta contra la ermita, las viviendas y la escalinata. La fotografía municipal de agosto de 2020 permite contrastar la escala de ese espacio, la escalinata rojiza, el pavimento gris y el caserío de fachadas claras. No se presenta el contorno inferido como una medición exacta de la plaza actual.

El pavimento sigue Calle Nueva Sangre y los enlaces cartografiados de Calle Vieja del Castillo, Dolores, Cubertorer, Leonardo Argensola, Isabel Cuello, Peñetas y los tramos sin nombre de la captura OSM. Los ejes se recortan dentro del ámbito de detalle; los fragmentos parciales conservan `sourceId` y `sourceCoordinates` para seguir su procedencia. No se inventan pasos peatonales atravesando viviendas o el recinto religioso.

Sólo se excluyen de la ciudad genérica las cuatro vías cuya sustitución es completa: `1357547433`, `1365045231`, `1419209828` y `733344350`. Las demás conservan sus continuaciones fuera del contexto. El tramo occidental de Nueva Sangre ya representado por la judería permanece en esa escena; el nuevo pavimento se recorta contra el pavimento existente.

La revisión del render detectó dos pequeñas piezas claras que atravesaban la plaza. Los rayos sobre la escena exportada identificaron su origen en los **bordillos de la ciudad genérica**, que seguían dibujándose sobre el nuevo pavimento al conservar las vías parciales. Se añadieron **27 máscaras de exclusión espacial del render**, derivadas de la plaza y de los nueve ejes parciales. Se mantienen dentro del pavimento propio, con una guarda interior de 1 cm frente a las fachadas. Su área fuera del pavimento detallado es cero. Retiran la calzada y los bordillos genéricos en los segmentos ya representados, conservando los ejes originales, la adaptación del terreno y las continuaciones exteriores. No son barreras de circulación ni nuevos recintos patrimoniales.

La envolvente reservada para los siete peldaños se toma de `sangre-plan.json.contextOwnership.stairEnvelope`. El modelo principal representa los peldaños dentro de ella y aplica un ajuste de suelo limitado al primer peldaño. El contexto no cubre esa envolvente con otro pavimento ni añade una plataforma general.

## Relieve y continuidad de las superficies

El contexto **no introduce parches que aplanen el MDT**. Las calles, la plaza y los zócalos se adaptan a `terrain.meshHeightAt` después de construir el relieve definitivo. La diferencia de cota de los bordes de la ermita y la relación de la nave con la ladera se mantienen como parte de la composición; no se coloca todo el barrio a una cota única.

Las superficies se preparan sobre las celdas exactas de 2,5 m y sus diagonales del terreno final. Esto evita que un triángulo de pavimento cruce varios planos del terreno y se hunda o quede suspendido en su interior. El pavimento consta de **1.495 triángulos**, **1.277 vértices** y **1.059 segmentos de borde**. Se eleva 10,5 cm sobre la superficie para su lectura gráfica; los bordes descienden hacia el suelo. Ese desplazamiento es una decisión del render, no una cota arqueológica o constructiva.

Los recortes incluyen todas las partes catastrales, el residual OSM conservado, los patios conocidos, la ermita, su escalinata y los pavimentos de propietarios anteriores. Las diferencias numéricas de cobertura, solape con edificios o solape con pavimentos anteriores son inferiores a **0,001 m²** en la comprobación geométrica.

## Edificios, cubiertas y límites del detalle

El render reutiliza el constructor catastral común de la judería y Berenguer: volúmenes sobre sus huellas, zócalos que siguen la pendiente, cornisas, huecos, carpinterías oscuras, revocos claros y cubiertas de teja o azotea según la información disponible. Las texturas y el relieve superficial de piedra y teja se generan de forma procedural y comparten la paleta del atlas.

Las plantas y alturas de referencia tienen procedencia cartográfica. **La distribución de ventanas, balcones, revocos, carpinterías y los detalles menores de cubierta son interpretativos.** La fotografía municipal se utiliza para ajustar el lenguaje material y la escala visual de las viviendas próximas, pero no acredita cada hueco de cada fachada. La referencia fotográfica de 2020 tampoco demuestra que todas las fachadas conservaran exactamente ese aspecto en 2026.

Un caso concreto de cobertura incompleta requería conservar parte de OSM: el edificio `733403822` sólo tenía algunas de sus partes representadas en la selección catastral del padre `3558705YJ3935H`. Excluir el edificio completo de la ciudad genérica habría dejado un vacío artificial. Se conserva su residual de **52,11 m²**, descontando las partes catastrales, el núcleo y otros propietarios. La fila derivada `733403822-residual-0` conserva `sourceId`, el contorno OSM original en `sourceResiduals` y el método de recorte. Se omiten sólo pequeñas diferencias de registro inferiores a 2 m². Este recorte no se presenta como una nueva huella levantada sobre el terreno.

### Alturas revisadas

De las 152 piezas, **76 usan estimaciones MDS normalizado del IGN** y **76 usan el número de plantas de Catastro como referencia**. No se utiliza la altura doméstica de reserva del constructor. Cuatro partes presentaban una estimación superficial inferior a 1,75 m por planta registrada; se conserva esa fuente sin modificar y se dibujan con una altura explícitamente interpretativa de 3 m por planta:

| Parte | Estimación superficial de origen | Plantas | Altura utilizada en el render |
| --- | ---: | ---: | ---: |
| `cat-3657309YJ3935H_part1-0` | 2,8 m | 3 | 9 m |
| `cat-3657327YJ3935H_part2-0` | 3,0 m | 4 | 12 m |
| `cat-3658211YJ3935H_part2-0` | 5,2 m | 3 | 9 m |
| `cat-3658917YJ3935H_part2-0` | 3,6 m | 3 | 9 m |

Los cuatro casos se detallan en `heightReview`. El ajuste sólo se aplica a copias de trabajo del render; el JSON conserva las alturas originales de las fuentes. No se afirma que 9 o 12 m sean alturas medidas de esas fachadas. Las estadísticas se recalculan desde la evidencia de cada pieza y permanecen estables después de repetir `bindGround`.

## Focos de visita e integración

Se aportan dos puntos de observación, enlazados con la documentación histórica de la visita:

| Foco | Coordenada geográfica | Función |
| --- | --- | --- |
| `sangre-plaza` | `[-0.277459590, 39.678236436]` | Relación de la fachada, escalinata y espacio público |
| `sangre-entorno` | `[-0.277337034, 39.678447539]` | Calle Sang Nova y conexión con Dolores |

Los focos conservan su posición física en la vista cercana, también en pantallas estrechas (`closeScale=false`). Son puntos de lectura de la maqueta; no certifican un itinerario accesible ni horarios de paso. La navegación general y el modelo principal incorporan el resto de las paradas de la visita.

Tras revisar la imagen, la observación cercana de la plaza se desplazó hacia la calle occidental y elevó su punto de mira, con un campo vertical de 46°. Permite leer la escalinata y el conjunto de la fachada sin dedicar casi todo el encuadre al suelo. Se comprobó que su posición no introduce la cámara en las viviendas próximas; la altura corresponde a la exploración de una maqueta, no a una vista peatonal de 1,70 m.

La integración debe crear `createSangreContext({data, heightAt, contextData, visitData})`, incorporar sus exclusiones de ciudad y calles, adjuntar su grupo conservando las coordenadas mundiales y llamar a `bindGround` con el suelo final. El color temático utiliza la capa `context` de la leyenda de la visita. El modo de materiales restaura las texturas y los mapas de relieve originales; cada instancia mantiene sus propios recursos para poder liberarlos sin afectar a otra escena.

## Verificación y reproducción

La validación independiente pasa **49 comprobaciones**, incluidas la conservación de las 151 filas catastrales y las nueve del núcleo, la propiedad única frente a las cinco escenas anteriores, el tratamiento del residual OSM, las cuatro revisiones de altura, la ausencia de aplanamiento del contexto, la restauración de materiales y la liberación de recursos. Repetir el enlace al terreno mantiene los recursos y las estadísticas de procedencia estables.

El contexto produce **9 mallas y 27.745 triángulos**, con atributos finitos. **5.980 muestras** en caras y bordes del pavimento se mantienen al desplazamiento previsto sobre la malla del terreno, con un error máximo aproximado de **0,000005 m** debido a precisión numérica. La prueba independiente usa la misma malla de 2,5 m; la validación integrada de V15 añade los parches del núcleo y los demás monumentos, las cámaras de visita y el render de la escena completa.

Una prueba adicional de **cinco condiciones** reproduce los bordillos duplicados en cinco puntos extraídos de la imagen, confirma su desaparición junto con la calzada superpuesta y verifica la conservación de una continuación exterior de cada una de las nueve vías parciales. Utiliza los constructores de calles y ciudad de producción con un suelo plano para aislar la propiedad de los segmentos; la prueba del terreno final permanece en la validación integrada. El resultado está en `validation-v15/sangre-street-overlap-qa.json`.

La preparación requiere Python con Shapely 2.1 o posterior. Matplotlib se usa sólo para el plano de trabajo. Estas dependencias no forman parte de la web publicada.

```sh
python research/validation-v15/prepare_sangre_context.py
python research/validation-v15/render_sangre_context_plan.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v15/validate_sangre_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v15/validate_sangre_street_overlap.mjs
```

Informes: `validation-v15/sangre-context-qa.json` y `validation-v15/sangre-context-pavement-qa.json`. Los hashes de las capturas de entrada se guardan en `sangre-context.json.inputHashes`; permiten identificar qué cartografía y qué contextos se utilizaron para preparar el resultado.

## Fuentes y atribuciones

- [Catastro INSPIRE Buildings](https://www.catastro.hacienda.gob.es/webinspire/): plantas, subdivisiones y número de plantas de la captura reutilizada. El resultado es un producto derivado y no información catastral oficial.
- [OpenStreetMap · Calle Nueva Sangre](https://www.openstreetmap.org/way/87552079): ejes, conexiones y huellas complementarias. © OpenStreetMap contributors, ODbL 1.0.
- [IGN · MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y [PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma): fuentes de relieve, alturas y contraste cartográfico ya registradas en el atlas. IGN/CNIG, CC BY 4.0.
- [Ayuntamiento de Sagunto · Mejora de la iluminación de la fachada, 18 de agosto de 2020](https://aytosagunto.es/es/actualidad/comienzan-las-obras-de-mejora-de-la-iluminacion-de-la-fachada-de-la-ermita-de-la-sangre/): fotografía de contraste de fachada, escalinata, plaza y viviendas próximas. La fotografía se consultó como referencia; no se incorporó a la galería ni a las texturas de la aplicación.
- [Ayuntamiento de Sagunto · Xiuxiueig, Ermita de la Puríssima Sang](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/ermita-de-la-purissima-sang/): localización y contexto del monumento. Los episodios históricos y sus matices se documentan por separado en `sangre-history.md` y en la visita.
