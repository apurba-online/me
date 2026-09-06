(() => {
  'use strict';
  const tabs=[...document.querySelectorAll('[data-area]')];
  if(!tabs.length)return;
  const areas=[
    {type:'Current research / RA-CMF',title:'Learning where to refine.',copy:'Conditional MeanFlow for CT image reconstruction, with a regional policy that directs refinement where it is most useful.',label:'01 / IMAGE RECONSTRUCTION'},
    {type:'Research direction / Representation',title:'From images to meaningful representations.',copy:'Learning regional and image-level representations that connect reconstruction, anatomical context, and multimodal patient information.',label:'02 / REPRESENTATION LEARNING'},
    {type:'Research direction / Prediction',title:'Connecting imaging to patient outcomes.',copy:'Developing patient-level models for risk prediction and early lung cancer detection, building on quantitative imaging and learned representations.',label:'03 / PREDICTIVE MODELING'}
  ];
  let active=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches;
  const motion=document.getElementById('toggle-motion'),reset=document.getElementById('reset-scene');
  let sceneAPI=null;
  function syncMotion(){motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-pressed',String(!paused));motion.setAttribute('aria-label',paused?'Play automatic rotation':'Pause automatic rotation');motion.title=paused?'Play motion':'Pause motion';}
  function select(index,focus=false){
    active=(index+3)%3;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===active));tab.tabIndex=i===active?0:-1});
    const a=areas[active];
    document.getElementById('panel-type').textContent=a.type;
    document.getElementById('panel-title').textContent=a.title;
    document.getElementById('panel-copy').textContent=a.copy;
    document.getElementById('model-label').textContent=a.label;
    document.getElementById('research-panel').setAttribute('aria-labelledby','tab-'+active);
    sceneAPI?.select(active);
    if(focus)tabs[active].focus();
  }
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?0:e.key==='End'?2:active+(e.key==='ArrowRight'?1:-1),true)}})});
  motion.addEventListener('click',()=>{paused=!paused;syncMotion();sceneAPI?.resume()});
  reset.addEventListener('click',()=>sceneAPI?.reset());
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();sceneAPI?.resume()});
  syncMotion();
  import('./gallery-3d.js').then(module=>module.createGallery({canvas:document.getElementById('portfolio-scene'),getPaused:()=>paused,getReduced:()=>reduced.matches,onSelect:select})).then(api=>{sceneAPI=api;sceneAPI.select(active);document.getElementById('gallery').classList.add('scene-ready')}).catch(()=>{
    document.getElementById('scene-hint').textContent='Choose a research area below to explore.';
    document.getElementById('portfolio-scene').hidden=true;
    document.getElementById('model-label').hidden=true;
    reset.disabled=true;motion.disabled=true;
  });
})();
