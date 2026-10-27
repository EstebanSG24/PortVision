/* Lógica de la aplicación. El contenido de guías vive en guides.js. */
(() => {
 'use strict';
 const $ = (selector, root=document) => root.querySelector(selector);
 const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
 const STORE = {history:'portvision-history-v1', care:'portvision-care-v1'};
 const state = {screen:'home',detailFrom:'guides',stream:null,facing:'environment',guide:null,step:0,filter:'all',question:0,answers:[],selected:null,history:read(STORE.history,[]),care:read(STORE.care,[])};
 const ports = {
  usb:{title:'USB-A / USB-C',emoji:'🔌',body:'Sirve para conectar teclado, mouse, memorias, cámaras y otros periféricos. USB-A es rectangular; USB-C es más pequeño y ovalado.',tip:'Si no funciona, prueba otro puerto y evita forzar el conector.',guide:'usb'},
  video:{title:'HDMI / DisplayPort',emoji:'🖥️',body:'Envía imagen y normalmente sonido desde la computadora a un monitor o televisor. HDMI y DisplayPort tienen formas distintas.',tip:'Si tienes tarjeta gráfica dedicada, normalmente la pantalla debe conectarse a ella.',guide:'hdmi'},
  lan:{title:'Ethernet (RJ45)',emoji:'🌐',body:'Conecta la PC a una red mediante un cable Ethernet. El conector suele ser más ancho que el de teléfono y puede tener luces de estado.',tip:'Comprueba ambos extremos del cable y el router si no hay conexión.',guide:'ethernet'},
  audio:{title:'Audio de 3.5 mm',emoji:'🎧',body:'Conector redondo para audífonos, micrófono o entrada de audio, según el puerto y el modelo del equipo.',tip:'En muchos equipos el verde es salida de audio y el rosa es micrófono, pero puede variar.',guide:'audio'}
 };
 const questions = [
  {title:'¿Qué problema notas?',hint:'Elige el síntoma que mejor describe lo que pasa.',emoji:'⚡',answers:[['screen','🖥️','No aparece imagen'],['internet','🌐','No tengo internet por cable'],['usb','🔌','No reconoce USB'],['audio','🎧','No se escucha el audio'],['slow','🐢','Está lenta o se congela'],['other','🧰','Otro problema']]},
  {title:'¿Cuándo sucede?',hint:'Esto ayuda a priorizar las comprobaciones.',emoji:'🔎',answers:[['boot','🔁','Desde que la enciendo'],['recent','🆕','Empezó hace poco'],['intermittent','🎲','Solo pasa a veces'],['afterchange','🔧','Tras mover o conectar algo']]},
  {title:'¿Qué tanto te animas a revisar?',hint:'No pasa nada si vas empezando: elegiremos pasos sencillos.',emoji:'🛡️',answers:[['beginner','🌱','Solo quiero revisar cosas simples'],['comfortable','🧰','Puedo revisar cables y ajustes'],['experienced','🧑‍💻','Tengo experiencia con Windows']]}
 ];
 const careTasks = [
  ['Exterior limpio','Paño suave y seco; equipo apagado y desconectado.','🧽'],
  ['Rejillas despejadas','Comprueba que las salidas de aire no estén bloqueadas.','🌬️'],
  ['Cables ordenados','Evita tensión, tropiezos y dobleces fuertes.','🔌'],
  ['Archivos importantes respaldados','Comprueba que tus documentos importantes tengan copia.','💾'],
  ['Sistema actualizado','Revisa las actualizaciones de Windows y la seguridad.','🛡️']
 ];
 let toastTimer;
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{toast('No se pudo guardar en este dispositivo.')}}
 function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
 function navigate(screen){if(state.screen==='detail'&&screen!=='detail')state.detailFrom=screen;if(screen!=='scanner')stopCamera();state.screen=screen;$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===screen));const activeTab=screen==='detail'?state.detailFrom:screen;$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));window.scrollTo({top:0,behavior:'smooth'});if(screen==='home')renderHomeActivity();if(screen==='guides')renderGuides();if(screen==='care')renderCare();if(screen==='history')renderHistory();if(screen==='diagnose'&&state.question===0&&state.answers.length===0)renderQuestion()}
 function formattedDate(date){try{return new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(date))}catch{return 'Actividad reciente'}}
 function addActivity(title,type='guide'){state.history.unshift({title,type,date:new Date().toISOString()});state.history=state.history.slice(0,80);write(STORE.history,state.history);$('#historyDot').classList.add('on');renderHomeActivity();renderHistory()}
 function activityMarkup(item){const icon=item.type==='scan'?'⌁':item.type==='diagnosis'?'ϟ':'✓';return `<div class="activity-row"><span class="activity-symbol">${icon}</span><div class="activity-copy"><b>${escapeHTML(item.title)}</b><small>${formattedDate(item.date)}</small></div><span class="activity-check">✓</span></div>`}
 function renderHomeActivity(){const target=$('#homeActivity');target.innerHTML=state.history.slice(0,3).map(activityMarkup).join('')||'<div class="empty-state"><span>🧰</span><p>Aún no hay actividad. ¡Vamos a empezar!</p></div>'}
 function renderHistory(){const list=$('#historyList');list.innerHTML=state.history.map(activityMarkup).join('')||'<div class="empty-state"><span>📒</span><p>Cuando completes una guía o diagnóstico, quedará guardado aquí.</p></div>';$('#historyTotal').textContent=state.history.length;$('#guidesTotal').textContent=state.history.filter(a=>a.type==='guide').length;$('#historyDot').classList.toggle('on',state.history.length>0)}
 function renderGuides(){const q=$('#guideSearch').value.trim().toLocaleLowerCase('es');const list=window.PORTVISION_GUIDES.filter(g=>(state.filter==='all'||g.group===state.filter)&&(!q||(g.title+' '+g.summary+' '+g.group).toLocaleLowerCase('es').includes(q)));$('#guideList').innerHTML=list.map(g=>`<button class="guide-item" data-guide="${g.id}"><span class="guide-art" style="background:${g.color}">${g.emoji}</span><span class="guide-info"><b>${g.title}</b><p>${g.summary}</p><span class="guide-meta"><span>◷ ${g.minutes} MIN</span><span>·</span><span>${g.level}</span></span></span><span class="guide-arrow">›</span></button>`).join('')||'<div class="empty-state"><span>🔎</span><p>No encontramos resultados. Prueba otra palabra.</p></div>'}
 function openGuide(id){const guide=window.PORTVISION_GUIDES.find(g=>g.id===id);if(!guide)return;state.guide=guide;state.step=0;state.detailFrom=state.screen==='detail'?state.detailFrom:state.screen;renderStep();navigate('detail')}
 function renderStep(){const g=state.guide;if(!g)return;const s=g.steps[state.step];$('#detailTitle').textContent=g.title;$('#detailEmoji').textContent=g.emoji;$('#detailLevel').textContent=g.level;$('#detailSummary').textContent=g.summary;$('#stepCount').textContent=`PASO ${state.step+1} DE ${g.steps.length}`;$('#stepPercent').textContent=`${Math.round((state.step+1)/g.steps.length*100)}%`;$('#stepBar').style.width=`${(state.step+1)/g.steps.length*100}%`;$('#stepNumber').textContent=String(state.step+1).padStart(2,'0');$('#stepTitle').textContent=s.title;$('#stepText').textContent=s.text;$('#stepTip').textContent=s.tip;$('#prevStep').disabled=state.step===0;$('#nextStep').classList.toggle('hidden',state.step===g.steps.length-1);$('#finishGuide').classList.toggle('hidden',state.step!==g.steps.length-1)}
 function resetDiagnosis(){state.question=0;state.answers=[];state.selected=null;renderWizardShell();renderQuestion()}
 function renderWizardShell(){const card=$('#wizardCard');card.innerHTML='<div class="wizard-emoji" id="questionEmoji">⚡</div><h2 id="questionTitle">¿Qué problema notas?</h2><p id="questionHint">Elige el síntoma que mejor describe lo que pasa.</p><div id="answerOptions" class="answer-options"></div><button class="button purple full" id="nextQuestion" disabled>Continuar <b>→</b></button>'}
 function renderQuestion(){const q=questions[state.question];if(!q)return;$('#questionEmoji').textContent=q.emoji;$('#questionTitle').textContent=q.title;$('#questionHint').textContent=q.hint;$('#questionCount').textContent=`PREGUNTA ${state.question+1} DE ${questions.length}`;$('#questionPercent').textContent=`${Math.round((state.question+1)/questions.length*100)}%`;$('#questionBar').style.width=`${(state.question+1)/questions.length*100}%`;$('#answerOptions').innerHTML=q.answers.map(a=>`<button class="answer-option ${state.selected===a[0]?'selected':''}" data-answer="${a[0]}"><span class="option-icon">${a[1]}</span><span>${a[2]}</span><span class="option-check"></span></button>`).join('');$('#nextQuestion').disabled=!state.selected;$('#nextQuestion').innerHTML=state.question===questions.length-1?'Ver recomendaciones <b>→</b>':'Continuar <b>→</b>'}
 function showDiagnosis(){const symptom=state.answers[0];const map={screen:['hdmi','Comprueba el monitor, el cable y la salida de video.'],internet:['ethernet','Revisa el cable RJ45, las luces del router y el estado de red.'],usb:['usb','Prueba el accesorio y otro puerto antes de tocar controladores.'],audio:['audio','Comprueba volumen, salida seleccionada y conexión.'],slow:['slow','Revisa aplicaciones de inicio, almacenamiento y actualizaciones.'],other:['clean','Empieza por una revisión externa segura e identifica mejor el síntoma.']};const [id,advice]=map[symptom]||map.other;const g=window.PORTVISION_GUIDES.find(x=>x.id===id);const cautious=state.answers[2]==='beginner';$('#wizardCard').innerHTML=`<div class="wizard-emoji">🧭</div><small class="result-kicker">PLAN SUGERIDO</small><h2>Vamos paso a paso</h2><div class="result-badge"><span>${g.emoji}</span><div><b>${g.title}</b><p>Coincide con el síntoma que elegiste. No es un diagnóstico definitivo.</p></div></div><p class="intro">${advice}</p><h3 style="font-size:13px;margin:17px 0 7px">Empieza por aquí</h3><ol class="result-list"><li>Guarda tu trabajo si el equipo todavía responde.</li><li>${cautious?'Revisa solo conexiones externas y ajustes visibles.':'Sigue los pasos de la guía y nunca fuerces conectores.'}</li><li>Si notas humo, chispas, olor a quemado o calor inusual, deja de usarlo y busca ayuda técnica.</li></ol><div class="result-actions"><button class="button purple full" id="suggestedGuide">Abrir guía recomendada →</button><button class="button white full" id="restartWizard">Empezar otro diagnóstico</button></div>`;$('#questionCount').textContent='RECOMENDACIÓN LISTA';$('#questionPercent').textContent='100%';$('#questionBar').style.width='100%';$('#suggestedGuide').addEventListener('click',()=>openGuide(id));$('#restartWizard').addEventListener('click',resetDiagnosis);addActivity(`Diagnóstico: ${g.title}`,'diagnosis')}
 async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia){toast('La cámara necesita HTTPS. Abre PortVision desde el enlace https:// de GitHub Pages.');return}
  try{
   stopCamera();
   state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.facing},width:{ideal:1280},height:{ideal:720}},audio:false});
   const video=$('#cameraVideo');video.srcObject=state.stream;await video.play();
   $('#cameraStage').classList.add('camera-on');$('#cameraStatus').textContent='CÁMARA ACTIVA · IA DETENIDA';$('#cameraNote').textContent='La cámara está lista. Inicia la detección IA para ubicar puertos.';$('#enableCamera').textContent='Cámara activa ✓';
   return true;
  }catch(error){
   let msg='No se pudo iniciar la cámara. Revisa permisos y usa HTTPS.';
   if(error.name==='NotAllowedError'||error.name==='PermissionDeniedError')msg='Permite el uso de la cámara en los permisos del navegador.';
   else if(error.name==='NotFoundError')msg='No se encontró una cámara disponible.';
   else if(error.name==='NotReadableError')msg='La cámara puede estar ocupada por otra aplicación.';
   toast(msg);return false;
  }
 }
 function stopDetection(silent=false){
  state.detectionActive=false;
  if(state.inferenceTimer){clearTimeout(state.inferenceTimer);state.inferenceTimer=null}
  if(state.abortController){try{state.abortController.abort()}catch{}state.abortController=null}
  state.inferenceBusy=false;
  const layer=$('#detectionLayer');if(layer)layer.replaceChildren();
  const start=$('#startDetector'),stop=$('#stopDetector');if(start)start.disabled=false;if(stop)stop.disabled=true;
  const badge=$('#detectorBadge');if(badge)badge.textContent='IA DETENIDA';
  const status=$('#cameraStatus');if(status)status.textContent=state.stream?'CÁMARA ACTIVA · IA DETENIDA':'CÁMARA DESACTIVADA';
  const note=$('#cameraNote');if(note)note.textContent=state.stream?'La cámara está activa, pero no se están analizando imágenes.':'Conecta la cámara y el motor de visión para comenzar.';
  if(!silent)toast('Detección IA detenida.');
 }
 function stopCamera(){
  stopDetection(true);
  if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}
  const video=$('#cameraVideo');if(video)video.srcObject=null;
  const stage=$('#cameraStage');if(stage)stage.classList.remove('camera-on');
  const status=$('#cameraStatus');if(status)status.textContent='CÁMARA DESACTIVADA';
  const button=$('#enableCamera');if(button)button.textContent='Activar cámara ↗';
  const note=$('#cameraNote');if(note)note.textContent='Conecta el motor de visión para detectar puertos reales.';
 }
 async function switchCamera(){state.facing=state.facing==='environment'?'user':'environment';const wasDetecting=state.detectionActive;stopDetection(true);const ok=await startCamera();if(ok&&wasDetecting)await startAIDetection()}
 function portForModelClass(rawClass){
  const c=String(rawClass||'').toLowerCase().replace(/_/g,'-');
  if(c==='usb-a'||c==='usb-c'||c.includes('usb'))return {id:'usb',label:c==='usb-c'?'USB-C':'USB-A',description:'Puerto USB detectado'};
  if(c==='hdmi'||c.includes('displayport'))return {id:'video',label:'HDMI',description:'Puerto de video detectado'};
  if(c==='rj45'||c.includes('ethernet'))return {id:'lan',label:'RJ45 / Ethernet',description:'Puerto de red detectado'};
  if(c==='jack-plug'||c.includes('audio'))return {id:'audio',label:'Audio 3.5 mm',description:'Conector de audio detectado'};
  return null;
 }
 async function inferPortsFromVideo(video,apiKey){
  const maxSide=640,ratio=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(video.videoWidth*ratio));canvas.height=Math.max(1,Math.round(video.videoHeight*ratio));
  const ctx=canvas.getContext('2d',{willReadFrequently:false});ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL('image/jpeg',0.72);const base64=dataUrl.slice(dataUrl.indexOf(',')+1);
  // Inference hosted endpoint: no key is stored in source, localStorage or the URL bar.
  const endpoint=`https://detect.roboflow.com/pc-ports/1?api_key=${encodeURIComponent(apiKey)}&confidence=32&overlap=35`;
  const controller=new AbortController();state.abortController=controller;
  let response;
  try{
   response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:base64,signal:controller.signal,cache:'no-store'});
  }catch(error){if(error.name==='AbortError')throw error;throw new Error('No se pudo conectar con Roboflow. Revisa internet y vuelve a intentar.');}
  if(!response.ok){
   let details='';try{details=(await response.text()).slice(0,280)}catch{}
   if(response.status===401||response.status===403)throw new Error('Roboflow rechazó la clave o no tienes acceso a ese modelo. Revisa tu API key.');
   if(response.status===429)throw new Error('El servicio respondió límite de solicitudes/cuota. Espera o revisa tu cuenta de Roboflow.');
   throw new Error(`El detector respondió HTTP ${response.status}. ${details}`);
  }
  const result=await response.json();
  if(result.error)throw new Error(String(result.error));
  return {predictions:Array.isArray(result.predictions)?result.predictions:[],image:result.image||{width:canvas.width,height:canvas.height}};
 }
 function renderDetections(predictions,imageSize){
  const layer=$('#detectionLayer'),stage=$('#cameraStage'),video=$('#cameraVideo');layer.replaceChildren();
  const frameWidth=Number(imageSize?.width)||640,frameHeight=Number(imageSize?.height)||360;
  const stageWidth=stage.clientWidth,stageHeight=stage.clientHeight;
  // Match the video element's object-fit: cover so boxes align with visible pixels.
  const scale=Math.max(stageWidth/video.videoWidth,stageHeight/video.videoHeight);
  const renderedWidth=video.videoWidth*scale,renderedHeight=video.videoHeight*scale;
  const offsetX=(stageWidth-renderedWidth)/2,offsetY=(stageHeight-renderedHeight)/2;
  const usable=predictions.map(p=>({p,kind:portForModelClass(p.class||p.class_name||p.label)})).filter(x=>x.kind&&Number(x.p.confidence??x.p.score??0)>=0.30);
  usable.forEach(({p,kind},index)=>{
   const x=Number(p.x)||0,y=Number(p.y)||0,w=Number(p.width)||20,h=Number(p.height)||20;
   const left=((x-w/2)/frameWidth)*renderedWidth+offsetX;
   const top=((y-h/2)/frameHeight)*renderedHeight+offsetY;
   const width=(w/frameWidth)*renderedWidth,height=(h/frameHeight)*renderedHeight;
   const box=document.createElement('button');box.type='button';box.className='detected-box';box.dataset.port=kind.id;box.style.left=`${left}px`;box.style.top=`${top}px`;box.style.width=`${Math.max(24,width)}px`;box.style.height=`${Math.max(24,height)}px`;box.style.setProperty('--detect-delay',`${index*35}ms`);
   const tag=document.createElement('span');tag.className='detected-tag';
   const label=document.createElement('b');label.textContent=kind.label;
   const confidence=document.createElement('small');confidence.textContent=`${Math.round(Number(p.confidence??p.score??0)*100)}%`;
   tag.append(label,confidence);box.appendChild(tag);box.setAttribute('aria-label',`${kind.label}, confianza ${confidence.textContent}`);
   box.addEventListener('click',()=>showPort(kind.id));layer.appendChild(box);
  });
  const status=$('#cameraStatus'),note=$('#cameraNote');
  if(usable.length){status.textContent=`${usable.length} PUERTO${usable.length===1?'':'S'} DETECTADO${usable.length===1?'':'S'}`;note.textContent='Etiquetas calculadas por el modelo de visión. Toca un recuadro para aprender sobre ese puerto.';$('#detectorBadge').textContent='IA EN VIVO';}
  else{status.textContent='BUSCANDO PUERTOS…';note.textContent='No se detectaron puertos en este fotograma. Acerca la cámara, mejora la luz y evita el movimiento.';$('#detectorBadge').textContent='ANALIZANDO';}
  return usable.length;
 }
 async function startAIDetection(){
  const apiKey=$('#roboflowKey').value.trim();
  if(!apiKey){toast('Pega una API key de Roboflow para usar el modelo de puertos.');$('#roboflowKey').focus();return}
  if(!$('#cloudConsent').checked){toast('Confirma que aceptas enviar fotogramas a Roboflow.');return}
  state.detectorKey=apiKey;
  if(!state.stream){const ok=await startCamera();if(!ok)return}
  if(state.detectionActive)return;
  const video=$('#cameraVideo');if(!video.videoWidth){toast('La cámara aún está iniciando. Intenta de nuevo en un momento.');return}
  state.detectionActive=true;$('#startDetector').disabled=true;$('#stopDetector').disabled=false;$('#detectorBadge').textContent='CONECTANDO…';$('#cameraStatus').textContent='CONECTANDO CON EL MODELO';$('#cameraNote').textContent='Enviando fotogramas pequeños a Roboflow para buscar puertos. Pulsa Detener cuando quieras.';$('#detectorHelp').textContent='Detección activa: se analiza aproximadamente un fotograma cada 1.6 segundos. Detén el escaneo para evitar solicitudes innecesarias.';
  toast('Conectando detector de puertos…');await detectNextFrame();
 }
 async function detectNextFrame(){
  if(!state.detectionActive||!state.stream)return;
  if(state.inferenceBusy){state.inferenceTimer=setTimeout(detectNextFrame,500);return}
  const video=$('#cameraVideo');if(!video||video.readyState<2||!video.videoWidth){state.inferenceTimer=setTimeout(detectNextFrame,500);return}
  state.inferenceBusy=true;
  try{
   const result=await inferPortsFromVideo(video,state.detectorKey);
   if(!state.detectionActive)return;
   const count=renderDetections(result.predictions,result.image);
   $('#detectorHelp').textContent=count?`Detectando en vivo: ${count} coincidencia(s) mostrada(s). El porcentaje es la confianza del modelo, no una garantía.`:'El modelo no encontró un puerto en el último fotograma. Prueba cambiar la distancia, luz o ángulo.';
  }catch(error){
   if(error.name==='AbortError')return;
   stopDetection(true);$('#detectorBadge').textContent='ERROR DE IA';$('#cameraStatus').textContent='NO SE PUDO DETECTAR';$('#cameraNote').textContent=error.message;$('#detectorHelp').textContent=error.message;toast(error.message);
  }finally{
   state.inferenceBusy=false;state.abortController=null;
   if(state.detectionActive)state.inferenceTimer=setTimeout(detectNextFrame,1600);
  }
 }
 function capturePhoto(){const video=$('#cameraVideo');if(!state.stream||!video.videoWidth){toast('Primero activa la cámara.');return}const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(!blob){toast('No se pudo crear la captura.');return}const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`portvision-captura-${Date.now()}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);addActivity('Captura de escáner','scan');toast('Captura lista para guardar')},'image/jpeg',.92)}
 function showPort(id){const p=ports[id];if(!p)return;$('#portModalEmoji').textContent=p.emoji;$('#portModalTitle').textContent=p.title;$('#portModalBody').textContent=p.body;$('#portModalTip').textContent=p.tip;$('#portGuideButton').onclick=()=>{closePortModal();openGuide(p.guide)};$('#portModal').classList.remove('hidden')}
 function closePortModal(){$('#portModal').classList.add('hidden')}
 function renderCare(){const done=new Set(state.care);$('#careList').innerHTML=careTasks.map((t,i)=>`<button class="care-item ${done.has(i)?'checked':''}" data-care="${i}"><span class="care-check">✓</span><span><b>${t[2]} ${t[0]}</b><small>${t[1]}</small></span></button>`).join('');$('#careCount').textContent=`${done.size} de ${careTasks.length}`;$('#careBar').style.width=`${done.size/careTasks.length*100}%`}
 // Navigation
 $$('[data-tab]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.tab)));
 $$('[data-open]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.open)));
 $('#heroScan').addEventListener('click',()=>navigate('scanner'));
 $('#historyShortcut').addEventListener('click',()=>navigate('history'));$('#homeHistory').addEventListener('click',()=>navigate('history'));
 $$('[data-back]').forEach(button=>button.addEventListener('click',()=>{if(state.screen==='detail'){navigate(state.detailFrom==='detail'?'guides':state.detailFrom);return}navigate('home')}));
 $('#enableCamera').addEventListener('click',startCamera);$('#switchCamera').addEventListener('click',switchCamera);$('#capturePhoto').addEventListener('click',capturePhoto);$('#startDetector').addEventListener('click',startAIDetection);$('#stopDetector').addEventListener('click',()=>stopDetection());
 $$('[data-port]').forEach(button=>button.addEventListener('click',()=>showPort(button.dataset.port)));
 $('#closePortModal').addEventListener('click',closePortModal);$('#portModal').addEventListener('click',event=>{if(event.target.id==='portModal')closePortModal()});document.addEventListener('keydown',event=>{if(event.key==='Escape')closePortModal()});
 $('#guideSearch').addEventListener('input',renderGuides);$('#clearSearch').addEventListener('click',()=>{$('#guideSearch').value='';renderGuides()});
 $('#guideFilters').addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;state.filter=button.dataset.filter;$$('[data-filter]').forEach(b=>b.classList.toggle('selected',b===button));renderGuides()});
 $('#guideList').addEventListener('click',event=>{const button=event.target.closest('[data-guide]');if(button)openGuide(button.dataset.guide)});
 $('#wizardCard').addEventListener('click',event=>{const answer=event.target.closest('[data-answer]');if(answer){state.selected=answer.dataset.answer;renderQuestion();return}if(event.target.closest('#nextQuestion')){if(!state.selected)return;state.answers[state.question]=state.selected;state.question++;state.selected=null;if(state.question>=questions.length)showDiagnosis();else renderQuestion()}});
 $('#prevStep').addEventListener('click',()=>{if(state.step>0){state.step--;renderStep()}});$('#nextStep').addEventListener('click',()=>{if(state.guide&&state.step<state.guide.steps.length-1){state.step++;renderStep()} });$('#finishGuide').addEventListener('click',()=>{if(!state.guide)return;addActivity(`Guía completada: ${state.guide.title}`,'guide');toast('¡Guía completada! Muy bien 🙌');navigate('guides')});
 $('#careList').addEventListener('click',event=>{const button=event.target.closest('[data-care]');if(!button)return;const index=Number(button.dataset.care);state.care=state.care.includes(index)?state.care.filter(n=>n!==index):[...state.care,index];write(STORE.care,state.care);renderCare();if(state.care.length===careTasks.length){addActivity('Checklist de mantenimiento completado','guide');toast('¡Checklist completado! ✨')}});
 $('#clearHistory').addEventListener('click',()=>{if(!state.history.length){toast('Tu historial ya está vacío.');return}if(confirm('¿Borrar el historial guardado en este dispositivo?')){state.history=[];write(STORE.history,state.history);renderHistory();renderHomeActivity();toast('Historial borrado')}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera()});window.addEventListener('pagehide',stopCamera);
 if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
 renderHomeActivity();renderHistory();renderGuides();renderCare();renderQuestion();
})();
