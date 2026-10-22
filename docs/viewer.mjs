import {aisMagPages} from './integration/consumidor_mapa_acs_pages.js';
import {analyze,pointsFrom,dayKey,matches} from './analysis.mjs';
const $=id=>document.getElementById(id),base=new URL('.',location.href),aisClient=aisMagPages(base.href);
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node};
const map=L.map('map',{preferCanvas:true}).setView([-48.2,-73.1],5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);
const markers=L.featureGroup().addTo(map),track=L.featureGroup().addTo(map),stopsLayer=L.featureGroup().addTo(map),playhead=L.featureGroup().addTo(map);
const boxes={'Los Lagos':[-44.1,-75.5,-40.1,-71.5],Aysen:[-49.2,-77,-43.5,-71],Magallanes:[-56.7,-77,-48.5,-66]};
const fleets={acuicultura:'Acuicultura',flota_artesanal:'Extractiva artesanal',flota_industrial:'Extractiva industrial',flota_transportadoras:'Transportadoras'};
const colors={acuicultura:'#cb7924',flota_artesanal:'#765bc0',flota_industrial:'#bf5360',flota_transportadoras:'#ac8d15'};
let latest=[],all=[],filtered=[],aisMeta=null,vmsMeta=null,am=null,vm=null,registry={},page=0,selected=null,rawPoints=[],points=[],selectedDay='',dateSerial=0,selectionSerial=0,busy=false,playTimer=null,drawing=false,corners=[];
const dayCache=new Map(),historyCache=new Map();let dates=[];
const key=v=>v.source+':'+(v.p.id||v.p.mmsi),label=v=>v.p.nombre||'Sin nombre',color=v=>v.source==='AIS'?'#078f99':colors[v.p.flotas?.[0]]||'#70818a';
const normalizeCall=call=>String(call||'').toUpperCase().replace(/\s+/g,'');
const numeric=(value,suffix='')=>Number.isFinite(value)?value+suffix:'—';
const hours=seconds=>{const minutes=Math.round(seconds/60);return Math.floor(minutes/60)+' h '+String(minutes%60).padStart(2,'0')};
const local=stamp=>new Date(stamp).toLocaleString('es-CL',{timeZone:'America/Punta_Arenas',hourCycle:'h23'});
function pointTime(p){if(!p)return 'Sin posiciones';return selected?.source==='VMS'?String(p.stamp).replace('T',' ')+' · hora fuente':local(p.t*1000)+' UTC−3'}
function sourceTime(t){return selected?.source==='VMS'?new Date((t+(Number($('timezone').value)||0)*3600)*1000).toISOString().slice(0,16).replace('T',' '):local(t*1000)}
function identity(v){const pieces=[];if(v.p.mmsi)pieces.push('MMSI '+v.p.mmsi);if(v.p.distintivo)pieces.push(v.p.distintivo);const plates=[...new Set((v.registry||[]).map(r=>r.matricula).filter(Boolean))];if(plates.length)pieces.push(plates.join(' / '));return pieces.join(' · ')||v.p.referencia_interna||'Identificador no informado'}
function attach(features,source){return features.map(f=>({source,p:f.properties,coords:f.geometry.coordinates,registry:registry[normalizeCall(f.properties.distintivo)]||[]}))}
async function json(path){const url=new URL(path,base);if(url.origin!==base.origin)throw Error('Ruta no permitida');const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error)}
function pair(list,name,value){if(value===undefined||value===null||value==='')return;list.append(el('dt',name),el('dd',String(value)))}
function stopPlayback(){clearInterval(playTimer);playTimer=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Reproducir posiciones')}
function clearSelection(){selectionSerial++;stopPlayback();selected=null;points=[];rawPoints=[];track.clearLayers();playhead.clearLayers();stopsLayer.clearLayers();$('vessel').hidden=true;renderList()}

// El calendario se añade al mismo control de zoom: ancho, bordes y radios compartidos.
const zoom=map.zoomControl.getContainer(),calendarButton=L.DomUtil.create('a','calendar-toggle',zoom);
calendarButton.href='#';calendarButton.role='button';calendarButton.setAttribute('aria-label','Seleccionar fecha de posiciones');calendarButton.title='Calendario de posiciones';
calendarButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h3m2 0h3m-8 3h3"/></svg>';
const calendar=el('div',undefined,'calendar-popup');calendar.hidden=true;zoom.append(calendar);
calendar.append(el('label','Día de la posición'));const dateInput=el('input');dateInput.type='date';dateInput.id='calendar-date';dateInput.setAttribute('aria-label','Fecha de posiciones');calendar.append(dateInput);
const dateActions=el('div',undefined,'date-actions'),previousDate=el('button','‹'),latestDate=el('button','Últimas'),nextDate=el('button','›');dateActions.append(previousDate,latestDate,nextDate);calendar.append(dateActions);
const calendarState=el('div','', 'calendar-state');calendar.append(calendarState);L.DomEvent.disableClickPropagation(calendar);L.DomEvent.disableScrollPropagation(calendar);
L.DomEvent.on(calendarButton,'click',event=>{L.DomEvent.stop(event);calendar.hidden=!calendar.hidden;calendarButton.setAttribute('aria-expanded',String(!calendar.hidden))});
calendar.title='VMS: día declarado en la fuente. AIS: día en UTC−3. Se muestra la última posición dentro de ese día, sin arrastrar datos anteriores.';
function calendarInfo(){dateInput.value=selectedDay;dateInput.min=dates[0]||'';dateInput.max=dates.at(-1)||'';const index=dates.indexOf(selectedDay);previousDate.disabled=!dates.length||(selectedDay&&index<=0);nextDate.disabled=!dates.length||!selectedDay||index===dates.length-1;calendarState.textContent=selectedDay||'Últimas posiciones disponibles';calendarButton.classList.toggle('active',Boolean(selectedDay))}
previousDate.onclick=()=>{const index=selectedDay?dates.indexOf(selectedDay):dates.length;chooseDay(dates[Math.max(0,index-1)])};nextDate.onclick=()=>{const index=dates.indexOf(selectedDay);chooseDay(dates[Math.min(dates.length-1,index+1)])};latestDate.onclick=()=>chooseDay('');dateInput.onchange=()=>chooseDay(dateInput.value);

async function chooseDay(day){
 const request=++dateSerial;selectedDay=day||'';clearSelection();page=0;calendarInfo();status('Cargando '+(day||'últimas posiciones')+'…');
 if(!day){all=latest;render();return;}
 try{
  let snapshot=dayCache.get(day);
  if(!snapshot){
   const paths=[am?.posiciones_por_fecha?.[day],vm?.posiciones_por_fecha?.[day]];
   const data=await Promise.all(paths.map((entry,i)=>entry?json((i?'vms/':'data/')+entry.archivo):Promise.resolve(null)));
   snapshot=[...(data[0]?attach(data[0].features,'AIS'):[]),...(data[1]?attach(data[1].features,'VMS'):[])];
   if(!paths.some(Boolean))throw Error('No hay posiciones publicadas para ese día');
   dayCache.set(day,snapshot);if(dayCache.size>4)dayCache.delete(dayCache.keys().next().value);
  }
  if(request!==dateSerial)return;all=snapshot;render();
 }catch(error){if(request!==dateSerial)return;all=[];render();status(error.message,true)}
}
async function refresh(){
 if(busy)return;busy=true;$('reload').disabled=true;status('Actualizando…');
 try{
  const data=await Promise.allSettled([aisClient.getLatest(),json('vms/latest.geojson'),json('data/manifest.json'),json('vms/manifest.json'),json('registro.json')]);
  registry=data[4].status==='fulfilled'?data[4].value.por_distintivo||{}:{};
  latest=[];const missing=[];
  if(data[0].status==='fulfilled'){aisMeta=data[0].value.metadata;latest.push(...attach(data[0].value.features,'AIS'));}else missing.push('AIS');
  if(data[1].status==='fulfilled'){vmsMeta=data[1].value.metadata;latest.push(...attach(data[1].value.features,'VMS'));}else missing.push('VMS');
  am=data[2].status==='fulfilled'?data[2].value:null;vm=data[3].status==='fulfilled'?data[3].value:null;
  dates=[...new Set([...Object.keys(am?.posiciones_por_fecha||{}),...Object.keys(vm?.posiciones_por_fecha||{})])].sort();calendarInfo();dayCache.clear();
  await chooseDay(selectedDay);if(missing.length)status(missing.join(' / ')+' no disponible',true);
  $('status').title='AIS: lote '+(aisMeta?local(aisMeta.publicado_utc):'sin datos')+' UTC−3. VMS: reporte '+(vmsMeta?.ultimo_reporte||'sin datos')+'. Matrículas: registro Sernapesca al 12-05-2026.';
 }finally{busy=false;$('reload').disabled=false;}
}
function render(){
 const region=$('region').value,fleet=$('fleet').value;
 filtered=all.filter(v=>{if(v.source==='AIS'&&!$('ais').checked||v.source==='VMS'&&!$('vms').checked)return false;if(fleet&&(v.source!=='VMS'||!v.p.flotas.includes(fleet)))return false;if(region){const [s,w,n,e]=boxes[region],[lon,lat]=v.coords;if(!(s<=lat&&lat<=n&&w<=lon&&lon<=e))return false;}return matches(v,$('search').value)});
 markers.clearLayers();for(const v of filtered){
  const dot=L.circleMarker([v.coords[1],v.coords[0]],{radius:5,color:'#fff',weight:1,fillColor:color(v),fillOpacity:.9}).addTo(markers);
  dot.bindTooltip(el('span',label(v)),{direction:'top',offset:[0,-5],className:'boat-label'});dot.on('click',()=>select(v));v.marker=dot;
 }
 renderList();status(filtered.length+' registros · '+(selectedDay||'últimas posiciones'));
}
function renderList(){
 const pages=Math.max(1,Math.ceil(filtered.length/25));page=Math.min(page,pages-1);$('list').replaceChildren();
 for(const v of filtered.slice(page*25,(page+1)*25)){
  const button=el('button',undefined,'vessel-row');button.classList.toggle('selected',selected&&key(v)===key(selected));
  const dot=el('span',undefined,'source-dot');dot.style.background=color(v);const text=el('span');text.append(el('span',label(v),'name'),el('span',identity(v),'id'));button.append(dot,text,el('span',v.source,'badge'));button.onclick=()=>select(v);$('list').append(button);
 }
 if(!filtered.length)$('list').append(el('div','Sin coincidencias','no-stops'));
 $('count').textContent=filtered.length;$('page').textContent=(page+1)+' / '+pages;$('prev').disabled=page===0;$('next').disabled=page===pages-1;
}
function vesselInfo(v){
 $('vessel-name').textContent=label(v);$('vessel-source').textContent=v.source;$('identity').textContent=identity(v);$('facts').replaceChildren();$('extra').replaceChildren();
 pair($('facts'),'MMSI',v.p.mmsi);pair($('facts'),'Señal de llamada',v.p.distintivo);pair($('facts'),'Matrícula',v.p.matricula||[...new Set(v.registry.map(r=>r.matricula))].join(' / '));
 pair($('facts'),'Flota',v.p.flotas?.map(f=>fleets[f]||f).join(', '));pair($('facts'),'Referencia interna',v.p.referencia_interna);pair($('facts'),'Destino declarado',v.p.destino_declarado);pair($('facts'),'Tipo AIS',v.p.tipo_ais);
 pair($('extra'),'Fuente',v.p.fuente||v.source);pair($('extra'),'Archivo/reporte',v.p.fecha_reporte);pair($('extra'),'Identidad VMS',v.p.base_identidad);pair($('extra'),'Proa reportada',Number.isFinite(v.p.proa_grados)?v.p.proa_grados+'°':null);pair($('extra'),'Tipo de mensaje',v.p.tipo_mensaje);
 for(const row of v.registry){pair($('extra'),'Nombre en registro',row.nombre_registro);pair($('extra'),'Armador/arrendatario',row.armador_o_arrendatario_registro);pair($('extra'),'Fecha del registro',row.fecha_registro);const link=el('a','Registro Sernapesca');link.href=row.url_fuente;link.target='_blank';link.rel='noopener';const value=el('dd');value.append(link);$('extra').append(el('dt','Fuente matrícula'),value);}
 $('vessel').hidden=false;document.querySelector('.timezone').hidden=v.source!=='VMS';document.querySelector('.scope').hidden=!selectedDay;
}
async function history(v){
 const cacheKey=key(v)+':'+(v.source==='VMS'?vmsMeta?.generado_utc:aisMeta?.publicado_utc);if(historyCache.has(cacheKey))return historyCache.get(cacheKey);
 let raw;
 if(v.source==='AIS')raw=(await aisClient.getVesselHistory(v.p.mmsi)).puntos;
 else{
  if(!/^vessels\/[a-f0-9]{24}\.json$/.test(v.p.historial))throw Error('Ruta inválida');const index=await json('vms/'+v.p.historial);if(index.archivos.length>20)throw Error('Ventana excesiva');raw=[];
  for(let i=0;i<index.archivos.length;i+=4){const files=index.archivos.slice(i,i+4);for(const file of files)if(!/^days\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{24}\.json$/.test(file.archivo))throw Error('Ruta diaria inválida');const blocks=await Promise.all(files.map(file=>json('vms/'+file.archivo)));for(const block of blocks)raw.push(...block.puntos);}
 }
 historyCache.set(cacheKey,raw);if(historyCache.size>10)historyCache.delete(historyCache.keys().next().value);return raw;
}
async function select(v){
 clearSelection();selected=v;const request=selectionSerial;vesselInfo(v);renderList();$('loading').textContent='Cargando historial…';$('scope').value='visible';
 try{const data=await history(v);if(request!==selectionSerial)return;rawPoints=data;applyHistory();$('loading').textContent='';}
 catch(error){if(request===selectionSerial)$('loading').textContent='Historial no disponible: '+error.message;}
}
function drawLines(subset,style){let part=[],last=null;const finish=()=>{if(part.length>1)L.polyline(part,style).addTo(track);part=[]};for(const p of subset){if(last&&(p.t-last.t>7200))finish();part.push([p.lat,p.lon]);last=p}finish()}
function applyHistory(){
 if(!selected)return;stopPlayback();track.clearLayers();stopsLayer.clearLayers();playhead.clearLayers();
 const raw=selectedDay&&$('scope').value==='visible'?rawPoints.filter(p=>dayKey(p,selected.source)===selectedDay):rawPoints;
 points=pointsFrom(raw,selected.source,Number($('timezone').value)||0);
 $('timeline').max=Math.max(0,points.length-1);$('timeline').value=Math.max(0,points.length-1);$('timeline').disabled=!points.length;$('play').disabled=points.length<2;
 drawLines(points,{color:'#86aeb8',weight:2,opacity:.45});updatePoint();updateAnalysis();
 if(points.length){const bounds=L.latLngBounds(points.map(p=>[p.lat,p.lon]));map.fitBounds(bounds,{paddingTopLeft:[35,35],paddingBottomRight:[window.innerWidth>680?410:35,window.innerWidth>680?35:window.innerHeight*.48],maxZoom:12});}
}
function updatePoint(){
 playhead.clearLayers();const index=Number($('timeline').value),p=points[index];$('step').textContent=points.length?(index+1)+'/'+points.length:'0/0';$('point-time').textContent=pointTime(p);if(!p){$('point-values').textContent='';return;}
 const dot=L.circleMarker([p.lat,p.lon],{radius:8,color:'#fff',weight:2,fillColor:'#006b91',fillOpacity:1,className:'selected-point'}).addTo(playhead);dot.bindTooltip(el('span',label(selected)),{direction:'top',className:'boat-label'});
 $('point-values').textContent=p.lat.toFixed(5)+', '+p.lon.toFixed(5)+' · '+numeric(p.speed,' kn')+' · rumbo '+numeric(p.heading,'°');
 // La capa de progreso se recrea aparte del recorrido completo.
 for(const layer of track.getLayers())if(layer.options.progress)track.removeLayer(layer);
 drawLines(points.slice(0,index+1),{color:'#087d96',weight:3,opacity:.9,progress:true});
}
function updateAnalysis(){
 if(!selected)return;const uncertain=selected.source==='VMS'&&$('timezone').value==='unknown';
 const solar=uncertain?null:(date,lat,lon)=>globalThis.SunCalc?.getPosition(date,lat,lon);
 const result=analyze(points,solar);$('day-hours').textContent=uncertain||result.solarUnknown?'—':hours(result.day);$('night-hours').textContent=uncertain||result.solarUnknown?'—':hours(result.night);$('stop-hours').textContent=hours(result.stopped);$('gap-hours').textContent=hours(result.gaps+result.unknown+result.invalid);
 $('period').textContent=points.length?points.length+' posiciones · '+(selectedDay&&$('scope').value==='visible'?selectedDay:'historial disponible'):'';
 $('stops').replaceChildren();$('stop-count').textContent='('+result.stops.length+')';
 for(const stop of result.stops){
  const button=el('button',hours(stop.duration)+' · '+sourceTime(stop.start)+' → '+sourceTime(stop.end),'stop');button.append(el('small',stop.lat.toFixed(5)+', '+stop.lon.toFixed(5)+' · '+stop.points+' observaciones'));
  button.onclick=()=>{stopPlayback();const index=points.findIndex(p=>p.t>=stop.start);$('timeline').value=Math.max(0,index);updatePoint();map.setView([stop.lat,stop.lon],13)};$('stops').append(button);
  L.circle([stop.lat,stop.lon],{radius:250,color:'#c18a25',weight:1,fillOpacity:.1}).bindTooltip(el('span','Detención observada: '+hours(stop.duration))).addTo(stopsLayer);
 }
 if(!result.stops.length)$('stops').append(el('div',points.length<2?'Datos insuficientes':'Sin paradas de al menos 1 hora','no-stops'));
}
$('timeline').oninput=()=>{stopPlayback();updatePoint()};$('play').onclick=()=>{if(playTimer){stopPlayback();return;}if(Number($('timeline').value)>=points.length-1)$('timeline').value=0;$('play').textContent='Ⅱ';playTimer=setInterval(()=>{const next=Number($('timeline').value)+1;if(next>=points.length){stopPlayback();return;}$('timeline').value=next;updatePoint()},600)};
$('timezone').onchange=applyHistory;$('scope').onchange=applyHistory;$('reload').onclick=refresh;
for(const id of ['ais','vms','fleet'])$(id).onchange=()=>{page=0;render()};$('search').oninput=()=>{page=0;render()};
$('region').onchange=()=>{page=0;render();const b=boxes[$('region').value];if(b)map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:[30,30]})};
$('fit').onclick=()=>{if(markers.getLayers().length)map.fitBounds(markers.getBounds(),{padding:[35,35],maxZoom:11})};$('clear').onclick=clearSelection;$('prev').onclick=()=>{page--;renderList()};$('next').onclick=()=>{page++;renderList()};
$('area').onclick=()=>{drawing=true;corners=[];status('Área AIS: elige dos esquinas · máximo 2° × 2°')};
map.on('click',async event=>{if(!drawing)return;corners.push(event.latlng);if(corners.length<2)return;drawing=false;const [a,b]=corners;try{const data=await aisClient.getAreaHistory([Math.min(a.lng,b.lng),Math.min(a.lat,b.lat),Math.max(a.lng,b.lng),Math.max(a.lat,b.lat)],{days:15});clearSelection();for(const v of data.embarcaciones)drawLines(pointsFrom(v.puntos.map(p=>p.slice(1)),'AIS'),{color:'#087d96',weight:2});status('Área AIS: '+data.cantidad_embarcaciones+' embarcaciones')}catch(error){status(error.message,true)}});
refresh();
