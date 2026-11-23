# Explorar Sagunto a nivel de calle

Desde la panorámica, **A pie** sitúa al visitante en el centro histórico. Desde una vista cercana, busca suelo accesible junto al punto observado. El buscador incluye accesos directos a Sagunto, Puerto de Sagunto y Grau Vell. Se puede mantener el modo de desplazamiento al utilizar esos accesos o elegir un punto del mapa general. [Simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador)

| Acción | Escritorio | Pantalla táctil |
| --- | --- | --- |
| Caminar o volar | W, A, S, D o flechas | Palanca izquierda |
| Mirar | Clic en la escena y mover el ratón. Esc libera el puntero. Si el navegador impide capturarlo, arrastrar | Arrastrar sobre la escena con otro dedo |
| Correr | Mantener Mayús | Tocar Correr para activar o desactivar |
| Saltar | Espacio cuando hay apoyo | Saltar |
| Agacharse | Mantener C o Ctrl | — |
| Cambiar de altura en vuelo | Espacio / C | Botones + / − |
| Cambiar velocidad de vuelo | Rueda, Mayús o ajustes de navegación | Selector de velocidad en los ajustes |
| Entrar en una visita cercana | E o pulsar el nombre del lugar | Botón Explorar |
| Abrir el mapa | M | Mapa general |
| Recuperar un punto seguro | R, a pie | Elegir un ámbito en el buscador |
| Cambiar de cámara | V o botones de cámara | Botones de cámara |
| Linterna | F, a pie o en vuelo | — |

**Capas y luz → Navegación y controles** permite reasignar teclas y ajustar sensibilidad, inversión vertical, velocidad, campo de visión y suavizado. Los ajustes de navegación se conservan en ese navegador. El modo cinematográfico suaviza las maniobras y **Ocultar interfaz** despeja el encuadre. **Mostrar interfaz** o Esc recuperan los controles.

## Territorio y patrimonio

El mundo sigue en ETRS89 / UTM 30N. Las coordenadas de dibujo restan un origen común. Los sectores de 500 m, las ortofotos, los puentes y los modelos del Atlas conservan ese sistema al desplazarse. Un registro compartido permite añadir un lugar con su fábrica original, posición, orientación, escala, recursos, huellas y paradas. El detalle urbano cede el sitio al modelo original al acercarse. Las fases históricas y las secciones se activan en sus visitas. [Registro y ejemplo reproducible](../research/territorial-heritage.md) · [Geometrías, cámaras y límites de cada fuente](SIMULADOR.md)

Las posiciones y huellas proceden de cartografía. Las alturas de 22.659 partes se estiman a partir de datos LiDAR y otras 22.053 a partir del número de plantas. El despiece de un revestimiento, las ventanas y la carpintería en edificios corrientes son interpretaciones. Las fotografías georreferenciadas aportan el color de las cubiertas. La documentación y las licencias distinguen ortofoto, cartografía, modelos de superficie y materiales de referencia. [Fuentes y licencias](GRAFICOS.md) · [Mediciones territoriales](../research/navegacion-v41/geometria.json)

## Motor y movimiento

La revisión parte del proyecto publicado en Sites v40. Usa la distribución local de Three.js r180. El agua reflectante, el recorte de terreno y varios materiales patrimoniales requieren el renderizador WebGL 2 y sus programas GLSL. El navegador puede exponer WebGPU y seguir necesitando WebGL 2 para esta escena. El selector de calidad muestra los recursos gráficos realmente empleados y habilita Ultra según capacidades. Si falla el contexto, el Atlas y el simulador ofrecen el plano y conservan los enlaces de visita. [Compatibilidad del renderizador de Three.js](https://threejs.org/docs/pages/WebGPURenderer.html) · [Pruebas de los perfiles gráficos](../research/graficos-v41/v41/perfiles.json)

La cámara a pie resuelve el movimiento en pasos cortos, con gravedad de 9,81 m/s² y radio de 32 cm. Comprueba patios, fachadas, obstáculos del mobiliario, vehículos y secciones de las mallas patrimoniales. Las puertas abiertas conservan el paso. Los puentes peatonales y el tramo construido del pantalán aportan su propio tablero. Los interiores de varias plantas con huecos superpuestos tienen límites de colisión simplificados. El tráfico usa sentidos y conexiones de la red viaria, frena ante el visitante y mantiene separación. Los radios corporales y las velocidades representan la interacción en esta maqueta.

## Reproducción

Servir `dist/` con `python -m http.server 8000 --directory dist`. El visitante recibe archivos estáticos. Para actualizar sólo la panorámica de sectores modificados, `python research/territory-aerial-buildings.py --sector 10_-1` prepara sus siluetas a partir de las huellas normalizadas y conserva los demás sectores en los paquetes compartidos. Se pueden repetir los argumentos para una finca que atraviese un límite. Una prueba modificó una altura en una copia temporal y verificó que el proceso recuperaba el contenido de los cuatro paquetes originales. El relieve, el viario, el arbolado y las fuentes cartográficas tienen sus propias recetas. [Preparación del territorio](SIMULADOR.md)

```powershell
node research/territorial-coordinates.mjs
python -X utf8 research/territory/validate.py
python research/network_validate.py
node research/test-territory-collision.mjs
python research/test-territory-street-runtime.py http://127.0.0.1:8000
python research/check-navigation-v41.py --base http://127.0.0.1:8000 --out navegacion.json
python research/check-navigation-v41.py --mobile --base http://127.0.0.1:8000 --out movil.json
python research/check-navigation-v41.py --tablet --base http://127.0.0.1:8000 --out tableta.json
```

Chrome comprobó los enlaces de las 529 paradas en plano y abrió una parada de cada uno de los 32 lugares en WebGL. Tanto al volver al salón del Casino como al regresar a pie desde Santa María, la desviación registrada fue de 0 m. En el perfil de tableta se mantuvo el movimiento mientras un segundo dedo giraba la cámara. En la Glorieta, WebKit recuperó la misma parada después de perder y reintentar el contexto gráfico. [Catálogo](../research/navegacion-v41/catalogo/rutas.json) · [Recorrido a pie y en vuelo](../research/navegacion-v41/chrome.json) · [Dos dedos](../research/navegacion-v41/tableta.json) · [Recuperación de la Glorieta](../research/navegacion-v41/recuperacion.json)

En una RTX 3090 a 1200 × 760, las vistas del Carrer Major y del pantalán registraron 16,7 ms de mediana antes y después de la revisión. En el vuelo con carga progresiva se recorrieron 3,29 km en 8 s, a 43,1 FPS de media. Los perfiles móviles de Playwright ejercitan controles y motores de navegador. Las mediciones de GPU y memoria de un iPhone o iPad físico quedan pendientes. [Rendimiento y método](../research/graficos-v41/README.md) · [Comparación visual de las mismas cámaras](../research/validation-atlas-parity/v41/comparacion.jpg) · [Errores de reproyección por monumento](../research/validation-atlas-parity/v41/controles.json)
