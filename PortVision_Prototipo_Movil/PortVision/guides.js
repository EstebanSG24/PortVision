/* Contenido separado de las pantallas para mantener el proyecto fácil de editar. */
window.PORTVISION_GUIDES = [
 {id:'hdmi',title:'Mi PC no da imagen',summary:'Revisa monitor, cable y salida de video.',emoji:'🖥️',group:'conexion',minutes:5,level:'FÁCIL',color:'#e7deff',steps:[
  {title:'Comprueba el monitor',text:'Confirma que el monitor tenga corriente y esté encendido. Revisa el menú Input/Source para seleccionar HDMI o DisplayPort, según tu cable.',tip:'Que el monitor esté encendido no significa que tenga seleccionada la entrada correcta.'},
  {title:'Revisa el cable',text:'Apaga el monitor y el equipo antes de desconectar y volver a conectar el cable. Revisa que no tenga daños visibles.',tip:'Prueba otro cable compatible si tienes uno. No fuerces los conectores.'},
  {title:'Usa la salida adecuada',text:'Si tu computadora tiene una tarjeta gráfica dedicada, conecta el monitor a la tarjeta gráfica, no a los conectores de video de la placa madre.',tip:'La ubicación de los puertos depende del modelo. Revisa el manual de tu equipo.'},
  {title:'Haz una prueba final',text:'Enciende el monitor y luego la computadora. Si sigue sin imagen, apaga el equipo y solicita una revisión técnica antes de desmontarlo.',tip:'Si notas olor a quemado, humo o chispas, deja de usar el equipo y desconéctalo si es seguro.'}
 ]},
 {id:'ethernet',title:'Ethernet sin internet',summary:'Comprueba cable, router y conexión de Windows.',emoji:'🌐',group:'conexion',minutes:6,level:'FÁCIL',color:'#d8f7e7',steps:[
  {title:'Comprueba el cable RJ45',text:'Revisa que el cable Ethernet esté insertado en la computadora y en el router. Debe quedar fijo, sin que tengas que empujarlo continuamente.',tip:'Presiona la pestaña de plástico para retirar el cable; no tires del cable mismo.'},
  {title:'Mira las luces de enlace',text:'Observa si hay luces en el puerto de red de la PC o en el router. Si no hay ninguna, prueba otro cable o puerto, si puedes.',tip:'Las luces y colores cambian entre equipos; consulta el manual si no estás seguro.'},
  {title:'Comprueba Windows',text:'Abre Configuración → Red e Internet → Ethernet y revisa el estado. Si dice conectado sin internet, el cable puede funcionar y el problema estar en el router o proveedor.',tip:'Comprueba si otros dispositivos también perdieron internet.'},
  {title:'Reinicia con cuidado',text:'Si los otros dispositivos también fallan, reinicia el router según las instrucciones del proveedor. Espera a que vuelva la conexión y prueba de nuevo.',tip:'Si solo falla esta PC, puede requerir revisar la configuración de red o el adaptador.'}
 ]},
 {id:'usb',title:'USB no reconoce dispositivos',summary:'Descarta una falla del accesorio, puerto o sistema.',emoji:'🔌',group:'diagnostico',minutes:4,level:'FÁCIL',color:'#ffe7cb',steps:[
  {title:'Prueba el dispositivo',text:'Si puedes, conecta el accesorio a otro equipo o conecta otro accesorio que sepas que funciona en el puerto que estás revisando.',tip:'Desconecta inmediatamente si notas calor inusual, olor a quemado o daño visible.'},
  {title:'Usa otro puerto',text:'Prueba otro puerto USB directamente en la computadora. Evita usar un concentrador USB durante esta comprobación.',tip:'No fuerces el conector. USB-C y USB-A tienen formas distintas.'},
  {title:'Revisa el sistema',text:'En Windows abre Administrador de dispositivos y busca alertas en las controladoras USB. No elimines controladores si no tienes claro cómo restaurarlos.',tip:'Anota cualquier mensaje de error para consultarlo después.'},
  {title:'Reinicia y comprueba',text:'Guarda tus archivos y reinicia Windows normalmente. Vuelve a conectar el accesorio y prueba de nuevo.',tip:'Si varios puertos no funcionan, puede ser necesaria una revisión técnica.'}
 ]},
 {id:'audio',title:'No se escucha el audio',summary:'Revisa volumen, salida elegida y conexión.',emoji:'🎧',group:'diagnostico',minutes:4,level:'FÁCIL',color:'#d9f0ff',steps:[
  {title:'Revisa el volumen',text:'Comprueba que Windows y la aplicación no estén silenciados. Sube el volumen poco a poco.',tip:'Empieza con un volumen bajo para evitar un sonido repentino.'},
  {title:'Elige la salida correcta',text:'Abre Configuración → Sistema → Sonido y comprueba que la salida elegida sea la de tus altavoces o audífonos.',tip:'Cuando se usa HDMI, a veces Windows envía el audio al monitor.'},
  {title:'Comprueba el conector',text:'Verifica que el conector esté insertado en el puerto correcto y, si puedes, prueba unos audífonos que funcionen.',tip:'No introduzcas objetos metálicos ni líquidos en los conectores.'},
  {title:'Ejecuta una prueba',text:'Usa la función de probar sonido de Windows. Si sigue sin funcionar, reinicia y revisa actualizaciones del sistema.',tip:'Si solo falla un puerto físico, podría necesitar limpieza o servicio técnico.'}
 ]},
 {id:'clean',title:'Limpieza exterior segura',summary:'Rutina sencilla para mantener limpio tu equipo.',emoji:'🧽',group:'mantenimiento',minutes:8,level:'FÁCIL',color:'#fff0c6',steps:[
  {title:'Apaga y desconecta todo',text:'Apaga la PC y el monitor. Desconecta la corriente y los periféricos antes de limpiar.',tip:'No limpies el equipo mientras está conectado a la corriente.'},
  {title:'Limpia superficies',text:'Usa un paño suave y seco en la carcasa. Para las pantallas, sigue las recomendaciones del fabricante.',tip:'No rocíes líquidos directamente sobre la computadora o la pantalla.'},
  {title:'Retira polvo superficial',text:'Limpia con suavidad alrededor de las rejillas sin introducir objetos en las ranuras ni desmontar piezas.',tip:'Nunca abras la fuente de poder; puede retener voltajes peligrosos incluso desconectada.'},
  {title:'Revisa el espacio',text:'Comprueba que la computadora tenga ventilación suficiente y que las rejillas no queden tapadas.',tip:'Conecta de nuevo solo cuando las superficies estén secas y no haya humedad.'}
 ]},
 {id:'slow',title:'Mi computadora está lenta',summary:'Revisa causas comunes antes de instalar herramientas.',emoji:'🐢',group:'diagnostico',minutes:7,level:'FÁCIL',color:'#f1ddff',steps:[
  {title:'Guarda y reinicia',text:'Guarda el trabajo abierto y reinicia Windows normalmente para cerrar procesos que podrían haberse quedado bloqueados.',tip:'No fuerces el apagado mientras Windows instala actualizaciones.'},
  {title:'Mira las aplicaciones de inicio',text:'Abre Administrador de tareas → Aplicaciones de inicio y desactiva solo las aplicaciones que reconozcas y no necesites al encender.',tip:'No desactives servicios del sistema que no identifiques.'},
  {title:'Comprueba almacenamiento',text:'En Configuración → Sistema → Almacenamiento revisa el espacio libre. Usa la herramienta de limpieza de Windows para liberar lo que reconozcas.',tip:'No elimines manualmente carpetas de Windows o archivos desconocidos.'},
  {title:'Busca actualizaciones y amenazas',text:'Instala actualizaciones pendientes y ejecuta un análisis con Seguridad de Windows.',tip:'Evita los limpiadores desconocidos y nunca compartas contraseñas con herramientas.'}
 ]}
];
