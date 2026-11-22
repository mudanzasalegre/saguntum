# Comparación de la revisión gráfica

Las dos columnas proceden del renderizador WebGL del simulador en Chrome para Windows. La primera corresponde al código publicado en Sites v33 y la segunda a la revisión gráfica v34. Cada par comparte cámara, hora solar, tamaño de ventana (1360 × 816) y calidad alta. El tráfico está en marcha durante las capturas.

[Abrir la comparación a tamaño completo](comparativa.jpg)

| Vista | Versión 33 | Versión 34 |
| --- | --- | --- |
| Carrer Major, a la altura de las fachadas | [Antes](v33/carrer-major.jpg) | [Después](v34/carrer-major.jpg) |
| Cubiertas del casco histórico | [Antes](v33/casco-aereo.jpg) | [Después](v34/casco-aereo.jpg) |
| Puerto de Sagunto a pie | [Antes](v33/puerto.jpg) | [Después](v34/puerto.jpg) |
| Alto Horno n.º 2 | [Antes](v33/alto-horno.jpg) | [Después](v34/alto-horno.jpg) |
| Fortín y poblado del Grau Vell | [Antes](v33/grau-vell.jpg) | [Después](v34/grau-vell.jpg) |
| Pantalán mirando a tierra | [Antes](v33/costa.jpg) | [Después](v34/costa.jpg) |
| Pantalán mirando al Mediterráneo | [Antes](v33/mar-abierto.jpg) | [Después](v34/mar-abierto.jpg) |
| Puerto al anochecer | [Antes](v33/anochecer.jpg) | [Después](v34/anochecer.jpg) |
| Panorámica territorial | [Antes](v33/panorama.jpg) | [Después](v34/panorama.jpg) |

Cada imagen tiene al lado un JSON con los parámetros reales devueltos por la aplicación. La comprobación de la lámina admite una diferencia inferior a un milímetro en posición y objetivo, y menos de una millonésima de radián en los ángulos guardados. La nueva panorámica tiene que haber acabado de cargar para tomar la captura.

Dos vistas adicionales de la Plaça Cronista Chabret comprueban la lectura de las copas, el contacto con el pavimento y la actividad peatonal. [La plaza desde arriba](plaza/cronista.jpg) · [Arbolado a cinco metros de altura](plaza/arbolado.jpg) · [Resultados WebGL](plaza/checks.json)

## Navegación y rendimiento

Se comprobó el recorrido del Atlas al Simulador y a la visita del Alto Horno, el retorno con cámara y hora restauradas, los cambios de fase, el vuelo, el modo a pie y el mapa. Se probaron la alternativa sin WebGL y los gestos en dos tamaños táctiles. Los 29 constructores patrimoniales que atienden los 31 destinos se dibujaron también en una prueba independiente con WebGL. Queda pendiente la prueba física en Safari de iPhone y iPad. [Escritorio](recorrido/resultados.json) · [Interfaz de teléfono](telefono/resultados.json) · [Gestos](tactil.json) · [Mapa 2D](mapa/resultados.json) · [Constructores patrimoniales](patrimonio-webgl.jsonl)

La medición de fluidez utiliza 119 intervalos por vista tras una espera de carga, a 1440 × 900 en una RTX 3090. El registro incluye las dos distribuciones de tiempo (mediana y percentil 95), triángulos, llamadas de dibujo, texturas y memoria JS. Los tiempos de carga y los picos durante el cambio de zona se distinguen de los intervalos ya estabilizados. [Medición por vista](rendimiento/mediciones.json) · [Controles geométricos de las siluetas y mediciones arquitectónicas](arquitectura.json) · [Pruebas de la ortofotografía y del terreno](../terrain-visual.md)

## Repetir la comparación

Con las dos distribuciones servidas por HTTP, ejecutar desde la raíz del repositorio con Python, Pillow, Playwright y Chrome instalados.

```powershell
python research/territorial-visual.py --base http://127.0.0.1:8432/ --out research/validation-visual/v33
python research/territorial-visual.py --base http://127.0.0.1:8433/ --out research/validation-visual/v34
python research/compare-territorial-renders.py
python research/territorial-metrics.py --base http://127.0.0.1:8433/ --out research/validation-visual/rendimiento
```
