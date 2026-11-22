# Edificación del simulador a la escala del Atlas

Las casas y naves del tejido general conservan sus referencias de Catastro, su huella con patios y la procedencia de altura de la versión 34. La comparación con la ciudad regional del Atlas identificó tres diferencias constructivas. El Atlas remata las azoteas con petos, organiza el alzado alrededor de una entrada y da volumen a alféizares, recercados y contraventanas. El simulador aplicaba una imagen plana por vano y clasificaba las medianeras dentro de un único sector. [Constructor de la ciudad regional](../../dist/js/city.js) · [Carpinterías de las visitas de Grau Vell](../../dist/js/coast-grau.js)

## Calle y fachada

El proceso de preparación toma muestras del exterior de los muros a intervalos máximos de dos metros. Compara cada muestra con todas las demás partes de Catastro, incluidas las del sector vecino. La orientación de la pared, la posición y el ancho de la vía y la interposición de otros edificios distinguen el frente de calle de un patio o una medianera. Una vía con restricciones al tráfico sigue proporcionando un eje físico de referencia. Las 44.838 partes se procesaron de esta forma. La elección de un vano principal en 11.304 parcelas o edificios con frente identificable sigue siendo interpretativa. No establece accesos legales ni la localización medida de una puerta.

Al acercarse, un trabajador produce paredes perforadas, cuatro retornos por vano y carpintería en un plano interior. La profundidad empleada es de 17 cm en ventanas, 27 cm en las entradas y 19 cm en las naves. Son dimensiones representativas. La malla se activa por edificio cuando ha terminado su construcción. Su propietario sustituye simultáneamente la masa de detalle anterior y sigue obedeciendo a las exclusiones de los monumentos. Los alféizares, pilastras, hojas de persiana, bajantes y antepechos de balcón se concentran en los frentes expuestos.

## Cubiertas

Para el corredor entre el casco y el puerto se tomó una ventana UTM de la cobertura MDSnE de edificios del IGN, con paso próximo a 2,5 m. Los valores se suman al MDT para trabajar con cotas de cubierta. Se excluye un metro en el borde de cada polígono y se exigen al menos 16 muestras válidas, un 78 % de cobertura interior y una altura compatible con el inventario. Se ensayan planos inclinados y dos faldones con cumbrera paralela a los lados principales. El modelo sólo se acepta si mejora claramente al horizontal con residuo bajo, tiene amplitud plausible y, para las cumbreras, reúne puntos a ambos lados. Se conserva la cota máxima de la parte edificada y su patio.

Se aceptaron **116 cumbreras y 36 planos inclinados**. La mediana de los residuos medianos de estos ajustes fue de **0,305 m** en las muestras seleccionadas. Es un error interno de ajuste al ráster, no una exactitud topográfica certificada. En el resto del término se aplican el criterio de cubierta tipológica existente y los petos de azotea según uso, altura y exposición. Las partes cuya forma ha podido ajustarse admiten la proyección de la ortofoto sobre los planos inclinados. [Fuente WCS y huella digital del insumo](../../dist/assets/territory/building-fabric/manifest.json) · [Productos LiDAR del CNIG](https://centrodedescargas.cnig.es/CentroDescargas/index.jsp)

## Comprobación y reproducción

Las tres parejas se capturaron en Chrome con WebGL. Las versiones comparten posición, dirección, hora y viewport de 1360 × 816. El Carrer Major y el Carrer de Barcelona permiten comparar las jambas y la planta baja. En las naves se aprecian las cumbreras ajustadas al ráster. Los modelos patrimoniales y las luces seleccionados por cada versión también aparecen en sus capturas.

| Lugar | Versión 34 | Versión 35 |
| --- | --- | --- |
| Carrer Major | [Antes](v34/major.jpg) | [Después](v35/major.jpg) |
| Carrer de Barcelona | [Antes](v34/barcelona.jpg) | [Después](v35/barcelona.jpg) |
| Naves de Puerto de Sagunto | [Antes](v34/naves.jpg) | [Después](v35/naves.jpg) |

Los resultados incluyen el número de edificios y huecos físicos residentes en torno a la cámara, los triángulos dibujados, la mediana y el percentil 95 de 90 intervalos entre fotogramas. El control geométrico verifica tres vanos con sus doce retornos y 410 m² de planta en un tejado cóncavo con patio atravesado por una cumbrera. La prueba táctil emplea Chrome de escritorio y un viewport de 390 × 844. [Medición v35](v35/checks.json) · [Medición v34](v34/checks.json) · [Prueba táctil](tactil/checks.json)

```powershell
python research/territory-building-fabric.py
node research/test-building-fabric.mjs
python research/territory-building-fabric-gl.py --base http://127.0.0.1:8455/ --new --out research/paridad-arquitectura/v35
```

La receta conserva el TIFF en caché local. En la distribución hay 22 paquetes comprimidos por zonas, con un peso total aproximado de 314 kB. La carga de arquitectura próxima solicita sólo las zonas correspondientes. El simulador conserva un camino de representación básica si el navegador carece de descompresión de flujos.
