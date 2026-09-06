(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');
  document.querySelectorAll('.focus-item').forEach(card => {
    card.addEventListener('pointermove', e => {
      if(reduced.matches || !fine.matches) return;
      const r=card.getBoundingClientRect();
      card.style.transform=`rotateX(${-(e.clientY-r.top-r.height/2)/30}deg) rotateY(${(e.clientX-r.left-r.width/2)/25}deg) translateZ(8px)`;
    });
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });
  const canvas=document.querySelector('#research-space');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  if(!ctx) return;
  const button=document.querySelector('#motion-toggle');
  let width=0,height=0,angle=.3,tilt=-.24,paused=reduced.matches,drag=false,lastX=0,lastY=0,raf=0,visible=true,last=0;
  const points=[];
  // Three-dimensional parametric lattice: abstract geometry, not research results.
  for(let i=0;i<24;i++) for(let j=0;j<15;j++){
    const u=i/24*Math.PI*2,v=j/15*Math.PI*2,r=1.65+.55*Math.cos(v);
    points.push([r*Math.cos(u),.55*Math.sin(v),r*Math.sin(u)]);
  }
  function project(p){
    const x=p[0]*Math.cos(angle)-p[2]*Math.sin(angle),z=p[0]*Math.sin(angle)+p[2]*Math.cos(angle);
    const y=p[1]*Math.cos(tilt)-z*Math.sin(tilt),depth=p[1]*Math.sin(tilt)+z*Math.cos(tilt);
    const scale=Math.min(width,height)*.205*5/(5+depth);
    return {x:width/2+x*scale,y:height*.51+y*scale,z:depth};
  }
  function draw(){
    ctx.clearRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width/2,height*.5,5,width/2,height*.5,width*.49);
    glow.addColorStop(0,'#215c6b55');glow.addColorStop(1,'#10283800');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    const projected=points.map(project);
    for(let i=0;i<24;i++)for(let j=0;j<15;j++){
      const a=projected[i*15+j];
      for(const k of [((i+1)%24)*15+j,i*15+(j+1)%15]){
        const b=projected[k];ctx.strokeStyle=`rgba(104,217,211,${.12+(2.3-a.z)/4.6*.42})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    projected.sort((a,b)=>b.z-a.z).forEach(p=>{ctx.fillStyle=p.z<0?'#b9fff0':'#578694';ctx.beginPath();ctx.arc(p.x,p.y,p.z<0?1.8:1,0,Math.PI*2);ctx.fill()});
    const labels=[['GENERATIVE IMAGING',[-2,.9,.1]],['REPRESENTATION',[1.2,-.9,1.3]],['PREDICTIVE AI',[1.8,.9,-.8]]];
    ctx.font='600 12px system-ui';
    labels.forEach(([label,p])=>{const q=project(p),tw=ctx.measureText(label).width,x=Math.min(width-tw-24,Math.max(8,q.x-tw/2)),y=Math.min(height-65,Math.max(95,q.y));ctx.fillStyle='#0b1a25ee';ctx.fillRect(x-8,y-18,tw+16,28);ctx.strokeStyle='#476975';ctx.strokeRect(x-8,y-18,tw+16,28);ctx.fillStyle='#c9e9ed';ctx.fillText(label,x,y)});
  }
  function frame(now){raf=0;if(!visible||document.hidden||paused)return;const dt=last?Math.min(now-last,40):16;last=now;if(!drag)angle+=dt*.00012;draw();raf=requestAnimationFrame(frame)}
  function start(){last=0;if(!raf&&!paused&&visible&&!document.hidden)raf=requestAnimationFrame(frame)}
  function updateButton(){button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(!paused))}
  function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start()}).observe(canvas);
  button.addEventListener('click',()=>{paused=!paused;updateButton();start()});
  reduced.addEventListener('change',()=>{paused=reduced.matches;updateButton();draw();start()});
  document.addEventListener('visibilitychange',start);
  canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;angle+=(e.clientX-lastX)*.008;tilt=Math.max(-1.2,Math.min(1.2,tilt+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;draw()});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=false);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angle-=.12;if(e.key==='ArrowRight')angle+=.12;if(e.key==='ArrowUp')tilt-=.1;if(e.key==='ArrowDown')tilt+=.1;if(e.key==='Home'){angle=.3;tilt=-.24}draw()});
  updateButton();resize();start();
})();
