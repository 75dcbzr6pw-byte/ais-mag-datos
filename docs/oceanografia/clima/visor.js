function clima(bundle,slot){
 const {sets,layers,coast}=bundle;
 const d=document.createElement('section');d.id='climaVista';d.className='workspace-panel-v39';d.hidden=true;
 d.innerHTML='<header class="workspace-head-v39"><h2>Clima</h2><div class="context-actions-v39"><button data-clear title="Restablecer parámetros de Clima" aria-label="Restablecer parámetros de Clima"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button><button data-min title="Minimizar hasta pasar el cursor" aria-label="Minimizar Clima">−</button><button data-close title="Cerrar menú de Clima" aria-label="Cerrar Clima">×</button></div></header><div class="clima-body"><div data-modes class="clima-modes"></div><div class="clima-bar"><div class="fleet-scale-buttons-v39" data-period></div><div class="clima-transport"><button data-prev></button><button data-play aria-label="Reproducir" title="Reproducir">▶</button><button data-next></button></div><div class="clima-options"><button class="motion"></button><button class="isobars" aria-pressed="true" aria-label="Isobaras de presión" title="Isobaras de presión"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moisture" viewBox="0 0 16 16"><path d="M13.5 0a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V7.5h-1.5a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V15h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5zM7 1.5l.364-.343a.5.5 0 0 0-.728 0l-.002.002-.006.007-.022.023-.08.088a29 29 0 0 0-1.274 1.517c-.769.983-1.714 2.325-2.385 3.727C2.368 7.564 2 8.682 2 9.733 2 12.614 4.212 15 7 15s5-2.386 5-5.267c0-1.05-.368-2.169-.867-3.212-.671-1.402-1.616-2.744-2.385-3.727a29 29 0 0 0-1.354-1.605l-.022-.023-.006-.007-.002-.001zm0 0-.364-.343zm-.016.766L7 2.247l.016.019c.24.274.572.667.944 1.144.611.781 1.32 1.776 1.901 2.827H4.14c.58-1.051 1.29-2.046 1.9-2.827.373-.477.706-.87.945-1.144zM3 9.733c0-.755.244-1.612.638-2.496h6.724c.395.884.638 1.741.638 2.496C11 12.117 9.182 14 7 14s-4-1.883-4-4.267" /></svg></button></div></div><div class="clima-time"><input type="range" min="0" step="1" value="0" aria-label="Línea de tiempo de Clima 2026"><div class="months"><span>Ene</span><span>Abr</span><span>Jul</span><span>Oct</span><span>Dic</span></div></div><div class="clima-readout"><output></output><span data-caption></span></div><figure><canvas data-chart width="340" height="90"></canvas></figure><div class="clima-fields" data-fields></div><div class="clima-legend"><div class="scale"><button data-end="0" title="Editar extremo inferior" aria-label="Editar extremo inferior"></button><button data-end="1" title="Editar extremo superior" aria-label="Editar extremo superior"></button></div><div data-marks></div><div class="clima-limits"><label>Mín. <input type="range" data-limit="0" aria-label="Mínimo de la escala"></label><label>Máx. <input type="range" data-limit="1" aria-label="Máximo de la escala"></label></div><div data-editor hidden><label>Color <input data-color type="color"></label><label>Opacidad <input data-opacity type="range" min="0" max="100"></label><output data-alpha></output><button data-done>Listo</button></div></div><small data-source></small></div>';document.body.append(d);
 const q=s=>d.querySelector(s),slider=q('.clima-time input'),play=q('[data-play]');
 const bio={no3:'#df7452',po4:'#9164d9',si:'#279aaa',chl:'#58a442'},checked=new Set();
 const pane=map.createPane('climaAmbiental');pane.style.cssText='z-index:350;pointer-events:none';pane.hidden=true;
 const canvas=()=>document.createElement('canvas');
 const base=canvas(),flow=canvas(),pressure=canvas(),symbols=canvas();
 for(const c of [base,flow,pressure,symbols]){c.style.position='absolute';pane.append(c)}
 const seaBits=bytes(coast.bits);
 function bytes(str){return Uint8Array.fromBase64?Uint8Array.fromBase64(str):Uint8Array.from(atob(str),s=>s.charCodeAt(0))}
 function isSea(lon,lat){if(!Number.isFinite(lon+lat))return false;const x=Math.round((lon-coast.west)/coast.step),y=Math.round((coast.north-lat)/coast.step);
  if(x<0||x>=coast.width||y<0||y>=coast.height)return false;
  const bit=y*coast.width+x;return !(seaBits[bit>>3]&(1<<(bit&7)))}
 let id='wind',mode='Histórico',period='Día',index=0,anchor='2026-01-01',revision=0,playing=false,timer,scrubTimer,run=0,anim=0;
 if(bundle.publicView){mode='Actual';anchor=sets.air.analysisEnd;period='6 h'}
 let current=null,previous=null,started=0,fraction=1,moving=true,showPressure=true,editing=null;
 let lons=[],lats=[],particles=[],lastFrame=0,lastPaint=0;
 const hold=4200,duration=hold,settings={},cache=new Map();
 const layer=()=>layers[id],timeline=()=>layer().views[mode][period];
 const marine=()=>id==='total'||id==='tide';
 const transportGlyphs={'◀◀':'<path d="M12 4 3 12l9 8zm9 0-9 8 9 8z"/>','▶▶':'<path d="m3 4 9 8-9 8zm9 0 9 8-9 8z"/>','▶':'<path d="m6 3 14 9-14 9z"/>','Ⅱ':'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>','≋':'<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M2 7c7-8 11 8 20 0M2 12c7-8 11 8 20 0M2 17c7-8 11 8 20 0"/>'};
 function button(el,icon,title,active){if(transportGlyphs[icon])el.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+transportGlyphs[icon]+'</svg>';else el.textContent=icon;el.title=title;el.setAttribute('aria-label',title);if(active!=null)el.setAttribute('aria-pressed',String(active))}
 function options(host,items,selected,onClick){const group=q(host);group.replaceChildren();
  for(const text of items){const b=document.createElement('button');button(b,text,text,text===selected);b.onclick=()=>onClick(text);group.append(b)}}
 function stop(){run++;playing=false;clearTimeout(timer);clearTimeout(scrubTimer);button(play,'▶','Reproducir')}
 function closeEditor(){editing=null;q('[data-editor]').hidden=true}
 function menu(){
  const views=layer().views[mode];if(!views[period])period='Día';
  const line=timeline();index=line.findIndex(t=>t.stamps.some(s=>s.slice(0,10)===anchor.slice(0,10)));
  if(index<0)index=anchor<line[0].stamps[0]?0:line.length-1;
  options('[data-modes]',Object.keys(layer().views),mode,v=>{stop();closeEditor();mode=v;period=v==='Actual'&&layer().views.Actual['6 h']?'6 h':'Día';anchor=layer().views[v][period][0].stamps[0];menu()});
  q('[data-modes]').lastChild.title='Últimos 15 días del archivo regional y pronóstico disponible';
  options('[data-period]',Object.keys(views),period,v=>{stop();period=v;menu()});
  const fields=q('[data-fields]');fields.replaceChildren();
  for(const key of Object.keys(layers)){
   if(key in bio){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=checked.has(key);
    check.onchange=()=>{if(check.checked){checked.add(key);select(key)}else{checked.delete(key);select(id===key?[...checked].at(-1)||'wind':id)}};
    label.append(check,layers[key].title);fields.append(label);
   }else{const b=document.createElement('button');button(b,layers[key].title,layers[key].title,key===id);b.onclick=()=>select(key);fields.append(b)}
  }
  q('.motion').disabled=!layer().vector;slider.max=line.length-1;slider.value=index;
  legend();update(false);
 }
 function select(key){stop();closeEditor();id=key;menu()}
 const format=(n,dec=1)=>n.toLocaleString('es-CL',{maximumFractionDigits:dec});
 function style(){return settings[id]??={range:[layer().min,layer().max],colors:['#244c7d','#b74862'],alpha:id.startsWith('wind')?[15,55]:[65,78]}}
 function hue(rgb){const [r,g,b]=rgb.map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),c=hi-lo,l=(hi+lo)/2;
  const h=!c?0:hi===r?(g-b)/c:hi===g?(b-r)/c+2:(r-g)/c+4;
  return [(h*60+360)%360,c?c/(1-Math.abs(2*l-1)):0,l]}
 function palette(){
  const st=style(),[a,b]=st.colors.map(hex=>hue([1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))));
  let delta=b[0]-a[0];if(delta>100&&a[0]>160&&b[0]>285)delta-=360;else if(delta>180)delta-=360;else if(delta< -180)delta+=360;
  return Array.from({length:128},(_,i)=>{const t=i/127,h=(a[0]+delta*t+360)%360,s=a[1]+(b[1]-a[1])*t,l=a[2]+(b[2]-a[2])*t;
   const ch=(1-Math.abs(2*l-1))*s,x=ch*(1-Math.abs((h/60)%2-1)),m=l-ch/2;
   const v=[[ch,x,0],[x,ch,0],[0,ch,x],[0,x,ch],[x,0,ch],[ch,0,x]][Math.floor(h/60)%6];return [...v.map(n=>Math.round((n+m)*255)),Math.round((st.alpha[0]+(st.alpha[1]-st.alpha[0])*t)*2.55)]});
 }
 function legend(){const l=layer(),p=palette(),unit=marine()?'kt':l.unit,f=marine()?1.94384:1;
  q('.scale').style.backgroundImage='repeating-linear-gradient(90deg,transparent 0,transparent calc(20% - 1px),rgba(255,255,255,.36) calc(20% - 1px),rgba(255,255,255,.36) 20%),linear-gradient(90deg,'+[0,25,51,76,102,127].map(i=>'rgb('+p[i].slice(0,3).join(',')+')').join(',')+')';
  const [lo,hi]=style().range;
  for(const input of d.querySelectorAll('[data-limit]')){
   const end=Number(input.dataset.limit);
   input.min=l.min;input.max=l.max;input.step=(l.max-l.min)/1000;input.value=end?hi:lo;
   input.setAttribute('aria-valuetext',format((end?hi:lo)*f,3)+' '+unit);
  }
  const marks=q('[data-marks]');marks.replaceChildren();
  for(let i=0;i<6;i++){const n=document.createElement('span');n.textContent=(i===5&&id.startsWith('wind')?'≥':'')+format((lo+(hi-lo)*i/5)*f,2)+(i===5?' '+unit:'');marks.append(n)}
 }
 for(const input of d.querySelectorAll('[data-limit]'))input.oninput=()=>{
  const end=Number(input.dataset.limit),range=style().range,step=Number(input.step);
  range[end]=end?Math.max(+input.value,range[0]+step):Math.min(+input.value,range[1]-step);
  legend();cancelAnimationFrame(recolorFrame);recolorFrame=requestAnimationFrame(()=>{
   if(current?.id!==id)return;current.texture=texture(current,true);
   if(previous?.id===id)previous.texture=texture(previous,true);paint(previous?fraction:1);
  })
 };
 for(const b of d.querySelectorAll('[data-end]'))b.onclick=()=>{stop();editing=+b.dataset.end;const st=style();q('[data-editor]').hidden=false;q('[data-color]').value=st.colors[editing];q('[data-opacity]').value=st.alpha[editing];q('[data-alpha]').value=st.alpha[editing]+' %';q('[data-color]').focus()};
 q('[data-done]').onclick=closeEditor;d.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing!==null)closeEditor()});
 let recolorFrame=0;
 function applyColor(){const st=style();st.colors[editing]=q('[data-color]').value;st.alpha[editing]=+q('[data-opacity]').value;q('[data-alpha]').value=st.alpha[editing]+' %';legend();cancelAnimationFrame(recolorFrame);recolorFrame=requestAnimationFrame(()=>{if(current&&!pane.hidden){previous=null;current.texture=texture(current,true);paint(1)}})}
 q('[data-color]').oninput=applyColor;q('[data-opacity]').oninput=applyColor;
 function chart(){
  const line=timeline(),l=layer(),c=q('[data-chart]'),ctx=c.getContext('2d'),w=c.width,h=c.height;
  c.title=l.referenceTitle;c.setAttribute('aria-label',l.title+' · '+l.referenceTitle);ctx.clearRect(0,0,w,h);
  const values=line.flatMap(t=>[t.value,t.ref]).filter(Number.isFinite);if(!values.length)return;
  const lo=Math.min(...values),hi=Math.max(...values),x=i=>34+i*(w-46)/Math.max(1,line.length-1),y=v=>8+(hi-v)/(hi-lo||1)*(h-26);
  ctx.font='10px Arial';ctx.fillStyle=getComputedStyle(d).color;ctx.fillText(format(hi),1,13);ctx.fillText(format(lo),1,h-13);
  for(const key of ['ref','value']){ctx.strokeStyle=key==='ref'?'#899599':'#219eb0';ctx.setLineDash(key==='ref'?[4,3]:[]);ctx.beginPath();let first=true;
   line.forEach((t,i)=>{if(t[key]==null){first=true;return}if(first)ctx.moveTo(x(i),y(t[key]));else ctx.lineTo(x(i),y(t[key]));first=false});ctx.stroke()}
  ctx.setLineDash([]);ctx.strokeStyle='#be824c';ctx.beginPath();ctx.moveTo(x(index),2);ctx.lineTo(x(index),h-12);ctx.stroke();
  if(line[index].value!=null){ctx.fillStyle='#219eb0';ctx.beginPath();ctx.arc(x(index),y(line[index].value),3,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle=getComputedStyle(d).color;const marks=q('.months');marks.replaceChildren();
  for(const i of new Set([0,.25,.5,.75,1].map(f=>Math.round(f*(line.length-1))))){const stamp=line[i].stamps[0],date=new Date(stamp.slice(0,10)+'T12:00Z');
   const text=date.toLocaleDateString('es-CL',mode==='Histórico'?{month:'short'}:{month:'short',day:'numeric'});ctx.fillText(text,Math.min(w-28,x(i)),h-1);const s=document.createElement('span');s.textContent=text;marks.append(s)}
 }
 async function decoded(raw){const stream=new Blob([bytes(raw)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Int16Array(await new Response(stream).arrayBuffer())}
 async function average(key,stamps){
  if(key==='air'&&mode==='Histórico')stamps=stamps.filter(t=>t.slice(0,10)<=sets.air.analysisEnd);
  if(bundle.loadDays)await bundle.loadDays(stamps);
  const set=sets[key],n=set.x.length*set.y.length,ids=stamps.filter(t=>(t.includes('T')?set.recent:set.days)?.[t]);
  if(!ids.length)return null;
  const token=[key,ids[0],ids.at(-1),ids.length].join('|');if(cache.has(token))return cache.get(token);
  const promise=(async()=>{let sums;const count=new Uint8Array(n);
   for(const t of ids){const a=await decoded((t.includes('T')?set.recent:set.days)[t]);sums??=new Float32Array(a.length);
    for(let j=0;j<n;j++){if(a[j]===-32768)continue;count[j]++;for(let k=j;k<a.length;k+=n)sums[k]+=a[k]}}
   for(let j=0;j<n;j++)for(let k=j;k<sums.length;k+=n)sums[k]=count[j]?sums[k]/count[j]:NaN;
   return {a:sums,n,nx:set.x.length,ny:set.y.length,x:set.x[0],y:set.y[0],dx:set.x[1]-set.x[0],dy:set.y[1]-set.y[0],count:ids.length};
  })();cache.set(token,promise);if(cache.size>16)cache.delete(cache.keys().next().value);return promise;
 }
 async function update(smooth){
  const ticket=++revision,t=timeline()[index],l=layer();anchor=t.stamps[0];slider.value=index;
  const stamp=(period==='Semana'?'Semana del ':'')+t.key.replace('T',' ')+(period==='6 h'?':00 UTC':'');
  q('.clima-readout output').textContent=stamp+(l.key==='air'&&mode==='Actual'&&t.stamps.at(-1).slice(0,10)>sets.air.analysisEnd?' · Pronóstico':'');slider.setAttribute('aria-valuetext',stamp);q('[data-caption]').textContent=l.title+' · '+(t.value==null?'Sin datos':format(t.value,2)+' '+l.unit);chart();
  if(pane.hidden)return;
  const [field,outer,air,overlays,detail]=await Promise.all([average(l.key,t.stamps),marine()?average('outer',t.stamps):null,average('air',t.stamps),Promise.all([...checked].map(async k=>[k,await average(k,t.stamps)])),l.detail?average(l.detail,t.stamps):null]);
  if(ticket!==revision||pane.hidden)return;
  const was=current;current={id,field,outer,air,overlays,detail,layer:l};previous=smooth&&was?.id===id&&was.field&&field?was:null;
  pressureToggle.title=air?'Isobaras de presión · hPa':'Isobaras de presión · sin datos';
  const first=t.stamps[0].slice(0,10),last=t.stamps.at(-1).slice(0,10),lastERA=sets.air.lastERA;
  const projected=last>sets.air.analysisEnd;
  const weatherSource=projected?(first>sets.air.analysisEnd?'Pronóstico GFS':'Análisis y pronóstico GFS')+' · emisión '+sets.air.cycle.slice(0,13).replace('T',' ')+':00 UTC':last<=lastERA?'ERA5':first>lastERA?'NOAA GFS · análisis':'ERA5 y NOAA GFS';
  const source=l.key==='air'?weatherSource+(period==='6 h'?' · lectura UTC':' · 4 lecturas UTC por día'):l.source;
  pressureToggle.title=air?'Isobaras de presión · '+weatherSource+' · hPa':'Isobaras de presión · sin datos';
  q('[data-source]').textContent=(l.key==='inner'&&period==='6 h'?'Copernicus Marine · SMOC · lectura horaria':source)+' · '+(field?.count||0)+(period==='6 h'?' lectura':' días con cartografía')+(air?'':' · Sin presión para este período');
  size();current.texture=texture(current);if(current.estimated.includes(1))q('[data-source]').textContent+=' · Tono tenue: estimación por agua conectada';drawSymbols();started=performance.now();fraction=previous?0:1;if(!previous)flow.getContext('2d').clearRect(0,0,flow.width,flow.height);paint(fraction);
 }
 let water=null,viewKey='';
 function size(){
  const {x:w,y:h}=map.getSize(),origin=map.containerPointToLayerPoint([0,0]),key=[w,h,map.getZoom(),map.getCenter().lat,map.getCenter().lng].join('/');
  for(const c of [base,flow,pressure,symbols])L.DomUtil.setPosition(c,origin);
  if(viewKey===key)return;viewKey=key;water=null;previous=null;
  for(const c of [base,flow,pressure,symbols]){c.width=w;c.height=h}
  lons=Array.from({length:w},(_,i)=>map.containerPointToLatLng([i,0]).lng);lats=Array.from({length:h},(_,j)=>map.containerPointToLatLng([0,j]).lat);
  particles=Array.from({length:Math.floor(w*h/250)},()=>[Math.random()*w,Math.random()*h,65+Math.random()*140]);
 }
 function waterMask(){if(water)return water;water=canvas();water.width=base.width;water.height=base.height;
  const c=water.getContext('2d'),img=c.createImageData(water.width,water.height);
  for(let j=0;j<water.height;j++)for(let i=0;i<water.width;i++)if(isSea(lons[i],lats[j]))img.data[(j*water.width+i)*4+3]=255;
  c.putImageData(img,0,0);return water}
 function sample(state,lon,lat,g){
  const l=state.layer,sea=l.key==='inner',f=state.field;if(!g)g=state.detail||f||state.outer;if(!g)return;
  const inside=(p)=>{const i=(lon-p.x)/p.dx,j=(lat-p.y)/p.dy;return i>=0&&i<p.nx-1&&j>=0&&j<p.ny-1};
  const fallback=()=>g===state.detail&&f?sample(state,lon,lat,f):g!==state.outer&&state.outer?sample(state,lon,lat,state.outer):undefined;
  if(!inside(g))return fallback();
  if(sea&&!isSea(lon,lat))return;
  const x=(lon-g.x)/g.dx,y=(lat-g.y)/g.dy,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;
  const vector=l.vector;let u=0,v=0,mag=0,weight=0;
  function add(a,b,w){if(w<=0||a<0||a>=g.nx||b<0||b>=g.ny)return;
   const k=b*g.nx+a,scalar=g.a[l.channels.at(-1)*g.n+k];if(!Number.isFinite(scalar))return;
   if(sea){const dx=g.x+a*g.dx-lon,dy=g.y+b*g.dy-lat,steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/coast.step);
    for(let z=1;z<=steps;z++)if(!isSea(lon+dx*z/steps,lat+dy*z/steps))return}
   weight+=w;mag+=scalar*w;
   if(vector){u+=g.a[l.channels[0]*g.n+k]*w;v+=g.a[l.channels[1]*g.n+k]*w}
  }
  add(i,j,(1-fx)*(1-fy));add(i+1,j,fx*(1-fy));add(i,j+1,(1-fx)*fy);add(i+1,j+1,fx*fy);
  if(!weight&&sea)for(let b=-1;b<=2;b++)for(let a=-1;a<=2;a++){const dist=(a-fx)**2+(b-fy)**2;if(dist>0&&dist<=2.25)add(i+a,j+b,1/dist)}
  if(weight)return [u*l.factor/weight,v*l.factor/weight,mag*l.factor/weight];
  return fallback();
 }
 function texture(s,recolor=false){
  const step=4,w=Math.ceil(base.width/step),h=Math.ceil(base.height/step),c=canvas();c.width=w;c.height=h;
  const ctx=c.getContext('2d'),image=ctx.createImageData(w,h),p=palette(),l=s.layer;
  const [lo,hi]=style().range;
  if(!recolor||s.width!==w||s.values?.length!==w*h){
   s.velocity=new Float32Array(w*h*2).fill(NaN);s.width=w;s.values=new Float32Array(w*h).fill(NaN);
   const ocean=!s.id.startsWith('wind'),eligible=new Uint8Array(w*h),queue=new Int32Array(w*h);
   s.estimated=new Uint8Array(w*h);let tail=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const k=y*w+x,lon=lons[x*step],lat=lats[y*step];
    if(ocean&&!isSea(lon,lat))continue;
    eligible[k]=1;const val=sample(s,lon,lat);if(!val)continue;
    s.values[k]=val[2];s.velocity[k*2]=val[0];s.velocity[k*2+1]=val[1];queue[tail++]=k;
   }
   if(ocean)for(let head=0;head<tail;head++){
    const k=queue[head],x=k%w,y=Math.floor(k/w);
    for(const n of [x>0?k-1:-1,x+1<w?k+1:-1,y>0?k-w:-1,y+1<h?k+w:-1]){
     if(n<0||!eligible[n]||Number.isFinite(s.values[n]))continue;
     const px=Math.floor(((n%w)+x)*step/2),py=Math.floor((Math.floor(n/w)+y)*step/2);
     if(!isSea(lons[px],lats[py]))continue;
     s.values[n]=s.values[k];s.velocity[n*2]=s.velocity[k*2];s.velocity[n*2+1]=s.velocity[k*2+1];
     s.estimated[n]=1;queue[tail++]=n;
    }
   }
  }
  for(let k=0;k<s.values.length;k++)if(Number.isFinite(s.values[k])){
   const bin=Math.round(127*Math.max(0,Math.min(1,(s.values[k]-lo)/(hi-lo))));
   image.data.set(p[bin],k*4);if(s.estimated[k])image.data[k*4+3]*=.55;
  }
  ctx.putImageData(image,0,0);return c;
 }
 function drawSymbols(){current.marks=null;if(!current.overlays.length)return;const marks=canvas();marks.width=base.width;marks.height=base.height;current.marks=marks;const ctx=marks.getContext('2d');
  for(const [k,g] of current.overlays){if(!g)continue;const l=layers[k],off=Object.keys(bio).indexOf(k);ctx.fillStyle=bio[k];
   for(let j=0;j<g.ny;j++)for(let i=0;i<g.nx;i++){const value=g.a[j*g.nx+i]*l.factor;if(!Number.isFinite(value))continue;
    const pt=map.latLngToContainerPoint([g.y+g.dy*j,g.x+g.dx*i]);if(!isSea(g.x+g.dx*i,g.y+g.dy*j))continue;
    ctx.beginPath();ctx.arc(pt.x+(off%2)*5,pt.y+Math.floor(off/2)*5,1+4*Math.sqrt(Math.max(0,Math.min(1,value/l.max))),0,2*Math.PI);ctx.fill()}}
 }
 function pressureLines(field,prior,t=1){
  if(!field)return [];
  const levels=new Map(),g=field,values=g.a.subarray(2*g.n,3*g.n);
  for(let j=0;j<g.ny-1;j++)for(let i=0;i<g.nx-1;i++){
   const k=j*g.nx+i,corners=[k,k+1,k+g.nx+1,k+g.nx],p=corners.map(k=>1000+.02*(prior?prior.a[2*g.n+k]*(1-t)+values[k]*t:values[k]));
   for(let level=2*Math.ceil(Math.min(...p)/2);level<=Math.max(...p);level+=2){
    const graph=levels.get(level)||new Map();levels.set(level,graph);const cuts=[];
    for(let h=0;h<4;h++){const b=(h+1)%4;if((p[h]<level)===(p[b]<level))continue;
     const u=(level-p[h])/(p[b]-p[h]),a=corners[h],z=corners[b];
     const x=(a%g.nx)*(1-u)+(z%g.nx)*u,y=Math.floor(a/g.nx)*(1-u)+Math.floor(z/g.nx)*u;
     const key=u===0?'v'+a:u===1?'v'+z:Math.min(a,z)+'/'+Math.max(a,z);
     if(!graph.has(key))graph.set(key,{pt:[g.y+y*g.dy,g.x+x*g.dx],next:new Set()});cuts.push(key);
    }
    if(cuts.length===4&&((p[0]-level)*(p[2]-level)<(p[1]-level)*(p[3]-level)))cuts.push(cuts.shift());
    for(let h=1;h<cuts.length;h+=2){const a=cuts[h-1],b=cuts[h];if(a!==b){graph.get(a).next.add(b);graph.get(b).next.add(a)}}
   }
  }
  const lines=[];
  for(const [level,graph] of levels){
   const keys=[...graph.keys()].sort((a,b)=>graph.get(a).next.size-graph.get(b).next.size);
   for(const start of keys)while(graph.get(start).next.size){const points=[graph.get(start).pt];let key=start;
    while(graph.get(key).next.size){const next=graph.get(key).next.values().next().value;graph.get(key).next.delete(next);graph.get(next).next.delete(key);points.push(graph.get(next).pt);key=next;if(key===start)break}
    if(points.length>=2)lines.push({level,points,closed:key===start});
   }
  }
  return lines;
 }
 function contours(t){
  const c=pressure.getContext('2d');c.clearRect(0,0,pressure.width,pressure.height);if(!current||!showPressure)return;
  const lines=current.lines??=pressureLines(current.air),labels=[];
  function stroke(line,points,alpha,label){
   if(alpha<=0)return;c.globalAlpha=alpha;c.strokeStyle='#b9e3f4';c.lineWidth=1.2;c.beginPath();let anchor,score=Infinity;
   points.forEach((point,i)=>{const p=map.latLngToContainerPoint(point);if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);
    if(p.x>16&&p.y>12&&p.x<pressure.width-16&&p.y<pressure.height-12){const s=(p.x-pressure.width*.5)**2+(p.y-pressure.height*.5)**2;if(s<score){score=s;anchor=p}}});
   if(line.closed)c.closePath();c.stroke();if(label&&anchor)labels.push([anchor,line.level,alpha]);
  }
  const a=current.air,b=previous?.air;
  const compatible=a&&b&&['x','y','nx','ny','dx','dy'].every(key=>a[key]===b[key]);
  const visible=compatible&&t<1?pressureLines(a,b,t):lines;
  for(const line of visible)stroke(line,line.points,1,true);
  c.font='9px Arial';c.textAlign='center';
  const placed=[];for(const [p,v,alpha] of labels){if(placed.some(q=>Math.abs(p.x-q.x)<29&&Math.abs(p.y-q.y)<13))continue;placed.push(p);c.globalAlpha=alpha*.72;c.fillStyle='#c6e8fa';c.beginPath();c.roundRect(p.x-12,p.y-6,24,11,5);c.fill();c.fillStyle='#183344';c.fillText(v,p.x,p.y+2.5)}
  c.globalAlpha=1;
 }
 function paint(t){if(!current)return;const c=base.getContext('2d'),w=base.width,h=base.height;
  c.clearRect(0,0,w,h);if(previous?.texture&&t<1){c.globalAlpha=1-t;c.drawImage(previous.texture,0,0,w,h);c.globalCompositeOperation='lighter';c.globalAlpha=t}
  c.drawImage(current.texture,0,0,w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  if(!current.id.startsWith('wind')){c.globalCompositeOperation='destination-in';c.drawImage(waterMask(),0,0);c.globalCompositeOperation='source-over'}
  const dots=symbols.getContext('2d');dots.clearRect(0,0,w,h);
  if(previous?.marks&&t<1){dots.globalAlpha=1-t;dots.drawImage(previous.marks,0,0)}
  dots.globalAlpha=previous?t:1;if(current.marks)dots.drawImage(current.marks,0,0);dots.globalAlpha=1;
  contours(t);
 }
 function animate(now){
  if(pane.hidden)return;anim=requestAnimationFrame(animate);if(!current||now-lastFrame<32)return;
  const dt=Math.min(65,now-lastFrame)/1000;lastFrame=now;
  if(previous){const f=Math.min(1,(now-started)/duration);fraction=f;
   if(now-lastPaint>90||f===1){paint(fraction);lastPaint=now}if(f===1)previous=null}
  if(editing!==null||!moving||!current.layer.vector)return;
  const c=flow.getContext('2d'),w=flow.width,h=flow.height;c.globalCompositeOperation='destination-in';c.fillStyle='rgba(0,0,0,.94)';c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';
  c.strokeStyle='rgba(248,252,255,.77)';c.lineWidth=.85;c.beginPath();
  for(const p of particles){const x=p[0],y=p[1],k=(Math.floor(y/4)*current.width+Math.floor(x/4))*2;
   let u=current.velocity[k],v=current.velocity[k+1];
   if(previous&&Number.isFinite(previous.velocity[k])&&Number.isFinite(u)){
    const a=previous.velocity[k],b=previous.velocity[k+1],before=Math.hypot(a,b),after=Math.hypot(u,v);
    if(before>0&&after>0){
     const angle=Math.atan2(b,a)+fraction*Math.atan2(a*v-b*u,a*u+b*v);
     const speed=before+(after-before)*fraction;u=speed*Math.cos(angle);v=speed*Math.sin(angle);
    }else{u=a+(u-a)*fraction;v=b+(v-b)*fraction}
   }
   if(x<0||x>=w||y<0||y>=h||!Number.isFinite(u)||p[2]<=0||(!playing&&--p[2]<=0)){p[0]=Math.random()*w;p[1]=Math.random()*h;p[2]=65+Math.random()*55;continue}
   const magnitude=Math.hypot(u,v),ratio=Math.min(2,magnitude/current.layer.max),gain=current.id.startsWith('wind')?dt*.768*Math.expm1(3*Math.min(1,magnitude/75))/Math.expm1(3):dt*24*(.35+.85*Math.sqrt(ratio));
   p[0]+=gain*u;p[1]-=gain*v;
   if(current.layer.key==='inner'&&(!isSea(lons[Math.floor(x)],lats[Math.floor(y)])||!isSea(lons[Math.floor(p[0])],lats[Math.floor(p[1])]))){p[2]=0;continue}
   c.moveTo(x,y);c.lineTo(p[0],p[1]);
  }c.stroke();
 }
 async function move(n,smooth=true){const next=Math.max(0,Math.min(timeline().length-1,index+n));if(next===index)return;index=next;await update(smooth)}
 async function advance(token){
  if(!playing||token!==run)return;const line=timeline();
  if(index>=line.length-1||!line.slice(index+1).some(t=>t.value!=null)){stop();return}
  await move(1);if(playing&&token===run)timer=setTimeout(()=>advance(token),hold);
 }
 play.onclick=async()=>{if(playing){stop();return}closeEditor();const token=++run;playing=true;button(play,'Ⅱ','Pausar');
  if(!timeline().slice(index+1).some(t=>t.value!=null)){index=0;await update(false)}if(playing&&token===run)await advance(token)};
 for(const [attr,n,icon,title] of [['prev',-1,'◀◀','Período anterior'],['next',1,'▶▶','Período siguiente']]){
  const b=q('[data-'+attr+']');button(b,icon,title);b.onclick=()=>{stop();move(n)}}
 slider.oninput=()=>{stop();const i=+slider.value,smooth=Math.abs(i-index)===1;index=i;revision++;scrubTimer=setTimeout(()=>update(smooth),60)};
 function motionLabel(){button(q('.motion'),'≋',moving?'Pausar partículas':'Animar partículas',moving);q('.motion').innerHTML='<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-braces-asterisk" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C2.25 2 1.49 2.759 1.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6M14.886 7.9v.164c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456v-1.3c-1.114 0-1.49-.362-1.49-1.456V4.352C14.51 2.759 13.75 2 12.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6M7.5 11.5V9.207l-1.621 1.621-.707-.707L6.792 8.5H4.5v-1h2.293L5.172 5.879l.707-.707L7.5 6.792V4.5h1v2.293l1.621-1.621.707.707L9.208 7.5H11.5v1H9.207l1.621 1.621-.707.707L8.5 9.208V11.5z" /></svg>'}motionLabel();
 q('.motion').onclick=()=>{moving=!moving;motionLabel();if(!moving)flow.getContext('2d').clearRect(0,0,flow.width,flow.height)};
 const pressureToggle=q('.isobars');pressureToggle.onclick=()=>{showPressure=!showPressure;pressureToggle.setAttribute('aria-pressed',String(showPressure));contours(fraction)};
 function redraw(){if(!current||pane.hidden)return;size();previous=null;current.texture=texture(current);drawSymbols();paint(1)}
 const context=window.__CONTEXT_MENUS_V39;
 context.panels.clima=d;
 const tool=slot.firstChild;
 function reveal(){context.show('clima');tool.setAttribute('aria-expanded','true')}
 function toggle(open){
  stop();closeEditor();pane.hidden=!open;tool.setAttribute('aria-pressed',String(open));cancelAnimationFrame(anim);
  if(open){
   if(window.__FLOTA_V39?.state.active)window.__FLOTA_V39.deactivate();
   window.__V39_EXPLICIT_VIEW='clima';reveal();id='wind';checked.clear();map.on('moveend resize',redraw);menu();anim=requestAnimationFrame(animate)
  }else{context.close('clima');tool.setAttribute('aria-expanded','false');revision++;current=null;previous=null;flow.getContext('2d').clearRect(0,0,flow.width,flow.height);map.off('moveend resize',redraw)}
 }
 slot.parentElement.addEventListener('click',e=>{const other=e.target.closest('button.workspace-icon-v39');if(other&&other!==tool&&!pane.hidden)toggle(false)},true);
 tool.onclick=()=>{if(pane.hidden)toggle(true);else if(d.hidden||d.classList.contains('context-peek-v39'))reveal();else toggle(false)};
 q('[data-min]').onclick=()=>context.minimize('clima');
 q('[data-close]').onclick=()=>{stop();closeEditor();context.close('clima');tool.setAttribute('aria-expanded','false')};
 q('[data-clear]').onclick=()=>{
  stop();closeEditor();checked.clear();Object.keys(settings).forEach(k=>delete settings[k]);
  id='wind';period=bundle.publicView?'6 h':'Día';mode=bundle.publicView?'Actual':'Histórico';anchor=bundle.publicView?sets.air.analysisEnd:'2026-01-01';moving=true;motionLabel();showPressure=true;pressureToggle.setAttribute('aria-pressed','true');menu()
 };
 d.addEventListener('pointerenter',()=>d.classList.remove('context-concealed-v39'));
 d.addEventListener('pointerleave',()=>{if(d.classList.contains('context-peek-v39'))d.classList.add('context-concealed-v39')});
 d.addEventListener('focusin',()=>d.classList.remove('context-concealed-v39'));
}