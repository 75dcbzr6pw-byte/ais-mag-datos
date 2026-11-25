function clima(bundle,slot){
 /* Bootstrap Icons (braces-asterisk, moisture, cloud-sun-fill).
The MIT License (MIT)

Copyright (c) 2019-2024 The Bootstrap Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
 const {layers,coast}=bundle;
 const activeSets=()=>mode==='Actual'&&bundle.actualSets?bundle.actualSets:bundle.sets;
 const d=document.createElement('section');d.id='climaVista';d.className='workspace-panel-v39';d.hidden=true;
 d.innerHTML='<header class="workspace-head-v39"><h2>Clima</h2><div class="context-actions-v39"><button data-clear title="Restablecer parámetros de Clima" aria-label="Restablecer parámetros de Clima"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button><button data-min title="Minimizar hasta pasar el cursor" aria-label="Minimizar Clima">−</button><button data-close title="Cerrar menú de Clima" aria-label="Cerrar Clima">×</button></div></header><div class="clima-body"><div class="clima-bar"><div data-modes class="clima-modes"></div><div class="fleet-scale-buttons-v39" data-period></div><div class="clima-transport"><button data-prev></button><button data-play aria-label="Reproducir" title="Reproducir">▶</button><button data-next></button></div><div class="clima-options"><button class="motion"></button><button class="isobars" aria-pressed="true" aria-label="Isobaras de presión" title="Isobaras de presión"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2.2 3.1a.55.55 0 0 1 .55-.55h10.5a.55.55 0 0 1 0 1.1h-.55l-.85 1.7-.85-1.7h-.7l-.85 1.7-.85-1.7h-.7l-.85 1.7-.85-1.7h-.7l-.85 1.7-.85-1.7h-.7l-.85 1.7-.85-1.7h-.55a.55.55 0 0 1-.55-.55z"/></svg></button></div></div><div class="clima-time"><input type="range" min="0" step="1" value="0" aria-label="Línea de tiempo de Clima 2026"><div class="months"><span>Ene</span><span>Abr</span><span>Jul</span><span>Oct</span><span>Dic</span></div></div><div class="clima-readout"><output></output><span data-caption></span></div><figure><canvas data-chart width="340" height="90"></canvas></figure><div class="clima-fields" data-fields></div><div class="clima-legend"><div class="scale"><button data-end="0" title="Editar extremo inferior" aria-label="Editar extremo inferior"></button><button data-end="1" title="Editar extremo superior" aria-label="Editar extremo superior"></button><div class="clima-limits"><label>Mín. <input type="range" data-limit="0" aria-label="Mínimo de la escala"></label><label>Máx. <input type="range" data-limit="1" aria-label="Máximo de la escala"></label></div></div><div data-marks></div><div data-editor hidden><label>Color <input data-color type="color"></label><label>Opacidad <input data-opacity type="range" min="0" max="100"></label><output data-alpha></output><label>Modo de fusión <select data-blend><option value="normal">Normal</option><option value="multiply">Multiplicar</option><option value="screen">Trama</option><option value="overlay">Superponer</option><option value="darken">Oscurecer</option><option value="lighten">Aclarar</option><option value="soft-light">Luz suave</option><option value="hard-light">Luz fuerte</option><option value="color-dodge">Sobreexponer color</option><option value="color-burn">Subexponer color</option><option value="difference">Diferencia</option><option value="exclusion">Exclusión</option><option value="hue">Tono</option><option value="saturation">Saturación</option><option value="color">Color</option><option value="luminosity">Luminosidad</option></select></label><button data-done>Listo</button></div></div><small data-source></small></div>';document.body.append(d);
 const q=s=>d.querySelector(s),slider=q('.clima-time input'),play=q('[data-play]');
 const bio={no3:'#df7452',po4:'#9164d9',si:'#279aaa',chl:'#58a442'},checked=new Set();
 const pane=map.createPane('climaAmbiental');pane.style.cssText='z-index:350;pointer-events:none';pane.hidden=true;
 const canvas=()=>document.createElement('canvas');
 const base=canvas(),flow=canvas(),pressure=canvas(),symbols=canvas();
 const colorPane=map.createPane('climaColor');colorPane.style.cssText='z-index:349;pointer-events:none';colorPane.hidden=true;
 base.style.position='absolute';colorPane.append(base);
 for(const c of [flow,pressure,symbols]){c.style.position='absolute';pane.append(c)}
 const seaBits=bytes(coast.bits);
 function bytes(str){return Uint8Array.fromBase64?Uint8Array.fromBase64(str):Uint8Array.from(atob(str),s=>s.charCodeAt(0))}
 function isSea(lon,lat){if(!Number.isFinite(lon+lat))return false;const x=Math.round((lon-coast.west)/coast.step),y=Math.round((coast.north-lat)/coast.step);
  if(x<0||x>=coast.width||y<0||y>=coast.height)return false;
  const bit=y*coast.width+x;return !(seaBits[bit>>3]&(1<<(bit&7)))}
 let id='wind',mode='Histórico',period='Día',index=0,anchor=sessionStorage.getItem('clima-fecha')||new Date().toISOString().slice(0,13),revision=0,playing=false,timer,scrubTimer,run=0,anim=0;
 if(bundle.publicView||bundle.actualSets){mode='Actual';period='6 h'}
 let current=null,previous=null,started=0,fraction=1,moving=true,showPressure=true,editing=null;
 let lons=[],lats=[],particles=[],lastFrame=0,lastPaint=0;
 let hold=4200,duration=hold;const speed=document.createElement("select");speed.setAttribute("aria-label","Velocidad de reproducción");for(const n of [1,2,3,5])speed.add(new Option(n+"×",n));q(".clima-transport").append(speed);speed.onchange=()=>{hold=duration=4200/Number(speed.value)};const settings={},cache=new Map();
 const layer=()=>layers[id],timeline=()=>layer().views[mode][period];
 const marine=()=>id==='total'||id==='tide';
 const transportGlyphs={"Histórico": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-clock-history\" viewBox=\"0 0 16 16\">\n  <path d=\"M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z\"/>\n  <path d=\"M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z\"/>\n  <path d=\"M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5\"/>\n</svg>", "Actual": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-calendar-week\" viewBox=\"0 0 16 16\">\n  <path d=\"M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z\"/>\n  <path d=\"M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z\"/>\n</svg>", "◀◀": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-rewind-btn-fill\" viewBox=\"0 0 16 16\">\n  <path d=\"M0 4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2m7.729 1.055A.5.5 0 0 1 8 5.5v1.886l3.21-2.293A.5.5 0 0 1 12 5.5v5a.5.5 0 0 1-.79.407L8 8.614V10.5a.5.5 0 0 1-.79.407l-3.5-2.5a.5.5 0 0 1 0-.814l3.5-2.5a.5.5 0 0 1 .519-.038\"/>\n</svg>", "▶": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-play-btn-fill\" viewBox=\"0 0 16 16\">\n  <path d=\"M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2m6.79-6.907A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z\"/>\n</svg>", "Ⅱ": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-pause-btn-fill\" viewBox=\"0 0 16 16\">\n  <path d=\"M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2m6.25-7C5.56 5 5 5.56 5 6.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C7.5 5.56 6.94 5 6.25 5m3.5 0c-.69 0-1.25.56-1.25 1.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C11 5.56 10.44 5 9.75 5\"/>\n</svg>", "▶▶": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-fast-forward-btn-fill\" viewBox=\"0 0 16 16\">\n  <path d=\"M0 4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2m4.271 1.055a.5.5 0 0 1 .52.038L8 7.386V5.5a.5.5 0 0 1 .79-.407l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 8 10.5V8.614l-3.21 2.293A.5.5 0 0 1 4 10.5v-5a.5.5 0 0 1 .271-.445\"/>\n</svg>", "≋": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" viewBox=\"0 0 16 16\"><path fill-rule=\"evenodd\" d=\"M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm4.65 1.1a.65.65 0 0 1 .65-.65h6.4a.65.65 0 0 1 0 1.3H5.3a.65.65 0 0 1-.65-.65zm-1.15 2.9a.65.65 0 0 1 .65-.65h6.1a.65.65 0 0 1 0 1.3H4.15A.65.65 0 0 1 3.5 8zm1.8 2.9a.65.65 0 0 1 .65-.65h4.8a.65.65 0 0 1 0 1.3h-4.8a.65.65 0 0 1-.65-.65z\"/></svg>"};
 function button(el,icon,title,active){if(transportGlyphs[icon])el.innerHTML=transportGlyphs[icon];else el.textContent=icon;el.title=title;el.setAttribute('aria-label',title);if(active!=null)el.setAttribute('aria-pressed',String(active))}
 function options(host,items,selected,onClick){const group=q(host);group.replaceChildren();
  for(const text of items){const b=document.createElement('button');button(b,text,text,text===selected);b.onclick=()=>onClick(text);group.append(b)}}
 function stop(){run++;playing=false;clearTimeout(timer);clearTimeout(scrubTimer);button(play,'▶','Reproducir')}
 function closeEditor(){editing=null;q('[data-editor]').hidden=true}
 let imageMode=false,mosaic=false;
 let bioOpen=false,argoOn=false;
 const stationPane=map.createPane('climaEstaciones');stationPane.style.cssText='pointer-events:none';stationPane.style.zIndex=String(Math.max(649,Number(map.getPane('rnaPointHitV52')&&getComputedStyle(map.getPane('rnaPointHitV52')).zIndex)||0)+1);
 function glassPoint(size,color){
  return L.divIcon({className:'clima-hit',iconSize:[26,26],iconAnchor:[13,13],html:'<i class="clima-glass-dot" style="width:'+size+'px;height:'+size+'px;--tint:'+color+'"></i>'})
 }
 function detailBox(){let box=q('[data-estacion]');if(!box){box=document.createElement('section');box.dataset.estacion='';q('.clima-body').append(box)}context.show('clima');box.scrollIntoView({block:'nearest'});return box}

 // Own station activation before other module handlers on the map container.
 const hitMarkers=new WeakMap();
 function registerHit(marker){const el=marker.getElement();if(el)hitMarkers.set(el,marker)}
 stationPane.addEventListener('click',e=>{const marker=hitMarkers.get(e.target.closest('.leaflet-marker-icon'));if(marker){e.stopPropagation();marker.fire('click',{originalEvent:e,latlng:marker.getLatLng()})}},true);
 const floats=L.layerGroup(),markers=new Map();let tracks=[],trackStart=0,lastBase='wind';
 function moveFloats(now){if(!argoOn||!tracks.length)return;
  const f=Math.min(1,Math.max(0,(now-trackStart)/duration)),t=f*f*(3-2*f);
  for(const [m,a,b] of tracks)m.setLatLng([a.lat+(b[0]-a.lat)*t,a.lng+(b[1]-a.lng)*t]);
  if(f===1)tracks=[];
 }
 function showFloats(stamp,smooth=false){
  tracks=[];if(!argoOn){floats.clearLayers();markers.clear();return}
  const end=Date.parse(stamp.length===13?stamp+':00Z':stamp.slice(0,10)),recent=new Map(),following=new Map();
  const dayTime=day=>Date.parse(day.slice(0,4)+'-'+day.slice(4,6)+'-'+day.slice(6));
  for(const row of bundle.argo||[]){
   const [file,day]=row,date=dayTime(day),wmo=file.split('/')[1];
   if(date>end){if(!following.has(wmo)||day<following.get(wmo)[1])following.set(wmo,row);continue}
   if(end-date>=30*86400000)continue;
   if(!recent.has(wmo)||day>recent.get(wmo)[1])recent.set(wmo,row);
  }
  for(const [wmo,m] of markers)if(!recent.has(wmo)){floats.removeLayer(m);markers.delete(wmo)}
  trackStart=performance.now();
  for(const [wmo,[file,day,lat,lon,agency]] of recent){
   let m=markers.get(wmo);if(!m){m=L.marker([lat,lon],{pane:'climaEstaciones',icon:glassPoint(11,'#9bb9c4'),title:'Boya Argo '+wmo}).addTo(floats);markers.set(wmo,m)}
   let target=[lat,lon];
   const next=following.get(wmo),start=dayTime(day),gap=next?dayTime(next[1])-start:Infinity;
   if(next&&gap<=30*86400000){
    const t=(end-start)/gap;target=[lat+(next[2]-lat)*t,lon+(next[3]-lon)*t];
   }
   const a=m.getLatLng();if(smooth&&(a.lat!==target[0]||a.lng!==target[1]))tracks.push([m,a,target]);else m.setLatLng(target);
   const reading=bundle.argoReadings?.[file],level=id==='salt'?2:id==='temp'?1:0,r=style().range;
   const near=reading&&level&&reading[0]<=10&&end-dayTime(day)<86400000;
   const col=near?palette()[Math.max(0,Math.min(127,Math.round(127*(reading[level]-r[0])/(r[1]-r[0]))))]:null;
   const tint=col?'rgb('+col.slice(0,3).join(',')+')':'#9bb9c4';if(m.tint!==tint){m.setIcon(glassPoint(12,tint));m.tint=tint}

   if(m.profileFile===file)continue;
   m.profileFile=file;
   const obs=bundle.argoReadings?.[file];
   const values=obs?'Lectura válida más somera · '+format(obs[0],1)+' dbar<br>Temperatura: '+format(obs[1],2)+' °C · Salinidad: '+format(obs[2],3)+' PSU':'Sin lectura de contraste validada';
   const units={DOXY:['Oxígeno','µmol/kg'],CHLA:['Clorofila','mg/m³'],NITRATE:['Nitrato','µmol/kg'],PH_IN_SITU_TOTAL:['pH','']};
   const extra=Object.entries(bundle.argoBGC?.[file]||{}).map(([key,[depth,value]])=>'<br>'+units[key][0]+' '+format(value,3)+' '+units[key][1]+' a '+format(depth,1)+' dbar').join('');
   const html='Argo '+wmo+' · '+agency+'<br>'+day.slice(6)+'-'+day.slice(4,6)+'-'+day.slice(0,4)+' · posición reportada '+format(lat,3)+', '+format(lon,3)+'<br>Movimiento interpolado entre perfiles. <br>'+values+extra+'<br><a target="_blank" rel="noopener" href="https://data-argo.ifremer.fr/dac/'+encodeURI(file)+'">Perfil vertical GDAC</a>';
   m.bindPopup(html,{className:"clima-popup"});if(!m.stationClick){m.stationClick=()=>{detailBox().innerHTML=m.getPopup().getContent()};m.on("click",m.stationClick)}m.bindTooltip("Argo "+wmo+" · "+(obs?format(obs[1],2)+" °C":"Sin lectura validada"));
   if(m.compareProfile)m.off('popupopen',m.compareProfile);
   m.compareProfile=async()=>{
    const when=day.slice(0,4)+'-'+day.slice(4,6)+'-'+day.slice(6);
    const values=await Promise.all(['temp','salt'].map(async key=>{
     const f=await average(layers[key].key,[when]);if(!f)return;
     const v=sample({id:key,layer:layers[key],field:f},lon,lat);
     if(v)return layers[key].title+' '+format(v[2],2)+' '+layers[key].unit;
    }));
    if(m.isPopupOpen()&&m.getPopup().getContent()===html)m.setPopupContent(html+'<br>Modelo superficial del día: '+(values.filter(Boolean).join(' · ')||'sin cobertura'));
   };m.on('popupopen',m.compareProfile);

  }
  floats.addTo(map);markers.forEach(registerHit);
 }
 const riverGroup=L.layerGroup();let riverOn=false;
 const outlets=(bundle.flow||[]).filter(site=>site.id!==12072);
 const discharges=outlets.flatMap(site=>site.monthly).filter(Number.isFinite);
 const lowFlow=Math.min(...discharges),highFlow=Math.max(...discharges);
 const plume=canvas(),plumeColor=canvas(),routes=new Map();let plumeTracks=[],riverMonth=0,plumeTime=0;
 plumeColor.dataset.flowColor='';plume.dataset.flowParticles='';
 for(const c of [plumeColor,plume]){c.style.position='absolute';pane.insertBefore(c,pressure)}
 function outletRoutes(site){
  if(routes.has(site.id))return routes.get(site.id);
  const kmLat=111.2,kmLon=kmLat*Math.cos(site.lat*Math.PI/180),step=coast.step*kmLon*.65;
  function at(origin,angle,km){return [origin[0]+Math.sin(angle)*km/kmLat,origin[1]+Math.cos(angle)*km/kmLon]}
  const wet=pt=>isSea(pt[1],pt[0]);
  let source=[site.lat,site.lon];
  if(!wet(source)){
   let found;
   for(let r=step;r<=6&&!found;r+=step)for(let i=0;i<64&&!found;i++){
    const candidate=at(source,i*Math.PI/32,r);if(wet(candidate))found=candidate;
   }
   if(!found){routes.set(site.id,[]);return []}source=found;
  }
  const directions=[];
  for(let i=0;i<64;i++){
   const angle=i*Math.PI/32;let length=0,back=0;
   for(let r=step;r<16&&wet(at(source,angle,r));r+=step)length=r;
   for(let r=step;r<4&&wet(at(source,angle+Math.PI,r));r+=step)back=r;
   directions.push({angle,length,score:length/(1+back)});
  }
  const best=directions.reduce((a,b)=>a.score>b.score?a:b);
  const rays=directions.filter(v=>Math.cos(v.angle-best.angle)>.83&&v.length>step)
   .map(v=>({start:source,end:at(source,v.angle,v.length),length:v.length}));
  routes.set(site.id,rays);return rays;
 }
 function preparePlumes(){
  plumeTracks=[];
  const origin=map.containerPointToLayerPoint([0,0]),sz=map.getSize();
  for(const c of [plumeColor,plume]){L.DomUtil.setPosition(c,origin);c.width=sz.x;c.height=sz.y;c.hidden=!riverOn}
  if(!riverOn)return;
  const ctx=plumeColor.getContext('2d');
  for(const site of outlets){
   const value=site.monthly[riverMonth];if(!Number.isFinite(value))continue;
   const strength=Math.log1p((value-lowFlow)/25)/Math.log1p((highFlow-lowFlow)/25);
   const hue=220*(1-strength),color=id==='salt'?style().colors[0]:'hsl('+hue+' 88% 54%)';
   for(const ray of outletRoutes(site)){
    const a=map.latLngToContainerPoint(ray.start),b=map.latLngToContainerPoint(ray.end);
    const reach=Math.min(1,(1+15*strength)/ray.length),dx=(b.x-a.x)*reach,dy=(b.y-a.y)*reach;
    if(Math.max(a.x,a.x+dx)<-5||Math.min(a.x,a.x+dx)>sz.x+5||Math.max(a.y,a.y+dy)<-5||Math.min(a.y,a.y+dy)>sz.y+5)continue;
    const length=Math.hypot(dx,dy);if(length<1)continue;
    const grad=ctx.createLinearGradient(a.x,a.y,a.x+dx,a.y+dy);
    grad.addColorStop(0,color);grad.addColorStop(1,'transparent');
    ctx.strokeStyle=grad;ctx.lineWidth=Math.max(2,length*.13);ctx.globalAlpha=.65;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+dx,a.y+dy);ctx.stroke();
    plumeTracks.push({a,dx,dy,length,speed:3+25*strength,phase:(site.id*.618+ray.end[0]*13)%1});
   }
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.drawImage(waterMask(),0,0);
 }
 function animatePlumes(dt){
  if(!riverOn)return;
  const ctx=plume.getContext('2d');ctx.clearRect(0,0,plume.width,plume.height);
  if(!moving||editing!==null)return;
  plumeTime+=dt;ctx.lineWidth=1.25;ctx.strokeStyle='rgba(255,255,255,.88)';ctx.beginPath();
  for(const r of plumeTracks){
   const t=((r.phase+plumeTime*r.speed/r.length)%1+1)%1;
   const tail=Math.max(0,t-Math.min(.12,4/r.length));
   ctx.moveTo(r.a.x+r.dx*tail,r.a.y+r.dy*tail);ctx.lineTo(r.a.x+r.dx*t,r.a.y+r.dy*t);
  }
  ctx.stroke();ctx.globalCompositeOperation='destination-in';ctx.drawImage(waterMask(),0,0);ctx.globalCompositeOperation='source-over';
 }
 function drawRivers(stamp){
  riverGroup.clearLayers();riverGroup.remove();
  if(!riverOn){plume.hidden=plumeColor.hidden=true;return}
  riverGroup.addTo(map);
  const month=riverMonth=Number(stamp.slice(5,7))-1;
  for(const site of bundle.flow||[]){
   const value=site.monthly[month];if(!Number.isFinite(value))continue;
   const card=document.createElement('div');
   card.textContent='FLOW · '+(site.name==='S/N'?'Salida '+site.id:site.name)+' · Media histórica del mes '+(month+1)+': '+format(value,2)+' m³/s · Caudal simulado por VIC';
   if(site.id===12072)continue;
   L.marker([site.lat,site.lon],{pane:'climaEstaciones',title:'FLOW · '+site.id,icon:glassPoint(9,'#7eafb7')}).bindTooltip(card.textContent).on('click',()=>detailBox().replaceChildren(card)).on('add',function(){registerHit(this)}).addTo(riverGroup)

  }
 }
 const metGroup=L.layerGroup();
 let metOn=false;
 function drawMet(stamp){
  metGroup.clearLayers();
  if(!metOn){metGroup.remove();return}
  metGroup.addTo(map);
  const end=Date.parse(stamp.length===10?stamp+'T23:59:59Z':stamp.slice(0,13)+':00Z');
  const occupied=[];
  for(const site of bundle.redmet||[]){
   const values={};
   for(const day of site.days)for(const [key,reading] of Object.entries(day)){
    if(reading[0]<=end&&(!values[key]||reading[0]>values[key][0]))values[key]=reading;
   }
   const direction=values.WindDirection;
   const hasWind=direction&&end-direction[0]<86400000&&Number.isFinite(direction[1]);
   const alternative=['Temperature','DailyMaximum','RH','Pressure','Rain'].map(key=>values[key]).find(Boolean);
   const symbol=hasWind?'↑':'●';
   const speed=values.WindSpeed, fresh=speed&&end-speed[0]<86400000, kmh=fresh?speed[1]*3.6:null;
   const range=id.startsWith('wind')?style().range:[0,75],scaled=fresh?Math.max(0,Math.min(127,Math.round(127*(kmh-range[0])/(range[1]-range[0])))):null;
   const bg=scaled===null?'#426271':id.startsWith('wind')?'rgb('+palette()[scaled].slice(0,3).join(',')+')':['#244c7d','#257e91','#37964c','#a0a442','#c17848','#b74862'][Math.min(5,Math.floor(scaled*6/128))];
   const screen=map.latLngToLayerPoint([site.lat,site.lon]);let offset=0;
   while(occupied.some(p=>Math.abs(p.x-screen.x)<53&&Math.abs(p.y-screen.y-offset)<18))offset+=20;
   occupied.push({x:screen.x,y:screen.y+offset});
   const icon=L.divIcon({className:'',iconSize:[50,20],iconAnchor:[25,10-offset],html:'<span style="display:flex;box-sizing:border-box;width:50px;height:20px;justify-content:space-between;padding-inline:5px;font-variant-numeric:tabular-nums;align-items:center;gap:3px;border-radius:8px;font-size:10px;padding:1px 3px;color:white;border:1px solid #ffffff8c;backdrop-filter:blur(5px);background:color-mix(in srgb,'+bg+' 35%,#26384199);font-weight:bold"><b style="transform:rotate('+(hasWind?direction[1]+180:0)+'deg)">'+symbol+'</b>'+(speed?Math.round(speed[1]*3.6)+(fresh?'':'*'):alternative?Math.round(alternative[1])+({'°C':'°','hPa':'','%':'%','mm':'㎜'}[alternative[2]]||''):'s/d')+'</span>'});
   const marker=L.marker([site.lat,site.lon],{icon,pane:'climaEstaciones',title:(site.source||'REDMET')+' · '+site.name}).addTo(metGroup);registerHit(marker);
   const card=document.createElement('div'),title=document.createElement('strong');title.textContent=(site.source||'REDMET')+' · '+site.name+(site.source==='DMC'?' · Hora del resumen UTC':'');card.append(title);
   const labels={DailyMaximum:'Máxima diaria del aire',WindDirection:'Viento desde',WindSpeed:'Viento',GustSpeed:'Ráfaga',Temperature:'Temperatura del aire',RH:'Humedad relativa',Rain:'Precipitación',Pressure:'Presión',DewPoint:'Punto de rocío',SolarRadiation:'Radiación solar',PAR:'Radiación PAR'};
   for(const [key,[time,value,unit]] of Object.entries(values)){
    const d=new Date(time).toISOString(),line=document.createElement('div');
    line.textContent=(labels[key]||key)+' · '+format(value,2)+' '+unit+' · '+d.slice(8,10)+'-'+d.slice(5,7)+'-'+d.slice(0,4)+(key==='DailyMaximum'?'':' '+d.slice(11,16)+' UTC');card.append(line)
   }
   if(!Object.keys(values).length)card.append(document.createElement('br'),'Sin lectura archivada para esta fecha');
   marker.bindTooltip(site.name+' · '+(speed?Math.round(speed[1]*3.6)+' km/h · '+new Date(speed[0]).toLocaleDateString('es-CL',{timeZone:'UTC'})+(fresh?'':' · última lectura anterior'):alternative?(alternative===values.DailyMaximum?'Máxima diaria · ':'')+format(alternative[1],1)+' '+alternative[2]+' · '+new Date(alternative[0]).toLocaleDateString('es-CL',{timeZone:'UTC'}):'Sin lectura registrada a esta fecha'));
   marker.on('click',()=>{let panel=q('[data-estacion]');if(!panel){panel=document.createElement('section');panel.dataset.estacion='';d.querySelector('.clima-body').append(panel)}panel.replaceChildren(card);
    const choose=document.createElement('select');choose.ariaLabel='Serie histórica de la estación';for(const key of Object.keys(values))choose.add(new Option(labels[key]||key,key));panel.append(choose);
    const chart=document.createElement('canvas');chart.width=310;chart.height=70;panel.append(chart);
    const plot=()=>{const rows=site.days.map(day=>day[choose.value]).filter(r=>r&&r[0]<=end);const ctx=chart.getContext('2d');ctx.clearRect(0,0,310,70);if(!rows.length)return;const ys=rows.map(r=>r[1]),min=Math.min(...ys),max=Math.max(...ys);ctx.strokeStyle='#32a8bd';ctx.beginPath();rows.forEach(([x,y],i)=>{const px=5+300*(x-rows[0][0])/Math.max(1,rows.at(-1)[0]-rows[0][0]),py=49-45*(y-min)/Math.max(.001,max-min);if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py)});ctx.stroke();ctx.fillStyle=getComputedStyle(d).color;ctx.fillText(new Date(rows[0][0]).toLocaleDateString('es-CL')+' — '+new Date(rows.at(-1)[0]).toLocaleDateString('es-CL')+' · '+format(min,1)+'–'+format(max,1)+' '+rows[0][2],5,65)};choose.onchange=plot;plot();context.show('clima');panel.scrollIntoView({block:'nearest'})})
  }
 }
 function detailKey(l,stamps){return l.native&&stamps.every(t=>t>=l.native.start&&t<=l.native.end)?l.native.key:l.detail}
 function menu(){
  const views=layer().views[mode];if(id==='chl'&&imageMode)period='Imágenes';if(!views[period])period=mode==='Actual'?(Object.keys(views).find(k=>k.endsWith(' h'))||'Día'):'Día';
  const line=timeline();const parse=s=>Date.parse(s.length===13?s+':00Z':s);
  let nearest=Infinity;index=0;
  line.forEach((row,i)=>{if(row.value==null)return;for(const stamp of row.stamps){const delta=Math.abs(parse(stamp)-parse(anchor));if(delta<nearest){nearest=delta;index=i}}});
  options('[data-modes]',Object.keys(layer().views),mode,v=>{stop();closeEditor();mode=v;period=v==='Actual'?(Object.keys(layer().views.Actual).find(k=>k.endsWith(' h'))||'Día'):'Día';menu()});
  q('[data-modes]').lastChild.title='Últimos 15 días del archivo regional y pronóstico disponible';
  const hourly=Object.keys(views).find(k=>k.endsWith(' h'));
  options('[data-period]',['Mes','Semana','Día','Hora'],period.endsWith(' h')?'Hora':period,v=>{stop();imageMode=false;period=v==='Hora'?hourly:v;menu()});
  const hour=q('[data-period]').lastChild;hour.disabled=!hourly;hour.title=hourly?'Lecturas cada '+hourly:'Sin lecturas intradiarias en esta vista';
  const fields=q('[data-fields]');fields.replaceChildren();
  const choices=document.createElement('div');choices.style.cssText='grid-column:1/-1;display:flex;gap:4px;flex-wrap:wrap';
  const clearBio=document.createElement('button');clearBio.textContent='Desactivar Bio';clearBio.disabled=!checked.size;clearBio.onclick=()=>{checked.clear();bioOpen=false;select(id in bio?lastBase:id)};choices.append(clearBio);
  for(const key of Object.keys(layers)){
   if(key in bio){
    if(key==='no3'){const b=document.createElement('button');b.textContent='Bio';b.setAttribute('aria-pressed',String(checked.size>0));b.setAttribute('aria-expanded',bioOpen);b.onclick=()=>{bioOpen=!bioOpen;choices.style.display=bioOpen?'flex':'none';b.setAttribute('aria-expanded',bioOpen)};fields.append(b)}
    const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=checked.has(key);
    check.onchange=()=>{if(check.checked){checked.add(key);select(id==='mixed'?id:key)}else{checked.delete(key);select(id===key?[...checked].at(-1)||lastBase:id)}};
    label.style.color=bio[key];label.append(check,layers[key].title);choices.append(label);
   }else{const b=document.createElement('button');button(b,layers[key].title,layers[key].title,key===id);b.onclick=()=>select(key);fields.append(b)}
  }
  if(id==='chl'){const controls=document.createElement('div');controls.style.gridColumn='1/-1';
   for(const [title,rolling] of [['Imagen a imagen',false],['Últimas 10 imágenes',true]]){const b=document.createElement('button');button(b,title,title,imageMode&&mosaic===rolling);b.onclick=()=>{stop();imageMode=true;mosaic=rolling;menu()};controls.append(b)}fields.append(controls)}
  const riverButton=document.createElement('button');button(riverButton,'FLOW','Caudal de las desembocaduras',riverOn);fields.append(riverButton);
  const note=document.createElement('small');note.style.gridColumn='1/-1';note.hidden=!riverOn;
  note.textContent='FLOW · Media histórica mensual · '+format(lowFlow,2)+'–'+format(highFlow,2)+' m³/s · '+(id==='salt'?'Tono de salinidad baja: influencia estimada de agua dulce. La lectura en PSU es de Copernicus.':'Azul a rojo: caudal creciente en escala logarítmica.');
  fields.append(note);
  riverButton.onclick=()=>{riverOn=!riverOn;riverButton.setAttribute('aria-pressed',String(riverOn));note.hidden=!riverOn;q('.motion').disabled=!riverOn&&!layer().vector;drawRivers(timeline()[index].stamps.at(-1));size();preparePlumes()};
  fields.append(choices);choices.style.display=bioOpen?'flex':'none';
  q('.motion').disabled=!riverOn&&!layer().vector;slider.max=line.length-1;slider.value=index;
  legend();update(false);
 }
 function select(key){stop();closeEditor();if(!(key in bio))lastBase=key;id=key;imageMode=key==='chl';menu()}
 const format=(n,dec=1)=>n.toLocaleString('es-CL',{maximumFractionDigits:dec});
 function style(){return settings[id]??={blend:'normal',range:[layer().min,marine()?Math.round(layer().max*1.94384)/1.94384:layer().max],colors:['#244c7d','#b74862'],alpha:id.startsWith('wind')?[15,55]:[65,78]}}
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
 function legend(){colorPane.style.mixBlendMode=style().blend;const l=layer(),p=palette(),unit=marine()?'kt':l.unit,f=marine()?1.94384:1;
  const [lo,hi]=style().range,lower=Math.round(l.min*f),upper=Math.max(lower+1,Math.round(l.max*f));
  const position=v=>100*(v*f-lower)/(upper-lower);
  const split=(position(lo)+position(hi))/2,bar=q('.scale');
  bar.style.backgroundImage='repeating-linear-gradient(90deg,transparent 0,transparent calc(20% - 1px),rgba(255,255,255,.36) calc(20% - 1px),rgba(255,255,255,.36) 20%),linear-gradient(90deg,'+[0,25,51,76,102,127].map(i=>'rgb('+p[i].slice(0,3).join(',')+') '+position(lo+(hi-lo)*i/127)+'%').join(',')+')';
  q('[data-end="0"]').style.width=split+'%';q('[data-end="1"]').style.width=(100-split)+'%';
  for(const input of d.querySelectorAll('[data-limit]')){
   const end=Number(input.dataset.limit);
   input.min=Math.round(l.min*f);input.max=Math.max(+input.min+1,Math.round(l.max*f));input.step=1;input.value=Math.round((end?hi:lo)*f);
   input.title=(end?'Máximo ':'Mínimo ')+format((end?hi:lo)*f,2)+' '+unit;input.setAttribute('aria-valuetext',input.title);
  }
  const marks=q('[data-marks]');marks.replaceChildren();
  for(let i=0;i<6;i++){const n=document.createElement('span');n.textContent=(i===5&&id.startsWith('wind')?'≥':'')+format(lower+(upper-lower)*i/5,2)+(i===5?' '+unit:'');marks.append(n)}
 }
 for(const input of d.querySelectorAll('[data-limit]'))input.oninput=()=>{
  const end=Number(input.dataset.limit),range=style().range,factor=marine()?1.94384:1,step=1/factor;
  range[end]=end?Math.max(+input.value/factor,range[0]+step):Math.min(+input.value/factor,range[1]-step);
  legend();cancelAnimationFrame(recolorFrame);recolorFrame=requestAnimationFrame(()=>{
   if(current?.id!==id)return;current.texture=texture(current,true);
   if(previous?.id===id)previous.texture=texture(previous,true);paint(previous?fraction:1);
  })
 };
 for(const b of d.querySelectorAll('[data-end]'))b.onclick=()=>{stop();editing=+b.dataset.end;const st=style();q('[data-editor]').hidden=false;q('[data-blend]').value=st.blend;q('[data-color]').value=st.colors[editing];q('[data-opacity]').value=st.alpha[editing];q('[data-alpha]').value=st.alpha[editing]+' %';q('[data-color]').focus()};
 q('[data-done]').onclick=closeEditor;d.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing!==null)closeEditor()});
 let recolorFrame=0;
 function applyColor(){const st=style();st.colors[editing]=q('[data-color]').value;st.alpha[editing]=+q('[data-opacity]').value;q('[data-alpha]').value=st.alpha[editing]+' %';legend();cancelAnimationFrame(recolorFrame);recolorFrame=requestAnimationFrame(()=>{if(current&&!pane.hidden){previous=null;current.texture=texture(current,true);paint(1)}})}
 q('[data-blend]').onchange=e=>{style().blend=e.target.value;colorPane.style.mixBlendMode=style().blend};
 q('[data-color]').oninput=applyColor;q('[data-opacity]').oninput=applyColor;
 function chart(c=q('[data-chart]'),line=timeline(),indexAt=index,chartMode=mode,marks=q('.months')){
  const l=layer(),ctx=c.getContext('2d'),w=c.width,h=c.height;
  c.title=l.referenceTitle;c.setAttribute('aria-label',l.title+' · '+l.referenceTitle);ctx.clearRect(0,0,w,h);
  const values=line.flatMap(t=>[t.value,t.ref]).filter(Number.isFinite);if(!values.length)return;
  const lo=Math.min(...values),hi=Math.max(...values),x=i=>34+i*(w-46)/Math.max(1,line.length-1),y=v=>8+(hi-v)/(hi-lo||1)*(h-26);
  ctx.font='10px Arial';ctx.fillStyle=getComputedStyle(c).color;ctx.fillText(format(hi),1,13);ctx.fillText(format(lo),1,h-13);
  for(const key of ['ref','value']){ctx.strokeStyle=key==='ref'?'#899599':'#219eb0';ctx.setLineDash(key==='ref'?[4,3]:[]);ctx.beginPath();let first=true;
   line.forEach((t,i)=>{if(t[key]==null){first=true;return}if(first)ctx.moveTo(x(i),y(t[key]));else ctx.lineTo(x(i),y(t[key]));first=false});ctx.stroke()}
  ctx.setLineDash([]);ctx.strokeStyle='#be824c';ctx.beginPath();ctx.moveTo(x(indexAt),2);ctx.lineTo(x(indexAt),h-12);ctx.stroke();
  if(line[indexAt].value!=null){ctx.fillStyle='#219eb0';ctx.beginPath();ctx.arc(x(indexAt),y(line[indexAt].value),3,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle=getComputedStyle(c).color;marks?.replaceChildren();
  for(const i of new Set([0,.25,.5,.75,1].map(f=>Math.round(f*(line.length-1))))){const stamp=line[i].stamps[0],date=new Date(stamp.slice(0,10)+'T12:00Z');
   const text=date.toLocaleDateString('es-CL',chartMode==='Histórico'?{month:'short'}:{month:'short',day:'numeric'});ctx.fillText(text,Math.min(w-28,x(i)),h-1);const s=document.createElement('span');s.textContent=text;marks?.append(s)}
 }
 async function decoded(raw){const stream=new Blob([bytes(raw)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Int16Array(await new Response(stream).arrayBuffer())}
 async function average(key,stamps,latest=false){
  const sets=activeSets(),view=mode;
  if(view==='Actual'&&bundle.loadActualDays)await bundle.loadActualDays(stamps);
  if(key==='air'&&view==='Histórico')stamps=stamps.filter(t=>t.slice(0,10)<=sets.air.analysisEnd);
  if(bundle.loadDays)await bundle.loadDays(stamps);
  const set=sets[key],n=set.x.length*set.y.length,ids=stamps.filter(t=>(t.includes('T')?set.recent:set.days)?.[t]);
  if(!ids.length)return null;
  const token=[view,latest,key,ids[0],ids.at(-1),ids.length].join('|');if(cache.has(token))return cache.get(token);
  const promise=(async()=>{let sums,count;
   for(const t of ids){
    const a=await decoded((t.includes('T')?set.recent:set.days)[t]);
    sums??=new Float32Array(a.length);count??=new Uint16Array(a.length);
    for(let k=0;k<a.length;k++)if(a[k]!==-32768){if(latest){sums[k]=a[k];count[k]=1}else{sums[k]+=a[k];count[k]++}}
   }
   for(let k=0;k<sums.length;k++)sums[k]=count[k]?sums[k]/count[k]:NaN;
   return {a:sums,n,nx:set.x.length,ny:set.y.length,x:set.x[0],y:set.y[0],dx:set.x[1]-set.x[0],dy:set.y[1]-set.y[0],count:ids.length};
  })();cache.set(token,promise);if(cache.size>16)cache.delete(cache.keys().next().value);return promise;
 }
 async function airAt(stamps){
  if(stamps.length!==1||!stamps[0].includes('T'))return average('air',stamps);
  const time=Date.parse(stamps[0]+':00:00Z'),step=6*3600000,lower=Math.floor(time/step)*step;
  if(time===lower)return average('air',stamps);
  const fields=await Promise.all([lower,lower+step].map(value=>average('air',[new Date(value).toISOString().slice(0,13)])));
  if(!fields[0]||!fields[1])return null;
  const [a,b]=fields,w=(time-lower)/step;
  return {...a,a:a.a.map((v,i)=>v+(b.a[i]-v)*w)};
 }
 async function update(smooth,linkedRow){
  const sets=activeSets(),ticket=++revision,t=linkedRow||timeline()[index],l=layer();slider.value=index;
  const stamp=(period==='Semana'?'Semana del ':'')+(period==='Mes'?t.stamps[0]:t.key).replace(/^(\d{4})-(\d{2})-(\d{2})/,'$3-$2-$1').replace('T',' ')+(period.endsWith(' h')?':00 UTC':'');
  q('.clima-readout output').textContent=stamp+(l.key==='air'&&mode==='Actual'&&t.stamps.at(-1).slice(0,10)>sets.air.analysisEnd?' · Pronóstico':'');slider.setAttribute('aria-valuetext',stamp);q('[data-caption]').textContent=l.title+' · '+(t.value==null?'Sin datos':format(t.value,2)+' '+l.unit);chart();
  if(pane.hidden)return;showFloats(t.stamps.at(-1),smooth);drawMet(t.stamps.at(-1));drawRivers(t.stamps.at(-1));
  const images=id==='chl'&&period==='Imágenes',frames=images&&mosaic?timeline().slice(Math.max(0,index-9),index+1).map(row=>row.key):t.stamps;
  const bioDates=[...new Set(t.stamps.map(stamp=>stamp.slice(0,10)))];
  const detailName=images?null:detailKey(l,t.stamps);
  const [field,outer,air,overlays,detail]=await Promise.all([images?average('chlNative',frames,mosaic):average(l.key,t.stamps),marine()?average('outer',t.stamps):null,airAt(t.stamps),Promise.all([...checked].filter(k=>k!==id).map(async k=>[k,await average(k,bioDates),detailKey(layers[k],bioDates)?await average(detailKey(layers[k],bioDates),bioDates):null])),detailName?average(detailName,t.stamps):null]);
  if(ticket!==revision||pane.hidden)return;
  const was=current;current={id,field,outer,air,overlays,detail,layer:l};previous=smooth&&was?.id===id&&was.field&&field?was:null;
  pressureToggle.title=air?'Isobaras de presión · hPa':'Isobaras de presión · sin datos';
  const first=t.stamps[0].slice(0,10),last=t.stamps.at(-1).slice(0,10),lastERA=sets.air.lastERA;
  const projected=last>sets.air.analysisEnd;
  const weatherSource=projected?(first>sets.air.analysisEnd?'Pronóstico GFS':'Análisis y pronóstico GFS')+' · emisión '+sets.air.cycle.slice(0,13).replace('T',' ')+':00 UTC':last<=lastERA?'ERA5':first>lastERA?'NOAA GFS · análisis':'ERA5 y NOAA GFS';
  const source=l.key==='air'?weatherSource+(period.endsWith(' h')?' · lectura UTC':' · 4 lecturas UTC por día'):l.source;
  pressureToggle.title=air?'Isobaras de presión · '+weatherSource+' · hPa':'Isobaras de presión · sin datos';
  q('[data-source]').textContent=(l.key==='inner'&&period.endsWith(' h')?'Copernicus Marine · SMOC · lectura horaria':source)+' · '+(images?(mosaic?'Último dato válido · ':'Imagen diaria · '):'')+(field?.count||0)+(period.endsWith(' h')?' lectura':' días con cartografía')+(air?'':' · Sin presión para este período')+(['tide','total','level','wave'].includes(id)?' · Costa de Otway–Skyring ajustada con ESA WorldCover 2021 (CC BY 4.0).':'');
  if(bundle.origin){
   const offline=mode==='Histórico'||bundle.origin==='Copia portable'||t.stamps.some(stamp=>bundle.fallbackDays?.has(stamp.slice(0,10)));
   q('[data-source]').append(' · '+(offline?'Archivo portable':'Publicado en GitHub'));
  }
  const guide={mixed:'La escala indica hasta qué profundidad llega la capa superficial de densidad relativamente uniforme. Un valor de 60 m indica una capa más profunda que uno de 10 m.',salt:'La escala indica salinidad superficial. Un valor de 30 PSU corresponde a agua más dulce que uno de 34 PSU.',o2:'La escala indica oxígeno disuelto en superficie. Para convertir de mmol/m³ a mg/L multiplica por 0,032.'};
  if(guide[id]){
   const note=q('[data-source]');note.append(' · '+guide[id]);
   if(id==='mixed'){const link=document.createElement('a');link.href='https://svs.gsfc.nasa.gov/20227/';link.target='_blank';link.rel='noopener';link.textContent='Ver animación de NASA';note.append(' ',link)}
  }
  size();preparePlumes();current.texture=texture(current);if(current.estimated.includes(2))q('[data-source]').append(' · Punteado: muestra marina más cercana');if(current.estimated.includes(1))q('[data-source]').append(' · Tono tenue: estimación por agua conectada');drawSymbols();started=performance.now();fraction=previous?0:1;if(!previous)flow.getContext('2d').clearRect(0,0,flow.width,flow.height);paint(fraction);
 }
 let water=null,viewKey='';
 function size(){
  const {x:w,y:h}=map.getSize(),origin=map.containerPointToLayerPoint([0,0]),key=[w,h,map.getZoom(),map.getCenter().lat,map.getCenter().lng].join('/');
  for(const c of [base,flow,pressure,symbols])L.DomUtil.setPosition(c,origin);
  if(viewKey===key)return;viewKey=key;water=null;previous=null;
  for(const c of [base,flow,pressure,symbols]){c.width=w;c.height=h}
  lons=Array.from({length:w},(_,i)=>map.containerPointToLatLng([i,0]).lng);lats=Array.from({length:h},(_,j)=>map.containerPointToLatLng([0,j]).lat);
  particles=Array.from({length:Math.floor(w*h/145)},()=>[Math.random()*w,Math.random()*h,65+Math.random()*140,Math.random()]);
 }
 function waterMask(){if(water)return water;water=canvas();water.width=base.width;water.height=base.height;
  const c=water.getContext('2d'),img=c.createImageData(water.width,water.height);
  for(let j=0;j<water.height;j++)for(let i=0;i<water.width;i++)if(isSea(lons[i],lats[j]))img.data[(j*water.width+i)*4+3]=255;
  c.putImageData(img,0,0);return water}
 // En los canales de Riesco una celda vecina puede pertenecer a otra cuenca.
 function unresolvedChannel(id,lon,lat){
  return (id==='tide'||id==='total'||id==='level')&&lon>=-73.65&&lon<=-71.2&&lat>=-53.45&&lat<=-52.32;
 }
 function sample(state,lon,lat,g){
  const l=state.layer,sea=l.key==='inner',f=state.field;if(!g)g=state.detail||f||state.outer;if(!g)return;
  const inside=(p)=>{const i=(lon-p.x)/p.dx,j=(lat-p.y)/p.dy;return i>=0&&i<p.nx-1&&j>=0&&j<p.ny-1};
  const fallback=()=>g===state.detail&&f?sample(state,lon,lat,f):g!==state.outer&&state.outer?sample(state,lon,lat,state.outer):undefined;
  if(g===state.outer&&unresolvedChannel(state.id,lon,lat))return;
  if(!inside(g))return fallback();
  if(sea&&!isSea(lon,lat))return;
  const x=(lon-g.x)/g.dx,y=(lat-g.y)/g.dy,i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;
  const vector=l.vector;let u=0,v=0,mag=0,weight=0;
  function add(a,b,w){if(w<=0||a<0||a>=g.nx||b<0||b>=g.ny)return;
   const k=b*g.nx+a,scalar=g.a[l.channels.at(-1)*g.n+k];if(!Number.isFinite(scalar))return;
   if(!state.id.startsWith('wind')){const dx=g.x+a*g.dx-lon,dy=g.y+b*g.dy-lat,steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/coast.step);
    for(let z=1;z<=steps;z++)if(!isSea(lon+dx*z/steps,lat+dy*z/steps))return}
   if(vector&&(!Number.isFinite(g.a[l.channels[0]*g.n+k])||!Number.isFinite(g.a[l.channels[1]*g.n+k])))return;
   weight+=w;mag+=scalar*w;
   if(vector){u+=g.a[l.channels[0]*g.n+k]*w;v+=g.a[l.channels[1]*g.n+k]*w}
  }
  add(i,j,(1-fx)*(1-fy));add(i+1,j,fx*(1-fy));add(i,j+1,(1-fx)*fy);add(i+1,j+1,fx*fy);
  if(!weight&&sea&&!unresolvedChannel(state.id,lon,lat))for(let b=-1;b<=2;b++)for(let a=-1;a<=2;a++){const dist=(a-fx)**2+(b-fy)**2;if(dist>0&&dist<=2.25)add(i+a,j+b,1/dist)}
  if(weight)return [u*l.factor/weight,v*l.factor/weight,mag*l.factor/weight];
  return fallback();
 }
 // Índice regional de donantes para un fiordo cuyo acceso al mar queda fuera de pantalla.
 const coastalLookup=new Map();
 function regionalDonors(state){
  const grids=[state.detail,state.field,state.outer].filter(Boolean),l=state.layer;
  if(!grids.length)return;
  const west=-77,east=-65,north=-39.5,south=-57,step=.01;
  const width=Math.round((east-west)/step)+1,height=Math.round((north-south)/step)+1;
  const sources=[];let signature=2166136261;
  for(const g of grids){
   const offset=g.n*l.channels.at(-1);
   for(let i=0;i<g.n;i++)if(Number.isFinite(g.a[offset+i])){
    sources.push([g,i]);signature=Math.imul(signature^(i+1),16777619);
   }
   signature=Math.imul(signature^g.n,16777619);
  }
  const key=[state.id,signature,sources.length].join('/');
  let donors=coastalLookup.get(key);
  if(!donors){
   donors=new Int32Array(width*height);const queue=new Int32Array(donors.length);let tail=0;
   for(let s=0;s<sources.length;s++){
    const [g,i]=sources[s],lon=g.x+(i%g.nx)*g.dx,lat=g.y+Math.floor(i/g.nx)*g.dy;
    const x=Math.round((lon-west)/step),y=Math.round((north-lat)/step),k=y*width+x;
    if(x<0||x>=width||y<0||y>=height||donors[k]||!isSea(lon,lat)||!isSea(west+x*step,north-y*step))continue;
    donors[k]=s+1;queue[tail++]=k;
   }
   for(let head=0;head<tail;head++){
    const k=queue[head],x=k%width,y=Math.floor(k/width),lon=west+x*step,lat=north-y*step;
    for(const n of [x>0?k-1:-1,x+1<width?k+1:-1,y>0?k-width:-1,y+1<height?k+width:-1]){
     if(n<0||donors[n])continue;
     const nx=n%width,ny=Math.floor(n/width),nl=west+nx*step,nt=north-ny*step;
     if(!isSea(nl,nt)){donors[n]=-1;continue}
     if(!isSea((lon+nl)/2,(lat+nt)/2))continue;
     donors[n]=donors[k];queue[tail++]=n;
    }
   }
   // Refinar la conexión de los brazos angostos a la resolución de la costa.
   const fineWest=-73.65,fineNorth=-52.32,spacing=coast.step;
   const cols=Math.ceil(2.45/spacing),rows=Math.ceil(1.23/spacing);
   const fine=new Int32Array(cols*rows),front=new Int32Array(fine.length);let end=0;
   for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const lon=fineWest+i*spacing,lat=fineNorth-j*spacing,k=j*cols+i;
    if(!isSea(lon,lat)){fine[k]=-1;continue}
    const gx=Math.round((lon-west)/step),gy=Math.round((north-lat)/step);
    if(Math.abs(west+gx*step-lon)>spacing*.51||Math.abs(north-gy*step-lat)>spacing*.51)continue;
    const donor=donors[gy*width+gx];
    if(donor>0){fine[k]=donor;front[end++]=k}
   }
   for(let head=0;head<end;head++){
    const k=front[head],i=k%cols;
    for(const n of [i?k-1:-1,i+1<cols?k+1:-1,k-cols,k+cols]){
     if(n<0||n>=fine.length||fine[n]!==0)continue;
     fine[n]=fine[k];front[end++]=n;
    }
   }
   donors.interior=(lon,lat)=>{
    const x=Math.round((lon-fineWest)/spacing),y=Math.round((fineNorth-lat)/spacing);
    return x>=0&&x<cols&&y>=0&&y<rows?fine[y*cols+x]:0;
   };
   if(coastalLookup.size>=2)coastalLookup.delete(coastalLookup.keys().next().value);
   coastalLookup.set(key,donors);
  }
  const nearestCache=new Map();
  return (lon,lat)=>{
   const x=Math.round((lon-west)/step),y=Math.round((north-lat)/step);
   if(x<0||x>=width||y<0||y>=height)return;
   let source=sources[(donors.interior(lon,lat)||donors[y*width+x])-1],quality=1;
   if(!source&&(unresolvedChannel(state.id,lon,lat)||(state.id==='wave'&&unresolvedChannel('tide',lon,lat))))return;
   if(!source){
    // En ensenadas con una boca subpíxel, atribuir la estimación a su muestra marina vecina.
    const key=x+'/'+y;quality=2;
    if(!nearestCache.has(key)){
     let best=Infinity;const cos=Math.cos(lat*Math.PI/180);
     for(const candidate of sources){
      const [g,i]=candidate,sx=g.x+(i%g.nx)*g.dx,sy=g.y+Math.floor(i/g.nx)*g.dy;
      const dist=((sx-lon)*cos)**2+(sy-lat)**2;
      if(dist<best&&isSea(sx,sy)){source=candidate;best=dist}
     }
     nearestCache.set(key,source);
    }else source=nearestCache.get(key);
   }
   if(!source)return;
   const [g,i]=source,read=channel=>g.a[channel*g.n+i]*l.factor;
   return [l.vector?read(l.channels[0]):0,l.vector?read(l.channels[1]):0,read(l.channels.at(-1)),quality];
  };
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
   if(ocean&&!(s.id==='chl'&&period==='Imágenes'))for(let head=0;head<tail;head++){
    const k=queue[head],x=k%w,y=Math.floor(k/w);
    for(const n of [x>0?k-1:-1,x+1<w?k+1:-1,y>0?k-w:-1,y+1<h?k+w:-1]){
     if(n<0||!eligible[n]||Number.isFinite(s.values[n]))continue;
     const px=Math.floor(((n%w)+x)*step/2),py=Math.floor((Math.floor(n/w)+y)*step/2);
     if(!isSea(lons[px],lats[py]))continue;
     s.values[n]=s.values[k];s.velocity[n*2]=s.velocity[k*2];s.velocity[n*2+1]=s.velocity[k*2+1];
     s.estimated[n]=1;queue[tail++]=n;
    }
   }
   if(ocean&&!(s.id==='chl'&&period==='Imágenes')){
    let lookup;
    for(let k=0;k<eligible.length;k++)if(eligible[k]&&!Number.isFinite(s.values[k])){
     lookup??=regionalDonors(s);if(!lookup)break;
     const val=lookup(lons[(k%w)*step],lats[Math.floor(k/w)*step]);if(!val)continue;
     s.values[k]=val[2];s.velocity[k*2]=val[0];s.velocity[k*2+1]=val[1];s.estimated[k]=val[3];
    }
   }
  }
  for(let k=0;k<s.values.length;k++)if(Number.isFinite(s.values[k])){
   const bin=Math.round(127*Math.max(0,Math.min(1,(s.values[k]-lo)/(hi-lo))));
   image.data.set(p[bin],k*4);if(s.estimated[k])image.data[k*4+3]*=s.estimated[k]===2&&((k%w+Math.floor(k/w))%5===0)?.28:.55;
  }
  s.pixels=image.data;ctx.putImageData(image,0,0);return c;
 }
 function drawSymbols(){current.marks=null;if(!current.overlays.length)return;const marks=canvas();marks.width=base.width;marks.height=base.height;current.marks=marks;const ctx=marks.getContext('2d');
  for(const [key,field,detail] of current.overlays){if(!field&&!detail)continue;
   const l=layers[key],state={id:key,layer:l,field,detail},step=4;
   const raster=canvas();raster.width=Math.ceil(base.width/step);raster.height=Math.ceil(base.height/step);
   const rc=raster.getContext('2d'),img=rc.createImageData(raster.width,raster.height);
   const rgb=[1,3,5].map(i=>parseInt(bio[key].slice(i,i+2),16));
   for(let y=0;y<raster.height;y++)for(let x=0;x<raster.width;x++){
    const lon=lons[x*step],lat=lats[y*step];if(!isSea(lon,lat))continue;
    const v=sample(state,lon,lat);if(v)img.data.set([...rgb,150*Math.sqrt(Math.min(1,Math.max(0,v[2]/l.max)))],4*(y*raster.width+x));
   }
   rc.putImageData(img,0,0);ctx.drawImage(raster,0,0,marks.width,marks.height);
  }
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(waterMask(),0,0);

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
   const origin=map.containerPointToLayerPoint([0,0]).add(map.getPixelOrigin());
   const path=points.map(point=>map.project(point).subtract(origin));
   if(line.closed)path.pop(); // El grafo repite el primer vértice al cerrar.
   if(path.length<2)return;
   const first=path[0],last=path[path.length-1];
   let start=line.closed?last.add(first).divideBy(2):first;
   c.lineJoin='round';c.lineCap='round';c.moveTo(start.x,start.y);
   for(let i=0;i<path.length;i++){
    const control=path[i],next=path[(i+1)%path.length];
    const end=!line.closed&&i===path.length-1?last:control.add(next).divideBy(2);
    c.quadraticCurveTo(control.x,control.y,end.x,end.y);
    const x=(start.x+2*control.x+end.x)/4,y=(start.y+2*control.y+end.y)/4;
    if(x>16&&y>12&&x<pressure.width-16&&y<pressure.height-12){
     const distance=(x-pressure.width*.5)**2+(y-pressure.height*.5)**2;
     if(distance<score){score=distance;anchor={x,y}}
    }
    start=end;
   }
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
 function paint(t,drawPressure=true){if(!current)return;const c=base.getContext('2d'),w=base.width,h=base.height;
  if(current.id.startsWith('wind')){
  c.clearRect(0,0,w,h);if(previous?.texture&&t<1){c.globalAlpha=1-t;c.drawImage(previous.texture,0,0,w,h);c.globalCompositeOperation='lighter';c.globalAlpha=t}
  c.drawImage(current.texture,0,0,w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }else{
  let frame=current.texture;
  if(previous?.pixels?.length===current.pixels.length && t<1){
   const blend=current.blend??=canvas();
   if(blend.width!==frame.width||blend.height!==frame.height){blend.width=frame.width;blend.height=frame.height}
   const ctx=blend.getContext('2d'),image=current.blendImage??=ctx.createImageData(frame.width,frame.height);
   const from=previous.pixels,to=current.pixels,out=image.data;
   const fw=frame.width,fh=frame.height,morph=current.id==='chl'&&period==='Imágenes'&&!mosaic;
   if(morph&&!current.flowShift){
    const displacement=current.flowShift=new Float32Array(fw*fh*2),A=previous.values,B=current.values;
    for(let y=1;y<fh-1;y++)for(let x=1;x<fw-1;x++){
     const k=y*fw+x,gx=(A[k+1]-A[k-1]+B[k+1]-B[k-1])/4,gy=(A[k+fw]-A[k-fw]+B[k+fw]-B[k-fw])/4;
     const change=A[k]-B[k],den=gx*gx+gy*gy+.0025;
     if(Number.isFinite(change+den)){const factor=Math.min(1,2*Math.sqrt(den)/(Math.abs(change)+1e-6))*change/den;displacement[k*2]=factor*gx;displacement[k*2+1]=factor*gy}
    }
   }
   for(let k=0;k<out.length;k+=4){
    let src=k,dst=k;
    if(morph&&from[k+3]&&to[k+3]){
     const x=(k/4)%fw,y=Math.floor(k/4/fw),dx=current.flowShift[k/2],dy=current.flowShift[k/2+1];
     const at=f=>4*(Math.max(0,Math.min(fh-1,y+Math.round(f*dy)))*fw+Math.max(0,Math.min(fw-1,x+Math.round(f*dx))));
     const old=at(-t),next=at(1-t);if(from[old+3]&&to[next+3]){src=old;dst=next}
    }
    const a=from[src+3]*(1-t),b=to[dst+3]*t,total=a+b;
    out[k+3]=total;
    for(let ch=0;ch<3;ch++)out[k+ch]=total?(a*from[src+ch]+b*to[dst+ch])/total:0;
   }
   ctx.putImageData(image,0,0);frame=blend;
  }
  c.globalCompositeOperation='copy';c.drawImage(frame,0,0,w,h);c.globalCompositeOperation='source-over';
  }
  if(!current.id.startsWith('wind')){c.globalCompositeOperation='destination-in';c.drawImage(waterMask(),0,0);c.globalCompositeOperation='source-over'}
  const dots=symbols.getContext('2d');dots.clearRect(0,0,w,h);
  if(previous?.marks&&t<1){dots.globalAlpha=1-t;dots.drawImage(previous.marks,0,0)}
  dots.globalAlpha=previous?t:1;if(current.marks)dots.drawImage(current.marks,0,0);dots.globalAlpha=1;
  if(drawPressure)contours(t);
 }
 function animate(now){
  moveFloats(now);
  if(pane.hidden)return;anim=requestAnimationFrame(animate);if(!current||now-lastFrame<32)return;
  const dt=Math.min(65,now-lastFrame)/1000;lastFrame=now;animatePlumes(dt);
  if(previous){const f=Math.max(0,Math.min(1,(now-started)/duration));fraction=f;
   if(now-lastPaint>90||f===1){paint(fraction,false);lastPaint=now}contours(fraction);if(f===1)previous=null}
  if(editing!==null||!moving||!current.layer.vector)return;
  const wind=current.id.startsWith('wind');
  const wave=current.id==='wave';
  const [minimum,maximum]=wind||wave?style().range:[0,1];
  const c=flow.getContext('2d'),w=flow.width,h=flow.height;c.globalCompositeOperation='destination-in';c.fillStyle=current.id==='wave'?'rgba(0,0,0,0)':current.id.startsWith('wind')?'rgba(0,0,0,.89)':'rgba(0,0,0,.94)';c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';
  c.strokeStyle='#fff';c.lineWidth=.85;c.beginPath();
  for(const p of particles){
   if(wave&&p[3]>.58)continue;
   const x=p[0],y=p[1],k=(Math.floor(y/4)*current.width+Math.floor(x/4))*2;
   let u=current.velocity[k],v=current.velocity[k+1];
   if(previous&&Number.isFinite(previous.velocity[k])&&Number.isFinite(u)){
    const a=previous.velocity[k],b=previous.velocity[k+1],before=Math.hypot(a,b),after=Math.hypot(u,v);
    if(before>0&&after>0){
     const angle=Math.atan2(b,a)+fraction*Math.atan2(a*v-b*u,a*u+b*v);
     const speed=before+(after-before)*fraction;u=speed*Math.cos(angle);v=speed*Math.sin(angle);
    }else{u=a+(u-a)*fraction;v=b+(v-b)*fraction}
   }
   if(x<0||x>=w||y<0||y>=h||!Number.isFinite(u+v)||p[2]<=0||(!wave&&!playing&&--p[2]<=0)){p[0]=Math.random()*w;p[1]=Math.random()*h;p[2]=65+Math.random()*55;p.waveAge=0;continue}
   const magnitude=Math.hypot(u,v),ratio=Math.min(2,magnitude/current.layer.max),intensity=Math.min(1,Math.max(0,(magnitude-minimum)/(maximum-minimum||1)));
   if(wave){
    const cell=k/2;
    let height=current.values[cell];
    if(previous&&Number.isFinite(previous.values[cell]))height=previous.values[cell]+fraction*(height-previous.values[cell]);
    if(!(magnitude>.01&&height>0)){p[2]=0;continue}
    const strength=Math.max(0,Math.min(1,(height-minimum)/(maximum-minimum||1)));
    const red=Math.max(0,(strength-.65)/.35);
    const visible=p[3]<=.38+.20*red;
    const speed=5+30*strength**1.35,life=4.8+2*strength;
    p.waveAge=(p.waveAge??Math.random()*life)+dt;
    const age=p.waveAge/life;
    if(age>=1){p[2]=0;continue}
    const dx=u/magnitude,dy=-v/magnitude;
    p[0]+=dt*speed*dx;p[1]+=dt*speed*dy;
    if(!visible)continue;
    const tail=Math.min(speed*p.waveAge,(1+11*strength)*(1-.35*red));
    for(let j=2;j>=0;j--){
     const back=tail*j/2,cx=p[0]-dx*back,cy=p[1]-dy*back;
     const half=3+5*(1-.45*red)*Math.max(0,age-back/(speed*life));
     c.globalAlpha=Math.min(1,(1-age)*4)*[1,.33,.13][j];
     c.beginPath();c.moveTo(cx+dy*half,cy-dx*half);
     c.quadraticCurveTo(cx+dx*1.5,cy+dy*1.5,cx-dy*half,cy+dx*half);c.stroke();
    }
    c.globalAlpha=1;continue;
   }
   const gain=wind?dt*(.32+.42*Math.pow(Math.min(1,magnitude/75),1.7)):dt*24*(.35+.85*Math.sqrt(ratio));
   p[0]+=gain*u;p[1]-=gain*v;
   if(current.layer.key==='inner'&&(!isSea(lons[Math.floor(x)],lats[Math.floor(y)])||!isSea(lons[Math.floor(p[0])],lats[Math.floor(p[1])]))){p[2]=0;continue}
   if(current.layer.key==='inner'){
    const lon=lons[Math.floor(x)],lat=lats[Math.floor(y)];
    // Mar abierto: agua en los cuatro puntos de una vecindad de unos 10 km.
    const dx=.09/Math.cos(lat*Math.PI/180);
    const offshore=isSea(lon-dx,lat)&&isSea(lon+dx,lat)&&isSea(lon,lat-.09)&&isSea(lon,lat+.09);
    if(p[3]>(offshore?.42:.80))continue;
   }
   if(wind){
    // Un umbral fijo por partícula evita el parpadeo entre fotogramas.
    if(!magnitude||p[3]>(.13+.39*intensity)*(1-.20*Math.max(0,(intensity-.7)/.3)))continue;
    const tail=2+4*intensity*intensity;
    c.moveTo(x-tail*u/magnitude,y+tail*v/magnitude);
    c.lineTo(p[0],p[1]);
    continue;
   }
   c.moveTo(x,y);c.lineTo(p[0],p[1]);
  }
  if(wave){c.globalCompositeOperation='destination-in';c.drawImage(waterMask(),0,0);c.globalCompositeOperation='source-over'}
  else c.stroke();
 }
 async function move(n,smooth=true){const next=Math.max(0,Math.min(timeline().length-1,index+n));if(next===index)return;index=next;anchor=timeline()[index].stamps[0];sessionStorage.setItem('clima-fecha',anchor);await update(smooth)}
 async function advance(token){
  if(!playing||token!==run)return;const line=timeline();
  if(index>=line.length-1||!line.slice(index+1).some(t=>t.value!=null)){stop();return}
  await move(1);if(playing&&token===run)timer=setTimeout(()=>advance(token),hold);
 }
 play.onclick=async()=>{if(playing){stop();return}closeEditor();const token=++run;playing=true;button(play,'Ⅱ','Pausar');
  if(!timeline().slice(index+1).some(t=>t.value!=null)){index=0;await update(false)}if(playing&&token===run)await advance(token)};
 for(const [attr,n,icon,title] of [['prev',-1,'◀◀','Período anterior'],['next',1,'▶▶','Período siguiente']]){
  const b=q('[data-'+attr+']');button(b,icon,title);b.onclick=()=>{stop();move(n)}}
 slider.oninput=()=>{stop();const i=+slider.value,smooth=Math.abs(i-index)===1;index=i;anchor=timeline()[i].stamps[0];sessionStorage.setItem('clima-fecha',anchor);revision++;scrubTimer=setTimeout(()=>update(smooth),60)};
 function motionLabel(){button(q('.motion'),'≋',moving?'Pausar partículas':'Animar partículas',moving)}motionLabel();
 q('.motion').onclick=()=>{moving=!moving;motionLabel();if(!moving)flow.getContext('2d').clearRect(0,0,flow.width,flow.height)};
 const pressureToggle=q('.isobars');pressureToggle.onclick=()=>{showPressure=!showPressure;pressureToggle.setAttribute('aria-pressed',String(showPressure));contours(fraction)};
 // El rumbo indica hacia dónde se desplaza el agua en el instante seleccionado.
 map.on('click',e=>{
  if(pane.hidden||!current||!marine()||current.id!==id||!isSea(e.latlng.lng,e.latlng.lat))return;
  const point=map.latLngToContainerPoint(e.latlng),col=Math.floor(point.x/4),row=Math.floor(point.y/4);
  if(col<0||col>=current.width||row<0)return;
  const k=row*current.width+col,u=current.velocity[k*2],v=current.velocity[k*2+1];
  const speed=Math.hypot(u,v),bearing=(Math.atan2(u,v)*180/Math.PI+360)%360;
  const compass=['Norte','Noreste','Este','Sureste','Sur','Suroeste','Oeste','Noroeste'];
  const reading=Number.isFinite(speed)?(speed<.001?'Sin dirección definida':('Hacia '+compass[Math.round(bearing/45)%8]+' · '+Math.round(bearing)%360+'° · '+format(speed,2)+' m/s')):'Sin cobertura';
  const origin=Number.isFinite(speed)?(current.estimated[k]?'Estimación espacial':'Modelo local'):'';
  L.popup({className:'clima-popup'}).setLatLng(e.latlng).setContent([layer().title,reading,origin,q('.clima-readout output').textContent].filter(Boolean).join('<br>')).openOn(map);
 });
 function redraw(){if(!current||pane.hidden)return;size();preparePlumes();previous=null;current.texture=texture(current);drawSymbols();paint(1)}
 const context=window.__CONTEXT_MENUS_V39;
 context.panels.clima=d;
 const tool=slot.firstChild;
 function reveal(){context.show('clima');tool.setAttribute('aria-expanded','true')}
 function toggle(open){
  const keepRiver=riverOn;riverOn=false;drawRivers();metOn=false;drawMet();argoOn=false;showFloats();floats.remove();stop();closeEditor();colorPane.hidden=pane.hidden=!open;tool.setAttribute('aria-pressed',String(open));cancelAnimationFrame(anim);
  riverOn=keepRiver;
  if(open){
   argoOn=metOn=true;
   if(window.__FLOTA_V39?.state.active)window.__FLOTA_V39.deactivate();
   window.__V39_EXPLICIT_VIEW='clima';reveal();map.on('moveend resize',redraw);menu();anim=requestAnimationFrame(animate)
  }else{context.close('clima');tool.setAttribute('aria-expanded','false');revision++;current=null;previous=null;flow.getContext('2d').clearRect(0,0,flow.width,flow.height);map.off('moveend resize',redraw)}
 }
 let savedView=null,lastLinked='';
 function stopLinked(){
  if(!savedView)return;
  toggle(false);({mode,period,index,anchor}=savedView);savedView=null;lastLinked='';
 }
 window.linkedClimateV39={stop:stopLinked,fanChart(canvas,caption,w,fanMode,scale){
  const day=w.to||w.end,span={day:'Día',week:'Semana',month:'Mes'}[scale];
  const views=layer().views,preferred=fanMode==='history'?'Histórico':'Actual';
  for(const view of [preferred,preferred==='Actual'?'Histórico':'Actual']){
   const line=views[view]?.[span]||[];
   const selected=line.findIndex(row=>row.stamps[0].slice(0,10)<=day&&row.stamps.at(-1).slice(0,10)>=day);
   if(selected<0)continue;
   chart(canvas,line,selected,view,null);
   const row=line[selected],date=s=>s.slice(0,10).split('-').reverse().join('-'),from=date(row.stamps[0]),to=date(row.stamps.at(-1));
   caption.textContent=layer().title+' · '+(row.value==null?'Sin datos':format(row.value,2)+' '+layer().unit)+' · '+from+(from===to?'':' – '+to);
   return;
  }
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);caption.textContent=layer().title+' · Sin datos para este período';
 },async follow(start,end,hourly){
  if(!savedView){savedView={mode,period,index,anchor};stop();closeEditor();map.on('moveend resize',redraw)}
  const views=layer().views,day=end.slice(0,10);
  let view='Histórico',scale='Día',rows=[];
  const detailed=Object.keys(views.Actual||{}).find(k=>k.endsWith(' h'));
  if(hourly&&detailed){
   const candidates=views.Actual[detailed].filter(r=>r.value!=null&&r.stamps.some(s=>s.startsWith(day)&&s<=end));
   if(candidates.length){view='Actual';scale=detailed;rows=[candidates.at(-1)]}
  }
  if(!rows.length){
   for(const v of ['Histórico','Actual']){
    const dates=views[v]?.Día||[];
    rows=dates.filter(r=>r.key>=start.slice(0,10)&&r.key<=day&&r.value!=null);
    if(rows.length){view=v;break}
   }
  }
  const key=[id,view,scale,rows[0]?.key,rows.at(-1)?.key].join('|');
  if(key===lastLinked)return;lastLinked=key;
  mode=view;period=scale;index=Math.max(0,timeline().indexOf(rows.at(-1)));
  revision++;if(!rows.length){colorPane.hidden=pane.hidden=true;cancelAnimationFrame(anim);const keep=riverOn;riverOn=false;drawRivers();riverOn=keep;return}
  if(pane.hidden){colorPane.hidden=pane.hidden=false;cancelAnimationFrame(anim);anim=requestAnimationFrame(animate)}
  const row={...rows.at(-1),stamps:rows.flatMap(r=>r.stamps)};
  await update(true,row);
 }};
 slot.parentElement.addEventListener('click',e=>{const other=e.target.closest('button.workspace-icon-v39');if(other&&other!==tool&&!pane.hidden)toggle(false)},true);
 tool.onclick=()=>{if(pane.hidden)toggle(true);else if(d.hidden||d.classList.contains('context-peek-v39'))reveal();else toggle(false)};
 q('[data-min]').onclick=()=>context.minimize('clima');
 q('[data-close]').onclick=()=>{stop();closeEditor();context.close('clima');tool.setAttribute('aria-expanded','false')};
 q('[data-clear]').onclick=()=>{
  riverOn=false;drawRivers();metOn=false;drawMet();argoOn=false;showFloats();floats.remove();stop();closeEditor();checked.clear();Object.keys(settings).forEach(k=>delete settings[k]);
  argoOn=metOn=true;id='wind';period=(bundle.publicView||bundle.actualSets)?'6 h':'Día';mode=(bundle.publicView||bundle.actualSets)?'Actual':'Histórico';moving=true;motionLabel();showPressure=true;pressureToggle.setAttribute('aria-pressed','true');menu()
 };
 d.addEventListener('pointerenter',()=>d.classList.remove('context-concealed-v39'));
 d.addEventListener('pointerleave',()=>{if(d.classList.contains('context-peek-v39'))d.classList.add('context-concealed-v39')});
 d.addEventListener('focusin',()=>d.classList.remove('context-concealed-v39'));
}