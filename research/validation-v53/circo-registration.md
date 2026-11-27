# Registro del circo completo · SAGUNTUM v53

Fecha: 27 de noviembre de 2026. Base revisada: `7c798336b46556233de8117492be11fed15b14ab`.

## Resultado que debe aplicar el modelo

La orientación del modelo v52 era compatible con la planta publicada. El problema principal era el **encaje longitudinal**: situaba la cabecera oriental aproximadamente **24 m al oeste** del ápice dibujado por la investigación de 2017. Además, imponía un semicírculo regular allí donde la figura muestra una cabecera más achatada. La *spina* de 190 m estaba mezclada con la restitución corta del edificio; esa misma investigación revisada propone una *spina* de 151 m.

Se conserva la puerta actual en su registro independiente. El nuevo conjunto histórico se coloca respecto a ella mediante este contrato, guardado íntegro en `circo-registration.json`:

| Parámetro | v52 | Propuesta v53 | Naturaleza del dato |
|---|---:|---:|---|
| Giro del conjunto | −0,307 rad | −0,305 rad | Ajuste gráfico; diferencia de 0,11° |
| Puerta en el eje longitudinal del conjunto | u=80 m | u=55,5 m | Registro respecto a la cabecera oriental |
| Longitud total de referencia | 273 m | 273 m | Hipótesis textual, con rango 270–290 m |
| Anchura exterior de referencia | 70 m | 70 m | Extremo superior del rango publicado 68–70 m |
| Profundidad axial de la cabecera oriental | 35 m | 22 m | Inferencia de la figura; tolerancia aproximada ±3 m |
| Semianchura transversal | 35 m | 35 m | Referencia geométrica del modelo de 70 m |
| Longitud de la *spina* | 190 m | 151 m | Medida textual de Tarraco Biennal 2017, p.159 |
| Centro de la *spina* | u=2; v=0,8 m | u=38; v=3,4 m | Posición aproximada trazada sobre las figuras |

En el marco local v53, `u` avanza hacia el este y `v` hacia el flanco meridional. El extremo oriental queda en `u=136,5`; el arranque de la elipse en `u=114,5`. La *spina* ocupa `u=−37,5…113,5`, cerca del arranque de esa curva. El giro equivale aproximadamente a un eje con rumbo 107,5° desde el norte.

**No modificar** los campos actuales de la puerta `registration.coordinate`, `registration.yawRadians=-0.307` ni `gateCenterLocalXZ=[-4.25,1.3]`. El giro nuevo pertenece a `historicalRegistration`. Su centro se calcula desde el centro físico de la puerta, restando el vector `[55.5,35]` en el marco histórico.

## Anclajes geográficos

Las coordenadas se guardan con decimales suficientes para reproducir el cálculo; su precisión arqueológica no es submétrica. Se adopta una tolerancia visual conservadora de **3–5 m** para las posiciones trazadas.

| Anclaje | Longitud | Latitud |
|---|---:|---:|
| Centro de la puerta conservada, fijo | −0,275569872 | 39,681049405 |
| Centro geométrico de la restitución | −0,276065091 | 39,681499018 |
| Ápice oriental del modelo | −0,274545405 | 39,681130800 |
| Ápice leído de la figura | −0,274547478 | 39,681134754 |
| Centro del cierre occidental hipotético a 273 m | −0,277584778 | 39,681867236 |
| Tangencia norte de la cabecera | −0,274667661 | 39,681490045 |
| Tangencia sur de la cabecera | −0,274913011 | 39,680890249 |
| Extremo occidental de la *spina* propuesta | −0,276494505 | 39,681571044 |
| Extremo oriental de la *spina* propuesta | −0,274813386 | 39,681163712 |

El ápice redondeado del modelo queda a unos 0,5 m del punto digitalizado. Esa coincidencia sirve para revisar el cálculo, **no acredita la exactitud de la localización histórica**. Mantener el ápice oriental y variar la longitud entre 270 y 290 m desplaza únicamente el cierre occidental; sus extremos nominales figuran en el JSON.

## Fuentes y límites de sus afirmaciones

La fuente principal es [Melchor et al., «Nuevos apuntes para el estudio del circo romano de Sagunto», ARSE 51 (2017), pp.25–46](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/5.-Nuevos-apuntes-para-el-estudio-del-circo-romano-de-Sagunto.pdf), especialmente pp.42–44 y figuras16–17. Su restitución usa fotografías de 1937/1938, el vuelo de 1945 y la ortofoto ICV2012, con referencia ETRS89/UTM30. El texto distingue 237 m de cimentación conservada de una longitud total hipotética de 270–290 m; propone 68–70 m de anchura y 11 m de *cavea*. La tabla1 emplea 273 m «aprox.». Los autores indican que no pueden determinar el cierre occidental.

El trabajo previo, «Nuevas aportaciones al conocimiento del circo romano de Sagunto y su entorno monumental», Tarraco Biennal 2017, pp.155–160, [PDF de la editorial de la Universitat Rovira i Virgili](https://llibres.urv.cat/index.php/purv/catalog/download/354/366/845?inline=1), aporta la longitud de *spina* de 151 m en p.159. El pie de la figura5, p.160, identifica el perímetro blanco como una **posible hipótesis de longitud total**. Por ello, el arco blanco del oeste no representa unas *carceres* documentadas.

La imagen de referencia de 2012 se recuperó del [servicio oficial ICV](https://terramapas.icv.gva.es/0202_2012CVAL0050?service=WMS&request=GetCapabilities), capa `2012CVAL0050_RGB`; [ficha oficial del conjunto, RGB a 50 cm](https://datos.gob.es/es/catalogo/a10002983-ortofoto-de-2012-pnoa-de-la-comunitat-valenciana-en-rgb-y-50-cm-de-resolucion1). La comparación actual usa [PNOA máxima actualidad](https://www.ign.es/wms-inspire/pnoa-ma), capa `OI.OrthoimageCoverage`. El GetMap no informa del año concreto de vuelo de este recorte actual; no se etiqueta como fotografía de 2026.

El estudio de la puerta distingue la puerta lateral conservada del acceso oriental histórico: [López, Sañudo y Verdasco, ARSE51 (2017), pp.103–123](https://centroarqueologicosaguntino.es/wp-content/uploads/2018/11/8.-La-intervenci%C3%B3n-aequeol%C3%B3gica-previa-para-la-puesta-en-valor-de-los-restos-arqueol%C3%B3gicos-de-la-puerta-del-circo-romano-de-Sagunto.pdf). Por tanto, el registro mantiene la puerta en el flanco sur y no la coloca en el extremo del eje.

## Método y control de ajuste

1. Se extrajo del PDF la imagen nativa de la figura17: **443×378 píxeles**. Se amplió tres veces únicamente para leer coordenadas; la ampliación no añade detalle.
2. Se preparó un ajuste manual inicial mediante cruces de calles visibles, con un residual aproximado de 5,1 m. Ese ajuste mostró los límites de elegir centros de calzada sobre una reproducción pequeña y se utilizó solamente como semilla de búsqueda. **No es el ajuste final.**
3. Se descargó la **misma ortofoto ICV2012** utilizada por la publicación, no una imagen moderna parecida. El recorte WMS cubre longitudes−0,2792…−0,2735 y latitudes39,6805…39,6829, con 2000×1100 píxeles. Las calles, sombras y cubiertas coinciden visualmente con la figura.
4. Se optimizó una transformación afín de seis parámetros usando correlación de intensidad normalizada localmente. Se excluyeron el río, el borde inferior fuera del recorte y el trazado blanco. La correlación global pasó de 0,011 a **0,865**. El ajuste se inspeccionó mediante una superposición de canales; los contornos de calles, edificios y sombras coinciden.
5. Se verificaron siete ventanas locales de 25×25 píxeles de la figura. Sus correlaciones quedaron entre 0,795 y 0,951; seis no necesitaron desplazamiento adicional y una mejoró con 0,2 píxeles. El residual de ese diagnóstico de copias de imagen es 0,077 m en la proyección del atlas. **No es un error topográfico ni la incertidumbre de los restos**: solo confirma que se ha encontrado la misma imagen de base.
6. Sobre esa correspondencia se digitalizaron los flancos, el ápice y las tangencias de la figura17. Los extremos de la *spina* proceden de la figura16, cuya composición es casi idéntica; la pequeña diferencia de encuadre entra en la tolerancia de 3–5 m adoptada. La distancia resultante entre sus extremos es 150,38 m, compatible con los 151 m del texto.
7. Se redondeó el contrato a valores apropiados para una restitución visual y se preservó la puerta. Las coordenadas del atlas utilizan exactamente su proyección local existente, sin cambiarla ni tratarla como una nueva red topográfica.

La transformación final de píxel ampliado `[px,py,1]` a metros del atlas `[x,z]` es:

```text
 x = 0.341540240*px - 0.0101957116*py - 85.8357582
 z = 0.0103930731*px + 0.332315906*py - 445.503295
```

Se conserva la matriz de precisión completa, los controles locales, URL GetMap y hashes SHA256 en los JSON. Las cifras anteriores están redondeadas para lectura.

## Lectura crítica de la cabecera y el oeste

En el marco antiguo, las tangencias orientales leídas caen aproximadamente en `u=140,1`, mientras el ápice está en `u=160,6`. La profundidad axial inferida es, por tanto, de unos 20–22 m; su extensión transversal es mayor. Esto motiva una **elipse de trabajo** con profundidad22 m y semianchura35 m. El semicírculo anterior obligaba a empezar la curva demasiado pronto y a interpretar mal la posición relativa de la *spina*.

No se afirma que la obra romana fuese una elipse matemática exacta. La fuente es una figura raster pequeña, sus líneas tienen grosor, el cierre tiene irregularidades y su trazado contiene interpretación. La elipse es una aproximación más cercana a esa planta que el semicírculo previo. La posición de la *spina* deja aproximadamente23 m hasta el ápice oriental y un espacio mayor delante del cierre occidental; no debe recentrarse por simetría.

Existe una discrepancia que conviene conservar: el perímetro blanco digitalizado produce una extensión gráfica cercana a260 m, mientras el texto propone270–290 m y la tabla273 m aproximadamente. No se debe deformar la ortofoto para hacer coincidir ambos. El modelo mantiene la hipótesis textual273 m, el ápice oriental mejor anclado y una banda de incertidumbre en el oeste. Así, el cierre de trabajo queda algo más al oeste que el arco blanco de la figura. La diferencia no establece una posición nueva de las *carceres*.

## Auditoría del modelo y las máscaras v52

El modelo completo v52 sí tenía su propia geometría de273×70 m: no se encontró un recorte interno que explicase el aparente edificio corto. Su máscara histórica medía278,4×75,4 m, suficiente para su contorno y el pequeño faldón exterior. La limitación estaba en el registro y en la forma elegida, no en la longitud del buffer del modelo.

Al aplicar el nuevo centro, el motor debe usarlo también para la máscara histórica, el terreno, la cámara general y el plano de visita. Reutilizar la máscara antigua dejaría sin ocultar edificios modernos en la nueva cabecera oriental. La puerta y su máscara permanente deben seguir independientes.

La activación de la restitución puede ocultar los edificios contemporáneos del recinto según el control de lectura de la visita. Ni esa máscara ni la interpretación histórica deben modificar las parcelas originales, los edificios que pertenecen a otras visitas o la entrada global al atlas. Este informe no cambia esas funciones: corresponde a la integración y verificación de la aplicación.

## Archivos y reproducción

- `circo-registration.json`: contrato geométrico, anclajes, contorno propuesto, rasgos digitalizados, controles, fuentes e incertidumbres.
- `circo-image-fit.json`: transformación y diagnóstico del emparejamiento de imágenes.
- `circo-registration-overlay.jpg`: comparación de v52, trazado publicado y propuesta v53 sobre ortofoto actual. La imagen se ha inspeccionado; leyenda y puerta resultan legibles.
- `prepare_circo_registration.py`: regenera el contrato, los anclajes y la superposición desde el ajuste guardado y las imágenes públicas de entrada. No modifica `dist/`.

Los insumos transitorios se encuentran en `/workspace/scratch/53242b8b9a77/circo-v53/`. Para repetir los artefactos:

```bash
python research/validation-v53/prepare_circo_registration.py \
  --inputs /workspace/scratch/53242b8b9a77/circo-v53
```

Los URL completos permiten recuperar los mismos recortes; la disponibilidad futura del mosaico de actualidad puede cambiar. Las figuras de la revista se mantienen como material de investigación y no se han añadido a los recursos públicos de la aplicación. En esta tarea solo se escriben archivos de `research/validation-v53`.
