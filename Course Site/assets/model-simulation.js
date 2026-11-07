/* One local interface, three sibling model panels. Models pause when hidden. */
(() => {
  const keys=['hydraulic','tank','motor'];
  const tabs=keys.map(k=>document.getElementById('tab-'+k));
  const frames=keys.map(k=>document.getElementById('viewer-'+k));
  let active='';
  function select(key,focus=false){
    if(!keys.includes(key))key='hydraulic';
    keys.forEach((k,i)=>{
      const selected=k===key;
      if(!selected&&frames[i].getAttribute('src'))frames[i].contentWindow.postMessage({type:'model-pause'},location.origin==='null'?'*':location.origin);
      tabs[i].setAttribute('aria-selected',String(selected));tabs[i].tabIndex=selected?0:-1;
      document.getElementById('panel-'+k).hidden=!selected;
      if(selected&&!frames[i].getAttribute('src'))frames[i].src=frames[i].dataset.src;
      else if(selected)frames[i].contentWindow.postMessage({type:'model-resize'},location.origin==='null'?'*':location.origin);
    });
    active=key;history.replaceState(null,'','#'+key);window.scrollTo(0,0);
    if(focus)tabs[keys.indexOf(key)].focus();
  }
  tabs.forEach((tab,i)=>{
    tab.onclick=()=>select(keys[i]);
    tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:keys.length-1))%keys.length;select(keys[next],true);}};
  });
  frames.forEach((f,i)=>f.addEventListener('load',()=>{document.getElementById('loading-'+keys[i]).hidden=true;f.contentWindow.postMessage({type:'model-resize'},location.origin==='null'?'*':location.origin);}));
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||!e.data||e.data.type!=='model-size')return;
    const frame=frames.find(f=>f.contentWindow===e.source);
    if(!frame||!Number.isFinite(e.data.height))return;
    document.getElementById('loading-'+keys[frames.indexOf(frame)]).hidden=true;
    const height=Math.ceil(Math.max(300,Math.min(4000,e.data.height)));
    if(frame.style.height!==height+'px')frame.style.height=height+'px';
  });
  window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(key!==active)select(key);});
  select(location.hash.slice(1));
})();
