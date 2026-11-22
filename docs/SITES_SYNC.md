# Sincronización de Sites a GitHub

## Copia local de Sites v32

- Proyecto Sites: `appgprj_6afeb5aaef8c8191b0062318fb3a24f1`.
- Web publicada: https://saguntum-atlas-3d.monmode.chatgpt.site
- Versión **32**, la última guardada en Sites al exportar el 22 de noviembre de 2026.
- Commit de origen `568bb3627fa6ed0c21c123e7b89a14aa50415cd7`.
- Árbol Git de origen `522ee2b27452e2c702f6f8f239f88ab3245cfe4c`.
- Se copiaron **2.233 archivos** (777.320.824 bytes). Se verificó el contenido de cada archivo contra su blob de origen. Ninguna ruta exportada coincide con las reglas de exclusión de Git.
- `dist/` contiene el código editable de la aplicación, la cartografía y los recursos, incluido Three.js r180. `research/` contiene la documentación, los scripts y las evidencias de validación que estaban en el commit.

## Ejecución y validación

Desde la raíz, sirve la aplicación con `python -m http.server 8000 --bind 127.0.0.1 --directory dist` y abre `http://127.0.0.1:8000/#atlas`. La aplicación estática funciona sin compilación ni instalación de dependencias.

En una copia temporal se ejecutaron 703 comprobaciones de distribución, 1.354 de la geometría y las cámaras costeras y 69 de los controladores de visita. Chrome abrió la portada y el enlace directo `#grau-vell/grau-sala-torre` con WebGL por software, sin errores de página, fallos HTTP ni peticiones externas.

La prueba de distribución se ejecutó con `python -X utf8 research/validation-v32/validate_static_assets.py`, Node 22 y ripgrep. Las pruebas de geometría y controladores utilizaron `three@0.180.0` y `@napi-rs/canvas@1.2.0` instalados en la copia temporal. Algunos scripts de investigación necesitan datos o herramientas externas para regenerar sus resultados.

## Antes del primer push del código

1. Revisar si el paquete contiene credenciales, tokens, claves, información privada o archivos `.env`.
2. Confirmar derechos de distribución de fotografías, cartografía y texturas.
3. Inspeccionar `package.json` y gestor de paquetes antes de inventar instrucciones de ejecución.
4. Conservar el lockfile y registrar SHA-256 del paquete exportado.
5. Conservar `dist/` porque en este proyecto contiene el código fuente de la aplicación estática. Excluir las dependencias descargadas para las pruebas locales.
6. Servir una copia limpia y comprobar rutas, componentes 3D y navegación de escenas.
7. Subir los fuentes a GitHub y anotar el SHA del commit y la versión de Sites.

La exportación se hizo localmente. El repositorio de Sites y la publicación web no recibieron cambios durante la copia.
