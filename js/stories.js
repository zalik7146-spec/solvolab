const SKEY_STORIES = 'stories:v1';

const storyTitle = $id('storyTitle');
const storyTags = $id('storyTags');
const storyBody = $id('storyBody');
const storyImages = $id('storyImages');
const addStory = $id('addStory');
const storiesList = $id('storiesList');
const storiesSearch = $id('storiesSearch');
const togglePreviewBtn = $id('togglePreview');
const storyPreview = $id('storyPreview');
const composerThumbs = $id('composerThumbs');

function getStories(){ return DB.get(SKEY_STORIES, []); }
function setStories(arr){ DB.set(SKEY_STORIES, arr); }

function parseTags(s){
  return (s||'').split(',').map(t=>t.trim()).filter(Boolean);
}

function md(text){
  // Very small markdown: **bold**, *italic*, `code`, lines -> <br>
  const esc = (s)=> s.replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  let out = esc(text||'');
  out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
           .replace(/\*(.+?)\*/g, '<i>$1</i>')
           .replace(/`(.+?)`/g, '<code>$1</code>')
           .replace(/\n/g, '<br>');
  return out;
}

let imagesData = [];
function resetComposer(){ imagesData = []; composerThumbs.innerHTML=''; storyTitle.value=''; storyBody.value=''; storyTags.value=''; storyPreview.style.display='none'; storyPreview.innerHTML=''; }

storyImages?.addEventListener('change', async (e)=>{
  const files = Array.from(e.target.files||[]).slice(0,12);
  for(const f of files){
    const url = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); });
    imagesData.push(url);
  }
  renderComposerThumbs();
});

function renderComposerThumbs(){
  composerThumbs.innerHTML='';
  imagesData.forEach((src, idx)=>{
    const img = document.createElement('img'); img.src = src; img.alt = 'img';
    img.title = 'Нажми, чтобы удалить';
    img.onclick = ()=>{ imagesData.splice(idx,1); renderComposerThumbs(); };
    composerThumbs.appendChild(img);
  });
}

togglePreviewBtn?.addEventListener('click', ()=>{
  if(storyPreview.style.display==='none'){ storyPreview.style.display='block'; storyPreview.innerHTML = md(storyBody.value); }
  else { storyPreview.style.display='none'; }
});

function addNewStory(){
  const title = (storyTitle.value||'').trim();
  const body = (storyBody.value||'').trim();
  const tags = parseTags(storyTags.value);
  if(!title && !body && imagesData.length===0) return;
  const list = getStories();
  list.unshift({ id: uid(), title: title||'Без названия', body, tags, favorite:false, images:[...imagesData], created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  setStories(list);
  resetComposer();
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
    const imgCount = (s.images||[]).length ? `<span class=\"chip\">🖼 ${s.images.length}</span>` : '';
    row.innerHTML = `
      <div style="display:grid;gap:6px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <b>${s.title}</b>
          ${tags}
          ${imgCount}
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
  renderStories();
  const saved = DB.get('stories:composer:images', []);
  imagesData = Array.isArray(saved) ? saved : [];
  renderComposerThumbs();
});

// persist composer images during typing session
window.addEventListener('beforeunload', ()=>{ DB.set('stories:composer:images', imagesData); });