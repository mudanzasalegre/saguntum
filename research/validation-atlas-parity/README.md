# El Atlas y el simulador desde el mismo punto

Se abrieron seis paradas en el Atlas de Sites v34, con Chrome en Windows, a 1200 × 760 píxeles. La visita del Atlas es la referencia en los tres ámbitos. Cada fila permite examinar el edificio y el entorno que asoma detrás o delante de él. [Comparación en una lámina](comparacion.jpg)

| Parada y encuadre | Visita del Atlas | Simulador v34 | Simulador v35 |
| --- | --- | --- | --- |
| Plaça Major, frente a los soportales | [Atlas](atlas/plaza-soportales.jpg) | [v34](v34/plaza-soportales.jpg) | [v35](v35/plaza-soportales.jpg) |
| Plaça Major, mercado y manzanas contiguas | [Atlas](atlas/plaza-mercado.jpg) | [v34](v34/plaza-mercado.jpg) | [v35](v35/plaza-mercado.jpg) |
| Alto Horno n.º 2, acceso | [Atlas](atlas/horno-acceso.jpg) | [v34](v34/horno-acceso.jpg) | [v35](v35/horno-acceso.jpg) |
| Gerencia, fachada de las oficinas | [Atlas](atlas/gerencia-oficinas.jpg) | [v34](v34/gerencia-oficinas.jpg) | [v35](v35/gerencia-oficinas.jpg) |
| Grau Vell, acceso al Fortín | [Atlas](atlas/grau-acceso.jpg) | [v34](v34/grau-acceso.jpg) | [v35](v35/grau-acceso.jpg) |
| Grau Vell, conjunto y costa | [Atlas](atlas/grau-conjunto.jpg) | [v34](v34/grau-conjunto.jpg) | [v35](v35/grau-conjunto.jpg) |

Las capturas de uso normal abren el conjunto del Grau Vell con la interfaz de cada edición y la cámara que ofrece al visitante. En el simulador se llega mediante el buscador. Se tomaron en sesiones aparte, sin el inspector de Three ni ajustes de cámara. [Visita nativa](atlas/uso-normal.jpg) · [Simulador v34](v34/uso-normal.jpg) · [Simulador v35](v35/uso-normal.jpg)

## Cómo se registran las cámaras

Se lee la cámara activa que usa el renderizador Three de la visita y se transforma el punto de vista y la dirección mediante la transformación local que el propio simulador utiliza para situar ese monumento en EPSG:25830. Para registrar la diferencia entre ambos relieves se mide el desplazamiento vertical de vértices de las mismas piezas y se aplica su mediana. En la captura comparativa el simulador recibe la misma distancia focal, ampliación y desplazamiento óptico que el Atlas. Este último desplaza la imagen para reservar espacio a la ficha de la visita.

La prueba comprueba posición y orientación, junto con los cuatro coeficientes de proyección que determinan el encuadre. Lee el resultado tras el dibujo final de WebGL, incluidos los pases de posprocesado que estén activos. Se mantienen los materiales, luces, capas, tráfico y geometrías de cada edición. Los píxeles del lienzo no incluyen paneles HTML.

## Controles de geometría y color

Para cada malla con nombre se comparan tres vértices de su geometría, su número de vértices y su posición en el sistema proyectado. Se registran coincidencias horizontales con una tolerancia máxima de 0,30 m por muestra. La prueba distingue las piezas del constructor del monumento, las piezas del contexto local bajo el grupo original del Atlas y las demás mallas nombradas dentro de 205 m. Una malla agrupada puede representar un número variable de edificios o elementos de la calle. Las instancias y los objetos sin nombre quedan fuera de este recuento.

El error de reproyección mide la distancia en píxeles entre puntos correspondientes del monumento visibles en los dos encuadres. La transformación local y la elevación de terreno varían ligeramente entre representaciones. También se conserva el color de cada imagen en una rejilla de 150 × 95 muestras. La distancia de color CIE76 resume cuánto se parece la imagen al Atlas en el encuadre entero. Depende tanto de colores como de geometrías visibles, relieve, cielo y elementos en movimiento. [Cámaras del Atlas](atlas/controles.json) · [Registro v34](v34/controles.json) · [Registro v35](v35/controles.json) · [Mediciones de color](color.json)

Las seis vistas de v35 emplean el terreno natural y el perfil de luz dorada del Atlas. El cambio se aprecia especialmente en las losas y portales de la Plaça Major, el vallado que rodea el Horno y los jardines frente a las oficinas de Gerencia. En el acceso al Fortín, la cubierta gris en primer plano tiene la misma geometría, material y textura que en la visita original.

Se compararon los parámetros de sombra sobre esa cubierta desde la cámara del Atlas. En el recorte entre los píxeles (600, 580) y (900, 730), conservar el desplazamiento de sombra del Atlas en las caras invertidas casi horizontales redujo el error de color medio CIE76 de 23,36 a 3,66. La intervención sólo actúa sobre los materiales originales de cubierta con dos caras y se desactiva al pasar a la hora solar. Se verificó el cambio de perfil de ida y vuelta en WebGL. En la imagen completa de acceso, la medida pasó de 9,08 a 4,24. La vista de conjunto del Grau cambió de 4,73 a 4,77. Gerencia y los soportales conservaron el mismo resultado de imagen. Los bordes sobre el terreno, los objetos en movimiento y las sombras locales todavía pueden presentar diferencias entre la visita y el simulador.

| Grupo de entorno del Atlas | Lotes presentes por nombre en v34 | Lotes presentes por nombre en v35 |
| --- | ---: | ---: |
| Trama urbana y accesos de la Plaça Major | 0 de 28 | 28 de 28 |
| Recepción y entorno industrial del Alto Horno | 0 de 26 | 26 de 26 |
| Ciudad jardín y entorno urbano de Gerencia | 0 de 18 | 18 de 18 |
| Poblado y entorno del Grau Vell | 12 de 15 | 15 de 15 |

Esta tabla identifica piezas del constructor por su nombre dentro de la ventana de 205 m. El registro geométrico aplica, adicionalmente, el requisito de comprobar la misma triangulación y tres vértices colocados en el mismo lugar. Las superficies adaptadas a distintos relieves pueden compartir el nombre y presentar una triangulación diferente.

Como control independiente, se abrieron de nuevo en el Atlas actual las paradas de los soportales, el acceso al Horno y el acceso al Fortín. Coincidieron la proyección y la posición de cámara con la versión anterior. La diferencia absoluta RGB media redondeada fue de 0,000 sobre 255 en los tres pares. [Regresión del Atlas](regresion-atlas.json)

## Repetir el ensayo

Se necesitan Python, NumPy, Pillow, Playwright y Chrome. Se sirve `dist/` de la versión 34 en el primer puerto y la versión a comparar en el segundo. El paso del Atlas guarda las muestras de registro en un directorio temporal; las tres ejecuciones deben compartir esa caché. El parámetro `--cache` permite elegir su ubicación.

```powershell
python research/compare-atlas-territory.py --base http://127.0.0.1:8454/ --stage atlas --native
python research/compare-atlas-territory.py --base http://127.0.0.1:8454/ --stage v34 --native
python research/compare-atlas-territory.py --base http://127.0.0.1:8455/ --stage v35 --native
python research/compare-atlas-territory.py --base http://127.0.0.1:8455/ --stage regresion
python research/compare-atlas-territory.py --stage comparar
```
