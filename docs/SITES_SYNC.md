# Sincronización de Sites a GitHub

## Situación actual

- Proyecto Sites: `appgprj_6afeb5aaef8c8191b0062318fb3a24f1`.
- Web publicada: https://saguntum-atlas-3d.monmode.chatgpt.site
- Última versión verificada mediante la conversación de desarrollo: **32**.
- **No se ha importado el código fuente completo.** Este repositorio no representa aún una copia de seguridad recuperable.

## Exportación necesaria

Obtener de Sites la versión 32 o la última versión disponible como árbol de archivos o archivo de código fuente. Incluir assets, geometrías, escenas, estilos, dependencias, ficheros de configuración sin secretos y bibliografía local si existe.

No confundir imágenes de validación o el HTML publicado con el proyecto editable completo.

## Antes del primer push del código

1. Revisar si el paquete contiene credenciales, tokens, claves, información privada o archivos `.env`.
2. Confirmar derechos de distribución de fotografías, cartografía y texturas.
3. Inspeccionar `package.json` y gestor de paquetes antes de inventar instrucciones de ejecución.
4. Conservar el lockfile y registrar SHA-256 del paquete exportado.
5. Excluir carpetas generadas y dependencias descargadas; conservar código y assets originales.
6. Compilar en una carpeta limpia y comprobar rutas, componentes 3D y navegación de escenas.
7. Subir los fuentes a GitHub y anotar el SHA del commit y la versión de Sites.

## Publicación y comprobación

Tras la importación, actualizar el README con stack real, estructura de directorios, comandos reproducibles de instalación, build y tests, matriz de compatibilidad y licencia decidida por el titular.

**Aviso:** un commit de documentación no prueba que el código de la web esté respaldado.
