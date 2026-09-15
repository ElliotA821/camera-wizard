/* Verified hardware data. Heuristics live in advisor.js, never in this table.
   Lens versions are explicit: a similarly named older lens is not substituted.
   Manufacturer sources checked 2026-09-15. See SOURCES.md for verification notes. */
(function(root){
  'use strict';
  const manual='https://fujifilm-dsc.com/en/manual/x-m5/';
  const cameras={xm5:{id:'xm5',name:'Fujifilm X-M5',mount:'Fujifilm X',sensor:'23.5 × 15.6 mm APS-C',crop:1.5,ibis:false,minISO:160,maxISO:12800,autoMinCeiling:400,mechanicalFastest:1/4000,electronicFastest:1/32000,longestShutter:900,flashSync:1/180,burstLow:5,burstHigh:8,extendedISO:[80,100,125,25600,51200],sources:[manual+'technical_notes/spec/',manual+'taking_photo/iso/',manual+'menu_shooting/shooting_setting/',manual+'menu_shooting/af_mf_setting/']}};
  function fuji(id,name,min,max,wide,tele,minAperture,ois=false,ratedStops=null){return {id,name:'Fujinon '+name,brand:'Fujifilm',mount:'Fujifilm X',minFocal:min,maxFocal:max,wideAperture:wide,teleAperture:tele,minAperture,ois,ratedStops,autofocus:true,source:`https://www.fujifilm-x.com/global/products/lenses/${id}/specifications/`};}
  const lenses=[
    fuji('xc15-45mmf35-56-ois-pz','XC 15–45mm F3.5–5.6 OIS PZ',15,45,3.5,5.6,22,true,3),
    fuji('xc13-33mmf35-63-ois','XC 13–33mm F3.5–6.3 OIS',13,33,3.5,6.3,22,true,4),
    fuji('xc35mmf2','XC 35mm F2',35,35,2,2,16),
    fuji('xf23mmf2-r-wr','XF 23mm F2 R WR',23,23,2,2,16),
    fuji('xf23mmf14-r-lm-wr','XF 23mm F1.4 R LM WR',23,23,1.4,1.4,16),
    fuji('xf27mmf28-r-wr','XF 27mm F2.8 R WR',27,27,2.8,2.8,16),
    fuji('xf30mmf28-r-lm-wr-macro','XF 30mm F2.8 R LM WR Macro',30,30,2.8,2.8,22),
    fuji('xf33mmf14-r-lm-wr','XF 33mm F1.4 R LM WR',33,33,1.4,1.4,16),
    fuji('xf35mmf14-r','XF 35mm F1.4 R',35,35,1.4,1.4,16),
    fuji('xf35mmf2-r-wr','XF 35mm F2 R WR',35,35,2,2,16),
    fuji('xf50mmf2-r-wr','XF 50mm F2 R WR',50,50,2,2,16),
    fuji('xf56mmf12-r-wr','XF 56mm F1.2 R WR',56,56,1.2,1.2,16),
    fuji('xf16mmf14-r-wr','XF 16mm F1.4 R WR',16,16,1.4,1.4,16),
    fuji('xf16mmf28-r-wr','XF 16mm F2.8 R WR',16,16,2.8,2.8,22),
    fuji('xf18mmf14-r-lm-wr','XF 18mm F1.4 R LM WR',18,18,1.4,1.4,16),
    fuji('xf18mmf2-r','XF 18mm F2 R',18,18,2,2,16),
    fuji('xf8mmf35-r-wr','XF 8mm F3.5 R WR',8,8,3.5,3.5,22),
    fuji('xf10-24mmf4-r-ois-wr','XF 10–24mm F4 R OIS WR',10,24,4,4,22,true),
    fuji('xf16-50mmf28-48-r-lm-wr','XF 16–50mm F2.8–4.8 R LM WR',16,50,2.8,4.8,22),
    fuji('xf16-55mmf28-r-lm-wr-ii','XF 16–55mm F2.8 R LM WR II',16,55,2.8,2.8,22),
    fuji('xf18-55mmf28-4-r-lm-ois','XF 18–55mm F2.8–4 R LM OIS',18,55,2.8,4,22,true),
    fuji('xf18-120mmf4-lm-pz-wr','XF 18–120mm F4 LM PZ WR',18,120,4,4,22),
    fuji('xf18-135mmf35-56-r-lm-ois-wr','XF 18–135mm F3.5–5.6 R LM OIS WR',18,135,3.5,5.6,22,true),
    fuji('xf50-140mmf28-r-lm-ois-wr','XF 50–140mm F2.8 R LM OIS WR',50,140,2.8,2.8,22,true),
    fuji('xf55-200mmf35-48-r-lm-ois','XF 55–200mm F3.5–4.8 R LM OIS',55,200,3.5,4.8,22,true),
    fuji('xf70-300mmf4-56-r-lm-ois-wr','XF 70–300mm F4–5.6 R LM OIS WR',70,300,4,5.6,22,true),
    {id:'sigma30',name:'Sigma 30mm F1.4 DC DN | Contemporary (X)',brand:'Sigma',minFocal:30,maxFocal:30,wideAperture:1.4,teleAperture:1.4,minAperture:16,ois:false,autofocus:true,source:'https://www.sigma-global.com/en/lenses/c016_30_14/'},
    {id:'sigma56',name:'Sigma 56mm F1.4 DC DN | Contemporary (X)',brand:'Sigma',minFocal:56,maxFocal:56,wideAperture:1.4,teleAperture:1.4,minAperture:16,ois:false,autofocus:true,source:'https://www.sigma-global.com/en/lenses/c018_56_14/'},
    {id:'sigma18-50',name:'Sigma 18–50mm F2.8 DC DN | Contemporary (X)',brand:'Sigma',minFocal:18,maxFocal:50,wideAperture:2.8,teleAperture:2.8,minAperture:22,ois:false,autofocus:true,source:'https://www.sigma-global.com/en/lenses/c021_18_50_28/'},
    {id:'tamron17-70',name:'Tamron 17–70mm F/2.8 Di III-A VC RXD (B070, X)',brand:'Tamron',minFocal:17,maxFocal:70,wideAperture:2.8,teleAperture:2.8,minAperture:22,ois:true,ratedStops:null,autofocus:true,source:'https://www.tamron.com/global/consumer/lenses/b070/spec.html'},
    {id:'viltrox27',name:'Viltrox AF 27mm F1.2 Pro XF',brand:'Viltrox',minFocal:27,maxFocal:27,wideAperture:1.2,teleAperture:1.2,minAperture:16,ois:false,autofocus:true,source:'https://viltrox.com/pages/af-27-1-2-pro-xf'}
  ];
  for(const l of lenses){l.mount='Fujifilm X';l.variable=l.wideAperture!==l.teleAperture;l.group=`${l.brand==='Fujifilm'?'Fujifilm':'Third-party'} ${l.minFocal===l.maxFocal?'primes':'zooms'}`;l.verifiedAt='2026-09-15';}
  // No fabricated aperture ramp. At unpublished intermediate focal lengths,
  // use the telephoto endpoint as a conservative *usable* aperture, explicitly
  // not the exact maximum. Endpoint values update automatically with zoom.
  // Future measured curves can be added as [{focal,aperture,source}] nodes;
  // use the next verified node conservatively, never interpolate optimistically.
  function lensAt(l,focal){
    if(!l||!Number.isFinite(focal)||focal<l.minFocal||focal>l.maxFocal) throw new Error('Choose a focal length within the selected lens range.');
    const intermediate=l.variable&&focal>l.minFocal&&focal<l.maxFocal;
    const maxAperture=focal===l.minFocal?l.wideAperture:l.teleAperture;
    return {maxAperture,intermediate,exact:!intermediate,range:[l.wideAperture,l.teleAperture]};
  }
  const api={cameras,lenses,lensAt};root.CameraProfiles=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
