/* Photographic heuristics and estimated light are intentionally separate from
   verified profiles and the EV mathematics in engine.js. No sensor is read. */
(function(root){
  'use strict';
  const E=typeof module!=='undefined'?require('./engine.js'):root.CameraEngine;
  const P=typeof module!=='undefined'?require('./profiles.js'):root.CameraProfiles;
  const movements={still:{label:'Still',time:900},posed:{label:'Posed',time:1/125},gentle:{label:'Gentle movement',time:1/160},walking:{label:'Walking',time:1/250},active:{label:'Active',time:1/500},running:{label:'Running',time:1/1000},veryfast:{label:'Very fast',time:1/2000}};
  const subjects={
    portrait:{label:'Portrait',motion:'posed',aperture:2.8,human:true,moves:['posed','gentle','walking'],goals:['blur','balanced','depth','clean']},
    people:{label:'People / candid',motion:'walking',aperture:4,human:true,moves:['posed','gentle','walking','active'],goals:['blur','balanced','freeze','clean']},
    group:{label:'Group',motion:'posed',aperture:5.6,human:true,moves:['posed','gentle','walking'],goals:['balanced','depth','clean']},
    children:{label:'Children',motion:'active',aperture:4,human:true,moves:['posed','walking','active','running'],goals:['balanced','freeze','blur']},
    pet:{label:'Pet',motion:'active',aperture:4,moves:['still','posed','walking','active','running'],goals:['balanced','freeze','blur']},
    street:{label:'Street',motion:'walking',aperture:5.6,moves:['still','walking','active'],goals:['balanced','depth','freeze','movement','clean']},
    action:{label:'Sport / action',motion:'running',aperture:4,moves:['active','running','veryfast'],goals:['freeze','balanced','movement']},
    landscape:{label:'Landscape',motion:'still',aperture:8,moves:[],goals:['depth','balanced','clean','movement']},
    architecture:{label:'Architecture / interior',motion:'still',aperture:8,moves:[],goals:['depth','balanced','clean']},
    food:{label:'Food',motion:'still',aperture:4,moves:[],goals:['balanced','blur','depth','clean']},
    product:{label:'Object / product',motion:'still',aperture:5.6,moves:[],goals:['balanced','depth','blur','clean']},
    macro:{label:'Close-up / macro',motion:'still',aperture:8,moves:['still','gentle'],goals:['balanced','depth','clean']},
    nightportrait:{label:'Night portrait',motion:'posed',aperture:2.8,human:true,moves:['posed','gentle','walking'],goals:['blur','balanced','clean']},
    nightscene:{label:'Night scene',motion:'still',aperture:5.6,moves:[],goals:['balanced','depth','clean','movement']},
    fashion:{label:'Fashion',motion:'walking',aperture:4,human:true,moves:['posed','walking','active'],goals:['balanced','blur','freeze']},
    event:{label:'Indoor event',motion:'walking',aperture:2.8,human:true,moves:['posed','walking','active'],goals:['balanced','blur','freeze']}
  };
  const goals={blur:'Maximum background blur',balanced:'Balanced',depth:'More of scene in focus',freeze:'Freeze movement',movement:'Allow some movement',clean:'Cleanest image possible'};
  // Each label is a broad illustrative range at ISO 100, not measured lux/EV.
  const lights=[
    {id:'brightsun',label:'Outside — very bright sun',ev:16,spread:1},
    {id:'sun',label:'Outside — sun',ev:15,spread:1},
    {id:'shade',label:'Outside — shade',ev:12,spread:1.5},
    {id:'overcast',label:'Outside — overcast',ev:13,spread:1.5},
    {id:'golden',label:'Golden hour',ev:11,spread:2},
    {id:'window',label:'Inside — strong window light',ev:9,spread:2,inside:true},
    {id:'bright',label:'Inside — bright',ev:8,spread:2,inside:true},
    {id:'normal',label:'Inside — normal',ev:6,spread:2,inside:true},
    {id:'dim',label:'Inside — dim',ev:4,spread:2,inside:true},
    {id:'verydim',label:'Inside — very dim',ev:2,spread:2,inside:true},
    {id:'brightstreet',label:'Night — bright street',ev:4,spread:2,artificial:true},
    {id:'darkstreet',label:'Night — dark street',ev:1,spread:2,artificial:true},
    {id:'candle',label:'Candle / very low light',ev:0,spread:2,inside:true}
  ];
  const defaults={camera:'xm5',lens:'xc15-45mmf35-56-ois-pz',focal:15,subject:'portrait',light:'shade',motion:'posed',goal:'balanced',maxISO:6400,raw:true,support:'handheld',ois:'on',oisStops:2,comp:0,shutterType:'mechanical',isoStrategy:'auto',fixedISO:800,customEV:false,ev:12,desiredAperture:0,minShutter:0,dof:'auto',manualFocal:50,manualAperture:2,manualMinAperture:16,manualOIS:false,manualAF:false};
  function equipment(v){
    const camera=P.cameras[v.camera];if(!camera)throw new Error('Choose an available camera.');
    let lens,focal;
    if(v.lens==='manual'){
      focal=Number(v.manualFocal);
      lens={id:'manual',name:'Other / manual lens',minFocal:focal,maxFocal:focal,wideAperture:Number(v.manualAperture),teleAperture:Number(v.manualAperture),minAperture:Number(v.manualMinAperture),ois:!!v.manualOIS,autofocus:!!v.manualAF,variable:false};
      if(!Number.isFinite(lens.wideAperture)||lens.wideAperture<.7||lens.wideAperture>32||!Number.isFinite(lens.minAperture)||lens.minAperture<lens.wideAperture||lens.minAperture>32)throw new Error('Check the manual lens aperture range (f/0.7–f/32).');
    }else{lens=P.lenses.find(l=>l.id===v.lens);if(!lens)throw new Error('Choose an available lens.');focal=lens.minFocal===lens.maxFocal?lens.minFocal:Number(v.focal);}
    if(!Number.isFinite(focal)||focal<4||focal>2000)throw new Error('Enter a focal length from 4 to 2000 mm.');
    return {camera,lens,focal,...P.lensAt(lens,focal)};
  }
  const approximate=n=>Math.round(n<1000?n/10:n/100)*(n<1000?10:100);
  function recommend(v,mode='simple'){
    const gear=equipment(v),{camera,lens,focal,maxAperture}=gear;
    const subject=subjects[v.subject],light=lights.find(l=>l.id===v.light);
    if(!subject||!light)throw new Error('Choose a subject and a light description.');
    const advanced=mode==='advanced',quick=mode==='quick';
    const goal=quick?subject.goals[0]==='depth'?'depth':'balanced':v.goal;
    if(!goals[goal]||!subject.goals.includes(goal))throw new Error('Choose a photographic result that suits the subject.');
    const motion=quick||!subject.moves.length?subject.motion:v.motion;
    if(!movements[motion])throw new Error('Choose a subject movement.');
    let motionTime=movements[motion].time;
    let aperture=subject.aperture;
    if(['portrait','nightportrait'].includes(v.subject))aperture=focal>=50?2.8:focal<23?4:2.8;
    if(goal==='blur')aperture=maxAperture;
    if(goal==='depth')aperture=v.subject==='group'||v.subject==='macro'?11:8;
    if(goal==='freeze')motionTime=Math.min(motionTime,1/1000);
    // Low-noise intent keeps sharpness constraints; it cannot manufacture light.
    const preferredCeiling=goal==='clean'?Math.min(Number(v.maxISO),800):Number(v.maxISO);
    if(![400,800,1600,3200,6400,12800].includes(Number(v.maxISO)))throw new Error('Choose an ISO ceiling supported by X-M5 Auto ISO.');
    if(advanced&&v.dof!=='auto')aperture={shallow:maxAperture,balanced:4,deep:8,maximum:11}[v.dof];
    if(advanced&&Number(v.desiredAperture)>0){aperture=Number(v.desiredAperture);if(aperture<maxAperture||aperture>lens.minAperture)throw new Error(`Choose an aperture from f/${maxAperture} to f/${lens.minAperture} for this lens/zoom position.`);}
    if(!Number.isFinite(aperture))throw new Error('Choose a valid depth priority.');
    aperture=Math.min(lens.minAperture,Math.max(maxAperture,aperture));
    const oisBenefit=lens.ois&&v.ois!=='off'&&v.support!=='tripod'?Number(v.oisStops):0;
    const shutterType=advanced?v.shutterType:'mechanical';
    if(!['mechanical','electronic'].includes(shutterType))throw new Error('Choose a shutter type.');
    const hardware={minISO:camera.minISO,maxISO:camera.maxISO,fastestShutter:shutterType==='electronic'?camera.electronicFastest:camera.mechanicalFastest,longestShutter:camera.longestShutter};
    const ev=advanced&&v.customEV?Number(v.ev):light.ev,spread=advanced&&v.customEV?1:light.spread;
    const fixed=advanced&&v.isoStrategy==='fixed';
    const s={ev,crop:camera.crop,focal,maxAperture,minAperture:lens.minAperture,support:v.support,stops:oisBenefit,dof:'balanced',desiredAperture:aperture,motion:goal==='movement'?'blur':motion==='still'?'still':'posed',motionTime,maxISO:preferredCeiling,comp:Number(v.comp),raw:!!v.raw};
    if(advanced&&Number(v.minShutter)>0)s.minShutter=Number(v.minShutter);
    if(fixed)s.fixedISO=Number(v.fixedISO);
    const r=E.calculate(s,hardware),warnings=[];
    const settings=(a,t,iso)=>`${E.fmtShutter(t)} s · ${E.fmtAperture(a)} · ISO ${iso.toLocaleString()}`;
    const alternatives=[];
    function alternative(title,a,t,ceiling,text){
      const required=E.requiredISO(a,t,ev,s.comp),available=E.isoValues.filter(n=>n>=camera.minISO&&n<=ceiling);
      const selected=E.nearest(available,Math.min(ceiling,Math.max(camera.minISO,required)));
      const error=Math.log2(selected/required);
      alternatives.push({title,aperture:a,shutter:t,iso:selected,requiredISO:required,error,settings:settings(a,t,selected),text:text+(error<-.25?` Still ${(-error).toFixed(1)} stops short; needs approximately ISO ${approximate(required).toLocaleString()}.`:error>.25?` About ${error.toFixed(1)} stops too bright; reduce light with ND or use a faster shutter.`:' Within ¼ stop of the estimated target.')});
    }
    if(r.insufficient){
      warnings.push(`Needs approximately ISO ${approximate(r.neededISO).toLocaleString()}, ${(-r.error).toFixed(1)} stops beyond ${fixed?'your fixed ISO':'the chosen ISO ceiling'}. These settings alone cannot deliver the requested exposure in the estimated light.`);
      const higher=Math.min(camera.maxISO,12800);
      if(r.iso<higher)alternative('Keep the shutter; accept more noise',r.aperture,r.shutter,higher,`Raise the ceiling to ${higher.toLocaleString()}. `);
      const slower=E.nearest(r.availableShutters,Math.min(camera.longestShutter,r.shutter*2));
      if(slower>r.shutter)alternative('Let the shutter run twice as long',r.aperture,slower,r.ceiling,'About one stop more light, with increased movement/shake risk. ');
    }else{
      const t=E.nearest(r.availableShutters,100*r.aperture*r.aperture/(camera.minISO*2**(ev-s.comp)));
      alternative('Lowest native ISO',r.aperture,t,camera.minISO,t>r.limitTime?'Use support for a still subject; movement may blur. ':'Keeps the selected motion guideline. ');
    }
    if(r.aperture>maxAperture)alternative('Open the lens',maxAperture,r.shutter,r.ceiling,'Less depth of field in exchange for more light. ');
    if(r.excess){
      warnings.push(`About ${r.error.toFixed(1)} stops too bright at ISO ${camera.minISO}. ${r.blur?'The chosen motion blur needs less incoming light.':'The selected shutter limit has been reached.'}`);
      alternatives.push({title:'Keep the look with an ND filter',settings:`Approximately ${r.error.toFixed(1)} stops of ND`,text:'Reduces light while preserving aperture and shutter. Check the camera histogram after fitting it.'});
    }
    if(gear.intermediate)warnings.push(`Intermediate zoom aperture is not published in the verified specifications. Using f/${maxAperture} as a conservative usable limit, not claiming it is the exact maximum. Your lens may open wider at ${focal} mm.`);
    if(r.blur){warnings.push('1/15 s deliberately allows movement. Camera shake can appear too; brace, pan deliberately or use a tripod.');if(advanced&&s.minShutter&&s.minShutter<1/15)warnings.push('Intentional motion blur takes priority over your faster minimum-shutter override.');}
    if(r.aperture>=11)warnings.push('More depth of field can soften fine detail through diffraction. Compare f/8 if the scene allows.');
    if(v.subject==='group')warnings.push('Keep faces at similar distances. Aperture alone cannot guarantee a sharp group across several rows.');
    if(v.subject==='macro')warnings.push('At macro distances, depth of field is very thin and effective light loss is not modelled. Use support, check focus closely and meter on the camera.');
    if(shutterType==='electronic')warnings.push('Electronic shutter may distort movement and cause banding under artificial light. Flash cannot be used.');
    if(supportLong(r,v))warnings.push('Use a stable tripod and the 2-second self-timer. Turn lens stabilisation off on the tripod.');
    if(r.shutter>30)warnings.push('This is a long exposure in M mode. Moving people, foliage or stars can blur; long-exposure noise reduction adds processing time.');
    if(!r.blur&&r.shutter>r.limitTime*1.05)warnings.push('The selected shutter type cannot reach the faster shake/movement guideline. Add support, shorten the focal length or reconsider the motion goal.');
    const moving=motion!=='still'&&motion!=='posed';
    let focus=moving?'AF-C · Zone':'AF-S · Single Point';
    let detection='Face/Eye and Subject Detection: Off';
    if(subject.human)detection='Face Detection On · Eye Auto; Subject Detection Off';
    if(v.subject==='pet')detection='Subject Detection: Animal (dogs/cats); Face/Eye Off. For other pets, use Zone AF with detection off.';
    if(v.subject==='action')detection='For people: Face Detection On · Eye Auto. For vehicles/birds: choose the matching Subject Detection type instead.';
    if(!lens.autofocus){focus='Manual focus';detection='AF and subject detection unavailable with this manual lens.';}
    const drive=v.support==='tripod'&&motion==='still'?'Single · 2-second timer':shutterType==='electronic'?'Single frame (electronic)':motion==='running'||motion==='veryfast'?'CH · up to 8 fps (mechanical)':moving?'CL · 5 fps, short bursts':'Single frame';
    const flashEligible=subject.human||['food','product','pet','macro'].includes(v.subject);
    let flash=null;
    if(r.insufficient){
      alternatives.push({title:'Move into better light',settings:`Aim for about ${(-r.error).toFixed(1)} stops more light`,text:'Move nearer a window or brighter lamp, then revise the light estimate. Light falls off with distance; test again.'});
      if(flashEligible)flash=`Consider an external compatible TTL flash for a nearby subject, if allowed${v.subject==='pet'?' and the animal is comfortable':''}. The X-M5 has no built-in flash. Use mechanical shutter at 1/180 s or slower for normal sync; flash output/distance are not calculated. ${moving?'Freezing motion with flash depends on flash duration and suppressing ambient light.':'Bounce from a suitable neutral surface when possible.'}`;
      else warnings.push('Flash will not evenly light a distant landscape or an entire large interior. Use a tripod for still scenes or add appropriate continuous light.');
    }
    let whiteBalance=null;
    if(light.inside||light.artificial)whiteBalance=v.raw?'Auto white balance is a useful starting point in mixed light. RAW leaves room to refine colour later.':'Try Auto (White Priority) for neutral indoor JPEGs; use a custom white balance when product colour must be consistent.';
    if(light.id==='golden')whiteBalance='Daylight white balance can preserve the warm golden-hour colour; Auto may neutralise some warmth.';
    const reason=`${E.fmtShutter(r.shutter)} s ${r.blur?'allows visible movement':motion==='still'?'balances camera support and shake risk':'prioritises subject movement over camera shake'}. ${E.fmtAperture(r.aperture)} ${goal==='blur'?'uses the widest safely known aperture':goal==='depth'||v.subject==='group'?'adds focus depth':'balances light and focus tolerance'}. ${fixed?'Fixed ISO keeps sensitivity consistent.':'Auto ISO lets the camera respond as light changes, within your ceiling.'}`;
    const needLow=E.requiredISO(r.aperture,r.shutter,ev+spread,s.comp),needHigh=E.requiredISO(r.aperture,r.shutter,ev-spread,s.comp);
    const expectedRange=[needLow,needHigh].map(n=>E.nearest(r.availableISO,Math.max(camera.minISO,Math.min(r.ceiling,n))));
    return {gear,subject,light,goal,motion,ev,spread,settings:s,result:r,hardware,warnings,alternatives,focus,detection,drive,flash,whiteBalance,reason,fixed,shutterType,expectedRange,rangeLimited:needHigh>r.ceiling,requiredRange:[needLow,needHigh]};
  }
  function supportLong(r,v){return v.support==='tripod'&&r.shutter>=.25;}
  const api={defaults,subjects,movements,goals,lights,equipment,recommend};root.CameraAdvisor=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
