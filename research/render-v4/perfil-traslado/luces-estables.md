# Iluminación programable durante el traslado de Sagunto al Puerto

Durante el segundo traslado medido, WebGL 2 enlazó 11 programas gráficos al entrar en Puerto de Sagunto. Con la selección de luces anterior enlazaba 44. La imagen del acceso al Alto Horno conservó la misma cámara en ambas configuraciones. [Medidas de los dos pares A/B](luces-estables.json)

## Qué cambia en el renderizador

El simulador sigue eligiendo las luces patrimoniales por posición, fase visible, alcance y calidad. Dos luces de escena conservan sus identidades aunque se descargue un monumento y aparezca otro. Al entrar en un interior con más focos, se usan grupos de cuatro u ocho. Se copian la posición mundial, el color lineal, la intensidad, la distancia y el decaimiento de las fuentes originales. Las posiciones vacantes tienen intensidad cero. Un punto de luz con sombras propias conserva su cámara y sus mapas.

La luz de contorno del Atlas pasa a intensidad cero al seleccionar hora solar. El sol conserva la misma configuración de shader aunque se desactiven las sombras por distancia o de noche. En esos tramos, la intensidad de sombra es cero y el sistema deja de solicitar pasadas de profundidad. Los cambios de área y de hora que sólo modifican uniformes permiten reutilizar programas ya enlazados.

## Ensayo con el simulador completo

Se utilizó Chrome de escritorio con aceleración en una GeForce RTX 3090, calidad alta, sol de mediodía del 21 de junio y un área de 1.000 × 640 píxeles. En cada sesión se aterrizó desde la panorámica, se subió en vuelo libre y se seleccionaron Sagunto histórico y Puerto de Sagunto con el buscador. La medición empezó en el segundo traslado, antes de cargar el Alto Horno. El perfil de V8 tomó muestras cada milisegundo. Las dos versiones presentaron fotogramas con normalidad durante la preparación de los modelos.

| Mayor intervalo observado | Par 1, referencia | Par 1, luces estables | Par 2, referencia | Par 2, luces estables |
| --- | ---: | ---: | ---: | ---: |
| WebGL 2, entre imágenes presentadas | 4.266 ms | 1.432 ms | 2.721 ms | 606 ms |
| WebGPU, entre callbacks rAF | 2.134 ms | 1.234 ms | 3.168 ms | 1.051 ms |

El segundo par invirtió el orden de ejecución. Se mantuvieron las mismas versiones de los acabados y de la preparación predictiva en el tratamiento y su control. El contador WebGL registró 57 programas ya enlazados antes del traslado con las luces estables y 74 en la referencia. Durante el traslado se enlazaron otros 11 y 44, respectivamente. La caché del simulador registró tres reutilizaciones adicionales con las luces estables y una en el control.

En ese mismo par, el tiempo acumulado de CPU muestreado en `getProgramInfoLog` bajó de 5.947 a 1.498 ms. Las pilas sitúan la espera residual en el primer uso de programas de los meshes de escena. El coordinador de contacto aparece en las pilas de los tres destinos de renderizado. Ese dato no permite atribuir por separado la espera a la pantalla, al destino HDR ni al reflejo del agua. Las cifras proceden de un único equipo y un traslado concreto. La variabilidad entre sesiones queda reflejada en la tabla.

## Casino, noche en la Glorieta y costa

Se compararon el salón del Casino con iluminación dorada, el monumento a Romeu en la Glorieta a las 23:00 solares y los trípodes marítimos del pantalán de día. Las seis comparaciones conservaron las posiciones de cámara y la intensidad efectiva de las sombras. Las dos farolas activas en el encuadre de Romeu conservaron sus coordenadas, color, intensidad, alcance y decaimiento. La diferencia media en las capturas de 1.000 × 640 píxeles fue inferior a 0,001 por canal en la escala 0–255, con percentil 95 igual a cero en las seis. El tráfico, los peatones y los chorros animados estaban desactivados para comparar la iluminación de la escena fija. [Capturas WebGL 2](luces-visitas-webgl2.jpg) · [Fotometría WebGL 2](luces-visitas-webgl2.json) · [Capturas WebGPU](luces-visitas-webgpu.jpg) · [Fotometría WebGPU](luces-visitas-webgpu.json)

## Reproducción

Con el directorio `dist` servido en el puerto 8492, estas órdenes preparan una referencia con los dos módulos de iluminación anteriores, conservando los demás archivos de la aplicación. Se muestran para PowerShell desde la raíz del repositorio. [Parche de referencia acotado a las luces](luces-referencia.patch)

```powershell
$root = (Get-Location).Path
$refs = Join-Path $env:TEMP 'saguntum-referencia-luces'
New-Item -Force -ItemType Directory (Join-Path $refs 'js') | Out-Null
Copy-Item -LiteralPath 'dist/js/territory-atmosphere.js','dist/js/territory-heritage.js' -Destination (Join-Path $refs 'js')
Push-Location $refs
git apply --ignore-space-change (Join-Path $root 'research/render-v4/perfil-traslado/luces-referencia.patch')
Pop-Location
python research/profile-territory-teleport-v4.py --base http://127.0.0.1:8492 --engine webgl2 --study control --light-reference "$refs/js" --out "$refs/control"
python research/profile-territory-teleport-v4.py --base http://127.0.0.1:8492 --engine webgl2 --study control --out "$refs/actual"
python research/check-territory-light-views-v4.py --base http://127.0.0.1:8492 --light-reference "$refs/js" --out "$refs/vistas"
```

Para perfilar WebGPU se emplea `--engine webgpu` y se omite `--study control`. La prueba de transformación y fotometría puede ejecutarse en CPU con `node --experimental-loader ./research/validate_loader.mjs research/test-territory-exhibit-lights-v4.mjs`.
