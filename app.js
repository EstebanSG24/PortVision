/* Lógica de la aplicación. El contenido de guías vive en guides.js. */
(() => {
 'use strict';
 const $ = (selector, root=document) => root.querySelector(selector);
 const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
 const STORE = {history:'portvision-history-v1', care:'portvision-care-v1'};
 const state = {screen:'home',detailFrom:'guides',stream:null,facing:'environment',guide:null,step:0,filter:'all',question:0,answers:[],selected:null,history:read(STORE.history,[]),care:read(STORE.care,[]),detectionActive:false,inferenceBusy:false,inferenceTimer:null,abortControllers:[],detectionHistory:[],detectorKey:'',lastInferenceWarning:'',manualMarking:false,manualMarks:[]};
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
  (state.abortControllers||[]).forEach(controller=>{try{controller.abort()}catch{}});state.abortControllers=[];
  state.inferenceBusy=false;state.detectionHistory=[];state.lastInferenceWarning='';
  const layer=$('#detectionLayer');if(layer){layer.replaceChildren();layer.classList.toggle('manual-marking',state.manualMarking);if(state.manualMarks.length)renderDetections([], {width:640,height:360});}
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
  const c=String(rawClass||'').trim().toLowerCase().replace(/[\s_]+/g,'-');
  if(c==='usb-c'||c==='usbc'||c.includes('usb-type-c'))return {id:'usb',label:'USB-C',description:'Puerto USB-C detectado'};
  if(c==='usb-a'||c==='usba'||c==='usb3a'||c.includes('usb-type-a')||c.includes('usb-a'))return {id:'usb',label:'USB-A',description:'Puerto USB-A detectado'};
  if(c==='hdmi'||c.includes('hdmi'))return {id:'video',label:'HDMI',description:'Puerto HDMI detectado'};
  if(c==='dp'||c.includes('displayport')||c.includes('display-port'))return {id:'video',label:'DisplayPort',description:'Puerto DisplayPort detectado'};
  if(c==='rj45'||c==='ethernet'||c==='lan'||c.includes('rj-45'))return {id:'lan',label:'RJ45 / Ethernet',description:'Puerto de red detectado'};
  if(c==='jack-plug'||c==='audio'||c.includes('audio-jack')||c.includes('3.5mm'))return {id:'audio',label:'Audio 3.5 mm',description:'Conector de audio detectado'};
  return null;
 }
 function captureInferenceFrame(video){
  const maxSide=640,ratio=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(video.videoWidth*ratio));canvas.height=Math.max(1,Math.round(video.videoHeight*ratio));
  const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL('image/jpeg',0.78);
  return {base64:dataUrl.slice(dataUrl.indexOf(',')+1),image:{width:canvas.width,height:canvas.height}};
 }
 async function inferImage(base64,apiKey,modelId){
  const controller=new AbortController();state.abortControllers.push(controller);
  const endpoint=`https://detect.roboflow.com/${modelId}?api_key=${encodeURIComponent(apiKey)}&confidence=35&overlap=30`;
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:base64,signal:controller.signal,cache:'no-store'});
   if(!response.ok){let details='';try{details=(await response.text()).slice(0,240)}catch{};if(response.status===401||response.status===403)throw new Error(`Roboflow rechazó el acceso al modelo ${modelId}. Revisa la API key y el acceso al modelo.`);if(response.status===429)throw new Error('Roboflow alcanzó el límite de solicitudes o cuota. Reduce las pruebas o revisa tu plan.');throw new Error(`El modelo ${modelId} respondió HTTP ${response.status}. ${details}`)}
   const result=await response.json();if(result.error)throw new Error(String(result.error));
   return {modelId,predictions:Array.isArray(result.predictions)?result.predictions:[],image:result.image||null};
  }catch(error){if(error.name==='AbortError')throw error;if(error instanceof TypeError)throw new Error(`No se pudo conectar con Roboflow (${modelId}). Comprueba internet y vuelve a intentar.`);throw error}
  finally{state.abortControllers=state.abortControllers.filter(item=>item!==controller)}
 }
 const OPEN_VOCAB_PROMPTS = [
  'HDMI port','USB Type-A port','USB Type-C port','DisplayPort connector','Ethernet RJ45 port','3.5mm audio jack',
  'VGA port','DVI port','PS/2 keyboard mouse port','optical S/PDIF audio port','Wi-Fi antenna connector',
  'Thunderbolt port','serial COM port','parallel LPT port','SATA connector on a desktop motherboard',
  'motherboard USB header connector','motherboard front panel header connector','motherboard fan header connector',
  '24-pin ATX motherboard power connector','M.2 slot on a desktop motherboard','PCI Express slot on a motherboard',
  'RAM DIMM slot on a desktop motherboard','computer port','computer connector','motherboard port','I/O port on a desktop computer','unidentified computer port on a motherboard rear I/O panel',
  'unidentified connector on a desktop computer motherboard','other external I/O connector on a desktop PC motherboard'
 ];
 async function inferGroundingDino(frame,apiKey){
  const controller=new AbortController();state.abortControllers.push(controller);
  const id=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():`pv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const endpoint=`https://serverless.roboflow.com/grounding_dino/infer?api_key=${encodeURIComponent(apiKey)}`;
  const body={id,api_key:apiKey,model_id:'grounding-dino',image:{type:'base64',value:frame.base64},text:OPEN_VOCAB_PROMPTS,box_threshold:0.32,text_threshold:0.24,grounding_dino_version_id:'default'};
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
   if(!response.ok){let details='';try{details=(await response.text()).slice(0,220)}catch{};if(response.status===401||response.status===403)throw new Error('Roboflow rechazó Grounding DINO. Revisa tu API key y los permisos del servicio.');if(response.status===429)throw new Error('Se alcanzó la cuota de Roboflow. Detén la detección y revisa el uso de tu cuenta.');throw new Error(`Grounding DINO respondió HTTP ${response.status}. ${details}`)}
   const result=await response.json();if(result.error)throw new Error(String(result.error));
   return {modelId:'grounding-dino',predictions:Array.isArray(result.predictions)?result.predictions:[],image:frame.image};
  }catch(error){if(error.name==='AbortError')throw error;if(error instanceof TypeError)throw new Error('No se pudo conectar con Grounding DINO. Comprueba internet y que tu API key tenga acceso al endpoint.');throw error}
  finally{state.abortControllers=state.abortControllers.filter(item=>item!==controller)}
 }
 function openVocabularyKind(rawClass){
  const raw=String(rawClass||'').trim();const c=raw.toLowerCase().replace(/[_]+/g,' ').replace(/\s+/g,' ');
  if(/\bhdmi\b/.test(c))return {id:'video',label:'HDMI',description:'Puerto HDMI detectado por búsqueda visual abierta'};
  if(/usb\s*(type[- ]?a|[- ]?a\b|a port)|\busb-a\b/.test(c))return {id:'usb',label:'USB-A',description:'Puerto USB-A detectado'};
  if(/usb\s*(type[- ]?c|[- ]?c\b|c port)|\busb-c\b/.test(c))return {id:'usb',label:'USB-C',description:'Puerto USB-C detectado'};
  if(/\b(rj.?45|ethernet|lan port)\b/.test(c))return {id:'lan',label:'RJ45 / Ethernet',description:'Puerto de red detectado'};
  if(/(3\.5\s?mm|audio jack|headphone jack|audio port)/.test(c))return {id:'audio',label:'Audio 3.5 mm',description:'Conector de audio detectado'};
  if(/display\s?port/.test(c))return {id:'unknown',label:'DisplayPort · adicional',generic:false};
  if(/\bvga\b/.test(c))return {id:'unknown',label:'VGA · puerto adicional',generic:false};
  if(/\bdvi\b/.test(c))return {id:'unknown',label:'DVI · puerto adicional',generic:false};
  if(/ps\s?\/?\s?2|ps2/.test(c))return {id:'unknown',label:'PS/2 · puerto adicional',generic:false};
  if(/s\s?\/?\s?pdif|spdif|optical audio/.test(c))return {id:'unknown',label:'S/PDIF · audio óptico',generic:false};
  if(/antenna|wi.?fi/.test(c))return {id:'unknown',label:'Conector de antena',generic:false};
  if(/thunderbolt/.test(c))return {id:'unknown',label:'Thunderbolt · adicional',generic:false};
  if(/serial|com port/.test(c))return {id:'unknown',label:'Puerto serial · adicional',generic:false};
  if(/parallel|lpt port/.test(c))return {id:'unknown',label:'Puerto paralelo · adicional',generic:false};
  if(/sata/.test(c))return {id:'unknown',label:'Conector SATA de placa madre',generic:false};
  if(/front.?panel header/.test(c))return {id:'unknown',label:'Header de panel frontal',generic:false};
  if(/usb header/.test(c))return {id:'unknown',label:'Header USB interno',generic:false};
  if(/fan header/.test(c))return {id:'unknown',label:'Conector de ventilador',generic:false};
  if(/24.?pin|atx motherboard power/.test(c))return {id:'unknown',label:'Conector de alimentación ATX',generic:false};
  if(/m\.2/.test(c))return {id:'unknown',label:'Ranura M.2',generic:false};
  if(/pci.?express|pcie/.test(c))return {id:'unknown',label:'Ranura PCI Express',generic:false};
  if(/ram dimm|ram slot|dimm slot/.test(c))return {id:'unknown',label:'Ranuras RAM / DIMM',generic:false};
  if(/unidentified|unrecognized|unknown|other external|other .*connector|connector on a desktop computer motherboard|computer port on a motherboard|motherboard .* connector|port opening|computer port|computer connector|motherboard port|i\/o port/.test(c))return {id:'unknown',label:'Conector no catalogado',generic:true};
  return null;
 }
 function boxIou(a,b){
  const ax=Number(a.x)||0,ay=Number(a.y)||0,aw=Math.max(1,Number(a.width)||1),ah=Math.max(1,Number(a.height)||1);
  const bx=Number(b.x)||0,by=Number(b.y)||0,bw=Math.max(1,Number(b.width)||1),bh=Math.max(1,Number(b.height)||1);
  const left=Math.max(ax-aw/2,bx-bw/2),top=Math.max(ay-ah/2,by-bh/2),right=Math.min(ax+aw/2,bx+bw/2),bottom=Math.min(ay+ah/2,by+bh/2);
  const inter=Math.max(0,right-left)*Math.max(0,bottom-top);return inter/(aw*ah+bw*bh-inter||1);
 }
 function boxesOverlapNear(a,b){
  if(boxIou(a,b)>.10)return true;const pa=a.p||a,pb=b.p||b;const dx=(Number(pa.x)||0)-(Number(pb.x)||0),dy=(Number(pa.y)||0)-(Number(pb.y)||0);const tolerance=Math.max(18,Math.max(Number(pa.width)||1,Number(pa.height)||1,Number(pb.width)||1,Number(pb.height)||1)*.42);return Math.hypot(dx,dy)<tolerance;
 }
 function groundingCandidates(result,frame){
  const list=[];const fw=frame.image.width,fh=frame.image.height;
  for(const p of result.predictions||[]){
   const conf=confidenceOf(p);if(conf<.31)continue;
   const raw=String(p.class||p.class_name||p.label||'');const kind=openVocabularyKind(raw);if(!kind)continue;
   const w=Number(p.width)||0,h=Number(p.height)||0,area=(w*h)/(fw*fh);
   // Open-vocabulary models sometimes return the entire I/O cluster for a generic prompt.
   // Only treat small boxes as unknown individual connectors; named parts can be larger.
   if(kind.generic&&(area<.0007||area>.10))continue;
   if(!kind.generic&&area>.24)continue;
   if(kind.generic&&conf<.40)continue;
   list.push({p,kind,confidence:conf,sourceModel:'grounding-dino'});
  }
  return list;
 }
 function mergeDesktopBoardCandidates(known,open){
  const merged=[...known];
  for(const candidate of open){
   const overlaps=merged.map((item,index)=>({item,index})).filter(x=>boxesOverlapNear(candidate,x.item));
   if(candidate.kind.id==='unknown'&&candidate.kind.generic){
    // A generic candidate should only be called unclassified if no known detector box already describes it.
    if(overlaps.length)continue;
    if(open.some(other=>other!==candidate&&!other.kind.generic&&boxesOverlapNear(candidate,other)))continue;
    merged.push(candidate);continue;
   }
   if(overlaps.length){
    const best=overlaps.sort((a,b)=>boxIou(candidate,b.item)-boxIou(candidate,a.item))[0];
    if(candidate.kind.id==='unknown'){
     // Named additional connectors (VGA/DVI/PS2/etc.) beat a conflicting generic class.
     if(candidate.confidence>=.36){merged.splice(best.index,1,candidate)}
    }else if(best.item.kind.id!==candidate.kind.id&&candidate.confidence>=Math.max(.40,best.item.confidence-.05)){
     // Let the open-vocabulary model correct a likely class confusion when its specific label is credible.
     merged.splice(best.index,1,candidate);
    }
    continue;
   }
   if(candidate.kind.id==='unknown'||candidate.confidence>=.47)merged.push(candidate);
  }
  // Suppress duplicates and prefer the specific, named candidate over a generic unknown label.
  return merged.filter((candidate,index,array)=>!array.some((other,j)=>j!==index&&boxesOverlapNear(candidate,other)&&candidate.kind.generic&& !other.kind.generic));
 }
 function confidenceOf(p){return Number(p.confidence??p.score??0)}
 function candidatesFrom(result,mode,combinedFallback=false){
  const out=[];
  for(const p of result.predictions){
   const kind=portForModelClass(p.class||p.class_name||p.label);if(!kind)continue;
   const confidence=confidenceOf(p);let threshold=0.5;
   if(result.modelId==='laptop-ports/2'){
    threshold=kind.id==='video'?0.43:kind.id==='usb'?0.49:1;
    if(kind.id!=='video'&&kind.id!=='usb')continue;
   }else if(mode==='combined'&&!combinedFallback){
    // The base model is used only for its network/audio classes in combined mode.
    if(kind.id!=='lan'&&kind.id!=='audio')continue;
    threshold=kind.id==='lan'?0.48:0.56;
   }else if(combinedFallback){
    // If the specialist is unavailable, be deliberately strict for classes it normally handles.
    threshold=kind.id==='video'?0.72:kind.id==='usb'?0.74:kind.id==='lan'?0.54:0.60;
   }else{
    threshold=kind.id==='video'?0.56:kind.id==='usb'?0.63:kind.id==='lan'?0.52:0.57;
   }
   if(confidence<threshold)continue;
   out.push({p,kind,confidence,sourceModel:result.modelId});
  }
  return out;
 }
 function boxesMatch(a,b){
  if(a.kind.id!==b.kind.id)return false;
  if(a.kind.id==='unknown'&&a.kind.label!==b.kind.label)return false;
  const pa=a.p,pb=b.p;const ax=Number(pa.x)||0,ay=Number(pa.y)||0,bx=Number(pb.x)||0,by=Number(pb.y)||0;
  const aw=Math.max(1,Number(pa.width)||1),ah=Math.max(1,Number(pa.height)||1),bw=Math.max(1,Number(pb.width)||1),bh=Math.max(1,Number(pb.height)||1);
  const distance=Math.hypot(ax-bx,ay-by);const tolerance=Math.max(22,Math.max(aw,ah,bw,bh)*0.65);
  return distance<=tolerance;
 }
 function stabilizeCandidates(candidates){
  const history=state.detectionHistory.slice(-2);
  // If different classes land nearly on the same box, reject ambiguous candidates instead of guessing.
  const unambiguous=candidates.filter((candidate,index)=>!candidates.some((other,otherIndex)=>{
   if(index===otherIndex||candidate.kind.id===other.kind.id)return false;
   const a=candidate.p,b=other.p;const dx=(Number(a.x)||0)-(Number(b.x)||0),dy=(Number(a.y)||0)-(Number(b.y)||0);
   const near=Math.hypot(dx,dy)<Math.max(18,Math.max(Number(a.width)||1,Number(a.height)||1,Number(b.width)||1,Number(b.height)||1)*0.35);
   return near&&Math.abs(candidate.confidence-other.confidence)<0.18;
  }));
  const stable=unambiguous.filter(candidate=>history.some(frame=>frame.some(previous=>boxesMatch(candidate,previous))));
  state.detectionHistory.push(unambiguous.map(c=>({p:{x:c.p.x,y:c.p.y,width:c.p.width,height:c.p.height},kind:c.kind,confidence:c.confidence,sourceModel:c.sourceModel})));
  if(state.detectionHistory.length>2)state.detectionHistory.shift();
  return stable;
 }
 async function inferFrameWithMode(frame,apiKey,mode){
  state.lastInferenceWarning='';
  if(mode==='desktop-motherboard'){
   const [base,open] = await Promise.allSettled([
    inferImage(frame.base64,apiKey,'pc-ports/1'),
    inferGroundingDino(frame,apiKey)
   ]);
   let known=[],extra=[],warnings=[];
   if(base.status==='fulfilled')known=candidatesFrom(base.value,'pc-ports/1');
   else warnings.push('No respondió el detector de puertos comunes.');
   if(open.status==='fulfilled')extra=groundingCandidates(open.value,frame);
   else warnings.push('No respondió la búsqueda abierta de conectores: '+(open.reason?.message||'error desconocido'));
   if(base.status!=='fulfilled'&&open.status!=='fulfilled')throw (base.reason||open.reason||new Error('Los modelos de placa madre no respondieron.'));
   const candidates=mergeDesktopBoardCandidates(known,extra);
   state.lastInferenceWarning=warnings.join(' ');
   return {candidates,image:frame.image,mode,openCount:extra.length};
  }
  if(mode==='combined'){
   const [specialist,base]=await Promise.allSettled([inferImage(frame.base64,apiKey,'laptop-ports/2'),inferImage(frame.base64,apiKey,'pc-ports/1')]);
   const candidates=[];let specialistOK=false,baseOK=false;
   if(specialist.status==='fulfilled'){
    specialistOK=true;candidates.push(...candidatesFrom(specialist.value,'combined'));
   }
   if(base.status==='fulfilled'){
    baseOK=true;candidates.push(...candidatesFrom(base.value,'combined'));
   }
   if(!specialistOK&&!baseOK){throw (specialist.reason?.name==='AbortError'?specialist.reason:(specialist.reason||base.reason||new Error('Los modelos no respondieron.')))}
   if(!specialistOK){state.lastInferenceWarning='No respondió el modelo especializado HDMI/USB; se usa el modelo base con un filtro más estricto. Revisa si tu clave tiene acceso a laptop-ports/2.';const result=base.value;candidates.push(...candidatesFrom(result,'combined',true));}
   else if(!baseOK){state.lastInferenceWarning='El modelo general RJ45/audio no respondió. Por ahora solo se intentan HDMI y USB.'}
   return {candidates,image:frame.image,mode};
  }
  const result=await inferImage(frame.base64,apiKey,mode);
  return {candidates:candidatesFrom(result,mode),image:frame.image,mode};
 }

 function renderDetections(predictions,imageSize){
  const layer=$('#detectionLayer'),stage=$('#cameraStage'),video=$('#cameraVideo');layer.replaceChildren();
  layer.classList.toggle('manual-marking',state.manualMarking);
  const frameWidth=Number(imageSize?.width)||640,frameHeight=Number(imageSize?.height)||360;
  const stageWidth=stage.clientWidth,stageHeight=stage.clientHeight;
  const scale=Math.max(stageWidth/(video.videoWidth||frameWidth),stageHeight/(video.videoHeight||frameHeight));
  const renderedWidth=(video.videoWidth||frameWidth)*scale,renderedHeight=(video.videoHeight||frameHeight)*scale;
  const offsetX=(stageWidth-renderedWidth)/2,offsetY=(stageHeight-renderedHeight)/2;
  const usable=predictions.map(item=>{const p=item.p||item;const kind=item.kind||item.pvKind||portForModelClass(p.class||p.class_name||p.label);return {p,kind,confidence:item.confidence??confidenceOf(p),sourceModel:item.sourceModel||''}}).filter(x=>x.kind&&Number(x.confidence)>=.30);
  usable.forEach(({p,kind,confidence},index)=>{
   const x=Number(p.x)||0,y=Number(p.y)||0,w=Number(p.width)||20,h=Number(p.height)||20;
   const left=((x-w/2)/frameWidth)*renderedWidth+offsetX;
   const top=((y-h/2)/frameHeight)*renderedHeight+offsetY;
   const width=(w/frameWidth)*renderedWidth,height=(h/frameHeight)*renderedHeight;
   const box=document.createElement('button');box.type='button';box.className='detected-box'+(kind.id==='unknown'?' is-unknown':'');box.dataset.port=kind.id;box.style.left=`${left}px`;box.style.top=`${top}px`;box.style.width=`${Math.max(28,width)}px`;box.style.height=`${Math.max(28,height)}px`;box.style.setProperty('--detect-delay',`${index*28}ms`);
   const tag=document.createElement('span');tag.className='detected-tag';
   const label=document.createElement('b');label.textContent=kind.label;
   const conf=document.createElement('small');conf.textContent=`${Math.round(Number(confidence)*100)}%`;
   tag.append(label,conf);box.appendChild(tag);box.setAttribute('aria-label',`${kind.label}, confianza ${conf.textContent}`);
   box.addEventListener('click',()=>kind.id==='unknown'?showUnknownPort(kind.label,confidence):showPort(kind.id));layer.appendChild(box);
  });
  // User-assisted fallback: allow pointing at a connector that neither model can classify.
  state.manualMarks.forEach((mark,index)=>{
   const box=document.createElement('button');box.type='button';box.className='detected-box is-unknown is-manual';box.style.left=`${Math.max(4,Math.min(stageWidth-54,mark.x*stageWidth-26))}px`;box.style.top=`${Math.max(34,Math.min(stageHeight-52,mark.y*stageHeight-22))}px`;box.style.width='52px';box.style.height='44px';
   const tag=document.createElement('span');tag.className='detected-tag';const label=document.createElement('b');label.textContent='MARCADO POR TI';const conf=document.createElement('small');conf.textContent='manual';tag.append(label,conf);box.appendChild(tag);box.setAttribute('aria-label','Conector marcado manualmente');box.addEventListener('click',()=>showUnknownPort('Conector marcado manualmente',null));layer.appendChild(box);
  });
  const status=$('#cameraStatus'),note=$('#cameraNote');
  if(usable.length){const unknownCount=usable.filter(x=>x.kind.id==='unknown').length;status.textContent=`${usable.length} OBJETO${usable.length===1?'':'S'} · ${unknownCount} ADICIONAL${unknownCount===1?'':'ES'}`;note.textContent=unknownCount?'Los cuadros naranjas indican conectores adicionales o candidatos sin catalogar. Toca uno para ver detalles.':'Puertos detectados por IA. Toca un recuadro para conocer la conexión.';$('#detectorBadge').textContent=unknownCount?'PUERTOS EXTRA':'IA EN VIVO';}
  else if(state.manualMarks.length){status.textContent=`${state.manualMarks.length} MARCA${state.manualMarks.length===1?'':'S'} MANUAL${state.manualMarks.length===1?'':'ES'}`;note.textContent='Marca manual: la IA no ha identificado este conector.';$('#detectorBadge').textContent='MARCA MANUAL';}
  else{status.textContent=state.detectionActive?'BUSCANDO PUERTOS…':'IA DETENIDA';note.textContent='Si la IA no reconoce un conector, usa “Marcar con flecha” para señalarlo sin fingir que fue detectado.';if($('#detectorBadge'))$('#detectorBadge').textContent=state.detectionActive?'ANALIZANDO':'IA DETENIDA';}
  return usable.length;
 }
 function showUnknownPort(label='Conector no catalogado',confidence=null){
  $('#portModalEmoji').textContent='🟠';$('#portModalTitle').textContent=label||'Conector no catalogado';
  $('#portModalBody').textContent='PortVision encontró una forma parecida a un conector, pero no tiene evidencia suficiente para identificarlo con seguridad. En una tarjeta madre de escritorio podría tratarse de VGA, DVI, PS/2, S/PDIF, antena u otro conector según el modelo.';
  $('#portModalTip').textContent=`${confidence==null?'Marca orientativa, no clasificación automática.':'Confianza visual aproximada: '+Math.round(confidence*100)+'%. No equivale a certeza.'} No conectes nada solo por el color del recuadro: confirma la forma, las etiquetas impresas en la placa y el manual del fabricante.`;
  $('#portGuideButton').classList.add('hidden');$('#portModal').classList.remove('hidden');
 }

 async function startAIDetection(){
  const apiKey=$('#roboflowKey').value.trim();
  if(!apiKey){toast('Pega una API key de Roboflow para usar el modelo de puertos.');$('#roboflowKey').focus();return}
  if(!$('#cloudConsent').checked){toast('Confirma que aceptas enviar fotogramas a Roboflow.');return}
  state.detectorKey=apiKey;
  if(!state.stream){const ok=await startCamera();if(!ok)return}
  if(state.detectionActive)return;
  const video=$('#cameraVideo');if(!video.videoWidth){toast('La cámara aún está iniciando. Intenta de nuevo en un momento.');return}
  state.detectionActive=true;$('#startDetector').disabled=true;$('#stopDetector').disabled=false;$('#detectorBadge').textContent='CONECTANDO…';$('#cameraStatus').textContent='CONECTANDO CON EL MODELO';$('#cameraNote').textContent='Enviando fotogramas pequeños a Roboflow para buscar puertos. Pulsa Detener cuando quieras.';const startMode=$('#detectionMode')?.value||'combined';$('#detectorHelp').textContent=startMode==='desktop-motherboard'?'Modo tarjeta madre: consulta un detector conocido y Grounding DINO para buscar conectores adicionales. Consume más cuota y puede tardar más.':startMode==='combined'?'Modo combinado activo: se consultan dos modelos aproximadamente cada 2.6 segundos y se consume más cuota.':'Detección activa: se consulta un modelo aproximadamente cada 1.8 segundos.';
  toast('Conectando detector de puertos…');await detectNextFrame();
 }
 async function detectNextFrame(){
  if(!state.detectionActive||!state.stream)return;
  if(state.inferenceBusy){state.inferenceTimer=setTimeout(detectNextFrame,500);return}
  const video=$('#cameraVideo');if(!video||video.readyState<2||!video.videoWidth){state.inferenceTimer=setTimeout(detectNextFrame,500);return}
  state.inferenceBusy=true;
  try{
   const frame=captureInferenceFrame(video);const mode=$('#detectionMode')?.value||'combined';
   const result=await inferFrameWithMode(frame,state.detectorKey,mode);
   if(!state.detectionActive)return;
   const stable=stabilizeCandidates(result.candidates);
   const count=renderDetections(stable.map(item=>item.p),result.image);
   if(count){
    $('#detectorHelp').textContent=`${mode==='desktop-motherboard'?'Tarjeta madre de escritorio: puertos comunes + Grounding DINO':mode==='combined'?'Modo combinado':mode==='laptop-ports/2'?'Modelo especializado HDMI/USB':'Modelo general'}: ${count} detección(es) confirmada(s) en más de un fotograma. Los cuadros naranjas son conectores adicionales/candidatos, no una identificación infalible.${state.lastInferenceWarning?' '+state.lastInferenceWarning:''}`;
   }else if(result.candidates.length){
    $('#cameraStatus').textContent='CONFIRMANDO DETECCIONES…';$('#detectorBadge').textContent='VALIDANDO';
    $('#cameraNote').textContent='Se detectó un posible puerto. Esperando otra coincidencia para reducir falsos positivos.';
    $('#detectorHelp').textContent=`Validando las detecciones en varios fotogramas antes de mostrar etiquetas.${state.lastInferenceWarning?' '+state.lastInferenceWarning:''}`;
   }else{
    $('#detectorHelp').textContent=`No hubo detecciones que superaran los umbrales de confianza. Acerca la cámara, limpia el lente y mejora la iluminación.${state.lastInferenceWarning?' '+state.lastInferenceWarning:''}`;
   }
  }catch(error){
   if(error.name==='AbortError')return;
   stopDetection(true);$('#detectorBadge').textContent='ERROR DE IA';$('#cameraStatus').textContent='NO SE PUDO DETECTAR';$('#cameraNote').textContent=error.message;$('#detectorHelp').textContent=error.message;toast(error.message);
  }finally{
   state.inferenceBusy=false;state.abortControllers=[];
   if(state.detectionActive){const activeMode=$('#detectionMode')?.value||'combined';const wait=activeMode==='desktop-motherboard'?4200:activeMode==='combined'?2600:1800;state.inferenceTimer=setTimeout(detectNextFrame,wait)}
  }
 }
 function capturePhoto(){const video=$('#cameraVideo');if(!state.stream||!video.videoWidth){toast('Primero activa la cámara.');return}const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(!blob){toast('No se pudo crear la captura.');return}const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`portvision-captura-${Date.now()}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);addActivity('Captura de escáner','scan');toast('Captura lista para guardar')},'image/jpeg',.92)}
 function showPort(id){const p=ports[id];if(!p)return;$('#portGuideButton').classList.remove('hidden');$('#portGuideButton').textContent='Ver guía relacionada →';$('#portModalEmoji').textContent=p.emoji;$('#portModalTitle').textContent=p.title;$('#portModalBody').textContent=p.body;$('#portModalTip').textContent=p.tip;$('#portGuideButton').onclick=()=>{closePortModal();openGuide(p.guide)};$('#portModal').classList.remove('hidden')}
 function closePortModal(){$('#portModal').classList.add('hidden')}
 function renderCare(){const done=new Set(state.care);$('#careList').innerHTML=careTasks.map((t,i)=>`<button class="care-item ${done.has(i)?'checked':''}" data-care="${i}"><span class="care-check">✓</span><span><b>${t[2]} ${t[0]}</b><small>${t[1]}</small></span></button>`).join('');$('#careCount').textContent=`${done.size} de ${careTasks.length}`;$('#careBar').style.width=`${done.size/careTasks.length*100}%`}
 // Navigation
 $$('[data-tab]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.tab)));
 $$('[data-open]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.open)));
 $('#heroScan').addEventListener('click',()=>navigate('scanner'));
 $('#historyShortcut').addEventListener('click',()=>navigate('history'));$('#homeHistory').addEventListener('click',()=>navigate('history'));
 $$('[data-back]').forEach(button=>button.addEventListener('click',()=>{if(state.screen==='detail'){navigate(state.detailFrom==='detail'?'guides':state.detailFrom);return}navigate('home')}));
 $('#enableCamera').addEventListener('click',startCamera);$('#switchCamera').addEventListener('click',switchCamera);$('#capturePhoto').addEventListener('click',capturePhoto);$('#startDetector').addEventListener('click',startAIDetection);$('#stopDetector').addEventListener('click',()=>stopDetection());
 $('#manualUnknownButton').addEventListener('click',()=>{state.manualMarking=!state.manualMarking;$('#detectionLayer').classList.toggle('manual-marking',state.manualMarking);$('#manualUnknownButton').classList.toggle('active',state.manualMarking);$('#manualUnknownButton').textContent=state.manualMarking?'✕ Cancelar marcado':'↗ Marcar con flecha';$('#manualHint').textContent=state.manualMarking?'Toca sobre el conector desconocido en la imagen. Se dibujará un recuadro naranja con flecha.':'Si la IA no reconoce un conector, pulsa “Marcar con flecha” y toca ese punto en la imagen. La marca manual no es una detección automática.';if(state.manualMarking)toast('Toca el conector que quieres señalar.');});
 $('#clearUnknownButton').addEventListener('click',()=>{state.manualMarks=[];state.manualMarking=false;$('#detectionLayer').classList.remove('manual-marking');$('#manualUnknownButton').classList.remove('active');$('#manualUnknownButton').textContent='↗ Marcar con flecha';renderDetections([], {width:640,height:360});toast('Marcas manuales eliminadas.');});
 $('#detectionLayer').addEventListener('click',event=>{if(!state.manualMarking||event.target.closest('.detected-box'))return;const rect=$('#detectionLayer').getBoundingClientRect();state.manualMarks.push({x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height});state.manualMarking=false;$('#detectionLayer').classList.remove('manual-marking');$('#manualUnknownButton').classList.remove('active');$('#manualUnknownButton').textContent='↗ Marcar con flecha';$('#manualHint').textContent='Marca manual colocada. Esta señal la pusiste tú; no es una detección automática.';renderDetections([], {width:640,height:360});toast('Conector marcado en naranja.');});
 $('#detectionMode').addEventListener('change',()=>{state.detectionHistory=[];const mode=$('#detectionMode').value;const help=mode==='desktop-motherboard'?'Modo para tarjeta madre de PC de escritorio: puertos comunes + Grounding DINO (búsqueda abierta) para VGA, DVI, PS/2, headers, SATA, M.2 y otros candidatos. Más lento y consume más cuota.':mode==='combined'?'Combina 2 modelos: uno especializado para HDMI/USB y otro para RJ45/audio. Consume más cuota.':mode==='laptop-ports/2'?'Optimizado para HDMI y USB; no está diseñado para RJ45 ni audio.':'Un solo modelo para puertos comunes; no reconoce todas las clases.';$('#modelModeHelp').textContent=help;if(state.detectionActive){stopDetection(true);toast('Modo cambiado. Pulsa Iniciar detección IA para aplicarlo.')}});
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
