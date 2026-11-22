# Casa del Mestre Penya: replaza, calles y caserío compartido

V17 · documentación del entorno · 20 de noviembre de 2026.

## Qué se ha registrado

La escena conserva la posición cartográfica del museo y completa su confluencia con Castell, Dolors y Cubertorer, la conexión de En Jou y el acceso al barrio judío por Sang Vella. La memoria de los arquitectos describe precisamente la implantación en esta confluencia. La fotografía exterior publicada con la rehabilitación muestra una calle en pendiente, una acera estrecha y jardineras junto al frente. No respalda convertir el lugar en una gran explanada plana ni añadir una escalinata monumental.

El proyecto de conservación redactado por Fernando Cos-Gayón López el 1 de agosto de 2025, tras la inspección del 14 de julio, aporta plantas que permiten corregir una ambigüedad inicial: las unidades principal y doméstica del museo caben dentro de la parcela **3558701YJ3935H**, de aproximadamente 307 m². Los dos cuerpos cartográficos de **3558702YJ3935H**, al este, se representan como edificación vecina. No se amplía el museo hacia esa propiedad para encajar una interpretación equivocada de los planos antiguos. El expediente publicado en 2026 no se utiliza como prueba de obras terminadas en ese año.

Los planos técnicos, las fotografías de los arquitectos y las huellas actuales se complementan; las dimensiones menores de la escena no equivalen a un levantamiento arquitectónico.

## Propiedad de la geometría

La Casa del Mestre Penya se encuentra entre entornos que ya se habían desarrollado en visitas anteriores. Se ha auditado la propiedad de cada parte de edificio, calle y pavimento antes de añadir geometría.

| Elemento | Tratamiento |
|---|---|
| Museo, parcela 3558701 | Dos partes fuente reservadas al modelo específico del museo. |
| Caserío nuevo | 44 partes de Catastro en 21 parcelas que ningún contexto anterior reclamaba. |
| Contexto anterior próximo | 178 registros de partes reutilizadas visualmente, con propietario explícito. |
| Calles anteriores | 15 registros de trazados o fragmentos reutilizados, sin cambio de fuente ni de posición. |
| Nuevas calles | Cinco fragmentos. Ninguno sustituye una vía fuente completa. |
| Arco frente al museo | Conserva la geometría, paso y propietario de la visita de la Judería. |

No hay transferencias de propiedad. También se rechazan parcelas parcialmente reclamadas por una visita anterior, para evitar reconstruir de forma incoherente una misma casa. Los siete archivos de contexto anteriores permanecen intactos y sus huellas de contenido se guardan en `inputHashes`.

El arco frente al museo es **OSM 1303697035**, situado aproximadamente en **−0.2781812925, 39.6785557926**. Es distinto del **Portalet de la Sang, OSM 733421700**. La visita del museo señala el arco existente de la Judería, sin crear una segunda malla y sin atribuirle la fecha de 1321. `sharedContext.protectedArc` registra esta diferencia y el propietario; `sharedContext.buildings`, `roads` y `paving` explican la reutilización del barrio.

## Edificios, alturas y materiales

Las 44 partes nuevas conservan exactamente las coordenadas, número de plantas, alturas fuente, fecha y procedencia de sus registros de Catastro. No se mueven casas para despejar una cámara. Las alturas del render proceden de 25 estimaciones del MDS normalizado del IGN y de 19 cálculos mediante plantas catastrales por tres metros. No se utiliza una altura genérica sin referencia y no ha sido necesario elevar artificialmente cubiertas para ocultar intersecciones con el terreno.

Los alzados domésticos incluyen huecos, carpinterías, balcones, recercados y remates, con cubiertas y tonos vinculados a los registros disponibles. Estos detalles son una interpretación del caserío, no una reproducción medida de cada fachada. Las parcelas y los cuerpos diferenciados conservan los cambios de altura presentes en las fuentes. Los huecos entre cuerpos y los patios privados se excluyen de la nueva pavimentación.

Se añaden cuatro jardineras cilíndricas con pequeños árboles como referencia al tipo de mobiliario visible en la fotografía de los arquitectos. Su colocación, tamaño y vegetación son interpretativos. No se afirma que formen un inventario actualizado de los ejemplares existentes ni se añaden árboles para ocultar problemas de registro.

## Pavimento y relieve

La cartografía local no contiene un polígono de plaza para este lugar. El perímetro de la replaza se infiere del frente catastral y de los vacíos públicos entre los ejes de calle. Se identifica expresamente como `derived`; no se presenta como un límite histórico, una parcela oficial ni un área patrimonial delimitada.

El nuevo pavimento cubre **491,34 m²**, de los cuales **123,61 m²** completan fragmentos libres de la replaza. Dentro del área interpretada de la replaza se reutilizan además **87,56 m²** de pavimentos anteriores. La diferencia geométrica elimina las superficies ya detalladas, el núcleo del museo, el caserío y los patios privados antes de triangular. El área nueva no se superpone con las calles de la Judería o de la Sangre.

La superficie resultante tiene 481 vértices, 563 triángulos y 391 segmentos de borde. Cada triángulo se recorta contra las celdas y diagonales de la malla final de relieve de 2,5 metros. La holgura gráfica es de 10,5 centímetros; los laterales cierran el borde. Se preservan la pendiente y las continuaciones de las calles. El contexto no genera ninguna plataforma de nivelación del terreno.

Las máscaras `genericStreetExclusions` retiran solamente el render genérico situado bajo el pavimento nuevo. Los ejes originales, los tramos exteriores y las superficies detalladas de las otras visitas permanecen. Las máscaras tienen un pequeño margen interior para no invadir paredes catastrales contiguas.

## Navegación y contrato de integración

`createMuseoContext` devuelve geometría y focos en coordenadas del atlas. El grupo debe incorporarse mediante `attach` si el museo utiliza un sistema local. `bindGround` vuelve a adaptar edificios, pavimento, mobiliario y focos al muestreador final del terreno. Las instancias poseen sus materiales, texturas y geometrías; el cambio de lectura y la liberación de una escena no afectan a otra.

La visita recibe cuatro focos: **replaza**, **arco**, **Judería** y **entorno de Dolors/Cubertorer**. Las observaciones cercanas se sitúan en espacio público, a 2,15 metros sobre la malla de suelo —aproximadamente 2,05 metros sobre el pavimento añadido—. Se verifican sus líneas de visión contra el museo, los contextos previos, los arcos y los edificios genéricos. No se coloca al observador dentro de una vivienda ni de pie sobre una azotea. Las vistas generales conservan carácter aéreo.

La lectura temática utiliza la capa **barrio**. El arco sigue siendo parte de la Judería y se enlaza desde el museo; su material no se modifica desde el contexto nuevo. El follaje y los troncos de las jardineras responden al control global de vegetación, mientras los recipientes permanecen como mobiliario de la calle.

## Verificación

`validate_museo_context.mjs` comprueba 45 condiciones sobre conservación de fuentes, propiedad única, pavimentación, alturas, recursos, lectura y enlace con el terreno. En 2.252 muestras de caras, aristas y centroides, el error máximo respecto a la separación prevista del relieve es inferior a 0,000004 metros. Los errores residuales de intersección o cierre de la preparación geométrica están por debajo de 0,001 m².

El contexto aporta 13 mallas y 20.283 triángulos. El segundo enlace al terreno mantiene la misma cantidad de recursos; instancias independientes no comparten materiales ni texturas, y `dispose` los libera. El informe de cámaras se conserva por separado porque depende del modelo de museo y de toda la escena integrada.

La figura `validation-v17/museo-context-source-plan.png` permite revisar el núcleo, las parcelas añadidas, el caserío ya existente, el arco protegido y los nuevos fragmentos de pavimento.

## Fuentes

- [Vía Arquitectura: Casa del Mestre Peña](https://via-arquitectura.net/arav07/096-arav07.htm). Memoria de Julián Esteban Chapapría, Carles Boigues Gregori y José Ignacio Casar Pinazo; plantas, secciones y fotografías de la rehabilitación.
- [Proyecto de conservación de 2025, publicado en la Plataforma de Contratación](https://contrataciondelestado.es/FileSystem/servlet/GetDocumentByIdServlet?DocumentIdParam=ihKowu21j5t8CwPcm4L4FDXBIGteKJw%2BbX4Xx1Uy701YxEe7nC3Lu31H68efJ5SUYcvrbM14rcAdZdZL6CYnAnwSmtNeOCNrKZWURXQUmMGB0nvVKRzfe4rpHcnlPhSZ&cifrado=QUC1GjXXSiLkydRHJBmbpw%3D%3D). Fernando Cos-Gayón López; páginas 4 y 9–11 para el encaje de las unidades.
- [Catastro INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/). Cuerpos edificados del municipio de Sagunto, fecha de los registros 21 de agosto de 2026. Obra transformada; no constituye cartografía catastral oficial.
- [OpenStreetMap: arco frente al museo](https://www.openstreetmap.org/way/1303697035), trazados de calle y geometría conservados en el atlas. © OpenStreetMap contributors, ODbL 1.0.
- [IGN: MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado) y [PNOA](https://www.ign.es/wms-inspire/pnoa-ma). Alturas, relieve y tonos de cubiertas; atribución IGN/CNIG, CC BY 4.0.

## Reproducibilidad

La preparación y el plano utilizan Shapely y Matplotlib únicamente fuera de la aplicación publicada. Las validaciones de la escena usan el cargador de Three.js y el adaptador de Canvas ya empleados por el repositorio:

```sh
python research/validation-v17/prepare_museo_context.py
python research/validation-v17/render_museo_context_plan.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v17/validate_museo_context.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v17/validate_museo_context_cameras.mjs
```

Los scripts regeneran únicamente los archivos de contexto del museo y sus informes. La revisión integral de la aplicación y la publicación pertenecen a la integración de V17.
