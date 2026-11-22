# Begoña y la Alameda — documentación de V27

Investigación: 21 de noviembre de 2026. La guía de producción está en `dist/assets/data/begona-visit.json`: 20 paradas, 40 hechos enlazados con fuentes, 5 ámbitos y 11 hitos. Sus coordenadas se registran posteriormente con el modelo final.

## Decisiones que afectan al modelo

La lectura de planos exteriores, fotografías y descripciones justifica un modelo arquitectónico interpretativo. No se ha encontrado un levantamiento métrico completo del interior. Alturas, espesores, objetos y detalles de moldura necesitan aproximación; no deben etiquetarse como réplica exacta.

- Se utiliza la secuencia municipal: proyecto de 1927, **solicitud** de permiso el 21 de abril de 1928, obras de 1928–1929 e inauguración de 1929. La solicitud no se transforma en licencia concedida. La ficha universitaria resume de otra manera el inicio de las obras.
- El campanario pertenece al eje de la fachada. La referencia bilbaína explica una relación cultural y compositiva, no autoriza copiar otra iglesia.
- La cubierta se modela según el sistema documentado de arcos diafragma y paneles inclinados. Una bóveda de cañón continua daría una lectura errónea.
- El cuerpo tras la cabecera corresponde a la Casa Abadía. Su volumen no debe abrirse a la nave como si fuera un transepto.
- El coro y el órgano cuentan con documentación fotográfica propia. No se coloca una caja barroca genérica donde las imágenes muestran un frente de tubos descubierto.
- Las representaciones de estatuas y retablos son abstracciones. Las referencias visuales no permiten reproducir su talla con exactitud.
- La policromía se registra en fotografías de distintas épocas. La fecha de consulta no convierte esas imágenes en una inspección de 2026.
- Los recuerdos de la Alameda describen usos históricos. La cartografía contemporánea determina qué construcciones se mantienen en la escena; no se reconstruye la escuela desaparecida dentro del estado actual.
- Las nuevas esculturas anunciadas en marzo de 2026 eran un proyecto con instalación prevista para diciembre. La licitación no demuestra que ya estuvieran instaladas el día de esta investigación.

## Referencias visuales realmente inspeccionadas

Las imágenes completas de terceros se consultaron como referencias de investigación y no se incorporan como texturas ni se redistribuyen en `dist/`. Los nombres siguientes permiten reproducir la inspección a partir de su URL.

| Referencia | Identificación y uso |
| --- | --- |
| [CONTRAST, image009.jpg](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image009.jpg) | Interior fotografiado en 2004: vista hacia la cabecera. Referencia de relaciones espaciales. |
| [CONTRAST, image013.jpg](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image013.jpg) | Fachada restaurada; fotografía atribuida en la página a Joanbanjo, CC BY-SA 4.0. Referencia de acabado exterior. |
| [CONTRAST, image007.jpg](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image007.jpg) | Postal histórica de 1965. No se trasladan automáticamente su quiosco ni sus árboles al contexto actual. |
| [CONTRAST, image029.jpg](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image029.jpg) | Fotografía de Antonio Cosín Marés de la maqueta de madera 1:40 de Miguel Pérez Ugarte. **No es una fotografía del inmueble.** |
| [CONTRAST, image037.jpg](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB_archivos/image037.jpg) | Fotografía de 2022 del hastial de la Casa Abadía, parcialmente oculto por vegetación. |
| [Cabanilles n.º 33, 1990](https://avamus.org/wp-content/uploads/2021/03/Cabanilles-033-033-1990-01-a-1990-03-Los-Organos-de-Santa-Maria-de-Sagunto-Valencia-y-el-mundo-musical-de-su-entorno.pdf) | PDF renderizado e inspeccionado con el flujo de la habilidad PDF: páginas físicas 54–56, registros, consola y frente del órgano. |
| [Guía CONTRAST / APIPS, 2022](https://www.apips.es/assets/files/CUADERNO_TP01.pdf) | Página física 33 renderizada e inspeccionada: dos vistas del interior, incluida la policromía cálida. La atribución temporal de las dos fotos no se convierte en una secuencia exacta de repintados. |

Los archivos `image012`, `image017`, `image019`, `image022` y `image030` de la misma página muestran otros edificios o ejemplos comparativos. Se descartaron como referencias directas de Begoña. Esta distinción se comunicó al modelador antes de implementar la arquitectura.

## Fuentes principales y límites

La guía conserva URLs, autoría, localizadores y fecha de consulta para quince fuentes. Las descripciones editoriales se han mantenido breves; la mayor parte de las instrucciones de visita son indicaciones originales para explorar la maqueta.

1. [Ayuntamiento, Església de Begonya](https://aytosagunto.es/es/ayuntamiento/areas-y-servicios/cultura-y-educacion/campus-abierto-a-la-ciudadania/proyecto-xiuxiueig/esglesia-de-begonya/): cronología, interior y dependencias. Su diagnóstico del órgano no está fechado; no se afirma que describa su funcionamiento actual.
2. [CONTRAST, iglesia](https://www.contrastapips.com/IHACM/IBP/Port/Port_patri_NSB.htm): lectura arquitectónica y comparación de evidencias.
3. [Ayuntamiento, cuaderno de 2002](https://aytosagunto.es/media/uiwbnv5e/02_ud_quad_itinerario-did%C3%A1ctico-para-la-eso.pdf): rasgos constructivos, sin adoptar su diagnóstico de conservación como actual.
4. [Universitat de València](https://www.uv.es/patrimoni_industrial_sagunt/bicgerencia/gerencia.html): relación del templo con el conjunto industrial. Sus usos y estados materiales deben leerse como información histórica sin fecha de actualización.
5. [Ayuntamiento, La Alameda](https://www.sagunto.es/va/ajuntament/arees-i-serveis/cultura-i-educacio/campus-obert-a-la-ciutadania/xiuxiueig/la-alameda/): memoria oral de las décadas de 1960 y 1970.
6. [Rutas de la memoria obrera, 2023](https://www.relatsiberoamerica.com/documentos/Beneyto/2023Beneytocoord.Rutas2.pdf): capítulo de Sonia Garcés Romero y Buenaventura Navarro Herraiz, páginas 51–52. La consulta textual y visual se realizó mediante búsqueda web; la descarga directa devolvió 403 y no se intentó eludir esa respuesta.
7. [Ayuntamiento, memorial, agosto de 2025](https://aytosagunto.es/es/actualidad/2025-08-12-acto-de-homenaje-a-las-personas-fallecidas-en-altos-hornos-del-mediterraneo-y-en-la-compania-minera-sierra-menera/): actualización del recuerdo público.
8. [Ayuntamiento, licitación de esculturas, marzo de 2026](https://aytosagunto.es/es/actualidad/2026-03-13-sale-a-licitacion-la-construccion-de-dos-esculturas-que-evocan-la-formacion-profesional-de-la-antigua-fabrica-siderurgica/): contexto de una propuesta futura. Barco y locomotora pertenecen a una colección urbana más amplia; la guía no invita a buscarlos dentro de la parcela del templo.

Se localizaron fichas de Campaners, pero las lecturas completas devolvieron errores de servicio. No se usaron para fijar nombres, número actual o mecanismos de las campanas.

## Mantenimiento

`research/validation-v27/build-begona-guide.py` genera el contenido antes del registro geométrico. Se niega a sobrescribir una guía marcada como registrada. Los cambios editoriales posteriores deben conservar las coordenadas definitivas y revisarse sobre el JSON.
