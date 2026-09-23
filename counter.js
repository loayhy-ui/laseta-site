(function(){
  const API_BASE='https://counterapi.com/api/laseta.net/visitor/site';
  const MARKER='laseta_recorded_visitor_v1';
  const els=[...document.querySelectorAll('[data-visit-counter]')];
  if(!els.length)return;
  const setText=(v)=>els.forEach(el=>{el.textContent=Number(v).toLocaleString(document.documentElement.lang==='ar'?'ar-SA':'en-US');});
  const readValue=(data)=>{
    if(typeof data==='number')return data;
    if(!data||typeof data!=='object')return null;
    for(const k of ['count','value','total','views','visits']) if(Number.isFinite(Number(data[k]))) return Number(data[k]);
    if(data.data&&typeof data.data==='object') for(const k of ['count','value','total','views','visits']) if(Number.isFinite(Number(data.data[k]))) return Number(data.data[k]);
    return null;
  };
  async function get(url){
    const r=await fetch(url,{method:'GET',mode:'cors',cache:'no-store'});
    if(!r.ok)throw new Error('counter http '+r.status);
    const text=await r.text();
    try{return JSON.parse(text);}catch(_){const m=text.match(/\d+/);return m?Number(m[0]):null;}
  }
  (async()=>{
    try{
      const isNew=!localStorage.getItem(MARKER);
      const url=isNew?API_BASE:(API_BASE+'?readOnly=true');
      const data=await get(url);
      const value=readValue(data);
      if(value!==null)setText(value);
      if(isNew)localStorage.setItem(MARKER,'1');
    }catch(e){
      els.forEach(el=>{el.closest('[data-counter-wrap]')?.setAttribute('hidden','hidden');});
    }
  })();
})();