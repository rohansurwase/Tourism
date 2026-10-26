export const CATEGORIES = {
  all: { label: 'All sights', icon: '✦', api: 'tourism.sights,tourism.attraction,entertainment.museum,leisure.park' },
  museums: { label: 'Museums', icon: '▥', api: 'entertainment.museum' },
  temples: { label: 'Temples', icon: '♧', api: 'tourism.sights.place_of_worship.temple' },
  monuments: { label: 'Monuments', icon: '♜', api: 'tourism.sights.memorial.monument' },
  forts: { label: 'Forts', icon: '⚑', api: 'tourism.sights.fort,tourism.sights.castle' },
  parks: { label: 'Parks', icon: '❧', api: 'leisure.park' },
  viewpoints: { label: 'Viewpoints', icon: '◉', api: 'tourism.attraction.viewpoint' },
  historic: { label: 'Historic sites', icon: '⌂', api: 'tourism.sights' }
};
export function inferCategory(query = '') {
  const rules = [['museums', /\bmuseums?\b/i], ['temples', /\btemples?\b/i], ['monuments', /\bmonuments?\b/i], ['forts', /\b(forts?|castles?)\b/i], ['parks', /\bparks?\b/i], ['viewpoints', /\bviewpoints?\b/i], ['historic', /\b(historic(al)? sites?|landmarks?)\b/i]];
  return rules.find(([, pattern]) => pattern.test(query))?.[0] || 'all';
}
export function coordinates(lat, lon) {
  return lat !== '' && lon !== '' && lat != null && lon != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180;
}
export function contextFromProps(props = {}) {
  const records = Array.isArray(props.searchData) ? props.searchData : [props.searchData];
  const record = records.find(r => r?.entities?.some(e => coordinates(e.entityInfo?.geo?.lat, e.entityInfo?.geo?.long))) || records.find(Boolean) || {};
  const entity = record.entities?.find(e => coordinates(e.entityInfo?.geo?.lat, e.entityInfo?.geo?.long));
  const geo = entity?.entityInfo?.geo;
  const query = record.query || props.searchQuery || '';
  const suggested = props.queryProps?.filters?.category;
  return { query, category: Object.hasOwn(CATEGORIES, suggested ?? '') ? suggested : inferCategory(query), center: geo ? { lat: Number(geo.lat), lon: Number(geo.long), name: geo.city || entity.word || geo.state || geo.country || 'Selected location' } : null };
}
export function distance(a, b) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function nearestOrder(places, center) {
  const left = [...places], result = [];
  let current = center;
  while (left.length) {
    left.sort((a, b) => distance(current, a) - distance(current, b));
    current = left.shift(); result.push(current);
  }
  return result;
}
export function safeURL(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function normalizePlaces(features, center, category, radius) {
  const seen = new Set(), allowed = CATEGORIES[category].api.split(',');
  return features.flatMap(feature => {
    const p = feature.properties || {}, raw = p.datasource?.raw || {}, cats = Array.isArray(p.categories) ? p.categories : [];
    const lat = p.lat ?? feature.geometry?.coordinates?.[1], lon = p.lon ?? feature.geometry?.coordinates?.[0];
    if (!p.name || !coordinates(lat, lon) || !cats.some(c => allowed.some(a => c === a || c.startsWith(a + '.')))) return [];
    if (cats.some(c => /^(catering|accommodation|commercial)(\.|$)/.test(c))) return [];
    const point = {lat: Number(lat), lon: Number(lon)}, km = distance(center, point);
    if (km * 1000 > radius + 25) return [];
    const id = String(p.place_id || `${p.name}:${lat}:${lon}`);
    if (seen.has(id)) return [];
    seen.add(id);
    const specific = [...cats].sort((a,b) => b.split('.').length - a.split('.').length).find(c => allowed.some(a => c === a || c.startsWith(a + '.'))) || cats[0];
    return [{ id, name: String(p.name), ...point, distance: km, kind: specific.split('.').at(-1).replaceAll('_', ' '), address: p.address_line2 || p.formatted || 'Address unavailable', description: p.description || raw['description:en'] || raw.description || '', website: safeURL(p.website || raw.website), hours: raw.opening_hours || '', categories: cats }];
  }).sort((a,b) => a.distance - b.distance).slice(0, 20);
}
