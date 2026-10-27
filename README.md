# PortVision — Realidad aumentada para puertos de PC

Versión del prototipo que **elimina las etiquetas falsas** y dibuja recuadros únicamente a partir de predicciones devueltas por un modelo de visión.

## Archivos
- `index.html`: estructura de pantallas e interfaz del escáner.
- `styles.css`: diseño móvil, recuadros de detección y animaciones.
- `app.js`: cámara, llamadas a inferencia, colocación de etiquetas, guías, diagnóstico, historial y checklist.
- `guides.js`: contenido de guías.
- `manifest.json`: instalación PWA.
- `sw.js`: caché offline básica.
- `icons/`: iconos.

## Activar la detección real
El escáner utiliza el modelo comunitario `pc-ports/1` de Roboflow Universe, que anuncia clases HDMI, jack-plug, RJ45, USB-A y USB-C. Página del modelo: https://universe.roboflow.com/ports-gmmmp/pc-ports

1. Publica los archivos de esta carpeta en la raíz de tu repo de GitHub Pages y espera el despliegue.
2. Abre el enlace HTTPS en el teléfono y permite el acceso a la cámara.
3. Crea/consulta tu API key en https://app.roboflow.com/settings/api.
4. En Escáner, pega tu propia API key, marca la casilla de consentimiento de envío de fotogramas y pulsa **Iniciar detección IA**.
5. La app analiza aproximadamente un fotograma cada 1.6 segundos. Cuando el modelo detecta una clase, dibuja un recuadro en la posición estimada de la imagen; al tocarlo muestra una ficha del puerto.
6. Pulsa **Detener** para cerrar el análisis; al abandonar el escáner, la app también detiene la cámara y las solicitudes.

## Privacidad y API key
- PortVision **no incluye una API key** en el repositorio.
- La clave que se pega se mantiene solo en memoria de la pestaña: no se guarda en `localStorage` ni se escribe en archivos.
- Al activar el detector, los fotogramas reducidos se envían a Roboflow para inferencia remota. No actives la detección si no aceptas ese envío.
- La clave se usa desde el navegador y una persona con acceso al dispositivo o herramientas de desarrollo podría inspeccionar sus solicitudes. No pegues una clave con permisos que no quieras exponer. Para una publicación de uso abierto, la solución correcta es un backend propio que proteja la clave o convertir el modelo a inferencia local.
- La API puede tener cuotas, límites o costos definidos por la cuenta y el servicio. Detén la detección cuando no la estés usando.

## Límites conocidos
- Esto es detección visual 2D superpuesta al vídeo: los cuadros se recalculan por fotograma y siguen el movimiento de la imagen, pero no es un sistema SLAM/ARCore que ancle objetos en el espacio 3D.
- El modelo comunitario es limitado y no garantiza detectar todos los conectores, modelos de PC, ángulos o condiciones de luz. Las clases documentadas son HDMI, jack-plug, RJ45, USB-A y USB-C; no se asume compatibilidad con todos los tipos de DisplayPort o conectores propietarios.
- Si el modelo no encuentra nada, la app no coloca etiquetas inventadas. Acerca la cámara, mejora la luz, enfoca el panel de puertos y detén/reinicia si la API devuelve un error.
- El diagnóstico y las guías son orientativos. No abras la fuente de poder ni manipules el interior de una PC conectada.

## Probar localmente
Con VS Code y Live Server, sirve la carpeta por localhost. En teléfonos, cámara y `getUserMedia` requieren HTTPS o un contexto local seguro. Si cambias archivos ya publicados, recarga la página; si el navegador conserva archivos antiguos, cierra la PWA o limpia la caché del sitio. El service worker de esta versión usa `portvision-ar-v2` para forzar actualización.
