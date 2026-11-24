# Simulador territorial V4

El selector **Motor gráfico**, en **Capas y luz**, abre el mismo territorio con WebGL 2 o WebGPU. Ambos recorren las mismas huellas, caminos, paradas, edificios y escenas patrimoniales. **Automático** usa WebGL 2. La selección de WebGPU es voluntaria y se recuerda en el navegador. [Entrar en el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador)

## Procedencia

La base editable de Sites era la versión 41, commit `d2b18cd956c6c7dfc303e1b103335088718a7218`. Su árbol `dist` coincide con el de GitHub `37aeb0fae32cbe8a4fde37b0792b13084b58c754`. Se conservó el archivo de esa distribución y la rama local `codex/respaldo-previo-v4`. El historial de la rama acumulativa V4 incorpora V2 y V3. El piloto de esa rama precede a la integración en la entrada principal documentada aquí. [V2 y carga anticipada](SIMULADOR_STREAMING_V2.md) · [V3 y detalle local](SIMULADOR_LOCAL_V3.md) · [Piloto acumulativo](https://github.com/mudanzasalegre/saguntum/commit/115366eee321f9f1132c85175dd2f2f89246f7e0)

## Arranque, cambio de motor y recuperación

1. WebGPU requiere HTTPS o localhost. El gestor solicita un adaptador de hardware y un dispositivo, comprueba sus límites, inicializa Three.js r180 y dibuja un patrón TSL. Una lectura de píxeles verifica el resultado. Las etapas tienen plazos y se cancela y libera el dispositivo fallido.
2. El mundo se crea después de elegir la ruta. La entrada habitual de WebGL 2 y las visitas del Atlas omiten la descarga del módulo WebGPU. En el simulador, un cambio de motor guarda la parada, la cámara, su pivote, orientación, óptica, capas, hora y ajustes antes de cerrar el documento. Se crea un solo dispositivo de presentación por sesión.
3. Una pérdida del dispositivo o un material esencial incompatible lleva al visitante al mismo punto en WebGL 2. La pestaña recuerda el fallo. Si tampoco puede dibujar en WebGL, el plano conserva el recorrido y los enlaces. **Reintentar 3D** vuelve a comprobar el motor elegido. El marcador de arranque también cubre una interrupción del proceso del navegador.

La decisión se basa en la API y en el dibujo efectivo. Los datos de telemetría distinguen el motor solicitado del activo. La versión compartida es Three.js r180. Todos los módulos y recursos de producción se sirven desde el sitio estático. [WebGPURenderer r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPURenderer.js) · [TSL de Three.js](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language) · [Pérdida de GPUDevice](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost)

## Qué dibuja cada motor

| Sistema | WebGL 2 | WebGPU |
| --- | --- | --- |
| MDT y suelo | Material original con ortofotos regionales, detalle PNOA y corrección de color del Atlas | Material nodal sobre la misma malla, mismas texturas, coordenadas y ventanas de carga |
| Calles y arquitectura | GLSL del Atlas y del simulador, cubiertas fotográficas, juntas, huecos y detalle por proximidad | Nodos de color, rugosidad, normales, oclusión y emisión. Conservan los lotes de fachada y las instancias de mobiliario |
| Patrimonio | Constructores originales, interiores, focos, fases y secciones | Mismos grupos y cámaras. Las variantes de material se aplican durante el dibujo. Los anillos de selección se cierran explícitamente en los cuatro constructores que los utilizan |
| Excavaciones | Máscaras de calzada y terreno, corte y profundidad | Las mismas ventanas se aplican al material visible y a las sombras. Los huecos permanecen vinculados a su parada |
| Mar y cielo | Shader del litoral, reflejo plano, oleaje, espuma, cielo y sonda PMREM | Polígonos, campo costero y normales originales. Reflejo plano con presupuesto, sombra, espuma y corte de inspección. Cielo y sonda PMREM nativos |
| Luz y posprocesado | Sol, entorno, sombras, oclusión de contacto y niebla originales | Sombra direccional, contacto por profundidad y niebla de distancia ajustada al orden de exposición y color del Atlas |

Los dos motores usan filtros de sombra distintos. El cristal, las persianas, los zócalos, las juntas y el desgaste de fachadas sin alzado individual siguen siendo interpretaciones tipológicas. Las coordenadas y perímetros provienen de los datos territoriales descritos en la documentación del Atlas. [Fuentes cartográficas y precisiones](SIMULADOR.md) · [Pruebas de suelo](../research/dual-v4/suelo.json) · [Materiales urbanos](../research/dual-v4/materiales-urbanos.json) · [Agua, cielo y reflejos](../research/ambiente-v4/README.md)

## Carga, presupuestos y diagnóstico

La panorámica usa paquetes ligeros. Los sectores y sus fachadas utilizan distancia a la huella, dirección de marcha y de la cámara, selección e histéresis. La precarga de módulos y documentos se limita a una tarea móvil o dos de escritorio. Las geometrías de detalle se preparan por lotes en un trabajador y sustituyen a la malla anterior cuando están listas. El constructor patrimonial conserva la memoria de la visita, sus colisiones y su entorno. La prioridad explícita de una parada permite cancelar una construcción especulativa del trabajador.

La caché de fachadas tiene un límite por perfil de 5–15 MiB en equipos compactos y 9–32 MiB en escritorio. La calidad adaptativa reduce primero la resolución y el detalle periférico. La compilación se hace al preparar el dibujo del lote. Las pruebas con compilación anticipada en un destino auxiliar de r180 produjeron iluminación incorrecta en el primer dibujo nativo. El simulador verifica el primer dibujo real y conserva la compilación progresiva.

En **Capas y luz → Cartografía y rendimiento** aparecen tiempo de fotograma, llamadas, triángulos, geometrías y texturas. **Compatibilidad gráfica** muestra el motor, su inicialización, la resolución, p95 y la caché local. `window.territoryStatus` incluye los presupuestos local y periférico, sectores, caché, estado de trabajadores, módulos precalentados, última preparación patrimonial y estado de los materiales. Los bytes del destino de contacto son estimaciones. El heap corresponde a JavaScript cuando Chromium lo expone. El temporizador GPU usa consultas de WebGL cuando están disponibles. La comparativa de recorrido emplea intervalos reales entre fotogramas para ambos motores.

## Nuevas visitas

La ficha y la escena se registran en `dist/assets/data/atlas-visits.json`. Comparten anclaje, escala, orientación, máscaras, fuentes, paradas y constructor entre el Atlas y el simulador. Un constructor que requiera WebGL puede declarar `"backends": ["webgl2"]` dentro de `scene`. Durante una visita nativa esto activa la recuperación del motor. Las fichas incompletas se registran en `registryIssues` y los identificadores repetidos conservan el original. [Contrato del registro](VISITAS_TERRITORIALES.md)

## Reproducción

Servir `dist` con `python -m http.server 8000 --directory dist` y abrir el enlace local con la ruta `/#simulador`. Los recursos publicables ya están construidos. Para regenerar el módulo gráfico y el trabajador se necesita Node con esbuild 0.25.12.

```sh
npm install --no-save --package-lock=false esbuild@0.25.12
node research/build-territory-webgpu.mjs
node research/build-territory-heritage.mjs
node research/test-territory-stream-policy.mjs
node research/test-territory-local-detail.mjs
node research/test-territory-local-cache.mjs
node research/test-territory-render-v4.mjs
node research/test-territory-gpu-timer.mjs
node --experimental-loader ./research/validate_loader.mjs research/test-territory-tsl-v4.mjs
```

La receta WebGPU comprueba el blob oficial r180, conserva la licencia y compacta el módulo. Aplica una corrección localizada en la inicialización de grupos de recursos. Cuando se libera una máscara de un sector, una instancia nueva toma la textura activa de su ranura TSL antes de crear el sampler. También acepta como argumento el archivo oficial de Three.js r180. La distribución compacta JSON cartográficos comprobando que números, geometrías y atributos sean idénticos. [Receta del módulo](../research/build-territory-webgpu.mjs) · [Resultados y capturas del mundo completo](../research/render-v4/README.md)
