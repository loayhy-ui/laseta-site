(function(){
  const MARKER='laseta_recorded_visitor_v2';
  const imgs=[...document.querySelectorAll('[data-visit-counter-img]')];
  if(!imgs.length)return;
  const base='https://counterapi.com/counter.svg?ns=laseta.net&action=view&key=site-visitors&color=0f2f2a&style=flat-square&label=Visitors';
  let isNew=false;
  try{isNew=!localStorage.getItem(MARKER);}catch(_){isNew=true;}
  const src=isNew?base:(base+'&readOnly=true');
  imgs.forEach(img=>{
    img.src=src;
    img.alt='Recorded visitors';
    img.addEventListener('error',()=>{img.closest('[data-counter-wrap]')?.setAttribute('hidden','hidden');},{once:true});
  });
  if(isNew){try{localStorage.setItem(MARKER,'1');}catch(_){}}
})();