window.$id = (id) => document.getElementById(id);
window.uid = () => Math.random().toString(36).slice(2,10);
window.today = () => DB.todayKey();

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop();
  document.querySelectorAll('.tab').forEach(a=>{
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }

  // Inject space switcher if not present and header exists
  if (!document.getElementById('spaceSelect')){
    const header = document.querySelector('.header');
    if (header){
      const holder = header.querySelector('.row') || header;
      const sel = document.createElement('select'); sel.className='input'; sel.id='spaceSwitcher';
      const add = document.createElement('button'); add.className='button'; add.id='spaceAddSwitcher'; add.textContent='＋';
      holder.appendChild(sel); holder.appendChild(add);
      const render = ()=>{
        sel.innerHTML='';
        DB.listSpaces().forEach(name=>{ const o=document.createElement('option'); o.value=name; o.textContent=name; sel.appendChild(o); });
        sel.value = DB.getSpace();
      };
      render();
      sel.onchange = ()=>{ DB.setSpace(sel.value); location.reload(); };
      add.onclick = ()=>{ const name=prompt('Название нового пространства:'); if(!name) return; DB.setSpace(name.trim()); render(); location.reload(); };
    }
  }

  // Global search overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="panel">
      <div class="row">
        <input class="input" id="globalSearchInput" placeholder="Поиск: задачи и истории (нажми Esc чтобы закрыть)"/>
      </div>
      <div class="search-results" id="globalSearchResults"></div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#globalSearchInput');
  const results = overlay.querySelector('#globalSearchResults');

  function openOverlay(){ overlay.classList.add('show'); input.value=''; results.innerHTML=''; input.focus(); }
  function closeOverlay(){ overlay.classList.remove('show'); }

  function getAllTasks(){ try { return DB.get('tasks:v2', []); } catch { return []; } }
  function getAllStories(){ try { return DB.get('stories:v1', []); } catch { return []; } }

  function match(str, q){ return (str||'').toLowerCase().includes(q.toLowerCase()); }

  function doSearch(){
    const q = (input.value||'').trim(); results.innerHTML='';
    if(!q){ return; }
    const tasks = getAllTasks().filter(t=> match(t.title, q));
    const stories = getAllStories().filter(s=> match(s.title, q) || match(s.body, q) || (s.tags||[]).some(t=>match(t,q)));
    if(tasks.length){
      const h=document.createElement('div'); h.className='group-title'; h.textContent='Задачи'; results.appendChild(h);
      tasks.slice(0,20).forEach(t=>{
        const r=document.createElement('div'); r.className='result';
        r.innerHTML = `<div>${t.done?'✅':'⬜️'} ${t.title}</div><small>${t.due||''}</small>`;
        r.onclick = ()=>{ location.href = 'tasks.html'; };
        results.appendChild(r);
      });
    }
    if(stories.length){
      const h=document.createElement('div'); h.className='group-title'; h.textContent='Истории'; results.appendChild(h);
      stories.slice(0,20).forEach(s=>{
        const r=document.createElement('div'); r.className='result';
        r.innerHTML = `<div>${s.favorite?'★ ':''}${s.title}</div><small>${(s.tags||[]).map(x=>'#'+x).join(' ')}</small>`;
        r.onclick = ()=>{ location.href = `stories.html#story-${s.id}`; };
        results.appendChild(r);
      });
    }
    if(!tasks.length && !stories.length){ const e=document.createElement('div'); e.className='item'; e.innerHTML='<span>Ничего не найдено</span>'; results.appendChild(e); }
  }

  input.addEventListener('input', doSearch);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeOverlay(); });
  document.addEventListener('keydown', (e)=>{
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = activeTag==='input' || activeTag==='textarea' || document.activeElement?.isContentEditable;
    if(e.key==='/' && !isTyping){ e.preventDefault(); openOverlay(); }
    if(e.key==='Escape' && overlay.classList.contains('show')){ e.preventDefault(); closeOverlay(); }
  });
});
