# La Glorieta · guía técnica y fuentes

La ruta `#glorieta` abre la plaza del Cronista Chabret en el casco de Sagunto. La raíz y `#atlas` siguen abriendo la portada territorial. La visita utiliza el catálogo, controlador de paradas, panel de fuentes, marcadores, temas y cámara del Atlas. En el simulador, el mismo constructor recibe las alturas territoriales y su matriz local se registra en ETRS89 / UTM 30N. [Visita](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta) · [Monumento en el simulador](https://saguntum-atlas-3d.monmode.chatgpt.site/#simulador/glorieta/glorieta-romeu)

## Recorrer la escena

En la visita hay 24 encuadres y cinco ámbitos. El plano se puede abrir desde el panel o el minimapa. Un selector permite comparar el trazado actual con seis ámbitos interpretados de la planta de 1986–2009. Ambos planos conservan la posición de las paradas. La cronología relaciona 16 cambios con su fuente documental. La parada del subsuelo incluye una columna con las cuatro cotas publicadas del sondeo III y el contexto de los enterramientos. [Sondeo III](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta/glorieta-subsuelo) · [Plano histórico](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta/glorieta-comparar)

La luz diurna y dorada procede del Atlas. «Vista nocturna» permite examinar las luminarias y el efecto de la luz cálida sobre el paseo. «Surtidores» detiene el agua animada. En el simulador, la plaza responde a la hora solar y el agua se controla en «Capas y luz». La actividad territorial sigue usando la red habitual. El modelo incorpora los equipamientos permanentes. Los encuadres del Palacio Municipal muestran tanto el extremo que da a la Glorieta como la fachada de la Autonomía. [Fachada del reloj](https://saguntum-atlas-3d.monmode.chatgpt.site/#glorieta/glorieta-reloj)

## Datos, fechas y alcance

| Elemento | Evidencia utilizada | Alcance de la reconstrucción |
| --- | --- | --- |
| Plaza, parterres y caminos | Ortofoto PNOA, MDT del Atlas, láminas de López Herranz y red OSM | El perímetro digitalizado encierra aproximadamente 9.915 m². Los vértices muestreados en el MDT oscilan entre 47,88 y 49,00 m. Los despieces de pavimento y la microtopografía son interpretativos. |
| Vegetación y mobiliario | Ortofoto, fotografías y plantas de uso | 59 posiciones de arbolado, 21 bancos y 17 luminarias. Especies, diámetros, diseños y posiciones individuales tienen precisión variable. Los surtidores ilustran su funcionamiento. |
| Patrimonio edificado | Catastro INSPIRE, MDSnE de edificios, ortofoto y fotografías de fachada | 191 partes de 45 parcelas, diez patios y 27 portales. La biblioteca ocupa la planta baja. El mercado y el auditorio se visitan desde el espacio público. Los frentes sin levantamiento se interpretan. |
| José Romeu | Fuentes sobre 1888 y 1976, fotografía atribuida de 2009 y referencias contemporáneas | La figura principal, su perfil y la inscripción se modelaron específicamente. La orientación, las dimensiones y el dorso son aproximados. En los paneles laterales se conserva el emplazamiento de los bajorrelieves. |
| Arqueología y proyectos posteriores | Publicación de la intervención, estudio de la UPV y noticias municipales | Los hallazgos se presentan mediante el registro de la excavación. Las termas se explican como hipótesis. La renovación infantil de 2018 está documentada. Los aseos licitados en mayo de 2026 se mencionan en la cronología. |

La geometría y sus niveles de certeza se apoyan en material de varias fechas. El Archivo Municipal y la memoria de Peris Arquitectos se consultaron a través de las láminas y citas reproducidas en el estudio de la UPV. No se dispone de un levantamiento arquitectónico integral de 2026. [Investigación histórica, arqueología y escultura](../research/glorieta-historia.md) · [Cartografía de la plaza](../research/glorieta/plaza-actual.md) · [Fachadas, portales y edificios](../research/glorieta-arquitectura.md)

## Implementación y reproducción

Los archivos `glorieta-*.json` de `dist/assets/data` contienen la planta, los edificios, los encuadres, el catálogo y la historia. `glorieta.js` coordina los tres grupos de geometría. El Atlas utiliza un volumen ligero a distancia y construye el detalle en la aproximación. En el simulador la carga espacial conserva la animación de los surtidores, registra las superficies transitables y retira las representaciones genéricas correspondientes. El worker compartido también se recompila para mantener el mismo registro de constructores.

Desde la raíz del repositorio se puede servir la distribución estática con `python -m http.server 8461 --directory dist`. Los scripts de preparación registran las fuentes y sus transformaciones. La prueba de la visita requiere Playwright y Chrome.

```powershell
python research/check-glorieta-layout.py
python research/validar-glorieta.py --base http://127.0.0.1:8461/
node research/validate-territory-heritage.mjs
```

Las imágenes del recorrido se obtuvieron del sitio en Chrome con WebGL. Las inspecciones individuales de la escultura y la plaza prueban sus componentes por separado. El ensayo integrado comprueba escritorio, pantalla táctil emulada, enlaces, luces, fuentes, selección en plano y el retorno desde la visita a la cámara territorial. La prueba independiente sin WebGL comprueba la documentación, el diagrama y la comparación de planos en una pantalla vertical. Queda pendiente una medición en Safari sobre dispositivos iOS físicos. [Resultados del recorrido](../research/glorieta-validacion/resultados.json) · [Captura del monumento](../research/glorieta-validacion/glorieta-romeu.jpg) · [Captura del Ayuntamiento](../research/glorieta-validacion/glorieta-reloj.jpg)
