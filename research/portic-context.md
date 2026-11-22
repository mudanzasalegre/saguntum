# V18 · Vía del Pòrtic, plaza de la Antigua Morería y entorno actual

## Alcance y propiedad de la geometría

El contexto representa la plaza frente al espacio arqueológico, sus jardines y las calles actuales de la Morería, Huertos, Alorco y los encuentros próximos. Conserva 152 partes catastrales pertenecientes a 44 parcelas vecinas, diez patios cartografiados y 17 fragmentos de ejes de calle. No transfiere edificios ni calles desde los ocho contextos detallados en iteraciones anteriores.

Los dos edificios actuales sobre los restos tienen una propiedad diferente: los dibuja `portic.js`, que puede retirarlos al abrir el corte o activar la restitución histórica. El contexto sólo proporciona su registro, no crea un segundo edificio en el mismo lugar:

| Conjunto actual | Partes catastrales | Papel |
| --- | ---: | --- |
| 4059201YJ3945N | 8 | Bloque septentrional, asociado al solar de aproximadamente 1.700 m² descrito en la excavación de 2002–2004. |
| 4059202YJ3945N | 19 | Bloque meridional contiguo, parte del conjunto urbano situado sobre las áreas musealizadas. |
| Vecindario | 152 | Contexto estable, visible también cuando se abre el yacimiento. |

La unión de las partes de los dos bloques suma aproximadamente 3.356 m². Es una superficie cartográfica de edificios actuales; **no equivale a una superficie arqueológica excavada**. La fuente municipal de 2022 confirma la conservación de los restos en los sótanos de dos edificios, pero no define por sí sola un perímetro topográfico preciso de cada sector.

## Fuentes utilizadas

- **Catastro INSPIRE Buildings:** huellas, patios, particiones de edificios, número de plantas y procedencia conservada en `cartography.json`. [Servicio](https://www.catastro.hacienda.gob.es/webinspire/).
- **OpenStreetMap:** ejes de las calles y posición de referencia del acceso. Se conserva cada eje original junto a sus fragmentos utilizados. [Calle frente al conjunto](https://www.openstreetmap.org/way/733188292).
- **IGN MDT05 y MDS normalizado:** relieve del atlas y estimaciones de altura sobre el terreno. [Procedencia](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado).
- **PNOA Máxima Actualidad:** mosaico ya incluido en el atlas; se ha inspeccionado la forma del parque, la disposición aproximada de las copas y la organización de las cubiertas. La fecha de descarga de 19 de noviembre de 2026 no es una fecha de vuelo. [Servicio](https://www.ign.es/wms-inspire/pnoa-ma).
- **Ayuntamiento, 4 de noviembre de 2022:** ubicación en la plaza Antiga Morería, dos edificios modernos sobre el conjunto y mejoras de las barandillas del itinerario interior. [Noticia municipal](https://aytosagunto.es/es/actualidad/sagunto-inaugura-las-mejoras-de-accesibilidad-en-la-via-del-portic/).
- **Ayuntamiento, 12 de junio de 2026:** incluye la plaza Antigua Morería entre los parques con sombra. Se usa para contrastar la presencia de espacio ajardinado, sin convertir el anuncio en un inventario de árboles. [Noticia municipal](https://aytosagunto.es/es/actualidad/2026-06-12-el-ayuntamiento-de-sagunto-habilita-mas-de-30-refugios-climaticos-para-combatir-las-altas-temperaturas/).

Las imágenes de investigación no se incorporan como una galería al sitio. El plano de inspección de esta carpeta es un gráfico derivado de las huellas del atlas.

## Espacio público y materiales

Se construyen cuatro regiones de superficie independientes: asfalto, aceras, plaza peatonal y parterres. Las calzadas parten de ejes OSM; sus anchuras y las aceras se aproximan. El contorno de la plaza, su recinto redondeado septentrional y las islas vegetales se han interpretado sobre PNOA. No se presentan como una delimitación oficial ni como un levantamiento de bordillos.

La preparación geométrica recorta estas regiones contra los edificios y patios, conserva las calles previamente detalladas y evita superponer dos pavimentos en una misma zona. El conjunto de superficies nuevas tiene aproximadamente 10.355 m²: 4.111 m² de calzada, 1.608 m² de acera, 3.139 m² de plaza mineral y 1.497 m² de plantación.

La vegetación incorpora 24 árboles de geometría original, con posiciones de copa aproximadas, alturas variables y ramificación sencilla. Se añaden seis bancos interpretativos y bordillos segmentados que siguen la pendiente. No se atribuyen especies botánicas ni una posición actual certificada a cada elemento. Troncos y copas se separan en `context.vegetation` para que el control general de vegetación no retire bancos ni pavimentos.

## Alturas y relieve

Los registros originales permanecen intactos. Las alturas de los vecinos utilizan 84 estimaciones IGN y 68 alturas derivadas de plantas. Nueve conflictos quedan registrados en `heightReview`: una señal demasiado baja para varias plantas, o una señal de MDS de nueve metros o más sobre una parte catastral de una sola planta. En este último caso puede existir contaminación de cubiertas vecinas; se usa una altura interpretativa de tres metros para evitar torres falsas en pequeños patios o cuerpos bajos. El registro original sigue disponible para revisar esa decisión.

No se añade ninguna explanación del barrio. Las superficies públicas están trianguladas sobre las mismas celdas y diagonales de 2,5 m de la malla final del atlas. La diferencia numérica de ajuste al terreno es una propiedad del modelo, **no una precisión topográfica sobre el terreno real**.

## Recorte arqueológico sin un agujero rectangular en la plaza

El sombreador existente del atlas usa un rectángulo girado para recortar el terreno. La parcela actual de los dos edificios tiene bordes diferentes. `surfaceApron` contiene el complemento geométrico entre ese rectángulo y las envolventes exteriores catastrales.

El modelo arqueológico, no el contexto, dibuja esta superficie cuando el recorte está activo. De ese modo el terreno situado fuera de los bloques vuelve a ocupar las esquinas sobrantes del rectángulo y no desaparecen porciones de la plaza o de las calles al explorar el interior. El complemento se triangula con la misma malla del relieve. No introduce una ampliación ficticia del yacimiento ni identifica el límite del corte con el límite de una excavación.

## Cámaras y contrato de integración

`createPorticContext({data, project, heightAt, contextData, visitData})` devuelve el mismo contrato de contexto utilizado por las visitas anteriores: `group`, `patches`, `exclusions`, `excludedBuildingIds`, `excludedRoadIds`, `focuses`, `plan`, `stats`, `qa`, `bindGround`, modos de lectura, selección y liberación de recursos.

El grupo está en coordenadas mundiales del atlas. Debe añadirse directamente al grupo regional o mediante `attach`; no debe heredar el giro o el desplazamiento local del modelo arqueológico.

Los tres focos exteriores son `portic-plaza`, `portic-acceso` y `portic-entorno`. La posición histórica de referencia del acceso cae unos metros dentro de la huella catastral; la cámara mira hacia el frente exterior, manteniendo sus ojos fuera del bloque. Los planos conservan la referencia geográfica original, cuya precisión sigue siendo aproximada.

## Comprobación

`validation-v18/validate_portic_context.mjs` comprueba propiedad de huellas, conservación de los ocho contextos anteriores, alturas, geometría, pavimentos, posiciones exteriores de cámara, modos de materiales, independencia de recursos y liberación tras volver a enlazar el terreno. La revisión final produce 50 comprobaciones correctas, 16 mallas y 98.484 triángulos. Los 35.932 puntos de comprobación de pavimentos se ajustan al terreno final con error numérico inferior a 0,001 m.

El informe de pavimentos verifica separadamente los solapes y vacíos; el del complemento de superficie comprueba que no tape las huellas interiores. La comprobación de cámaras dentro de toda la escena y los renders finales se realiza en la integración regional, con ambos edificios anfitriones presentes.

Para reproducir la preparación se necesita Python con Shapely 2.1 o superior; para el plano también Matplotlib. La aplicación publicada no necesita esas dependencias. Para reproducir la comprobación de geometría se usa el cargador de Three del repositorio y Canvas del entorno:

```sh
python research/validation-v18/prepare_portic_context.py
python research/validation-v18/render_portic_context_plan.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v18/validate_portic_context.mjs
```

Reejecutar la preparación reescribe `portic-context.json`; si cambian las cámaras se deben sincronizar después las posiciones de la guía y del plano.
