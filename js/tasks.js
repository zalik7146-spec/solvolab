// Модель: единый список tasks со сроком (due) и статусом
const SKEY = 'tasks:v2';
const nowISO = () => new Date().toISOString();
const todayKey = () => DB.todayKey();

const Views = { INBOX:'inbox', TODAY:'today', PLANNED:'planned', LOG:'log' };

const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

const state = {
  view: DB.get('tasks:view', Views.INBOX)
};

const getTasks = () => DB.get(SKEY, []);
const setTasks = (arr) => DB.set(SKEY, arr);

function addTask(title, due=null){
  const t = {
    id: uid(),
    title,
    done: false,
    created_at: nowISO(),
    completed_at: null,
    due // YYYY-MM-DD | null
  };
  const list = getTasks();
  list.unshift(t);
  setTasks(list);
}

function toggleDone(id){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.done = !t.done;
  t.completed_at = t.done ? nowISO() : null;
  setTasks(list);
}

function setDue(id, due){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.due = due || null;
  setTasks(list);
}

function delTask(id){
  const list = getTasks().filter(x=>x.id!==id);
  setTasks(list);
}

function renameTask(id, title){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.title = title;
  setTasks(list);
}

function byView(view, items){
  const d = todayKey();
  if(view===Views.INBOX)   return items.filter(t=>!t.done && !t.due);
  if(view===Views.TODAY)   return items.filter(t=>!t.done && t.due===d);
  if(view===Views.PLANNED) return items.filter(t=>!t.done && t.due && t.due>d);
  if(view===Views.LOG)     return items.filter(t=>t.done);
  return items;
}

function render(){
  DB.set('tasks:view', state.view);
  $$('#viewSeg button').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view));

  const wrap = $('#taskList');
  const list = byView(state.view, getTasks());
  wrap.innerHTML = '';

  if(!list.length){
    const empty = document.createElement('div');
    empty.className='item';
    empty.innerHTML = '<span>Пусто. Добавь первую задачу.</span><small>⌘↩ — быстрое добавление</small>';
    wrap.appendChild(empty);
    return;
  }

  // drag and drop
  let dragIndex = null;

  list.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item'; row.draggable = true; row.dataset.index = String(idx);
    const dueBadge = t.due ? `<span class="badge">${t.due===todayKey()?'Сегодня':t.due}</span>` : '';
    row.innerHTML = `
      <div class="task">
        <span class="chk ${t.done?'done':''}" data-act="toggle">${t.done?'✓':''}</span>
        <div class="title ${t.done?'done':''}" contenteditable="true" spellcheck="false">${t.title}</div>
        ${dueBadge}
      </div>
      <div class="actions">
        <button class="button" data-act="due">Срок</button>
        <button class="button" data-act="del">Удалить</button>
      </div>
    `;

    // DnD handlers
    row.addEventListener('dragstart', ()=>{ dragIndex = idx; row.style.opacity = '0.6'; });
    row.addEventListener('dragend', ()=>{ dragIndex = null; row.style.opacity = ''; $$('.item.drag-over', wrap).forEach(el=>el.classList.remove('drag-over')); });
    row.addEventListener('dragover', (e)=>{ e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', ()=>{ row.classList.remove('drag-over'); });
    row.addEventListener('drop', (e)=>{
      e.preventDefault(); row.classList.remove('drag-over');
      const targetIndex = idx;
      if (dragIndex===null || dragIndex===targetIndex) return;
      const full = getTasks();
      // Build view indices map to full list indices
      const viewIds = list.map(x=>x.id);
      const fullIndices = viewIds.map(id=> full.findIndex(f=>f.id===id));
      // Move in view order
      const [moved] = fullIndices.splice(dragIndex, 1);
      fullIndices.splice(targetIndex, 0, moved);
      // Rebuild full list in the new order for affected items only
      const reordered = [...full];
      fullIndices.forEach((fullIdx, i)=>{ reordered[fullIdx] = list[i]; });
      setTasks(reordered);
      render();
    });

    // toggle
    row.querySelector('[data-act="toggle"]').onclick = ()=>{ toggleDone(t.id); render(); };

    // inline edit
    const titleEl = row.querySelector('.title');
    titleEl.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){ e.preventDefault(); titleEl.blur(); }
    });
    titleEl.addEventListener('blur', ()=>{
      const v = titleEl.textContent.trim();
      if(v && v!==t.title){ renameTask(t.id, v); }
      render();
    });

    // due
    row.querySelector('[data-act="due"]').onclick = async ()=>{
      const current = t.due || '';
      const d = prompt('Срок в формате ГГГГ-ММ-ДД (пусто — убрать срок):', current) || '';
      const val = d.trim();
      if(val===''){ setDue(t.id, null); render(); return; }
      // простая валидация YYYY-MM-DD
      if(/^\d{4}-\d{2}-\d{2}$/.test(val)){ setDue(t.id, val); render(); }
      else alert('Неверный формат даты. Пример: 2025-08-13');
    };

    // delete
    row.querySelector('[data-act="del"]').onclick = ()=>{ delTask(t.id); render(); };

    wrap.appendChild(row);
  });
}

function bind(){
  $('#viewSeg').addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    state.view = btn.dataset.view; render();
  });

  const t = $('#quickTitle'), d = $('#quickDue'), add = $('#quickAdd');
  add.onclick = ()=>{
    const title = (t.value||'').trim(); if(!title) return;
    const due = (d.value||'').trim() || null;
    addTask(title, due); t.value=''; d.value=''; render();
  };
  t.addEventListener('keydown',(e)=>{
    if((e.key==='Enter' || (e.key==='Enter' && e.metaKey))){ e.preventDefault(); add.click(); }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{ bind(); render(); });
