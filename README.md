# PortVision — Realidad aumentada visual para tarjeta madre de PC de escritorio

Este proyecto usa una cámara móvil, modelos de detección de puertos y una segunda búsqueda visual abierta para señalar conexiones adicionales. Los cuadros verdes son clases que el detector de puertos reconoce; los cuadros naranjas señalan una clase adicional (por ejemplo VGA, DVI, PS/2, S/PDIF, antenna, SATA, headers, RAM/DIMM o PCIe) o un candidato genérico que todavía debe verificarse.

## Publicación
1. Reemplaza los archivos del repositorio de GitHub Pages por los de esta carpeta, dejando `index.html`, `styles.css`, `app.js`, `guides.js`, `manifest.json`, `sw.js` y `icons/` en la raíz.
2. Haz Commit changes y espera a que GitHub Pages termine el despliegue.
3. Cierra/reabre PortVision en el teléfono. El service worker tiene un nombre de caché nuevo (`portvision-board-v4`).
4. Abre Escáner, pega tu propia clave de Roboflow, marca el consentimiento de envío de imágenes y selecciona **Tarjeta madre de escritorio · buscar conectores extra**.
5. Pulsa Iniciar detección IA y apunta a la zona de conectores de la placa madre. Usa buena luz, evita el movimiento y llena el encuadre con el panel de I/O o el conector que quieres identificar.

## Detección de conectores adicionales
- El modo específico para tarjeta madre llama a `pc-ports/1` para los tipos comunes y a Grounding DINO (`/grounding_dino/infer`) con prompts de conectores de escritorio: HDMI, USB-A/USB-C, DisplayPort, Ethernet, jack de audio, VGA, DVI, PS/2, S/PDIF, antenas, Thunderbolt, serial/parallel, SATA, headers de panel frontal/USB/fan, alimentación ATX, M.2, PCIe y ranuras DIMM/RAM.
- Si los modelos reconocen una clase adicional, se dibuja naranja con una flecha. Los candidatos genéricos se muestran como **Conector no catalogado**, sin inventar un nombre específico.
- El botón **Marcar con flecha** permite que la persona señale un conector que la IA no vio. La etiqueta manual se diferencia y no se considera detección automática.
- Las detecciones se estabilizan entre fotogramas para reducir el parpadeo. El modo de placa madre puede tardar más y consumir más cuota porque hace dos inferencias por ciclo.

## Limitaciones importantes
- La detección abierta cero-shot no garantiza detectar cada puerto o conectar una etiqueta exactamente a su borde. La precisión depende del modelo, iluminación, ángulo, tamaño, enfoque y cuota de Roboflow. Para una cobertura fiable de toda una placa madre hace falta entrenar/evaluar un modelo con imágenes de sus puertos objetivo y validarlo en equipos reales.
- Los cuadros naranjas son tipos adicionales sugeridos por el modelo o regiones genéricas candidatas; no significan que se conozca con certeza el conector. Comprueba serigrafías de la placa y manual del fabricante antes de conectar algo.
- La app utiliza visión 2D con cuadros superpuestos a la cámara; no es seguimiento espacial 3D anclado (SLAM/ARCore).
- Los fotogramas se envían a los servidores de Roboflow para inferencia. La clave se introduce en el navegador, por lo que no debe publicarse en el repositorio ni usarse una clave con permisos que no quieras exponer. En una implementación para muchos usuarios, conviene un backend propio para proteger la clave.
- La API puede consumir créditos/cuota según la cuenta. Detén la detección al terminar.

## Archivos
- `index.html`: estructura y controles de UI.
- `styles.css`: diseño móvil, cuadros de detección naranja/verde y flechas.
- `app.js`: cámara, inferencia, filtros, etiquetas, guías, diagnóstico e historial.
- `guides.js`: guías de mantenimiento.
- `manifest.json`, `sw.js`, `icons/`: instalación PWA y caché.

## Seguridad
No abras la fuente de poder ni manipules componentes internos de la PC mientras esté conectada. Apaga y desconecta el equipo antes de hacer mantenimiento físico.
