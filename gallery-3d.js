import * as THREE from './vendor/three.module.min.js';

export function createGallery({canvas,getPaused,getReduced,onSelect}) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0xf7f8fa,0);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,60);
  camera.position.set(0,2.1,10.5);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0xa0aec7,3));
  const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(-3,7,5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.045;key.shadow.bias=-.0001;scene.add(key);
  const blue=new THREE.DirectionalLight(0xbfcfff,2.4);blue.position.set(4,1,-3);scene.add(blue);
  const white=new THREE.DirectionalLight(0xffffff,2);white.position.set(-5,-1,-1);scene.add(white);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.6;floor.receiveShadow=true;scene.add(floor);
  const materials={blue:new THREE.MeshPhysicalMaterial({color:0x395ae0,metalness:.18,roughness:.3,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide}),silver:new THREE.MeshPhysicalMaterial({color:0xc9d7ec,metalness:.3,roughness:.32,clearcoat:.7,side:THREE.DoubleSide}),light:new THREE.MeshPhysicalMaterial({color:0xe5edf7,metalness:.15,roughness:.34,side:THREE.DoubleSide})};
  const items=[new THREE.Group(),new THREE.Group(),new THREE.Group()];
  items.forEach((group,i)=>{group.userData.area=i;scene.add(group)});
  const exhibit=items.map(group=>{const inner=new THREE.Group();group.add(inner);return inner});
  function mesh(geometry,material,group){const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
  // The sculptures are conceptual views of research areas, not measured results.
  for(let layer=0;layer<9;layer++){
    const geometry=new THREE.PlaneGeometry(2.05,2.05,28,28),p=geometry.attributes.position;
    for(let n=0;n<p.count;n++){
      const x=p.getX(n),y=p.getY(n);
      p.setZ(n,.16*Math.sin(x*2.1+layer*.22)*Math.cos(y*1.8)+.04*Math.sin(y*4));
    }
    geometry.computeVertexNormals();
    const sheet=mesh(geometry,layer===4?materials.blue:materials.silver,exhibit[0]);
    sheet.position.z=(layer-4)*.18;
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,35),new THREE.LineBasicMaterial({color:0x718ebc,transparent:true,opacity:.35}));sheet.add(edges);
  }
  exhibit[0].rotation.set(-.38,-.48,.12);
  const cubeGeometry=new THREE.BoxGeometry(.29,.29,.29);
  const coords=[];
  for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++){
    const pos=new THREE.Vector3((x-1.5)*.53,(y-1.5)*.53,(z-1.5)*.53);coords.push(pos);
    const cube=mesh(cubeGeometry,(x+y+z)%3===0?materials.blue:materials.light,exhibit[1]);cube.position.copy(pos);
  }
  const lines=[];
  coords.forEach((a,i)=>coords.slice(i+1).forEach(b=>{if(a.distanceTo(b)<.55)lines.push(a,b)}));
  const network=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),new THREE.LineBasicMaterial({color:0x8499bb,transparent:true,opacity:.35}));exhibit[1].add(network);exhibit[1].rotation.set(.2,.55,-.1);
  for(let row=0;row<7;row++){
    const points=[];for(let j=0;j<=45;j++){const t=j/45;points.push(new THREE.Vector3((t-.5)*2.6,Math.sin(t*Math.PI*1.65+row*.12)*.58+(row-3)*.15,(row-3)*.24))}
    const curve=new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve,55,.052,8,false),row===3?materials.blue:materials.silver,exhibit[2]);
    const endpoint=mesh(new THREE.SphereGeometry(.088,12,12),row===3?materials.blue:materials.light,exhibit[2]);endpoint.position.copy(points[45]);
  }
  exhibit[2].rotation.set(.2,-.22,-.1);
  let active=0,raf=0,last=0,visible=true,dragging=false,downX=0,downY=0,px=0,py=0,yaw=0,pitch=0,spin=0,hover=-1,dirty=true;
  const slots=[new THREE.Vector3(0,0,.7),new THREE.Vector3(2.1,.32,-1.5),new THREE.Vector3(-2.1,.45,-1.75)];
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function targets(i){return (i-active+3)%3;}
  function placeInstant(){items.forEach((g,i)=>{const slot=targets(i);g.position.copy(slots[slot]);g.scale.setScalar(slot===0?1.07:.59)})}
  function render(now){
    raf=0;if(!visible||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.04):.016;last=now;
    const smoothing=getReduced()?1:1-Math.exp(-dt*7);let moving=false;
    if(!getPaused()&&!dragging)spin+=dt*.1;
    items.forEach((g,i)=>{
      const slot=targets(i),target=slots[slot],s=(slot===0?1.07:.59)+(hover===i?.035:0);
      if(g.position.distanceTo(target)>.001||Math.abs(g.scale.x-s)>.001)moving=true;
      g.position.lerp(target,smoothing);g.scale.lerp(new THREE.Vector3(s,s,s),smoothing);
      const targetY=yaw+(i===active?Math.sin(spin)*.15:0);
      g.rotation.y+=(targetY-g.rotation.y)*smoothing;
      g.rotation.x+=(pitch-g.rotation.x)*smoothing;
    });
    renderer.render(scene,camera);dirty=false;
    if(!getPaused()||dragging||moving)raf=requestAnimationFrame(render);
  }
  function wake(){dirty=true;if(!raf&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(render)}}
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=camera.aspect<.95?12.6:10.5;camera.updateProjectionMatrix();wake()}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0}}, {rootMargin:'120px'});visibility.observe(canvas);
  document.addEventListener('visibilitychange',wake);
  function pick(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(items,true).find(h=>h.object.isMesh);if(!hit)return -1;let obj=hit.object;while(obj.parent&&obj.userData.area===undefined)obj=obj.parent;return obj.userData.area??-1}
  canvas.addEventListener('pointerdown',e=>{dragging=true;downX=px=e.clientX;downY=py=e.clientY;canvas.setPointerCapture(e.pointerId);wake()});
  canvas.addEventListener('pointermove',e=>{if(dragging){yaw+=(e.clientX-px)*.008;pitch=Math.max(-.6,Math.min(.6,pitch+(e.clientY-py)*.005));px=e.clientX;py=e.clientY;wake()}else{const next=pick(e);if(hover!==next){hover=next;canvas.style.cursor=hover<0?'grab':'pointer';wake()}}});
  canvas.addEventListener('pointerup',e=>{const distance=Math.hypot(e.clientX-downX,e.clientY-downY);dragging=false;if(distance<7){const selected=pick(e);if(selected>=0)onSelect(selected)}wake()});
  for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{dragging=false;wake()});
  canvas.addEventListener('pointerleave',()=>{hover=-1;wake()});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')onSelect((active+2)%3);if(e.key==='ArrowRight')onSelect((active+1)%3);if(e.key==='ArrowUp')pitch=Math.max(-.6,pitch-.15);if(e.key==='ArrowDown')pitch=Math.min(.6,pitch+.15);if(e.key==='Home'){yaw=0;pitch=0;spin=0}wake()}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(raf)cancelAnimationFrame(raf);raf=0;document.getElementById('gallery').classList.remove('scene-ready');document.getElementById('scene-hint').textContent='3D view paused. Research areas remain available below.'});
  canvas.addEventListener('webglcontextrestored',()=>{document.getElementById('gallery').classList.add('scene-ready');resize();wake()});
  placeInstant();resize();wake();
  return {select(index){active=index;hover=-1;yaw=0;pitch=0;if(getReduced())placeInstant();wake()},reset(){yaw=0;pitch=0;spin=0;wake()},resume:wake};
}
