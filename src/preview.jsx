import React from 'react';
import { createRoot } from 'react-dom/client';
import NewComponent from './frontend/NewComponent.jsx';
const examples = [ ['Paris',48.8566,2.3522],['Delhi',28.6139,77.2090],['Kyoto',35.0116,135.7681],['Rome',41.9028,12.4964],['Kurukshetra',29.9695,76.8783],['New York City',40.71427,-74.00597],['Tokyo',35.6762,139.6503] ];
const root = createRoot(document.getElementById('root'));
let sidebar = false;
function render() {
  const select = document.getElementById('query');
  const [city,lat,long] = examples[select.selectedIndex];
  document.getElementById('root').style.maxWidth = sidebar ? '370px' : '1120px';
  root.render(<NewComponent format={sidebar ? 'sidebar' : 'mainline'} searchData={{query:select.value,entities:[{word:city,collectionType:'HD_LOCATION',entityInfo:{geo:{city,lat,long}}}]}} messageHandlers={{componentLoaded:() => {window.__componentLoaded = (window.__componentLoaded || 0)+1;}}}/>);
}
document.getElementById('query').onchange=render;
document.getElementById('format').onclick=() => {sidebar=!sidebar; document.getElementById('format').textContent=sidebar?'Switch to mainline':'Switch to sidebar';render();};
render();
