import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, contextFromProps, distance, nearestOrder } from '../shared/tourism.js';
import { demoCenter, demoPlaces } from './demo.js';
import './tourism.css';
const directions = p => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
function PocketMap({ places, center, selected, onSelect }) {
  const points = [center, ...places], lat0 = center.lat;
  const xs = points.map(p => (((p.lon - center.lon + 540) % 360) - 180) * Math.cos(lat0 * Math.PI / 180));
  const ys = points.map(p => p.lat - lat0);
  const span = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs), 0.006) * 2.5;
  const project = i => [150 + xs[i] / span * 260, 115 - ys[i] / span * 200];
  return <div className="te-map"><svg viewBox="0 0 300 230" role="img" aria-label="Relative positions of sights around the search centre; not a street map">
    {[35,75,115,155,195].map(y => <path key={y} d={`M0 ${y} H300`} className="te-grid"/>)}
    {[30,90,150,210,270].map(x => <path key={x} d={`M${x} 0 V230`} className="te-grid"/>)}
    <circle cx="150" cy="115" r="72" className="te-orbit"/><circle cx="150" cy="115" r="32" className="te-orbit"/>
    <path d="M145 115h10m-5-5v10" className="te-center"/>
    {places.map((p,i) => { const [x,y] = project(i+1); return <g key={p.id} className={`te-pin ${selected === p.id ? 'active' : ''}`} role="button" tabIndex="0" aria-label={`Show ${p.name}`} onClick={() => onSelect(p.id)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); onSelect(p.id);}}}><title>{p.name}</title><circle cx={x} cy={y} r="12"/><text x={x} y={y+4} textAnchor="middle">{i+1}</text></g>; })}
    <text x="278" y="22" className="te-north">N ↑</text>
  </svg><p>Relative positions · + search centre<br/>Not a street map; markers may overlap.</p></div>;
}
export default function NewComponent(props) {
  const context = contextFromProps(props), centerKey = context.center ? `${context.center.lat},${context.center.lon},${context.center.name}` : '';
  const [category, setCategory] = useState(context.category), [radius, setRadius] = useState('5000'), [mode, setMode] = useState('live');
  const [places, setPlaces] = useState([]), [state, setState] = useState('loading'), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [plan, setPlan] = useState([]), [tab, setTab] = useState('discover'), [selected, setSelected] = useState(null), [theme, setTheme] = useState(null), [notice, setNotice] = useState('');
  const loaded = useRef(false), handlers = useRef(props.messageHandlers); handlers.current = props.messageHandlers;
  const center = mode === 'demo' ? demoCenter : context.center;
  const API_URL = process.env.NODE_ENV === 'production' ? props.deployedBackendURL ?? '' : import.meta.env.VITE_API_URL;
  useEffect(() => {setCategory(context.category); setMode('live');}, [context.category, context.query, centerKey]);
  useEffect(() => {setPlan([]); setSelected(null); setNotice('');}, [centerKey, mode]);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setPlaces([]); setError(''); setSelected(null);
    if (!center) {setState('missing'); return () => controller.abort();}
    if (mode === 'demo') {
      const allowed = CATEGORIES[category].api.split(',');
      setPlaces(demoPlaces.map(p => ({...p, distance: distance(center,p)})).filter(p => p.distance * 1000 <= Number(radius) && p.categories.some(c => allowed.some(a => c === a || c.startsWith(a+'.')))).sort((a,b) => a.distance-b.distance)); setState('ready'); return () => controller.abort();
    }
    setState('loading');
    const timer = setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        const params = new URLSearchParams({lat: center.lat, lon: center.lon, category, radius});
        const response = await fetch(`${(API_URL || '').replace(/\/$/, '')}/api/places?${params}`, {signal: controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Search could not be completed.');
        if (!Array.isArray(data.places)) throw new Error('The service returned an unexpected response.');
        if (active) {setPlaces(data.places); setState('ready');}
      } catch (err) {if (active) {setError(err.name === 'AbortError' ? 'Search took too long. Please retry.' : err.message === 'Failed to fetch' ? 'Cannot reach the backend. Check that it is running, then retry.' : err.message); setState('error');}}
      finally {clearTimeout(timer);}
    })();
    return () => {active = false; clearTimeout(timer); controller.abort();};
  }, [centerKey, mode, category, radius, retry, API_URL]);
  useEffect(() => {if (state !== 'loading' && !loaded.current && handlers.current?.componentLoaded) {loaded.current = true; handlers.current.componentLoaded();}}, [state, props.messageHandlers]);
  const totalDistance = useMemo(() => center ? plan.reduce((sum,p,i) => sum + distance(i ? plan[i-1] : center,p), 0) : 0, [plan, center?.lat, center?.lon]);
  function togglePlan(p) {setNotice(''); setPlan(previous => previous.some(x => x.id === p.id) ? previous.filter(x => x.id !== p.id) : previous.length < 6 ? [...previous,p] : previous);}
  function move(index, delta) {setPlan(prev => {const next = [...prev]; [next[index], next[index+delta]] = [next[index+delta], next[index]]; return next;});}
  function exportPlan() {
    const content = `${mode === 'demo' ? 'DEMO — ' : ''}Pocket day plan: ${center.name}\n\n${plan.map((p,i) => `${i+1}. ${p.name}\n${p.address}\n${directions(p)}`).join('\n\n')}\n\nStraight-line distance from search centre: ${totalDistance.toFixed(1)} km. Not a walking route. Check opening hours and tickets.\nSource: ${mode === 'demo' ? 'Curated demo fixtures' : 'Geoapify / OpenStreetMap'}\n`;
    const url = URL.createObjectURL(new Blob([content], {type:'text/plain'})); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'pocket-day-plan.txt'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url),1000); setNotice('Plan exported.');
  }
  const currentTheme = theme || props.theme?.palette?.mode || props.theme?.mode || (typeof props.theme === 'string' ? props.theme : 'auto');
  return <section className={`te ${props.format === 'sidebar' ? 'te-sidebar' : ''}`} data-theme={currentTheme} aria-label="Tourism Explorer">
    <header className="te-header"><div className="te-brand"><span className="te-logo">↗</span><span>FIELDNOTES <small>TOURISM EXPLORER</small></span></div><button className="te-icon-button" aria-label="Toggle light or dark theme" onClick={() => setTheme((currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'light' : 'dark')}>◐</button></header>
    <div className="te-hero"><div className="te-eyebrow">A LITTLE CURIOSITY. A GREAT DAY OUT.</div><h1>{center ? <>Your day in <em>{center.name}.</em></> : <>Where will you <em>wander?</em></>}</h1><p>Find a few places worth your time.<br/>Then make the day your own.</p><div className="te-stamp" aria-hidden="true">GO<br/><span>EXPLORE</span><br/>↗</div></div>
    {mode === 'demo' && <div className="te-banner">Demo · curated Paris examples, not live results. <button onClick={() => setMode('live')}>Return to live search</button></div>}
    <nav className="te-tabs" aria-label="Views"><button aria-pressed={tab === 'discover'} onClick={() => setTab('discover')}>01 / Discover</button><button aria-pressed={tab === 'plan'} onClick={() => setTab('plan')}>02 / My day <span>{plan.length}</span></button></nav>
    {tab === 'discover' ? <><div className="te-filters"><div className="te-chips" aria-label="Attraction categories">{Object.entries(CATEGORIES).map(([key,c]) => <button key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>{c.icon} {c.label}</button>)}</div><label className="te-radius">Search radius <select value={radius} onChange={e => setRadius(e.target.value)}>{[2,5,10,20].map(km => <option key={km} value={km*1000}>{km} km</option>)}</select></label></div>
    {state === 'loading' && <div className="te-status" role="status"><div className="te-loader"/><h2>Finding your next detour…</h2><p>Looking for real places near {center?.name}.</p></div>}
    {state === 'missing' && <div className="te-status"><h2>Start with a place.</h2><p>Search “things to do in Paris” or “museums in Delhi” in hyperDart. We use the location resolved by the platform.</p><button className="te-primary" onClick={() => setMode('demo')}>Explore the Paris demo ↗</button></div>}
    {state === 'error' && <div className="te-status" role="alert"><h2>A small detour.</h2><p>{error}</p><div className="te-actions"><button className="te-primary" onClick={() => setRetry(v => v+1)}>Try again</button><button onClick={() => setMode('demo')}>Explore labelled demo</button></div></div>}
    {state === 'ready' && (places.length ? <div className="te-results"><div><div className="te-section-title"><h2>{places.length} places to explore</h2><span>NEAREST FIRST</span></div><p className="te-muted">Within {Number(radius)/1000} km of the search centre. Up to 20 results.</p><div className="te-cards">{places.map((p,i) => {const added = plan.some(x => x.id === p.id); return <article key={p.id} id={`place-${p.id}`} className={`te-card ${selected === p.id ? 'te-selected' : ''}`}><div className="te-card-top"><span className="te-number">{String(i+1).padStart(2,'0')}</span><span className="te-kind">{p.kind}</span><span className="te-distance">{p.distance.toFixed(1)} km</span></div><h3>{p.name}</h3><p className="te-address">⌖ {p.address}</p><p className="te-description">{p.description || 'No description supplied. Open directions to explore this place.'}</p>{p.hours && <details><summary>Reported opening hours</summary><p>{p.hours}</p><small>Source notation; confirm before visiting.</small></details>}<div className="te-card-bottom"><a href={directions(p)} target="_blank" rel="noopener noreferrer">Directions ↗</a>{p.website && <a href={p.website} target="_blank" rel="noopener noreferrer">Website ↗</a>}<button disabled={!added && plan.length >= 6} aria-pressed={added} aria-label={`${added ? 'Remove' : 'Add'} ${p.name} ${added ? 'from' : 'to'} day plan`} onClick={() => togglePlan(p)}>{added ? '✓ Saved' : '+ My day'}</button></div></article>;})}</div></div><aside className="te-aside"><div className="te-section-title"><h2>Get your bearings</h2><span>⌖</span></div><PocketMap places={places} center={center} selected={selected} onSelect={id => {setSelected(id); document.getElementById(`place-${id}`)?.scrollIntoView({behavior:'smooth',block:'nearest'});}}/><div className="te-tip"><span>MAKE ROOM FOR A DETOUR</span><h3>Less rushing.<br/>More discovering.</h3><p>Save up to six places. Put nearby stops together, then leave time for what catches your eye.</p><button onClick={() => setTab('plan')}>Build my day →</button></div></aside></div> : <div className="te-status" role="status"><h2>No matching places here yet.</h2><p>Try a wider radius or another category. Coverage varies by location; this does not mean there are no attractions.</p><button onClick={() => {setCategory('all'); setRadius('20000');}}>Show all sights within 20 km</button></div>)}</> : <div className="te-plan"><div className="te-section-title"><h2>A day, at your pace.</h2><span>{plan.length} / 6 STOPS</span></div>{plan.length ? <><p>{totalDistance.toFixed(1)} km straight-line chain from the search centre. This is not a walking distance or travel-time estimate.</p><div className="te-actions"><button onClick={() => setPlan(nearestOrder(plan, center))}>Order nearby stops</button><button onClick={exportPlan}>Export plan ↓</button><button onClick={() => setPlan([])}>Clear</button></div><ol className="te-plan-list">{plan.map((p,i) => <li key={p.id}><span className="te-number">{i+1}</span><div><h3>{p.name}</h3><p>{p.address}</p><a href={directions(p)} target="_blank" rel="noopener noreferrer">Directions ↗</a></div><div className="te-reorder"><button aria-label={`Move ${p.name} up`} disabled={i===0} onClick={() => move(i,-1)}>↑</button><button aria-label={`Move ${p.name} down`} disabled={i===plan.length-1} onClick={() => move(i,1)}>↓</button><button aria-label={`Remove ${p.name}`} onClick={() => togglePlan(p)}>×</button></div></li>)}</ol><div className="te-banner">Suggested order uses nearest-next straight-line distances, not route optimisation. Check opening hours, tickets and access before heading out. Your plan lasts for this session.</div></> : <div className="te-status"><h2>Leave a little room for wonder.</h2><p>Tap “+ My day” on any sight to start a plan.</p><button className="te-primary" onClick={() => setTab('discover')}>Find my first stop ↗</button></div>}<span role="status">{notice}</span></div>}
    <footer className="te-footer"><span>FIELDNOTES / TAKE THE SCENIC ROUTE</span><span>{mode === 'demo' ? 'Demo fixtures · not live data' : <><a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></>}</span></footer>
  </section>;
}
