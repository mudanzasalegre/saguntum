# V4 — preparación de doble backend y revisión gráfica

Rama acumulativa sobre V2 y V3. Three.js r180: el `three.core.js` ya incluido coincide con el blob original r180 `7dcd0fbcbc04b8d9a20ecb96c1ce344cb55150d5`. Se incorporan `three.webgpu.js` y `three.tsl.js` oficiales, con los blobs originales `81b64e4760cf020bd28d6b7bf286c57c725ec68d` y `ad19811ad80e14c70dd3e8d4e8b73f77a13598ee`. Licencia MIT incluida en vendor/LICENSE. No se usa CDN en tiempo de ejecución.

## Qué está implementado
- Simulador completo: permanece en WebGL 2 con política explícita de promoción por compatibilidad, diagnóstico del adaptador y acceso al laboratorio. No se crea un segundo dispositivo mientras funciona el motor de producción.
- Laboratorio independiente en `dist/graphics-lab.html`: utiliza Three.js WebGPURenderer y selecciona WebGPU nativo si un adaptador válido está disponible; usa su backend WebGL 2 como alternativa. Una lectura de píxeles de un pequeño render TSL comprueba que el pipeline produce imagen. Se identifica el backend efectivo; la prueba no demuestra compatibilidad integral ni rendimiento superior.
- El piloto usa sectores reales de edificios de Sagunto, Puerto y Grau Vell, el worker original de geometría, MDT, ortofoto, red viaria, pavimentos, huellas y materiales de arquitectura. Incluye una primera traducción TSL de color, rugosidad, carpintería y luces de ventana; el primer port litoral TSL conserva el polígono y utiliza el campo de costa y las normales originales, oleaje de cinco escalas, Fresnel, espuma y ReflectorNode con resolución limitada. No incorpora aún la máscara de sombra directa, recortes de inspección ni la misma cadencia de reflejos; falta validación visual y funcional. No modifica ni sustituye las escenas del Atlas.
- Render WebGL de producción: histeresis de huella de sombras, límites según capacidades, actualización cuando cambia geometría (no sólo cantidad de sectores), protección contra singularidad del sol cenital y revisión de oclusión de contacto: rechazo de fondo/halos, intensidad más moderada y MSAA en render target acotado por resolución. Si falla el efecto, se intenta render directo; si falla el render base, se conserva el plano.
- `window.territoryStatus.graphics` registra diagnóstico y coste estimado del render target. `window.saguntumGraphicsLab` registra el backend real, prueba de píxeles y tiempos de fotograma del piloto.

## No se ha completado la migración integral
No activar automáticamente WebGPU para el Simulador completo sólo porque exista navigator.gpu. El piloto es una primera prueba y no ha sido ejecutado en GPU desde esta sesión. El registro `productionNative` está deliberadamente cerrado. Para abrirlo, portar y verificar todos los módulos de `parityFeatures`, aportar entrada nativa de producción y comparativas. Especialmente: máscaras/relieve/cortes, ortofotos regionales, material urbano y vegetación, materiales patrimoniales onBeforeCompile/ShaderMaterial, iluminación/PMREM, oclusión y agua original. Mantener el renderer WebGLRenderer original para fallback de producción (no confundirlo con WebGPURenderer forzado a WebGL).

## Pruebas
Ejecutar `node research/test-territory-render-v4.mjs` y los tres tests de V2/V3. Servir dist por localhost/HTTPS; abrir el laboratorio en navegador real, confirmar lectura de píxeles y los dos backends, alternar zonas y provocar fallos de dispositivo. Abrir simulador completo y comprobar todos los lugares, agua y cortes, comparar mismos encuadres y perf. No se ha publicado en Sites.

## Diagnóstico y validación de nodos

El render de producción incluye un temporizador GPU opcional y no bloqueante mediante EXT_disjoint_timer_query_webgl2. Muestra sólo medidas disponibles (no sustituye frameMs/p95 y no incluye el trabajo ejecutado antes del render). `graphics.gpu` contiene tiempos y número de muestras; si no hay extensión, no hay estimación inventada. Ejecutar también:

```bash
node research/test-territory-gpu-timer.mjs
node --experimental-loader ./research/validate_loader.mjs research/test-territory-tsl-v4.mjs
```

En esta sesión se comprobaron 24 aserciones de política de render/backend, el ciclo de consultas con GL simulado y la construcción de seis nodos de material usando las fuentes exactas de Three.js r180 con texturas de prueba. No se ha validado la compilación WGSL/GLSL ni la lectura de píxeles del laboratorio en GPU real.
