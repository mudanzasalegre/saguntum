# Patrimonio en el Simulador 3D de SAGUNTUM

El inventario reúne 32 destinos, incluida la Glorieta del Cronista Chabret. Los anclajes proceden de los documentos de monumentos, arqueología, patrimonio industrial, costa y paisajes que ya alimentan el Atlas. El Castillo usa la parada «conjunto» y el Teatro usa el centro registrado de su planta.

## Del panorama a la visita

La volumetría general procede de la cartografía territorial. El panorama incorpora tres siluetas ligeras. La del Castillo sigue su perímetro y sus murallas cartografiadas. La del Alto Horno usa el perfil de sección y la torre del modelo. El pantalán conserva el paseo, la plataforma terminal y los apoyos identificados en la documentación de su estado actual.

Al acercar la cámara, el simulador ejecuta los constructores originales del Atlas. La casa dels Berenguer y el muro de Diana comparten geometría registrada. Los dos tramos del pantalán comparten su eje y su fase temporal. Así, 30 constructores dan acceso a 32 destinos. El enlace de cada destino abre su visita completa en el Atlas.

| Ámbito | Modelos recuperados |
| --- | --- |
| Sagunto | Glorieta, Santa María, Plaça Major, Judería, Calvario, Berenguer, Diana, Sangre, Salvador, Museo Arqueológico, Castillo, Teatro, Circo, Pòrtic, Domus y Necrópolis |
| Puerto | Alto Horno, Talleres, Museo Industrial, Gerencia, Casino, Begoña, Economato, Barrio Obrero y Sanatorio |
| Litoral | Paseo del Pantalán, tramo marítimo, Grau Vell y antiguo puerto de Arse–Saguntum |
| Paisajes | Marjal dels Moros, Dunas de Almardà y corredor del Palancia |

El detalle urbano incorpora los entornos originales disponibles, entre ellos la Plaça Major, el Alto Horno, la Gerencia, Grau Vell y el pantalán. El constructor territorial de la Glorieta incorpora además los edificios colindantes. Las visitas del Atlas conservan sus entornos monográficos, planos, secciones, fuentes y cronologías.

En el mundo territorial se activan las restituciones locales de ambos tramos del pantalán y del antiguo puerto, además de la lectura de la fábrica antigua de Diana. En Pòrtic, Domus, Circo y Necrópolis la lectura histórica abre la parada original con sus herramientas de excavación. Las fases, intervalos y referencias se leen en los documentos de la visita correspondiente. La restitución del antiguo puerto mantiene la incertidumbre de sus hipótesis marítimas.

## Registro espacial y sustitución

Los dibujos de v32 contienen puntos geográficos y elementos arquitectónicos en la proyección métrica local original. El adaptador calcula una matriz afín en el anclaje de cada conjunto y aplica esa matriz al grupo completo. El muestreo de alturas utiliza las mallas territoriales en el mismo marco ETRS89 / UTM 30N. Los monumentos conservan su orientación y sus proporciones originales.

La comparación entre esta matriz y la reproyección directa de cada vértice dio las siguientes desviaciones máximas en la horizontal.

| Control | Puntos comparados | Desviación máxima |
| --- | ---: | ---: |
| Contorno del Castillo | 272 | 0,014 m |
| Contorno del Teatro | 66 | 0,001 m |
| Huella del Fortín | 15 | Menos de 0,001 m |
| Apoyos conservados del pantalán marítimo | 21 | 0,096 m |

Estas cifras cuantifican el error añadido por el cambio de marco. La precisión absoluta depende de los datos originales. Entre el foco del Castillo y el del Alto Horno hay 5.561 m en planta. Entre el Alto Horno y la Gerencia hay 574 m, y entre el foco del paseo del pantalán y el Fortín hay 3.322 m.

El gestor cruza los identificadores de Catastro y OSM y la posición de los cuerpos genéricos con las huellas reclamadas por el modelo activo. Un índice de celdas de 64 m limita las consultas. La silueta lejana del horno sustituye los dos cuerpos situados bajo la máquina y conserva el pabellón contiguo. Las sustituciones cambian al entrar, salir o desactivar la capa. En las geometrías con identificadores diferentes, la comprobación espacial emplea el centro de la envolvente de cada cuerpo. Las huellas cóncavas y los límites entre conjuntos siguen siendo casos que conviene inspeccionar al actualizar la cartografía.

## Alta de una visita en el registro compartido

El Atlas y el simulador leen [el manifiesto](../dist/assets/data/atlas-visits.json) en su arranque. La sección `inventories` identifica los documentos históricos que alimentan los catálogos especializados. La lista `visits` acepta nombres de documentos nuevos de `dist/assets/data/`, sin extensión. Cada documento contiene el identificador, la información editorial, la georreferencia y la fábrica de la visita. Registrarlo una vez activa búsqueda, marcador, selección, enlace profundo, paradas, carga y descarga en los dos modos.

| Campo de la ficha | Lectura |
| --- | --- |
| `id`, `name`, `coordinate`, `region` | Identificador estable, nombre, longitud y latitud en grados, y uno de los seis ámbitos del Atlas. |
| `short`, `category`, `description`, `sources` | Textos del catálogo y referencias. Se admiten también los campos editoriales habituales del Atlas, entre ellos `era`, `facts`, `history`, `features` y `angle`. |
| `footprint` o `footprints`, `buildingIds` | Anillo geográfico, o lista de polígonos con `coordinates` exteriores y `holes` interiores. Los identificadores opcionales de Catastro u OSM precisan la sustitución. |
| `guide` | Objeto con `stops` y, opcionalmente, `regions`, o nombre del documento JSON que lo contiene. Cada parada lleva `id`, `title` y `coordinate`. Admite `intro`, `mode`, `requiresSection` y `interiorView`. Las restricciones físicas de acceso y la incertidumbre histórica se documentan en la ficha y sus paradas. |
| `scene.module`, `scene.factory` | Ruta al módulo original relativa a `dist/js/` y nombre de la exportación. La exportación predeterminada por convención se llama `createVisit`. |
| `scene.frame`, `scene.yawDegrees`, `scene.scale`, `scene.offset` | Con el marco predeterminado `anchor`, el origen es el anclaje a ras del terreno. Los modelos dibujados en la malla histórica usan `atlas`. El giro sigue la convención de Three.js sobre Y. El desplazamiento se expresa en metros sobre los ejes del dibujo. |
| `scene.resources`, `scene.preloadDistance`, `scene.nativeDistance` | Diccionario de documentos JSON por clave de la fábrica y distancias horizontales en metros. Los valores iniciales son 260 m para la precarga y 100 m para el detalle completo. |
| `historical` | Estado histórico opcional, con `period`, `href`, `confidence`, `sources` e `inWorld` cuando la fábrica permite activarlo. |

La firma de la fábrica es `createVisit({record, guide, resources, project, heightAt, renderer})`. Puede ser asíncrona. `project(longitud, latitud)` y `heightAt(x, z)` trabajan en **el sistema de dibujo de esa escena**. El grupo devuelto debe tener el eje Y hacia arriba. Puede entregarse directamente como un `Object3D` o como `{group, selectFocus, setSection, setHistorical, dispose}`. Los cuatro métodos son opcionales. Para nuevas monografías, el mismo módulo proporciona las mallas, materiales originales y controles a las dos vistas. `dispose` libera los recursos privados del autor, como temporizadores y escuchas. El gestor libera las geometrías, instancias, materiales y texturas del grupo.

En la distancia se dibujan las siluetas territoriales y los edificios cartografiados. Para las visitas nuevas se precarga el módulo al entrar en su entorno urbano. La geometría nativa y sus máscaras entran en el mismo fotograma cuando están listas. Para los conjuntos históricos, un trabajador prepara la representación urbana. A pie o en vuelo bajo, en un radio de 100 m del anclaje, el gestor recupera el árbol de escena original, sus luces y controles aunque el visitante todavía no haya abierto una parada. Una parada seleccionada pide ese árbol directamente. La histéresis horizontal y vertical evita oscilaciones. Se conserva el modelo nativo hasta salir de la ventana de descarga o hasta que otro conjunto más próximo requiera su plaza. El panel de diagnóstico expone el nivel de cada conjunto en `territoryStatus.heritage.levels`.

Las nuevas huellas se comparan con los anillos del edificio y sus patios cuando el sector contiene esa geometría. El índice compacto del panorama usa el centro y los identificadores disponibles. Se conserva el edificio que sólo comparte la medianera, junto con los cuerpos que caben en un patio abierto. Las máscaras y colisiones se retiran cuando se descarga el conjunto.

La [prueba de registro](validate-heritage-registry.py) inyecta una ficha adicional exclusivamente en el navegador de pruebas. Recorre su enlace de parada en ambos sentidos en el plano y en 3D, dibuja su modelo con escala y giro, verifica la cota, las máscaras, la descarga, los controles y la promoción automática del Alto Horno. La prueba contrasta la posición y el objetivo antes y después de la visita con una tolerancia de 10 cm, además de la hora, la parada y el modo. Se ejecuta desde el repositorio con `python research/validate-heritage-registry.py`, Python Playwright y Chrome.

### Comparación visual del 23 de noviembre de 2026

Se igualaron la óptica y el encuadre en Chrome con WebGL 2 y SwiftShader. En el acceso al Alto Horno coincidieron 114 de los 114 lotes arquitectónicos y 26 de 26 lotes del entorno. En 145 puntos de control visibles, la mediana del error de reproyección fue de 0,57 píxeles. En Grau Vell coincidieron 98 de 99 lotes arquitectónicos dentro de la tolerancia de 30 cm en planta. Los 15 lotes del entorno figuraban por nombre y 11 superaron el cotejo geométrico. La mediana de 245 controles visibles fue de 2,33 píxeles. En la imagen costera se aprecian diferencias en la vegetación de fondo y la cubierta próxima. Los dos casos acreditaron el nivel patrimonial nativo.

[Comparación visual](validation-atlas-parity/v41/comparacion.jpg) · [Cámaras y controles numéricos](validation-atlas-parity/v41/controles.json) · [Regresión de los 30 constructores y del agua](validation-atlas-parity/v41/patrimonio-webgl.jsonl)

Con la distribución servida en el puerto 8471, pueden repetirse los dos encuadres mediante estos comandos. Ambos deben compartir la misma carpeta temporal de referencias.

```sh
python research/compare-atlas-territory.py --software --base http://127.0.0.1:8471/ --stage atlas --only horno-acceso grau-acceso --out research/validation-atlas-parity/v41/atlas
python research/compare-atlas-territory.py --software --base http://127.0.0.1:8471/ --stage simulador --only horno-acceso grau-acceso --out research/validation-atlas-parity/v41/simulador
```

## Suelo y mar

Los parches de cimentación proceden de los propios constructores. El trabajador calcula la diferencia entre las cotas de v32 y el MDT. El terreno local se vuelve a triangular al acercarse al monumento y mantiene la ortofoto compartida. La corrección del teatro emplea la función original de su graderío y su cuerpo escénico. El Circo y la Necrópolis abren únicamente sus ventanas de excavación permanente. La cámara peatonal reconoce estas aberturas.

El Mediterráneo reutiliza la clase Water de la distribución, sus normales de onda, el campo de distancia costera, el planificador de reflejos y el shader del pantalán. La nueva entrada admite varias polilíneas métricas para que los bordes exteriores de recorte no generen espuma. Toda la superficie marina usa el mismo polígono y recibe la posición solar de la escena. La transición cromática próxima a la costa indica distancia a la orilla. El fondo sumergido es expositivo y carece de valor batimétrico.

## Preparación y comprobaciones

El navegador construye los conjuntos próximos en un trabajador de módulos. Los buffers de vértices e índices, las matrices de instanciación y las texturas pasan al hilo gráfico mediante transferencia. El trabajador importa el mismo archivo local de Three que utiliza la distribución. La alternativa para un navegador sin lienzo fuera de pantalla ejecuta el constructor original en el hilo principal. Los movimientos sobre la cartografía y la consulta del mapa siguen disponibles durante la carga progresiva.

El simulador mantiene entre dos y cuatro conjuntos de detalle en escritorio según el perfil y uno en dispositivos con pantalla estrecha o puntero táctil. El muestreo de grupos vegetales y guijarros interpretativos conserva posiciones originales distribuidas por el terreno. En una vista de comprobación, esa reducción llevó la Marjal de aproximadamente 1,53 millones a 131.000 triángulos y las Dunas de 1,68 millones a 91.000. Las estructuras y la visita original conservan su geometría.

El trabajador empaquetado se incluye en la distribución. Se puede regenerar después de modificar un constructor o su adaptador.

```sh
npm install --no-save --package-lock=false esbuild@0.25.12
node research/build-territory-heritage.mjs
```

Para repetir la prueba en Node 22, con Chrome o Chromium disponible, ejecutar el comando siguiente desde el repositorio. La variable opcional `CHROME_PATH` selecciona el ejecutable.

```sh
node research/validate-territory-heritage.mjs
```

La comprobación del 22 de noviembre de 2026 construyó los 29 conjuntos y los dibujó en WebGL con Chromium y SwiftShader sobre el MDT y las ortofotos del simulador. Se verificaron las ventanas orientadas del Circo y la Necrópolis, el rebaje bajo el Teatro, la alternancia de las fases locales y la sustitución del horno al conmutar la capa. El polígono marino produjo 607 triángulos con el shader original, las tres texturas activas y código de error WebGL cero. Los tiempos de cada fila incluyen construcción, transferencia y un primer dibujo en la máquina de prueba. La evaluación de la navegación completa y sus tiempos de fotograma se recoge en la validación general.

[Resultados WebGL por conjunto](validation-territory/patrimonio-webgl.jsonl)
