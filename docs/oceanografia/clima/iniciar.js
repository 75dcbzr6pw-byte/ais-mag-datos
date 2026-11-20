const map=L.map('map').setView([-52.8,-72.3],7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
const panels={};window.__CONTEXT_MENUS_V39={panels,show(k){panels[k].hidden=false;panels[k].classList.remove('context-peek-v39','context-concealed-v39')},close(k){panels[k].hidden=true},minimize(k){panels[k].classList.add('context-peek-v39','context-concealed-v39')}};
async function get(file){const r=await fetch(file,{cache:file==='actual.json'?'no-cache':'default'});if(!r.ok)throw Error('Descarga no disponible: '+file);return r}
async function unpack(r){const data=new Uint8Array(await r.arrayBuffer());if(data[0]===31&&data[1]===139)return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).json();return JSON.parse(new TextDecoder().decode(data))}
async function openClimate(){const [b,coast]=await Promise.all([get('actual.json').then(r=>r.json()),get('costa.gz').then(unpack)]);b.coast=coast;
 const pending=new Map();b.loadDays=stamps=>Promise.all([...new Set(stamps.map(s=>s.slice(0,10)))].filter(d=>b.files[d+'.gz']).map(day=>{
 if(!pending.has(day))pending.set(day,get(day+'.gz?v='+b.files[day+'.gz'].slice(0,12)).then(unpack).then(groups=>{for(const [key,g] of Object.entries(groups))for(const [kind,frames] of Object.entries(g))Object.assign(b.sets[key][kind],frames)}).catch(e=>{pending.delete(day);throw e}));return pending.get(day)}));
 clima(b,document.querySelector('#climaTool').parentElement);document.querySelector('#status').hidden=true;document.querySelector('#climaTool').click()}
window.addEventListener('unhandledrejection',()=>{const s=document.querySelector('#status');s.hidden=false;s.textContent='No se pudo cargar el período. Vuelve a seleccionar la fecha para reintentar.'});openClimate();
