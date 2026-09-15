(function (root) {
  'use strict';
  const shutters = [1/8000,1/6400,1/5000,1/4000,1/3200,1/2500,1/2000,1/1600,1/1250,1/1000,1/800,1/640,1/500,1/400,1/320,1/250,1/200,1/160,1/125,1/100,1/80,1/60,1/50,1/40,1/30,1/25,1/20,1/15,1/13,1/10,1/8,1/6,1/5,1/4,0.3,0.4,0.5,0.6,0.8,1,1.3,1.6,2,2.5,3.2,4,5,6,8,10,13,15,20,25,30];
  const isoSteps = [100,125,160,200,250,320,400,500,640,800,1000,1250,1600,2000,2500,3200,4000,5000,6400,8000,10000,12800,16000,20000,25600,32000,40000,51200,64000,80000,102400];
  const motionTimes = {still:30,posed:1/125,walking:1/250,active:1/500,fast:1/1000,blur:1/15};
  const depth = {shallow:0,balanced:4,deep:8,maximum:11};
  function validate(s) {
    const ranges = {ev:[-6,18],crop:[0.5,10],focal:[4,2000],maxAperture:[0.7,32],stops:[0,5],maxISO:[100,102400],comp:[-3,3]};
    for (const [key,[min,max]] of Object.entries(ranges)) if (!Number.isFinite(s[key]) || s[key]<min || s[key]>max) throw new Error(`${key}: enter a value between ${min} and ${max}.`);
    if (!(s.dof in depth) || !(s.motion in motionTimes) || !['handheld','braced','tripod'].includes(s.support)) throw new Error('Choose a valid depth, movement and support option.');
  }
  function shutterAtMost(t) { return shutters.filter(x=>x<=t+1e-10).at(-1) || shutters[0]; }
  function nearest(values,n) {return values.reduce((a,b)=>Math.abs(Math.log2(b/n))<Math.abs(Math.log2(a/n))?b:a);}
  function fmtShutter(t) {return t<0.25 ? `1/${Math.round(1/t)}` : `${Number(t.toFixed(2))}`;}
  function fmtAperture(n) {return `f/${Number(n.toFixed(1))}`;}
  // EV is always referenced to ISO 100; changing a camera's base ISO does not
  // change this relationship. Crop is used only by the shake heuristic below.
  function requiredISO(aperture, shutter, ev, comp=0) { return 100*aperture*aperture/(shutter*2**(ev-comp)); }
  function calculate(s, camera={}) {
    validate(s);
    // Optional hardware/intent inputs preserve the original generic API.
    const baseISO=camera.minISO??100, ceiling=Math.min(s.maxISO,camera.maxISO??102400);
    const fastest=camera.fastestShutter??1/8000, longest=camera.longestShutter??30;
    const availableShutters=[1/32000,1/25600,1/20000,1/16000,1/12800,1/10000,...shutters,40,50,60,80,100,125,160,200,250,320,400,500,640,800,900].filter(t=>t>=fastest&&t<=longest);
    const availableISO=isoSteps.filter(n=>n>=baseISO&&n<=ceiling);
    if(!Number.isFinite(baseISO)||!Number.isFinite(ceiling)||!availableISO.length||!availableShutters.length) throw new Error('The selected ISO or shutter limits are incompatible.');
    for(const key of ['desiredAperture','motionTime','minShutter','fixedISO']) if(s[key]!=null && (!Number.isFinite(s[key])||s[key]<=0)) throw new Error('Enter a positive, finite setting.');
    if(s.fixedISO!=null&&!availableISO.includes(s.fixedISO)) throw new Error('Fixed ISO must be within the camera range and your ISO ceiling.');
    const atMost=t=>availableShutters.filter(x=>x<=t+1e-10).at(-1)||availableShutters[0];
    const aperture=Math.min(s.minAperture??32,Math.max(s.maxAperture,s.desiredAperture??depth[s.dof]));
    const shakeTime=s.support==='tripod'?longest:2**(s.stops+(s.support==='braced'?1:0))/(s.focal*s.crop*1.5);
    const movementTime=s.motionTime??(s.motion==='still'?longest:motionTimes[s.motion]);
    const blur=s.motion==='blur';
    const limitTime=blur?1/15:Math.min(shakeTime,movementTime,longest,s.minShutter??longest);
    let shutter=atMost(limitTime);
    const required=(a,t)=>requiredISO(a,t,s.ev,s.comp);
    // For excess light shorten exposure, preserving the intentional-blur target.
    if(!blur && required(aperture,shutter)<(s.fixedISO??baseISO)) shutter=nearest(availableShutters.filter(t=>t<=shutter),100*aperture*aperture/((s.fixedISO??baseISO)*2**(s.ev-s.comp)));
    const neededISO=required(aperture,shutter);
    const iso=s.fixedISO??nearest(availableISO,Math.max(baseISO,Math.min(ceiling,neededISO)));
    const error=Math.log2(iso/neededISO);
    const insufficient=error < -0.25;
    const excess=error > 0.25;
    let limit=blur?'Intentional movement':movementTime<=shakeTime?'Subject movement':'Camera shake';
    if(s.support==='tripod' && s.motion==='still') limit='Depth of field';
    if(insufficient) limit='Your ISO ceiling';
    if(excess) limit=blur?'Too much light for motion blur':'Fastest shutter reached';
    const alternatives=[];
    if(aperture>s.maxAperture*1.01) {
      const n=required(s.maxAperture,shutter);
      const altISO=nearest(availableISO,Math.max(baseISO,Math.min(ceiling,n)));
      const e=Math.log2(altISO/n);
      alternatives.push({title:'Open the lens',settings:`${fmtAperture(s.maxAperture)} · ${fmtShutter(shutter)} s · ISO ${altISO}`,text:`Less depth of field; ${e<-.25?`${(-e).toFixed(1)} stops still short of the target.`:e>.25?`${e.toFixed(1)} stops too bright; use a faster shutter or ND filter.`:'more light at the same shutter speed.'}`});
    }
    const slowISO=insufficient?ceiling:baseISO;
    const idealTime=100*aperture*aperture/(slowISO*2**(s.ev-s.comp));
    const altTime=nearest(availableShutters,idealTime);
    const slowError=Math.log2(altTime/idealTime);
    alternatives.push({title:insufficient?'Trade speed for light':'Prioritise a cleaner image',settings:`${fmtAperture(aperture)} · ${fmtShutter(altTime)} s · ISO ${slowISO}`,text:`${altTime>limitTime*1.05?'A slower shutter risks subject blur or camera shake; use support for a still subject.':'This keeps the shutter within the selected motion guideline.'}${Math.abs(slowError)>.25?` Camera range leaves ${Math.abs(slowError).toFixed(1)} stops ${slowError<0?'under':'over'} target.`:''}${blur?' This changes your motion-blur effect.':''}`});
    if(insufficient) alternatives.push({title:'Keep the creative settings',settings:`${fmtAperture(aperture)} · ${fmtShutter(shutter)} s · ISO ≈ ${Math.round(neededISO/100)*100}`,text:`If your camera supports it, raise the ISO ceiling at the cost of noise. Otherwise add about ${(-error).toFixed(1)} stops of light.`});
    else if(excess) alternatives.push({title:'Reduce incoming light',settings:`ND filter · about ${error.toFixed(1)} stops`,text:'An ND filter preserves the aperture and shutter effect. Alternatively stop down or wait for softer light.'});
    else alternatives.push({title:'Freeze more movement',settings:(()=>{const t=atMost(shutter/2);return `${fmtAperture(aperture)} · ${fmtShutter(t)} s · ISO ≈ ${Math.round(required(aperture,t))}`;})(),text:`A faster shutter trades light for motion control.${required(aperture,atMost(shutter/2))>ceiling?' This exceeds your ISO ceiling.':''}${blur?' It reduces the intentional blur.':''}`});
    return {aperture,shutter,iso,neededISO,error,insufficient,excess,limit,shakeTime,movementTime,alternatives,blur,baseISO,ceiling,availableShutters,availableISO,limitTime};
  }
  const api={calculate,validate,fmtShutter,fmtAperture,requiredISO,nearest,isoValues:Object.freeze([...isoSteps])};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  root.CameraEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
