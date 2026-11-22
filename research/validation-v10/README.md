# Verificación V10 · Plaça Major y Puerta del Almudín

Revisión del 19 de noviembre de 2026. Se distinguen las comprobaciones de geometría, integración, interfaz y render; ninguna de ellas se presenta como una medición de rendimiento GPU.

## Resultados

| Área | Resultado | Evidencia |
| --- | --- | --- |
| Integración real del atlas | 1.663 comprobaciones aprobadas | `sagunto-regression.json` |
| Modelo principal y cámaras | 468 comprobaciones aprobadas | `plaza-model-qa.json` |
| Contexto, pavimentos, cámaras y planos | 274 comprobaciones aprobadas | `plaza-context-qa.json` |
| Identidad y exclusiones cartográficas | 16 comprobaciones aprobadas | `plaza-context-geography-qa.json` |
| Controlador de las cuatro visitas | 24 comprobaciones aprobadas | `visit-controller-results.json` |
| Distribución e imports | 265 comprobaciones aprobadas | `static-assets-qa.json` |
| Revisión independiente de hastiales | 48 rayos encuentran cierre; la versión anterior falla los 48 | `plaza-gables-independent-review.json`, `plaza-gables-old-comparison.json` |
| Interfaz y móvil | Navegación, fuentes, capas y plano verificados en modo 2D | `plaza-v10-browser-evidence.json` y capturas JPG |

La visita contiene 16 paradas, 48 hechos con referencias, 16 hitos cronológicos, 18 fuentes y 5 ámbitos. Se comprueba la resolución de todos los identificadores de fuentes y de los destinos de la cronología. Las coordenadas del plano y las paradas coinciden.

## Cámaras e integración

La prueba integral ejecuta el constructor regional diferido y el encuadre de `app.js`, con las mallas reales de plaza, contexto, Santa María, edificios civiles, ciudad y terreno. Solo sustituye la carga de texturas que requiere navegador. Comprueba 102 variantes de cámara de la plaza, 102 de Santa María y 102 del Teatro Romano: conjunto o parada, vista completa o próxima, escritorio de 1363 × 936, móvil vertical de 390 × 844 y horizontal de 844 × 390.

Las cámaras permanecen por encima de la superficie final, el foco queda dentro del espacio libre de la interfaz y los límites de cada vista completa caben en el encuadre. Las vistas próximas pueden recortar deliberadamente parte de un conjunto. La prueba busca obstrucciones en los edificios genéricos, los monumentos vecinos, el caserío detallado, el pavimento y las cimentaciones. En la parada de epigrafía, el propio pretil de Santa María se considera el objeto observado: su superficie frontal no se clasifica como un edificio vecino que lo oculte. Las demás cubiertas permanecen en la prueba.

El modelo añade 96 comprobaciones de cámara contra su propia arquitectura, y el contexto verifica 24 rayos contra el conjunto civil, religioso y el terreno. Se corrigieron vistas de abasto, Peixateria, Cavallers y Carrer Major orientando la cámara hacia espacios libres. Los focos pequeños pueden definir su distancia mínima de encuadre; la distancia anterior se conserva por defecto en las otras visitas. No se desplazan edificios para despejar una cámara.

La prueba conserva los cortes arqueológicos anteriores, las 28 localizaciones patrimoniales registradas por esos módulos y la carga diferida; la interfaz incluye los tres paisajes y mantiene 31 lugares. También simula el fallo de una textura, comprueba la retirada de la escena incompleta y un único reintento regional. Los materiales civiles del reintento son nuevos. Al descargar la región después de activar la lectura por épocas, las texturas y materiales se liberan una sola vez, incluso cuando las texturas se han separado de los materiales visibles. Se preservan las regiones ajenas.

## Geometría y cartografía

El núcleo de la plaza contiene 13 fachadas documentadas, 14 cuerpos, 233 mallas y 180.342 triángulos. El contexto añade 28 mallas y 36.152 triángulos: en conjunto son 261 mallas y 216.494 triángulos. Se comprueban 27 posiciones de huecos, atributos finitos, restauración de materiales e independencia entre instancias.

Los tejados reciben 1.340 sondeos verticales. La inspección visual detectó además huecos en los hastiales de ocho cubiertas: el cierre mediante un único cuadrilátero no alcanzaba la cumbrera cuando una arista la atravesaba. Se subdividieron esas aristas; la revisión independiente con 48 rayos horizontales aísla y verifica la corrección. Los rayos verticales por sí solos no detectaban ese defecto.

Los 94 cuerpos de contexto corresponden a 36 parcelas y conservan tres patios. Hay 51 estimaciones de altura IGN y 43 derivaciones por plantas; no se usa una altura genérica de reserva. Se preservan los 44 cuerpos y 16 parcelas del contexto de Santa María. La ampliación al número 17 conserva la separación cartográfica entre su cuerpo frontal y posterior.

Se comprueban 5.720 triángulos de pavimento respecto al terreno final, sin enterramientos ni los despegues que el verificador clasifica como flotación. El margen vertical de representación varía entre aproximadamente 5,5 y 22,8 cm por los ajustes de triangulación y contacto; no es una cota de pavimento levantada sobre el terreno.

## Interfaz y planos

Los seis casos Canvas cubren minimapa, plano grande y plano móvil en las dos apariencias. Se verifican 16 marcadores, sus áreas de interacción, la separación, el anclaje geográfico y el contraste mínimo medido de 5,52:1. El plano conserva 133 componentes del modelo.

En el navegador se comprobaron las 18 fuentes, la cronología, el diálogo de una referencia histórica y los enlaces directos a las paradas. El regreso a Castillo, Teatro Romano, Santa María y Plaça Major conserva sus estadísticas de avance independientes. La visita de plaza no ofrece un corte de interiores que el modelo no representa.

En móvil vertical no hay desbordamiento horizontal: el cuerpo mide 390 × 844 y el panel ocupa su mitad inferior. El plano tiene un lienzo de 313 × 300 y se presenta a ese tamaño. Un clic sobre el marcador 7 abre la parada del escudo. En 844 × 390 se mantiene el título y la navegación de la parada, y se verificó la apariencia clara. La lectura por capas muestra sus cinco categorías. La página temporal de prueba se retiró antes de la comprobación estática definitiva.

El gate estático revisa 48 módulos JavaScript, 89 imports locales, 61 JSON, 27 solicitudes iniciales, 16 diferidas y 109 identificadores HTML únicos. Los informes guardan las huellas de los archivos revisados para comprobar su correspondencia con la versión terminada.

## Renders y alcance de la verificación

Los PNG del conjunto, Almudín y galería son renders CPU de las mallas Three.js exportadas, con la ortofoto, la plaza, el caserío próximo y Santa María. No son ilustraciones generadas ni capturas del renderizador WebGL. Las texturas procedurales se aproximan en el render de inspección y la iluminación de relleno facilita la lectura bajo los soportales. El caserío lejano del atlas no se incluye completo en esta exportación local.

El navegador disponible informa `GL_VENDOR = Disabled` y `GL_RENDERER = Disabled`. Las capturas JPG muestran el modo 2D de compatibilidad. La revisión acredita la interfaz, la cartografía y la geometría exportada; no acredita rendimiento GPU ni la apariencia exacta de sus sombras. La aplicación mantiene el renderizador Three.js para navegadores con WebGL disponible.

## Reproducir las comprobaciones

Desde la raíz del repositorio:

```sh
node --experimental-loader ./research/validate_loader.mjs research/validate_sagunto_v10.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v10/validate_plaza_model.mjs
node --experimental-loader ./research/validate_loader.mjs research/validation-v10/validate_plaza_context.mjs
python research/validation-v10/validate_plaza_context_geography.py
node research/validation-v10/validate_visit_controller.mjs
python research/validation-v10/validate_static_assets.py
```

La exportación comprimida de las mallas está en `plaza-geometry.json.gz`; el render se reproduce con `render_plaza.py` en Blender, según las instrucciones incluidas en ese archivo.
