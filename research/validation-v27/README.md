# V27 · Iglesia de Begoña y Alameda

La iteración incorpora una visita completa a Begoña dentro de **SAGUNTUM · Atlas
vivo**. Conserva la entrada territorial `#atlas`, los 31 lugares y las seis
regiones, y amplía a 21 las visitas guiadas. La ruta de esta escena es `#begona`.

## Alcance y decisiones

El modelo sustituye la representación compacta anterior. Incluye la fachada
restaurada, la portada, el campanario central, las torrecillas, la cúpula y la
linterna; tres naves, columnas toscanas, arcadas, claristorio, presbiterio, capillas,
coro y órgano. La cubierta se representa mediante arcos diafragma y placas
inclinadas de hormigón. Casa Abadía y las dependencias parroquiales completan la
envolvente y su relación con la parcela.

La planta parte de cartografía OSM y Catastro contrastada con ortofoto. Las alturas,
los detalles ornamentales, parte de la policromía y el mobiliario son
interpretaciones proporcionadas. Las fotografías proceden de fechas distintas:
la escena no constituye un levantamiento ni un inventario del interior en 2026.
El órgano sigue documentación fotográfica publicada en 1990; su funcionamiento
actual queda sin afirmar. Las esculturas litúrgicas se resuelven de forma abstracta.

La guía reúne 20 paradas, ocho vistas interiores, 40 hechos con referencias,
15 fuentes y once hitos cronológicos. El plano tiene 272 componentes registrados
desde la geometría. Distingue la planta del templo y el coro elevado, con la nave
inferior como referencia de orientación. La sección retira conjuntamente las
cubiertas y los elementos superiores dependientes, incluido el coro, su órgano y
las lámparas. Casa Abadía y el anexo permanecen cubiertos, preservando su lectura
como envolventes con interiores sin reconstruir.

## Alameda y continuidad urbana

El contexto aporta 9.347,38 m² de superficies diferenciadas, 37 árboles registrados
en la ortofoto, 11 bancos, siete luminarias, tres recorridos y una zona de juegos.
Se refinan 64 partes de edificio de 28 parcelas y se reutilizan otras 90 partes del
entorno. La revisión próxima añade 94,34 m² de pavimento junto al costado
noreste del templo, recortado entre la parcela y el viario existente. El memorial obrero se representa esquemáticamente, con posición
aproximada declarada. El conjunto se apoya en el terreno de producción del Puerto.

La transferencia de suelo desde el contexto del Museo Industrial abarca
3.640,32 m². Conserva sus 69 partes de edificio, 20 carreteras, focos, colisiones,
farolas y pasos de peatones. Retira diez árboles que duplicaban el nuevo ámbito y
recorta un bordillo. Su plano se actualiza únicamente en la geometría de contexto;
los veinte registros de parada conservan sus coordenadas y metadatos originales.

Durante la revisión se detectaron 614,59 m² de suelo sin cubrir. Dos volúmenes
catastrales descartados en V24 se estaban utilizando aún como obstáculos de
recorte. Se incorporó esa exclusión histórica al generador y quedó una diferencia
numérica de cobertura de 0,0046 m². La antigua escuela y las esculturas previstas
para diciembre de 2026 no se representan como construcciones actuales.

## Validación final

| Ámbito | Resultado | Informe |
| --- | --- | --- |
| Arquitectura y huecos físicos | 159 comprobaciones correctas | `begona-model-qa.json` |
| Contexto de producción | 43 comprobaciones correctas | `begona-context-model-qa.json` |
| Fuentes y cobertura del contexto | 15 comprobaciones correctas | `begona-context-source-qa.json` |
| Transferencia aplicada a la Alameda | 18 comprobaciones correctas | `begona-alameda-ownership-transfer-qa.json` |
| Registro documental | 17 comprobaciones correctas | `begona-documentary-qa.json` |
| Mapas Canvas | 98 casos correctos | `begona-map-qa.json` |
| Navegación de las 21 visitas | 53 comprobaciones correctas | `visit-controller-results.json` |
| Distribución, sintaxis y dependencias | 546 comprobaciones correctas | `static-assets-qa.json` |
| Puerto completo y cámaras reales | 781 comprobaciones; 126 cámaras; cero errores | `integrated-scene-qa.json` |

El modelo arquitectónico contiene 92.775 triángulos en 149 mallas, con 57 huecos
físicos de ventana y tres de puerta. El contexto añade 45.006 triángulos en 22
mallas. La escena regional integrada contiene 877 mallas y 4.165.872 triángulos,
incluidas las instancias y las iteraciones anteriores.

El primer pase integrado, conservado como `integrated-scene-initial-qa.json`,
detectó seis obstrucciones de la cámara lateral por edificios vecinos. Se acercó
el encuadre al espacio disponible en la calle y el pase final resolvió las seis.
También se corrigieron los apoyos de torre y torrecillas, las alturas de los
machones laterales, los encuentros posteriores de las cubiertas, el entramado del
hastial y los reclinatorios duplicados. Las ventanas y puertas se verifican con
rayos sobre huecos físicos; los interiores conservan su techo en la vista normal.
La revisión visual añadió los soportes de campanas y las peanas de las figuras,
retiró las lámparas dependientes de la cubierta en sección y mantuvo cubiertas
las dependencias cuyos interiores no se han reconstruido.

## Revisión visual y sus límites

La revisión visual final se registra en `visual-review.json`. Las siete imágenes
de inspección se generan mediante Blender en CPU, a partir de las mallas,
normales, texturas procedimentales y cámaras exportadas de producción. Cada
imagen conserva un manifiesto con las huellas del archivo geométrico y del
renderizador, resolución y muestras. La iluminación se aproxima para inspección;
las imágenes no son capturas del navegador.

El estado de previsualización disponible era «Sites preview stopped». No había
evidencia de recuperación de los problemas anteriores de autoridad de URL y
WebGL; se mantuvo el diagnóstico documentado en `browser-limitations.json`.
La distribución y la geometría quedan comprobadas, mientras que la disposición
completa en navegador, los FPS y la memoria GPU no están verificados.

## Reproducción

Desde la raíz del repositorio, con las dependencias del runtime habilitadas:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validation-v27/validate_begona_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v27/validate_begona_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v27/build-begona-plan.mjs
python research/validation-v27/validate_begona_documentation.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v27/validate_begona_maps.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v27/validate_visit_controllers.mjs
python research/validation-v27/validate_static_assets.py
node --experimental-loader ./research/validate_loader.mjs research/validate_port_v27.mjs --export
python research/validation-v27/render-begona-scenes.py
```

La transferencia de propiedad del suelo ya está aplicada. Su informe conserva el
estado previo; no se debe repetir `--apply` sobre los datos transformados. El
generador documental protege las coordenadas registradas. Los archivos geométricos
comprimidos y los logs de render se excluyen de Git; pueden reproducirse desde el
estado de fuente conservado. El refinamiento del pavimento lateral se reproduce con
`refine_begona_sidewalk.py`; su informe verifica que los contextos vecinos y la
evidencia de transferencia permanecen idénticos.

El diagnóstico `begona-context-visual-review.json` incluye un rectángulo negro
visible en el primer render de Alameda. La geometría estaba completa: el adaptador
CPU había convertido el pavimento genérico en emisor de sombra, ignorando
`castShadow=false`. Dos recortes con idénticas mallas aislaron la causa. El exportador
y Blender respetan ahora ese indicador de producción; el viario queda intacto.

Los razonamientos y las referencias completas se encuentran en
`research/begona-research.md`, `research/begona-model.md` y
`research/begona-context-research.md`.
