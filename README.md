# PortVision — Prototipo móvil

Aplicación web instalable (PWA) pensada primero para teléfonos, editable desde **Visual Studio Code**, con estructura, diseño y lógica separados.

## Abrir en Visual Studio Code
1. Extrae el ZIP y abre la carpeta `PortVision` en Visual Studio Code.
2. Instala la extensión **Live Server** y selecciona `index.html` → **Open with Live Server** para previsualizar en computadora.
3. La cámara necesita un contexto seguro: publica los archivos en HTTPS (por ejemplo, GitHub Pages) y abre el enlace en el teléfono, o usa un servidor local seguro accesible desde el dispositivo.
4. En Android Chrome, abre el menú ⋮ y elige **Instalar aplicación** o **Añadir a pantalla de inicio**. Es una PWA, no un APK nativo.

## Estructura
- `index.html`: estructura y pantallas.
- `styles.css`: diseño responsive, navegación inferior y animaciones.
- `app.js`: navegación, cámara, captura, diagnóstico, checklist e historial.
- `guides.js`: contenido de las guías.
- `manifest.json`: nombre, iconos y configuración instalable de PortVision.
- `sw.js`: caché offline básica.
- `icons/`: iconos de la aplicación.

## Funciones actuales
- Interfaz móvil con barra inferior que respeta el área segura de las pantallas.
- Cámara frontal/trasera y captura descargable.
- Fichas interactivas de USB, HDMI/DisplayPort, Ethernet y audio.
- Diagnóstico guiado por reglas y guía sugerida.
- Guías paso a paso, búsqueda, filtros y progreso.
- Checklist de mantenimiento e historial local.
- Instalación como PWA y caché básica de recursos estáticos.

## Límite importante: IA y detección de puertos
La cámara y las etiquetas interactivas funcionan como demostración; esta versión **no incluye un modelo de IA capaz de reconocer los puertos reales ni de seguir su ubicación**. Para lograrlo se debe integrar y probar un modelo de visión con imágenes etiquetadas de distintos equipos. Las fotografías no se envían a servicios externos en esta versión.

El diagnóstico es orientativo y no confirma fallas de hardware. No abras la fuente de poder ni manipules componentes internos mientras el equipo esté conectado. La cámara requiere permiso y HTTPS o localhost.
