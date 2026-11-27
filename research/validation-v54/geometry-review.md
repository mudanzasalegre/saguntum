# v54 — Revisión visual del sector oriental

## Resultado

Se inspeccionaron los buffers reales de la escena después de las correcciones de suelo, coronación del depósito y cámaras. Las cuatro vistas finales permiten leer el recinto oriental, la terraza norte, el vaso abierto y las dependencias meridionales. El acercamiento del aljibe usa exactamente la cámara de detalle publicada por `visit.focuses`, con FOV de 58 grados: se ve el fondo y no hay una pared interpuesta en la mirada.

La inspección valida la lectura geométrica de estas vistas. Las alturas, espesores, materiales y detalles menores siguen siendo aproximaciones declaradas en la guía; no se convierten en un levantamiento arqueológico.

## Procedimiento y procedencia

- Exportador: `export-castle-geometry.mjs`, adaptado del de v51 y conectado a `castle-scene.mjs` de v54.
- Entrada: geometrías, índices, UV, colores, normales, matrices e instancias construidas por los módulos reales de la aplicación, con el terreno final y el recorte efectivo del aljibe. No se ha sustituido la arquitectura por primitivas creadas para las imágenes.
- Exportación final: 160 mallas y 200.785 triángulos del Castillo; 1.389 mallas con contexto y 100 texturas de color.
- Render: Blender 4.3.2, Cycles CPU, ocho hilos, 24 muestras, 1280 × 960, sin denoiser. Iluminación y sombreado propios de Cycles. No son capturas WebGL ni una medición del rendimiento del navegador.
- `render-inspection.json` conserva cámaras, parámetros, hashes del código y de las imágenes. El exportador rechaza una captura si los archivos fuente cambian durante su construcción.

## Vistas finales inspeccionadas

| Imagen | Cámara / contenido | Resultado observado |
|---|---|---|
| `castillo-oriente-general.jpg` | Vista desde este/sureste, derivada del foco general de Almenara. | Se distinguen el perímetro, cuatro plataformas, pequeñas ruinas y el contexto urbano. El suelo interior deja de mostrar los montículos del primer lote. |
| `castillo-oriente-bateria.jpg` | Ojo a 1,90 m sobre el terreno del patio, mirando la terraza norte. | Escalera, frente de la plataforma y aberturas de merlones legibles; continuidad del suelo frente a la escalera. |
| `castillo-oriente-aljibes.jpg` | Cámara real de detalle: ojo `[199.427129, 137.746899, 280.381684]`, objetivo `[200.883615, 134.607604, 278.522640]`, FOV 58. | Fondo, paredes interiores y coronación del vaso visibles. Desaparece la junta negra de esquina detectada en el primer lote. |
| `castillo-oriente-dependencias.jpg` | Vista auxiliar elevada, derivada de su foco. | Se leen la planta abierta, la diferencia de alzados y los encuentros con el suelo. Desaparece la sombra continua que sugería suspensión. |

Las coordenadas de estas cámaras son las coordenadas locales de la escena, no longitud/latitud. La cámara real del aljibe mira a `floorY + 0,25 m` y conserva el ojo fuera del hueco.

## Incidencias encontradas y resueltas

1. **Objetivo alto del aljibe.** El primer acercamiento real dedicaba gran parte del encuadre al cielo y el borde del vaso ocultaba el fondo. Integración bajó el objetivo al interior y acercó el ojo al borde. El render final comprueba la mejora.
2. **Junta en la coronación.** La esquina derecha del aljibe mostraba una abertura negra. La geometría final comparte las cotas de sus esquinas; el defecto ya no aparece en la vista inspeccionada.
3. **Lectura del suelo.** El primer lote mostraba montículos suaves y franjas oscuras que dificultaban interpretar los apoyos. La revisión suaviza el interior, añade una superficie de tierra y grava y resuelve laterales de caminos. Las laderas exteriores conservan el terreno del modelo.
4. **Apariencia de ruina suspendida.** Antes de modificar apoyos se contrastaron pies y aristas inferiores con la altura baricéntrica del terreno exportado. En las dependencias, 110 pies y 328 puntos intermedios no mostraron separación; quedaron al menos unos 15 cm bajo la superficie. La sombra no justificaba hundir la ruina. La mejora posterior del suelo aclara su lectura.

Quedan pequeños fragmentos triangulares claros junto a algunos pies de las dependencias. Se registran como detalle menor de contacto/material; no constituyen un hueco continuo ni justifican desplazar la arquitectura.

## Contraste con la documentación

El contraste utiliza las fotografías originales enumeradas en `east-evidence.md`: Ricsol 17 para el contexto exterior; 21 para el baluarte; 24, 28 y 31 para escaleras, plataformas y coronaciones; 25–27 para diferencias de muros y torres; 30 y Civera p. 175 para depósitos abiertos con revestimiento. Las imágenes no proporcionan por sí mismas una medición completa de alturas ni una datación homogénea.

Se conservaron las diferencias que sí están documentadas: depósitos descubiertos, merlones perforados del norte, aberturas más anchas del baluarte, torre semicircular y dependencias sin techo. La maqueta simplifica las fábricas y los acabados. No incluye una restitución completa del alcázar medieval o de las defensas ibéricas de la ladera.

## Regresión y revisión inicial

`initial-review/` contiene el primer lote de seis imágenes, su manifiesto y el contraste de apoyos. La vista de la Puerta de Almenara está allí identificada como **inspección inicial**: conserva el arco apuntado, los dos óculos y el paso abovedado. No se volvió a renderizar tras los ajustes interiores porque su geometría específica no cambió. La forma y las cámaras del portal se contrastaron con la revisión v51; no se afirma identidad píxel a píxel del contexto.

## Reproducción

```sh
node research/validation-v54/export-castle-geometry.mjs --out /workspace/scratch/53242b8b9a77/east-v54/model.json.gz
/usr/bin/blender --background --threads 8 --python research/validation-v54/render_castle.py -- --input /workspace/scratch/53242b8b9a77/east-v54/model.json.gz --output research/validation-v54 --samples 24 --only castillo-oriente-general.jpg,castillo-oriente-bateria.jpg,castillo-oriente-aljibes.jpg,castillo-oriente-dependencias.jpg
```
