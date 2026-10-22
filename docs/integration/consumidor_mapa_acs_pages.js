/* AIS-MAG Pages v2 — cliente de archivos públicos, sin credenciales.
   BASE = https://USUARIO.github.io/REPOSITORIO/
   No descarga historial al abrir el mapa; solo bajo acción explícita.
 */
export function aisMagPages(BASE) {
  const base = String(BASE).replace(/\/+$/, '') + '/';
  let cachedManifest = null;
  const getJson = async path => {
    if (path.startsWith('/') || path.includes('..')) throw new Error('Ruta no permitida');
    const response = await fetch(base + path, {cache: 'no-store'});
    if (!response.ok) throw new Error(`AIS-MAG HTTP ${response.status}: ${path}`);
    return response.json();
  };
  async function getManifest({refresh = false} = {}) {
    if (refresh || !cachedManifest) cachedManifest = await getJson('data/manifest.json');
    if (cachedManifest.schema !== 'ais-mag-pages-v2') throw new Error('Versión de manifiesto no compatible');
    return cachedManifest;
  }
  async function getLatest() {
    const result = await getJson('data/latest.geojson');
    if (result.type !== 'FeatureCollection') throw new Error('GeoJSON inválido');
    return result;
  }
  const uniqSorted = points => {
    const used = new Set();
    return points.filter(p => {
      const id = `${p[0]}/${p[1]}`;
      if (used.has(id)) return false;
      used.add(id);
      return true;
    }).sort((a,b) => a[1] - b[1]);
  };
  const segments = (points, ixLon, ixLat) => {
    const paths = [];
    let current = [];
    for (const p of points) {
      const coord = [p[ixLon], p[ixLat]];
      if (current.length && p[1] - current[current.length - 1].time > 7200) {
        if (current.length >= 2) paths.push(current.map(e => e.coord));
        current = [];
      }
      current.push({time:p[1],coord});
    }
    if (current.length >= 2) paths.push(current.map(e => e.coord));
    return paths;
  };
  async function getVesselHistory(mmsi) {
    const id = String(mmsi);
    if (!/^\d{9}$/.test(id)) throw new Error('MMSI debe contener 9 dígitos');
    const manifest = await getManifest({refresh: true});
    const entry = manifest.historico_naves[id];
    if (!entry) return {mmsi:id, puntos:[], trayectos:[], encontrado:false};
    const obj = await getJson('data/' + entry.archivo);
    const cutoff = Date.parse(manifest.fecha_minima_utc) / 1000;
    const pts = obj.puntos.filter(p => p[0] >= cutoff).sort((a,b) => a[0]-b[0]);
    // Estructura: nave [tiempo, lon, lat, velocidad, rumbo]
    const norm = pts.map(p => [id,...p]);
    return {mmsi:id, nombre:obj.nombre, puntos:pts,
      trayectos:segments(norm,2,3), encontrado:true, actualizado_utc: manifest.publicado_utc};
  }
  const intersections = (bbox,cell) => {
    const [s,w] = cell.split('_').map(Number);
    return bbox[0] <= w+1 && bbox[2] >= w && bbox[1] <= s+1 && bbox[3] >= s;
  };
  async function getAreaHistory(bbox, {days=15, onProgress=null}={}) {
    if (!Array.isArray(bbox) || bbox.length!==4 || bbox.some(x=>typeof x!=='number'||!Number.isFinite(x))) throw new Error('bbox=[oeste,sur,este,norte]');
    const [w,s,e,n] = bbox;
    if (w>=e || s>=n || e-w>2 || n-s>2 || w < -180 || e > 180 || s < -90 || n > 90) throw new Error('Seleccionar área de hasta 2° x 2°');
    if (!Number.isInteger(days) || days<1 || days>15) throw new Error('Historial máximo 15 días');
    const manifest = await getManifest({refresh: true});
    const maxEnd = Date.parse(manifest.publicado_utc)/1000;
    const cutoff = Math.max(maxEnd - days * 86400, Date.parse(manifest.fecha_minima_utc)/1000);
    const filePaths = [];
    for (const [day,cells] of Object.entries(manifest.historico_areas)) {
      if (new Date(day+'T23:59:59Z').getTime()/1000 < cutoff) continue;
      for (const [cell, info] of Object.entries(cells)) {
        if (intersections(bbox,cell)) filePaths.push('data/'+info.archivo);
      }
    }
    const result = [];
    // Límite de concurrencia para no bloquear navegador ni abusar del CDN.
    let completed = 0;
    for (let i=0; i<filePaths.length; i+=4) {
      const batch = await Promise.all(filePaths.slice(i,i+4).map(getJson));
      for (const block of batch) {
        for (const p of block.puntos) {
          // área [MMSI, unix, lon, lat, sog, cog]
          if (p[1]>=cutoff && p[2]>=w && p[2]<=e && p[3]>=s && p[3]<=n) result.push(p);
        }
      }
      completed += batch.length;
      if (onProgress) onProgress(completed, filePaths.length);
    }
    const points = uniqSorted(result);
    const byVessel = {};
    for (const p of points) (byVessel[p[0]] ??= []).push(p);
    const vessels = Object.entries(byVessel).map(([mmsi,puntos])=>({
      mmsi, nombre:manifest.historico_naves[mmsi]?.nombre ?? null,
      puntos, trayectos:segments(puntos,2,3)
    }));
    return {bbox, days, embarcaciones:vessels, cantidad_embarcaciones:vessels.length,
      cantidad_posiciones:points.length, archivos_descargados:filePaths.length,
      actualizado_utc: manifest.publicado_utc};
  }
  return {getLatest, getManifest, getVesselHistory, getAreaHistory};
}
