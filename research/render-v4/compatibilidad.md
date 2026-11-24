# Compatibilidad del simulador V4

Pruebas del 24 de noviembre de 2026 sobre la entrada del Atlas en `http://localhost:8492/`, con Three.js r180. Las versiones, rutas y motores que se indican son los observados durante la ejecución.

| Navegador y entorno | Selección y motor activo | Resultado |
| --- | --- | --- |
| Chrome 156.0.8078.47, Windows, escritorio | Automático abrió WebGL 2. La selección explícita de WebGPU abrió el dispositivo nativo. | La Glorieta y la Gerencia conservaron la cámara, la parada y los ajustes al cambiar de motor. En la Gerencia se conservó el vuelo libre. El Casino activó la recuperación en WebGL 2 al recibir un material de ensayo incompatible. [13 casos de recuperación](recuperacion.json) |
| Firefox 153.0, Windows, navegador sin ventana, 980 × 650 | Se solicitó WebGPU. El navegador expuso la API en contexto seguro y devolvió un adaptador nulo. El simulador abrió WebGL 2. | La ruta `#simulador/glorieta/glorieta-romeu` cargó el monumento a José Romeu, la visita detallada y el selector de 24 paradas. Se observaron fotogramas del mundo 3D y cero errores de página o consola. [Resultado de Firefox](firefox-glorieta.json) |
| WebKit 27.2, perfil táctil de iPhone 13, 390 × 664 | WebGL 2, recuperación en plano y reintento en 3D | Al perder el contexto en la visita a Romeu se pudo regresar a la misma parada. También se verificaron el paso del simulador al plano, la entrada a la visita y la vuelta al simulador en 3D. [Prueba de recuperación móvil](webkit-recuperacion.json) |
| Chrome 156.0.8078.47, perfil táctil de iPad de 7.ª generación, 810 × 1080 | Automático, WebGL 2 | Dos contactos simultáneos permitieron caminar y girar la mirada. Funcionaron correr, saltar, mostrar el control de altura de vuelo y volver a la panorámica. La visita a la plaza Mayor y el regreso al paseo conservaron la posición y el rumbo, con diferencias medidas de 0 m y 0 rad. [Prueba de navegación táctil](tableta-navegacion.json) |

La comprobación de Firefox corresponde al ejecutable de Playwright de revisión 1538 con su controlador compatible. El resultado registra las capacidades disponibles en esa ejecución. Los perfiles móviles se ejecutaron en Windows con emulación táctil. Queda pendiente la comprobación de WebGPU y de la presión de memoria en Safari de iPhone, iPad y Mac físicos.

## Reproducción

Los tres comandos se ejecutan desde la raíz del proyecto, con la carpeta `dist` servida en localhost.

```powershell
python research/check-backend-recovery-v4.py --base http://localhost:8492 --out research/render-v4/recuperacion.json
python research/check-render-recovery.py --engine webkit --base http://localhost:8492 --out research/render-v4/webkit-recuperacion.json
python research/check-navigation-v41.py --tablet --base http://localhost:8492 --out research/render-v4/tableta-navegacion.json
```

Para revisar Firefox, abrir la parada de Romeu en el simulador, seleccionar WebGPU en **Capas y luz → Motor gráfico**, y consultar el motor activo y el motivo de la selección en **Compatibilidad gráfica**. Comprobar que el enlace a la visita sigue apuntando a `#glorieta/glorieta-romeu`.
