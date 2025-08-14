const SKEY_STORIES = 'stories:v1';

const storyTitle = $id('storyTitle');
const storyTags = $id('storyTags');
const storyBody = $id('storyBody');
const addStory = $id('addStory');
const storiesList = $id('storiesList');
const storiesSearch = $id('storiesSearch');

function getStories(){ return DB.get(SKEY_STORIES, []); }
function setStories(arr){ DB.set(SKEY_STORIES, arr); }

function parseTags(s){
  return (s||'').split(',').map(t=>t.trim()).filter(Boolean);
}

function addNewStory(){
  const title = (storyTitle.value||'').trim();
  const body = (storyBody.value||'').trim();
  const tags = parseTags(storyTags.value);
  if(!title && !body) return;
  const list = getStories();
  list.unshift({ id: uid(), title: title||'Без названия', body, tags, favorite:false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  setStories(list);
  storyTitle.value=''; storyBody.value=''; storyTags.value='';
  renderStories();
}

function delStory(id){ setStories(getStories().filter(s=>s.id!==id)); renderStories(); }
function toggleFav(id){ const list=getStories(); const s=list.find(x=>x.id===id); if(!s) return; s.favorite=!s.favorite; s.updated_at=new Date().toISOString(); setStories(list); renderStories(); }
function editStory(id){
  const list=getStories(); const s=list.find(x=>x.id===id); if(!s) return;
  const t = prompt('Заголовок:', s.title)||s.title;
  const b = prompt('Текст (одно поле, для многострочного лучше редактировать внизу и снова сохранить):', s.body)||s.body;
  const tg = prompt('Теги через запятую:', (s.tags||[]).join(', '))||'';
  s.title=t; s.body=b; s.tags=parseTags(tg); s.updated_at=new Date().toISOString(); setStories(list); renderStories();
}

function matches(story, q){
  if(!q) return true; const s = q.toLowerCase();
  return (story.title||'').toLowerCase().includes(s)
    || (story.body||'').toLowerCase().includes(s)
    || (story.tags||[]).some(t=>t.toLowerCase().includes(s));
}

function renderStories(){
  const q = (storiesSearch?.value||'').trim();
  const list = getStories().filter(s=>matches(s,q));
  storiesList.innerHTML='';
  if(!list.length){ const empty=document.createElement('div'); empty.className='item'; empty.innerHTML='<span>Нет историй</span>'; storiesList.appendChild(empty); return; }
  list.forEach(s=>{
    const row=document.createElement('div'); row.className='item'; row.id = `story-${s.id}`;
    const tags = (s.tags||[]).map(t=>`<span class="chip">#${t}</span>`).join(' ');
    row.innerHTML = `
      <div style="display:grid;gap:6px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <b>${s.title}</b>
          ${tags}
          ${s.favorite?'<span class="chip">★ Избранное</span>':''}
        </div>
        <small class="tag">${new Date(s.updated_at||s.created_at).toLocaleString()}</small>
        <div class="story-snippet">${(s.body||'').slice(0,220)}${(s.body||'').length>220?'…':''}</div>
      </div>
      <div class="actions">
        <button class="button" data-act="fav">${s.favorite?'Убрать ★':'В избранное ★'}</button>
        <button class="button" data-act="edit">Редактировать</button>
        <button class="button" data-act="del">Удалить</button>
      </div>
    `;
    row.querySelector('[data-act="fav"]').onclick=()=>toggleFav(s.id);
    row.querySelector('[data-act="edit"]').onclick=()=>editStory(s.id);
    row.querySelector('[data-act="del"]').onclick=()=>delStory(s.id);
    storiesList.appendChild(row);
  });
}

addStory.onclick = addNewStory;
storiesSearch?.addEventListener('input', renderStories);
document.addEventListener('DOMContentLoaded', ()=>{
  // If opened with #story-xxx anchor, scroll after render
  renderStories();
  if (location.hash.startsWith('#story-')) {
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block:'start' });
  }
});