import test from 'node:test';
import assert from 'node:assert/strict';
import { inferCategory, contextFromProps, coordinates, distance, normalizePlaces, nearestOrder, safeURL } from '../src/shared/tourism.js';
import app from '../src/backend/index.js';
const center = {lat: 28.61, lon: 77.21};
const feature = (overrides = {}) => ({properties:{name:'Museum',lat:28.611,lon:77.21,place_id:'one',categories:['entertainment.museum'],...overrides}});
test('query categories, word boundaries and default', () => {
  for (const [query,category] of [['museums in Delhi','museums'],['temples in Kyoto','temples'],['fort in Jaipur','forts'],['parks in Tokyo','parks'],['landmarks in Rome','historic'],['monuments in Paris','monuments'],['viewpoints in Tokyo','viewpoints'],['Things to do in Paris','all'],['Parksville attractions','all']]) assert.equal(inferCategory(query),category);
});
test('array and object props resolve actual entity coordinates, including zero', () => {
  const data = {query:'Museums in Delhi',entities:[{entityInfo:{geo:{lat:0,long:0,city:'Origin'}}}]};
  assert.equal(contextFromProps({searchData:[{},data]}).category,'museums');
  assert.equal(contextFromProps({searchData:data}).center.lat,0);
  assert.equal(contextFromProps({}).center,null);
  assert.equal(contextFromProps({searchData:data,queryProps:{filters:{category:'parks'}}}).category,'parks');
});
test('coordinates reject blanks, missing, nonfinite and out of range', () => {
  for (const values of [[null,0],['',0],['no',0],[91,0],[0,-181],[Infinity,0]]) assert.equal(coordinates(...values),false);
  assert.equal(coordinates('28.61','77.21'),true);
});
test('normalisation filters wrong categories, commercial results, duplicates, unnamed and distant places', () => {
  const features = [feature(),feature(),feature({place_id:'two',categories:['commercial.shop','entertainment.museum']}),feature({place_id:'three',categories:['tourism.sights.fort']}),feature({name:''}),feature({lat:40}),feature({lat:NaN})];
  assert.equal(normalizePlaces(features,center,'museums',5000).length,1);
  assert.equal(normalizePlaces([feature({datasource:{raw:{description:'Source description',website:'javascript:alert(1)'}}})],center,'museums',5000)[0].website,null);
});
test('distance and nearest-next ordering', () => {
  assert.equal(distance(center,center),0);
  assert.ok(Math.abs(distance({lat:0,lon:0},{lat:0,lon:1})-111.195)<0.01);
  const points = [{id:'far',lat:0,lon:2},{id:'near',lat:0,lon:1}];
  assert.deepEqual(nearestOrder(points,{lat:0,lon:0}).map(p=>p.id),['near','far']);
  assert.equal(points[0].id,'far');
  assert.equal(safeURL('data:text/html,x'),null);
});
test('API rejects malformed inputs and explains missing key', async () => {
  for (const query of ['', '?lat=0&lon=0&category=invalid', '?lat=91&lon=0', '?lat=0&lon=0&radius=999999']) assert.equal((await app.request('/api/places'+query,{},{})).status,400);
  assert.equal((await app.request('/api/places?lat=0&lon=0',{},{})).status,503);
});
test('API passes longitude first, a 20-result cap, and category; returns normalised data', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => {assert.equal(url.searchParams.get('filter'),'circle:77.21,28.61,5000'); assert.equal(url.searchParams.get('limit'),'20'); assert.equal(url.searchParams.get('categories'),'entertainment.museum'); return Response.json({features:[feature()]});};
  try {const response = await app.request('/api/places?lat=28.61&lon=77.21&category=museums',{}, {GEOAPIFY_API_KEY:'test-secret'}); assert.equal(response.status,200); const text = await response.text(); assert.ok(!text.includes('test-secret')); assert.equal(JSON.parse(text).places.length,1);} finally {globalThis.fetch = original;}
});
test('API handles empty, rate-limited, malformed and unavailable upstream', async () => {
  const original = globalThis.fetch;
  try {
    for (const [mock, status] of [[async()=>Response.json({features:[]}),200],[async()=>new Response('',{status:429}),429],[async()=>Response.json({unexpected:true}),502],[async()=>{throw new Error('network');},502],[async()=>{throw new DOMException('timeout','TimeoutError');},502]]) {globalThis.fetch=mock; assert.equal((await app.request('/api/places?lat=0&lon=0',{}, {GEOAPIFY_API_KEY:'test'})).status,status);}
  } finally {globalThis.fetch=original;}
});
test('CORS allows configured platform domains and rejects unrelated origins', async () => {
  const request = origin => app.request('/api/health',{headers:{Origin:origin}}, {PROD_DOMAIN:'https://example.test'});
  assert.equal((await request('https://example.test')).headers.get('access-control-allow-origin'),'https://example.test');
  assert.equal((await request('https://unrelated.test')).headers.get('access-control-allow-origin'),null);
});
