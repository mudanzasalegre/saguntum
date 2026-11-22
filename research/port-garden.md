# Puerto de Sagunto: Gerencia, Casino y Begoña

## Alcance de la entrega

Se incorporan los lugares 17, 18 y 19 del atlas. Los tres conjuntos comparten el sistema métrico del resto de Sagunto: origen WGS84 `[-0.278,39.679]`, X hacia el este, Z hacia el sur, elevaciones en metros. No se incorporan fotografías históricas a la aplicación. Las imágenes institucionales se consultaron únicamente como documentación arquitectónica.

El resultado es una interpretación arquitectónica documentada. No constituye un levantamiento de precisión ni certifica el estado físico de cada elemento en noviembre de 2026. La fecha de consulta de un mosaico PNOA tampoco equivale a su fecha de vuelo.

## Fuentes consultadas

- [Ayuntamiento: cuaderno del estudiante sobre el patrimonio industrial](https://aytosagunto.es/media/qwub41a1/01_cuaderno_estudiante_cast.pdf), páginas impresas 14–16: fotografías y descripciones de los edificios, organización social y cronología.
- [Universitat de València: conjunto de la Gerencia](https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html): descripción de los espacios y elementos arquitectónicos; sus referencias al uso contemporáneo son antiguas y no se utilizan para afirmar el estado actual.
- [Casino Recreativo y Cultural: historia de la propia entidad](https://www.casinopuertosagunto.com/historia/): edificio de 1921 y constitución de la entidad en 1941.
- [Ayuntamiento, 6 de octubre de 2026: rehabilitación del Casino en ejecución](https://aytosagunto.es/es/actualidad/2026-10-06-avanzan-las-obras-de-rehabilitacion-del-casino-de-la-gerencia/).
- [Ayuntamiento, 17 de diciembre de 2025: contrato para completar las obras del Casino](https://aytosagunto.es/es/actualidad/2025-12-17-adjudicado-el-contrato-para-retomar-y-terminar-las-obras-del-casino-de-la-gerencia/): actuaciones pendientes, incluido el cierre acristalado del patio. La previsión contractual no se interpreta como una obra ya concluida.
- [Ayuntamiento, 15 de noviembre de 2023: recuperación del jardín oriental](https://aytosagunto.es/es/actualidad/las-obras-de-la-zona-este-de-la-antigua-gerencia-de-ahm-han-finalizado/).
- [Ayuntamiento, 3 de marzo de 2026: adjudicación de la restauración paisajística del entorno](https://aytosagunto.es/es/actualidad/2026-03-03-adjudicado-el-contrato-para-la-restauracion-paisajistica-en-el-entorno-de-la-gerencia-de-puerto-de-sagunto/).
- [Dirección General del Catastro: edificios INSPIRE](https://www.catastro.hacienda.gob.es/webinspire/index.html), conjunto `A.ES.SDGC.BU.46222`, metadatos de agosto de 2026.
- [OpenStreetMap: edificio de Begoña](https://www.openstreetmap.org/way/443618470), parque `1458486121` y paseo `447370841`.
- [IGN / CNIG: PNOA Máxima Actualidad](https://www.ign.es/wms-inspire/pnoa-ma), consulta de 19 de noviembre de 2026; fecha de vuelo de cada tesela no verificada.

## Base geométrica y decisiones

### Gerencia y Ciudad Jardín

Catastro identifica el conjunto de Gerencia y Casino con la referencia `8338801YJ3983N`: 19 componentes de huella y 43 partes de distinta altura administrativa. Se mantienen los contornos de los cuerpos principales. El modelo reúne las oficinas en un conjunto y representa once grupos de chalés o adosados. El dato histórico de 22 viviendas no se convierte artificialmente en 22 edificios aislados.

Las cubiertas se contrastaron con un recorte PNOA de 1800 × 1215 píxeles: oeste −0.2255, este −0.2207, norte 39.66025 y sur 39.65775. Los píxeles digitados y la URL WMS quedan dentro de `port-garden.json`; permiten repetir la comparación con las huellas catastrales. La conversión de píxel a WGS84 es lineal sobre esos límites. El Catastro original, en EPSG:25830, se transformó con GDAL.

Se representan fachadas con zócalos, marcos, persianas, chimeneas, terrazas y los remates curvos de las villas centrales. Los caminos siguen el paseo OSM y la lectura de PNOA. La vegetación se coloca evitando edificios y caminos, preservando el área occidental abierta que se aprecia en la ortofoto. Las alturas, decoración menuda, especies y posiciones de árboles son interpretativas. Las pequeñas construcciones auxiliares cuyo estado no se reconoce suficientemente en la ortofoto quedan registradas como omitidas, en lugar de reconstruirse con alzados inventados.

### Casino

Se conserva el contorno catastral del componente 13 y el patio de la parte 35. La cubierta forma un anillo que deja visible el vacío central; los cuatro frentes, la terraza elevada, las escaleras y el jardín permiten una lectura exterior del conjunto. Las proporciones de terrazas y mobiliario son interpretativas.

La ubicación del edificio se apoya en Catastro/PNOA. El punto postal del mapa de la asociación cae varias decenas de metros al este y no se utiliza como centro del modelo. La ficha indica obras en ejecución según la comunicación municipal de octubre de 2026. No se añade la cubierta de vidrio proyectada ni se anuncia una reapertura que no está acreditada.

### Begoña y Alameda

La huella OSM en L se contrasta con Catastro `8338803YJ3983N` y PNOA. El cuerpo principal es un rectángulo aproximado de 26.35 × 26.37 m, con dependencias al noroeste. Se modelan las tres naves, la nave central elevada, los óculos laterales, las cubiertas, el anexo parroquial, la fachada ornamentada y un campanario con vanos realmente abiertos. El frente principal mira hacia el sureste y la Alameda.

La altura del campanario, sus molduras, la decoración y el interior son aproximaciones visuales. El interior muestra la distribución basilical; no pretende reproducir todos los bienes litúrgicos ni cada sala. Las cubiertas constituyen un grupo independiente por si se habilita la inspección de las naves. El entorno inmediato incorpora el atrio, bancos y arbolado a escala peatonal.

## Integración

`createPortGarden({heightAt,project,records})` devuelve `group`, `sites` y `stats`. Cada sitio ofrece su punto, vistas, cimentaciones, exclusiones y focos secundarios. Los registros incluyen fuentes, estado documental, evidencias, referencias catastrales y límites de fidelidad.

Para evitar edificios duplicados, la capa de contexto debe excluir las referencias catastrales `8338801YJ3983N` y `8338803YJ3983N`, además del edificio OSM `443618470`. El perímetro de Gerencia se emplea para evitar vegetación genérica superpuesta a sus jardines. Los modelos conservan la escala métrica y proporcionan cimentaciones, pero no implementan todavía navegación peatonal ni un sistema completo de colisiones.

## Comprobación

Se ejecuta la geometría real de Three.js con el cargador local del proyecto. La primera comprobación generó 38 mallas con aproximadamente 336 000 triángulos y ninguna coordenada no finita ni triángulos degenerados. Se revisan también representaciones de esta misma geometría con Blender en CPU; estas imágenes no sustituyen una prueba WebGL interactiva. Los resultados de la integración y de los encuadres del atlas completo corresponden a la verificación general de la iteración.

La comprobación adicional con rayos confirma que el centro del patio del Casino permanece abierto: el primer impacto vertical se produce en el pavimento, no en la cubierta. La entrada mediante un diccionario de registros, la cubierta independiente de Begoña y las exclusiones de los edificios duplicados también se verifican.
