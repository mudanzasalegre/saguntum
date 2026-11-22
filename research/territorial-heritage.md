# Patrimonio en el Simulador 3D de SAGUNTUM

El inventario reúne los 31 destinos de Sites v32. Los anclajes proceden de los documentos de monumentos, arqueología, patrimonio industrial, costa y paisajes que ya alimentan el Atlas. El Castillo usa la parada «conjunto» y el Teatro usa el centro registrado de su planta.

## Del panorama a la visita

La volumetría general procede de la cartografía territorial. El panorama incorpora tres siluetas ligeras. La del Castillo sigue su perímetro y sus murallas cartografiadas. La del Alto Horno usa el perfil de sección y la torre del modelo. El pantalán conserva el paseo, la plataforma terminal y los apoyos identificados en la documentación de su estado actual.

Al acercar la cámara, el simulador ejecuta los constructores originales de v32. La casa dels Berenguer y el muro de Diana comparten geometría registrada. Los dos tramos del pantalán comparten su eje y su fase temporal. Así, 29 constructores dan acceso a 31 destinos. El enlace de cada destino abre su visita completa en el Atlas.

| Ámbito | Modelos recuperados |
| --- | --- |
| Sagunto | Santa María, Plaça Major, Judería, Calvario, Berenguer, Diana, Sangre, Salvador, Museo Arqueológico, Castillo, Teatro, Circo, Pòrtic, Domus y Necrópolis |
| Puerto | Alto Horno, Talleres, Museo Industrial, Gerencia, Casino, Begoña, Economato, Barrio Obrero y Sanatorio |
| Litoral | Paseo del Pantalán, tramo marítimo, Grau Vell y antiguo puerto de Arse–Saguntum |
| Paisajes | Marjal dels Moros, Dunas de Almardà y corredor del Palancia |

El detalle urbano incorpora el entorno modelado de Grau Vell y del pantalán. En los demás destinos se muestra la geometría principal y el territorio circundante aporta el contexto general. Las visitas del Atlas conservan sus entornos monográficos, planos, secciones, fuentes y cronologías.

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

## Suelo y mar

Los parches de cimentación proceden de los propios constructores. El trabajador calcula la diferencia entre las cotas de v32 y el MDT. El terreno local se vuelve a triangular al acercarse al monumento y mantiene la ortofoto compartida. La corrección del teatro emplea la función original de su graderío y su cuerpo escénico. El Circo y la Necrópolis abren únicamente sus ventanas de excavación permanente. La cámara peatonal reconoce estas aberturas.

El Mediterráneo reutiliza la clase Water de la distribución, sus normales de onda, el campo de distancia costera, el planificador de reflejos y el shader del pantalán. La nueva entrada admite varias polilíneas métricas para que los bordes exteriores de recorte no generen espuma. Toda la superficie marina usa el mismo polígono y recibe la posición solar de la escena. La transición cromática próxima a la costa indica distancia a la orilla. El fondo sumergido es expositivo y carece de valor batimétrico.

## Preparación y comprobaciones

El navegador construye los conjuntos próximos en un trabajador de módulos. Los buffers de vértices e índices, las matrices de instanciación y las texturas pasan al hilo gráfico mediante transferencia. El trabajador importa el mismo archivo local de Three que utiliza la distribución. La alternativa para un navegador sin lienzo fuera de pantalla ejecuta el constructor original en el hilo principal. Los movimientos sobre la cartografía y la consulta del mapa siguen disponibles durante la carga progresiva.

El simulador mantiene a lo sumo dos conjuntos de detalle en escritorio y uno en dispositivos con pantalla estrecha o puntero táctil. El muestreo de grupos vegetales y guijarros interpretativos conserva posiciones originales distribuidas por el terreno. En una vista de comprobación, esa reducción llevó la Marjal de aproximadamente 1,53 millones a 131.000 triángulos y las Dunas de 1,68 millones a 91.000. Las estructuras y la visita original conservan su geometría.

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
