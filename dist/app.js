'use strict';
const $=id=>document.getElementById(id), A=CameraAdvisor, P=CameraProfiles, E=CameraEngine;
const KEY='camera-wizard-preferences-v2';
let mode='simple', state={...A.defaults}, last=null, registration=null, installPrompt=null;
const numeric=['focal','maxISO','oisStops','comp','ev','desiredAperture','minShutter','fixedISO','manualFocal','manualAperture','manualMinAperture'];
const checkboxes=['raw','customEV','manualOIS','manualAF'];
try {
  const stored=JSON.parse(localStorage.getItem(KEY)||'null');
  if(stored&&stored.version===2&&stored.settings){
    for(const key of Object.keys(A.defaults))if(Object.hasOwn(stored.settings,key)&&typeof stored.settings[key]===typeof A.defaults[key])state[key]=stored.settings[key];
    // Validate saved data before applying it; corrupted/stale profiles fall back.
    A.recommend(state,'simple');
  }
}catch{state={...A.defaults};}
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}
for(const light of A.lights)$('light').append(option(light.id,light.label));
for(const group of ['Fujifilm primes','Fujifilm zooms','Third-party primes','Third-party zooms']){
  const opt=document.createElement('optgroup');opt.label=group;
  for(const l of P.lenses.filter(l=>l.group===group).sort((a,b)=>a.minFocal-b.minFocal||a.wideAperture-b.wideAperture))opt.append(option(l.id,l.name));
  $('lens').append(opt);
}
$('lens').append(option('manual','Other / manual lens'));
for(let i=-9;i<=9;i++)$('comp').append(option(i/3,(i>0?'+':'')+Number((i/3).toFixed(1))+' EV'));
for(const n of [160,200,250,320,400,500,640,800,1000,1250,1600,2000,2500,3200,4000,5000,6400,8000,10000,12800])$('fixedISO').append(option(n,n.toLocaleString()));
const firstSubjects=['portrait','people','children','pet','street','landscape'];
for(const [key,s] of Object.entries(A.subjects)){
  const b=document.createElement('button');b.type='button';b.dataset.subject=key;b.textContent=s.label;
  b.setAttribute('aria-pressed',String(state.subject===key));
  b.addEventListener('click',()=>{
    state.subject=key;state.motion=s.motion;state.goal=s.goals.includes('balanced')?'balanced':s.goals[0];
    state.desiredAperture=0;state.dof='auto';state.minShutter=0;
    subjectOptions();sync();render();
  });
  $(firstSubjects.includes(key)?'subjects':'extra-subjects').append(b);
}
function subjectOptions(){
  const s=A.subjects[state.subject];
  $('motion').replaceChildren(...(s.moves.length?s.moves:[s.motion]).map(k=>option(k,A.movements[k].label)));
  $('goal').replaceChildren(...s.goals.map(k=>option(k,A.goals[k])));
  $('motion-wrap').hidden=!s.moves.length;
}
function sync(){
  for(const key of Object.keys(A.defaults)){const el=$(key);if(!el)continue;if(checkboxes.includes(key))el.checked=state[key];else el.value=state[key];}
  for(const b of document.querySelectorAll('[data-subject]'))b.setAttribute('aria-pressed',String(b.dataset.subject===state.subject));
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:2,settings:state}));}catch{$('storage-note').textContent='Storage is unavailable here. Settings work for this visit but may not be remembered.';}}
function gearControls(){
  const gear=A.equipment(state),l=gear.lens;
  $('manual-controls').hidden=state.lens!=='manual';
  $('saved-kit').textContent='Using '+l.name+' · '+gear.focal+' mm';
  $('zoom-controls').hidden=l.minFocal===l.maxFocal;
  $('focal').min=l.minFocal;$('focal').max=l.maxFocal;$('focal').value=gear.focal;
  $('focal-label').textContent=gear.focal+' mm';
  $('wide-label').textContent=l.minFocal+' mm · wide';$('tele-label').textContent=l.maxFocal+' mm · tele';
  $('lens-summary').textContent=gear.focal+' mm · ≈ '+Math.round(gear.focal*gear.camera.crop)+' mm equivalent angle of view · '+(l.ois?'Lens OIS / VC':l.brand==='Viltrox'?'No OIS allowance':'No lens OIS');
  $('aperture-note').textContent=gear.intermediate?'Safe aperture limit: f/'+gear.maxAperture+'. Intermediate maximum is not published; your lens may open wider. At the wide endpoint: f/'+l.wideAperture+'.':'Maximum aperture at this focal length: f/'+gear.maxAperture+'.';
  const apertures=[...new Set([gear.maxAperture,...[1,1.2,1.4,1.6,1.8,2,2.2,2.5,2.8,3.2,3.5,4,4.5,4.8,5,5.6,6.3,7.1,8,9,10,11,13,14,16,18,20,22,25,29,32].filter(n=>n>=gear.maxAperture&&n<=l.minAperture)])].sort((a,b)=>a-b);
  $('desiredAperture').replaceChildren(option(0,'Automatic'),...apertures.map(n=>option(n,'f/'+n)));
  if(!apertures.includes(state.desiredAperture))state.desiredAperture=0;
  $('desiredAperture').value=state.desiredAperture;
  $('ois').disabled=!l.ois||state.support==='tripod';
  $('oisStops').disabled=!l.ois||state.support==='tripod'||state.ois==='off';
  $('ois-note').textContent=!l.ois?(l.brand==='Viltrox'?'No stabilisation allowance: an explicit OIS specification was not found. X-M5 body IBIS contributes zero.':'No stabilisation allowance: this lens has no OIS and the X-M5 has no IBIS.'):state.support==='tripod'?'No stabilisation benefit is applied on a tripod. Turn lens IS off.':(l.ratedStops?'Manufacturer rating: '+l.ratedStops+' stops under test conditions. ':'No verified stop rating is encoded. ')+'The chosen benefit is a user assumption, not a guarantee. It never freezes subject motion.';
  $('lens-source').replaceChildren();
  if(l.source){const link=document.createElement('a');link.href=l.source;link.target='_blank';link.rel='noreferrer';link.textContent='Selected lens: manufacturer specifications ↗';$('lens-source').append(link);}
  else $('lens-source').textContent='Manual lens values are supplied by you and are not verified.';
  return gear;
}
function paragraph(text,className){const p=document.createElement('p');p.textContent=text;if(className)p.className=className;return p;}
function render(){
  $('advanced-panel').hidden=mode!=='advanced';
  $('intent-panel').hidden=mode==='quick';
  $('fixed-iso-wrap').hidden=state.isoStrategy!=='fixed';
  $('ev').disabled=!state.customEV;
  try{
    gearControls();
    const data=A.recommend(state,mode),r=data.result;last=data;
    $('error').hidden=true;$('show-result').disabled=false;document.body.classList.remove('invalid-result');
    $('result-title').textContent=data.subject.label;
    $('result-context').textContent=data.light.label+' · '+data.gear.focal+' mm on X-M5';
    $('shutter-result').textContent=E.fmtShutter(r.shutter);$('aperture-result').textContent=E.fmtAperture(r.aperture);
    $('aperture-detail').textContent=data.gear.intermediate?'safe zoom aperture':'light & focus depth';
    $('iso-strategy').textContent=data.fixed?'FIXED ISO':'AUTO ISO';
    $('iso-result').textContent=(data.fixed?'ISO ':'expected ≈ ISO ')+r.iso.toLocaleString();
    $('iso-range').textContent=data.fixed?'The camera will not adjust ISO automatically.':'Default 160 · ceiling '+r.ceiling.toLocaleString()+' · plausible ISO '+data.expectedRange.map(x=>x.toLocaleString()).join('–')+(data.rangeLimited?' (darker end may exceed ceiling)':'');
    $('mode-result').textContent=data.fixed?'M · fixed ISO':'M + Auto ISO';
    $('focus-result').textContent=data.focus;$('drive-result').textContent=data.drive;
    $('comp-result').textContent=(state.comp>0?'+':'')+Number(state.comp.toFixed(1))+' EV'+(data.fixed?' target*':'');
    $('detection-result').textContent=data.detection;
    $('reason').textContent=data.reason;
    $('status').textContent=r.insufficient?'LIGHT NEEDED':r.excess?'TOO BRIGHT':'START HERE';$('status').classList.toggle('warn',r.insufficient||r.excess);
    $('main-warning').hidden=!r.insufficient&&!r.excess;
    $('main-warning').textContent=r.insufficient||r.excess?data.warnings.find(x=>x.startsWith('Needs')||x.startsWith('About'))||'Check exposure before shooting.':'';
    $('confidence-title').textContent='Exposure estimate · '+(data.spread>=2?'low':'medium')+' confidence';
    $('confidence-text').textContent='Estimated light can vary by about ±'+data.spread+' stops or more. '+(data.gear.intermediate?'Zoom aperture is conservative, adding uncertainty. ':'')+'This app has not measured the scene.';
    $('ev-range').textContent='Description range: approximately EV '+(data.light.ev-data.light.spread)+' to '+(data.light.ev+data.light.spread)+'. Custom EV is still an estimate.';
    $('alternatives').replaceChildren();
    for(const a of data.alternatives){const div=document.createElement('div');div.className='alt';const h=document.createElement('h3');h.textContent=a.title;const strong=document.createElement('strong');strong.textContent=a.settings;div.append(h,strong,paragraph(a.text));$('alternatives').append(div);}
    $('warnings').replaceChildren(...data.warnings.map(t=>paragraph(t,'advice-warning')));
    $('capture-advice').textContent=(state.raw?'RAW gives editing latitude but cannot restore clipped highlights.':'For JPEG, set colour and white balance before shooting; avoid relying on large exposure corrections later.')+' Check focus on your subject after the first frame.';
    $('white-balance').hidden=!data.whiteBalance;$('white-balance').textContent=data.whiteBalance||'';
    $('flash-advice').hidden=!data.flash;$('flash-advice').textContent=data.flash||'';
    if(data.flash)$('flash-advice').className='advice-warning';
    $('calculation-detail').textContent='ISO = 100 × aperture² ÷ (seconds × 2^(EV − compensation)). This setup: EV '+data.ev+', '+E.fmtShutter(r.shutter)+' s, '+E.fmtAperture(r.aperture)+'. '+(data.fixed?'* Compensation is included in the target calculation; with fixed ISO in M, change settings directly. ':'')+'Mechanical max 1/4000 s; electronic max 1/32000 s. M-mode timed exposure limit 15 minutes. Native ISO 160–12800.';
    const instructions=[
      'Set the mode dial to M. Set '+E.fmtShutter(r.shutter)+' s and '+E.fmtAperture(r.aperture)+' using the camera’s exposure controls or aperture ring.',
      data.fixed?'Under SHOOTING SETTING → ISO, select '+r.iso+'. The compensation value above describes the target; in fully manual exposure, adjust settings directly.':'Under SHOOTING SETTING → ISO, choose AUTO1, AUTO2 or AUTO3. Set DEFAULT SENSITIVITY to 160 and MAX. SENSITIVITY to '+r.ceiling+'. You control shutter speed directly in M.',
      'Under SHOOTING SETTING → SHUTTER TYPE, choose '+(data.shutterType==='electronic'?'ELECTRONIC SHUTTER.':'MECHANICAL SHUTTER.'),
      data.gear.lens.autofocus?'Under AF/MF SETTING, set FOCUS MODE and AF MODE to match the focus recommendation. Face/Eye and Subject Detection are separate, mutually exclusive choices.':'Set manual focus and magnify the subject to check sharpness.',
      'Set drive to '+data.drive+'.'+(!data.fixed?' For compensation in M, assign EXPOSURE COMPENSATION to a command dial under BUTTON/DIAL SETTING → COMMAND DIAL SETTING.':'')
    ];
    $('camera-instructions').replaceChildren(...instructions.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
    $('quick-summary').textContent=E.fmtShutter(r.shutter)+' · '+E.fmtAperture(r.aperture)+(r.insufficient?' · needs light':' · '+(data.fixed?'ISO '+r.iso:'Auto ISO'));
    save();
  }catch(error){
    last=null;$('error').hidden=false;$('error').textContent=error.message;$('show-result').disabled=true;$('quick-summary').textContent='Check your settings';
    document.body.classList.add('invalid-result');$('status').textContent='CHECK INPUTS';
    // Never leave a stale exposure readable as the current answer.
    $('shutter-result').textContent='—';$('aperture-result').textContent='—';$('iso-result').textContent='Unavailable';
  }
}
$('settings').addEventListener('submit',e=>e.preventDefault());
$('settings').addEventListener('input',event=>{
  const el=event.target,key=el.id;if(!Object.hasOwn(A.defaults,key))return;
  state[key]=checkboxes.includes(key)?el.checked:numeric.includes(key)?(el.value===''?NaN:Number(el.value)):el.value;
  if(key==='lens'){
    const lens=P.lenses.find(l=>l.id===state.lens);
    if(lens)state.focal=lens.minFocal;
    state.desiredAperture=0;
  }
  if(['focal','manualAperture','manualMinAperture'].includes(key))state.desiredAperture=0;
  if(key==='light')state.customEV=false;
  if(key==='isoStrategy'&&state.isoStrategy==='fixed')state.fixedISO=Math.min(state.fixedISO,state.maxISO);
  render();
});
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{
  mode=button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $('mode-note').textContent=mode==='quick'?'Subject, light, lens. Saved ISO, support and RAW preferences do the rest.':mode==='advanced'?'Refine the estimated light and exposure priorities. Overrides apply only in Advanced.':'Choose the photograph. We’ll work out a starting setup.';
  render();
});
$('more-subjects').addEventListener('click',()=>{
  const visible=$('extra-subjects').hidden;$('extra-subjects').hidden=!visible;
  $('more-subjects').setAttribute('aria-expanded',String(visible));$('more-subjects').textContent=visible?'Fewer subjects −':'More subjects +';
});
$('reset').addEventListener('click',()=>{
  state={...A.defaults};subjectOptions();sync();render();
});
$('show-result').addEventListener('click',()=>{
  if(!last)return;
  $('result-title').focus({preventScroll:true});
  $('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('install').addEventListener('click',async()=>{
  if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}
  else{$('install-help').open=true;$('install-help').scrollIntoView({behavior:'smooth',block:'center'});}
});
window.addEventListener('appinstalled',()=>{$('install').textContent='Installed';});
function showUpdate(){if(registration&&registration.waiting)$('update-app').hidden=false;}
$('update-app').addEventListener('click',()=>{if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});});
let refreshPending=false;
if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol)){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshPending)location.reload();});
  $('update-app').addEventListener('click',()=>{refreshPending=true;});
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
    registration=reg;showUpdate();
    reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed')showUpdate();});});
    return navigator.serviceWorker.ready;
  }).then(()=>{$('offline-state').textContent='Ready for offline use. Camera profiles, lens data and calculations are stored on this device.';}).catch(()=>{$('offline-state').textContent='Offline setup could not complete. Use HTTPS or localhost and reload online.';});
}else $('offline-state').textContent='The calculator works here. To install it or cache it offline, open it through HTTPS or a localhost web server.';
subjectOptions();sync();
if(!firstSubjects.includes(state.subject)){$('extra-subjects').hidden=false;$('more-subjects').setAttribute('aria-expanded','true');$('more-subjects').textContent='Fewer subjects −';}
render();
