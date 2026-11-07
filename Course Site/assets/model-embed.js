/* The same model views serve the shared selector; old direct URLs return there. */
(() => {
  const embedded=new URLSearchParams(location.search).get('embed')==='1';
  const hydraulic=location.pathname.endsWith('/hydraulic.html');
  if(!embedded){const key=hydraulic?'hydraulic':location.hash==='#motor'?'motor':'tank';location.replace('../model-simulation.html#'+key);return;}
  document.documentElement.classList.add('model-embedded');
  if(!hydraulic){
    const playback=document.createElement('div');playback.className='model-playback';
    ['.play-controls','.scrub-label','#scrub'].forEach(q=>{const el=document.querySelector(q);if(el)playback.append(el);});
    document.querySelector('.parameters').prepend(playback);
    const more=document.createElement('details');more.className='model-more';
    const summary=document.createElement('summary');summary.textContent='Response and model';more.append(summary);
    const section=document.querySelector('.animation-section');
    section.after(more);
    ['.response-card','.definition','.derivation'].forEach(q=>{const el=document.querySelector(q);if(el)more.append(el);});
    more.addEventListener('toggle',()=>{if(more.open)window.dispatchEvent(new Event('resize'));report();});
  }
  function report(){const height=Math.ceil(document.body.getBoundingClientRect().height)+4;if(height<100)return;parent.postMessage({type:'model-size',height},location.origin==='null'?'*':location.origin);}
  new ResizeObserver(report).observe(document.body);
  window.addEventListener('load',report);
  window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||!e.data)return;if(e.data.type==='model-pause')document.dispatchEvent(new Event('model-pause'));if(e.data.type==='model-resize'){window.scrollTo(0,0);report();}});
})();
