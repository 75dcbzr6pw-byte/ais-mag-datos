export const LIMITS={gap:7200,stopSpeed:.5,stopRadius:250,stopDuration:3600,maxSpeed:60};
const rad=Math.PI/180;
export function distance(a,b){const dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;const x=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));}
export function timeOf(point,source,offset=0){
 if(source==='AIS')return Number(point[0]);
 const t=Date.parse(point[0]+'Z')/1000;
 return Number.isFinite(t)?t-offset*3600:NaN;
}
export function pointsFrom(raw,source,offset=0){
 const seen=new Set();return raw.map(p=>({t:timeOf(p,source,offset),stamp:p[0],lon:Number(p[1]),lat:Number(p[2]),speed:p[3],heading:p[4]}))
 .filter(p=>{const key=[p.t,p.lon,p.lat].join('/');if(!Number.isFinite(p.t)||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>a.t-b.t);
}
export function analyze(points,solarPosition){
 const result={moving:0,day:0,night:0,solarUnknown:0,stopped:0,unknown:0,gaps:0,invalid:0,distance:0,stops:[]};
 let stop=null;
 const finish=()=>{if(stop&&stop.duration>=LIMITS.stopDuration)result.stops.push({...stop});stop=null;};
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dt=b.t-a.t;
  if(dt<=0)continue;
  if(dt>LIMITS.gap){result.gaps+=dt;finish();continue;}
  const meters=distance(a,b),derived=meters/dt/1852*3600;
  if(derived>LIMITS.maxSpeed){result.invalid+=dt;finish();continue;}
  result.distance+=meters;
  const known=Number.isFinite(a.speed)&&Number.isFinite(b.speed);
  const slow=known&&a.speed<=LIMITS.stopSpeed&&b.speed<=LIMITS.stopSpeed;
  if(slow&&meters<=LIMITS.stopRadius){
   if(stop&&distance(stop,a)<=LIMITS.stopRadius&&distance(stop,b)<=LIMITS.stopRadius){stop.end=b.t;stop.duration+=dt;stop.points++;}
   else{finish();stop={lat:a.lat,lon:a.lon,start:a.t,end:b.t,duration:dt,points:2};}
   result.stopped+=dt;continue;
  }
  finish();
  if(!known||(a.speed+b.speed)/2<=LIMITS.stopSpeed){result.unknown+=dt;continue;}
  result.moving+=dt;
  const n=Math.ceil(dt/300),step=dt/n;
  for(let j=0;j<n;j++){
   const f=(j+.5)/n,t=a.t+(j+.5)*step,lat=a.lat+(b.lat-a.lat)*f,lon=a.lon+(b.lon-a.lon)*f;
   const altitude=solarPosition?.(new Date(t*1000),lat,lon)?.altitude;
   if(!Number.isFinite(altitude))result.solarUnknown+=step;
   else if(altitude>=-.833*rad)result.day+=step;
   else result.night+=step;
  }
 }
 finish();return result;
}
export function dayKey(point,source){
 if(source==='VMS')return String(point[0]).slice(0,10);
 return new Date((Number(point[0])-3*3600)*1000).toISOString().slice(0,10);
}
export function matches(v,query){
 const fold=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const needle=fold(query);if(!needle)return true;
 return [v.p.nombre,v.p.mmsi,v.p.matricula,v.p.distintivo,v.p.referencia_interna,...(v.registry||[]).flatMap(r=>[r.matricula,r.nombre_registro])].some(x=>fold(x).includes(needle));
}
