# V24 · Nave de Efectos y Repuestos: entorno cartográfico

La escena sitúa el museo entre la avenida del 9 de Octubre, la aproximación de Fundición, el conjunto de edificios públicos situado al sur y oeste, el aparcamiento comercial oriental y la plaza al norte. La geometría incorpora las huellas actuales del conjunto de Catastro empleado por el atlas, los ejes de OpenStreetMap y una referencia PNOA georreferenciada consultada el 20 de noviembre de 2026. La fecha de consulta no permite afirmar la fecha de vuelo ni que todos los detalles correspondan al mismo estado histórico.

## Núcleo y encaje

La nave mantiene el origen cartográfico **−0.2216385,39.65754705**, giro 1.0446 radianes y las dos partes del inmueble **8335601YJ3983S**. El cuerpo principal tiene una envolvente cartográfica aproximada de 60,67 × 20,22 m. La franja anexa al nordeste forma la segunda parte. Ambos cuerpos se reservan al modelo específico `museo-industrial.js`, sin extrusión genérica duplicada.

La discrepancia con las medidas documentales 70 × 18 m y anexo 34 m queda registrada por la guía y el modelo. El contexto no ensancha la parcela para forzar esas cifras nominales. Las cotas verticales y las anchuras visuales no equivalen a un levantamiento topográfico.

## Edificación próxima y propiedad

Se detallan **69 partes catastrales de 18 parcelas**, con sus anillos y patios originales. Incluyen los volúmenes del complejo público inmediato, el edificio comercial al este y casas al nordeste. Se utilizan estimaciones de cubierta MDSnE2.5 existentes cuando están disponibles; el resto conserva el número de plantas fuente mediante una altura visual de 3 m por planta o, en pequeñas partes de cubierta, una altura representativa de otras partes de la misma parcela. Las fachadas, carpinterías, pretiles y colores son interpretativos; no se atribuye una fotografía medida a cada alzado.

Los edificios históricos de Gerencia, Casino, Begoña, Economato, Talleres Generales y Alto Horno conservan sus propietarios de geometría. Los distritos completos de Alto Horno y Talleres se restan con un margen de 0,7 m. Sus archivos de contexto permanecen intactos y sus huellas SHA256 forman parte de la procedencia del nuevo contexto.

### Conflicto de dos geometrías de Catastro con PNOA

La parcela **8338802YJ3983N** contiene dos partes que, si se extruyeran con sus plantas fuente, formarían bloques sobre una plaza que aparece abierta en la ortofoto. Ninguna de las dos dispone de estimación de altura MDS en el conjunto utilizado. La revisión visual del plano de fuentes detectó esta contradicción antes del cierre.

Se conservan ambas fichas completas en `withheldBuildingParts` y se reservan sus identificadores para impedir que el generador regional repita la extrusión. La escena representa el espacio abierto que se ve en la referencia. Esta decisión **no afirma una demolición, una fecha de obra ni certifica el estado físico de noviembre de 2026**: explica el conflicto de fuentes y la preferencia visual adoptada. Los registros originales de Catastro no se modifican.

## Suelo y mobiliario

El entorno añade 20 fragmentos viarios, **25,288.43m² de pavimento**,30 árboles visibles en la referencia, 8 luminarias y 5 pasos peatonales. Las posiciones se conservan como píxeles de la imagen georreferenciada para poder revisar la interpretación. Los tamaños de copa, las especies, la altura de las luminarias y las dimensiones finas del mobiliario son aproximaciones. No se reconstruye una vía férrea exterior deduciéndola únicamente de la función histórica del almacén.

Las superficies distinguen accesos del museo, viario y aparcamiento, plaza pública, aceras y terreno ajardinado seco. Los bordillos se recortan contra los edificios. Las hileras de aparcamiento reproducen de manera simplificada la disposición visible, sin coches ni obstáculos arbitrarios delante de los accesos.

El suelo se triangula contra las celdas y diagonales de la malla regional de 5 m. Sus 4.971 vértices y 7.267 triángulos siguen el relieve final mediante `bindGround`, con una separación gráfica de 3,5 cm. Se eliminan los solapes entre pavimentos y se recortan las huellas construidas. Esa separación gráfica y los errores numéricos de la prueba no expresan precisión topográfica.

## Contrato de integración

`createMuseoIndustrialContext({contextData,visitData,project,heightAt})` devuelve un grupo en coordenadas mundiales, subgrupo de vegetación, planos, recursos propios, exclusiones, polígonos de colisión y el foco `museo-industrial-entorno`. La lectura temática utiliza la clave `conjunto`. La selección, la restauración de materiales, la adaptación al terreno y la liberación de recursos siguen el contrato del entorno de Talleres. Las geometrías no se desplazan desde una raíz local después del ajuste al terreno.

El contexto final agrupa 16 mallas y 54.848 triángulos.

## Verificación

- 12 comprobaciones de procedencia y superficies superadas: huellas intactas, recubrimiento, ausencia de solapes, separación de propietarios y exclusión de las dos partes conflictivas.
- 20 comprobaciones de geometría superadas: coordenadas finitas, ausencia de triángulos degenerados, patios, propiedad, alturas de cámaras, lectura temática, ajuste al suelo y liberación de recursos.
- La imagen `validation-v24/museo-industrial-context-source-plan.png` permite contrastar todos los edificios, superficies y árboles con PNOA. La revisión identificó y corrigió las dos extrusiones incompatibles con el espacio abierto.
- Estas pruebas no sustituyen la inspección del render WebGL en un navegador. La revisión integrada de cámaras y de toda la región corresponde al informe general V24.

## Fuentes y reproducción

- [IGN/CNIG · PNOA](https://www.ign.es/wms-inspire/pnoa-ma): imagen de 1800 × 1500 píxeles, bounds −0.2238..−0.2193/39.65605..39.6590. URL completa, metadatos y huella de contenido en el JSON y en `museo-industrial-ortho-registration.json`.
- [Dirección General del Catastro · INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/): huellas de edificio, partes, plantas y procedencia de agosto de 2026, incorporadas previamente al atlas.
- [OpenStreetMap](https://www.openstreetmap.org/#map=18/39.65755/-0.22164): ejes viarios, con atribución y licencia ODbL preservadas.
- [IGN · MDT](https://datos.gob.es/es/catalogo/e00125901-spaignmdt) y [MDS normalizado](https://datos.gob.es/es/catalogo/e00125901-spaignmds-normalizado): relieve y alturas indicativas.

```sh
PYTHONPATH=/workspace/scratch/36862867499f/circo-context-research/deps python research/validation-v24/prepare_museo_industrial_context.py
node --experimental-loader ./research/validate_loader.mjs research/validation-v24/validate_museo_industrial_context.mjs
python research/validation-v24/plot_museo_industrial_context.py
```

El script de preparación requiere Shapely 2.1 o posterior; el trazado del plano requiere Pillow. La ruta PYTHONPATH del ejemplo corresponde a las dependencias ya disponibles en este entorno. No forma parte del sitio publicado.
