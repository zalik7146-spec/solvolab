// Модель: единый список tasks со сроком (due) и статусом
const SKEY = 'tasks:v2';
const nowISO = () => new Date().toISOString();
const todayKey = () => DB.todayKey();

const Views = { INBOX:'inbox', TODAY:'today', PLANNED:'planned', LOG:'log' };

const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

const state = {
  view: DB.get('tasks:view', Views.INBOX),
  search: '',
  sort: 'created',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(), // 0..11
  calSelected: todayKey(),
  selectedIds: []
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
  if(view===Views.PLANNED){
    const sel = state.calSelected || d;
    return items.filter(t=>!t.done && t.due && t.due===sel);
  }
  if(view===Views.LOG)     return items.filter(t=>t.done);
  return items;
}

function bySearchAndSort(items){
  let out = items;
  const q = (state.search||'').trim().toLowerCase();
  if(q) out = out.filter(t => (t.title||'').toLowerCase().includes(q));
  if(state.sort==='created') out.sort((a,b)=> (b.created_at||'').localeCompare(a.created_at||''));
  if(state.sort==='due') out.sort((a,b)=> (a.due||'9999-12-31').localeCompare(b.due||'9999-12-31'));
  if(state.sort==='title') out.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
  return out;
}

function render(){
  DB.set('tasks:view', state.view);
  $$('#viewSeg button').forEach(b=>b.classList.toggle('active', b.dataset.view===state.view));

  // bulk bar
  const bulkBar = $('#bulkBar');
  const bulkCount = $('#bulkCount');
  if(bulkBar){
    if(state.selectedIds.length){
      bulkBar.style.display='flex';
      bulkCount.textContent = `${state.selectedIds.length} выбрано`;
    } else bulkBar.style.display='none';
  }

  const wrap = $('#taskList');
  const list = bySearchAndSort(byView(state.view, getTasks()));
  wrap.innerHTML = '';

  if(!list.length){
    const empty = document.createElement('div');
    empty.className='item';
    empty.innerHTML = '<span>Пусто. Добавь первую задачу.</span><small>⌘↩ — быстрое добавление</small>';
    wrap.appendChild(empty);
  }

  // drag and drop
  let dragIndex = null;

  list.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item'; row.draggable = true; row.dataset.index = String(idx); row.dataset.id = t.id;
    if(state.selectedIds.includes(t.id)) row.classList.add('selected');
    const dueBadge = t.due ? `<span class="badge">${t.due===todayKey()?'Сегодня':t.due}</span>` : '';
    row.innerHTML = `
      <div class="task">
        <input type="checkbox" class="sel" ${state.selectedIds.includes(t.id)?'checked':''} />
        <span class="chk ${t.done?'done':''}" data-act="toggle">${t.done?'✓':''}</span>
        <div class="title ${t.done?'done':''}" contenteditable="true" spellcheck="false">${t.title}</div>
        ${dueBadge}
      </div>
      <div class="actions">
        <button class="button" data-act="due">Срок</button>
        <button class="button" data-act="today">Сегодня</button>
        <button class="button" data-act="tomorrow">Завтра</button>
        <button class="button" data-act="nextweek">Через неделю</button>
        <button class="button" data-act="del">Удалить</button>
      </div>
    `;

    // selection
    row.querySelector('.sel').onchange = (e)=>{
      if(e.target.checked){ if(!state.selectedIds.includes(t.id)) state.selectedIds.push(t.id); }
      else { state.selectedIds = state.selectedIds.filter(id=>id!==t.id); }
      render();
    };

    // DnD handlers within list
    row.addEventListener('dragstart', ()=>{ dragIndex = idx; row.style.opacity = '0.6'; });
    row.addEventListener('dragend', ()=>{ dragIndex = null; row.style.opacity = ''; $$('.item.drag-over', wrap).forEach(el=>el.classList.remove('drag-over')); });
    row.addEventListener('dragover', (e)=>{ e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', ()=>{ row.classList.remove('drag-over'); });
    row.addEventListener('drop', (e)=>{
      e.preventDefault(); row.classList.remove('drag-over');
      const targetIndex = idx;
      if (dragIndex===null || dragIndex===targetIndex) return;
      const full = getTasks();
      const viewIds = list.map(x=>x.id);
      const fullIndices = viewIds.map(id=> full.findIndex(f=>f.id===id));
      const [moved] = fullIndices.splice(dragIndex, 1);
      fullIndices.splice(targetIndex, 0, moved);
      const reordered = [...full];
      fullIndices.forEach((fullIdx, i)=>{ reordered[fullIdx] = list[i]; });
      setTasks(reordered);
      render();
    });

    // toggle
    row.querySelector('[data-act="toggle"]').onclick = ()=>{ toggleDone(t.id); render(); };

    // inline edit
    const titleEl = row.querySelector('.title');
    titleEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); titleEl.blur(); } });
    titleEl.addEventListener('blur', ()=>{ const v = titleEl.textContent.trim(); if(v && v!==t.title){ renameTask(t.id, v); } render(); });

    // due
    row.querySelector('[data-act="due"]').onclick = async ()=>{
      const current = t.due || '';
      const d = prompt('Срок в формате ГГГГ-ММ-ДД (пусто — убрать срок):', current) || '';
      const val = d.trim();
      if(val===''){ setDue(t.id, null); render(); return; }
      if(/^\d{4}-\d{2}-\d{2}$/.test(val)){ setDue(t.id, val); render(); }
      else alert('Неверный формат даты. Пример: 2025-08-13');
    };
    row.querySelector('[data-act="today"]').onclick = ()=>{ setDue(t.id, todayKey()); render(); };
    row.querySelector('[data-act="tomorrow"]').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); setDue(t.id, d.toISOString().slice(0,10)); render(); };
    row.querySelector('[data-act="nextweek"]').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); setDue(t.id, d.toISOString().slice(0,10)); render(); };

    // delete
    row.querySelector('[data-act="del"]').onclick = ()=>{ delTask(t.id); state.selectedIds = state.selectedIds.filter(id=>id!==t.id); render(); };

    wrap.appendChild(row);
  });

  renderCalendar();
  renderAgenda();
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
  t.addEventListener('keydown',(e)=>{ if((e.key==='Enter' || (e.key==='Enter' && e.metaKey))){ e.preventDefault(); add.click(); } });

  const s = $('#taskSearch'); const sel = $('#taskSort');
  s.oninput = ()=>{ state.search = s.value; render(); };
  sel.onchange = ()=>{ state.sort = sel.value; render(); };

  // Calendar controls
  $('#calPrev').onclick = ()=>{ const m=new Date(state.calYear, state.calMonth-1, 1); state.calYear=m.getFullYear(); state.calMonth=m.getMonth(); renderCalendar(); };
  $('#calNext').onclick = ()=>{ const m=new Date(state.calYear, state.calMonth+1, 1); state.calYear=m.getFullYear(); state.calMonth=m.getMonth(); renderCalendar(); };
  $('#calToday').onclick = ()=>{ const n=new Date(); state.calYear=n.getFullYear(); state.calMonth=n.getMonth(); state.calSelected=todayKey(); renderCalendar(); };
}

function renderCalendar(){
  const grid = $('#calGrid'); const label = $('#calLabel');
  if(!grid || !label) return;
  grid.innerHTML='';
  const year = state.calYear; const month = state.calMonth;
  const first = new Date(year, month, 1);
  const startDay = (first.getDay()+6)%7; // Monday=0
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const prevDays = startDay;
  const totalCells = Math.ceil((prevDays + daysInMonth)/7)*7;

  label.textContent = first.toLocaleString('ru-RU', { month:'long', year:'numeric' });

  const tasks = getTasks();
  const dayCounts = tasks.reduce((acc,t)=>{ if(t.due){ acc[t.due] = (acc[t.due]||0) + 1; } return acc; }, {});

  for(let i=0;i<totalCells;i++){
    const cell = document.createElement('div'); cell.className='cal-day';
    const date = new Date(year, month, i - prevDays + 1);
    const ymd = date.toISOString().slice(0,10);
    const inMonth = date.getMonth()===month;
    if(!inMonth) cell.classList.add('other');
    if(ymd===todayKey()) cell.classList.add('today');
    if(ymd===state.calSelected) cell.classList.add('selected');
    cell.innerHTML = `<div class="date">${date.getDate()}</div>` + (dayCounts[ymd]? `<div class="count"><span class="badge">${dayCounts[ymd]} задач</span></div>` : '');

    cell.onclick = ()=>{ state.calSelected = ymd; if(state.view!==Views.LOG){ state.view = Views.PLANNED; } render(); };

    cell.addEventListener('dragover', (e)=>{ e.preventDefault(); cell.classList.add('drag-over'); });
    cell.addEventListener('dragleave', ()=>{ cell.classList.remove('drag-over'); });
    cell.addEventListener('drop', (e)=>{
      e.preventDefault(); cell.classList.remove('drag-over');
      const id = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || null;
      const draggingRow = document.querySelector('.item[draggable="true"][style*="opacity: 0.6"]');
      const tid = id || draggingRow?.dataset?.id;
      if(!tid) return;
      setDue(tid, ymd); render();
    });

    grid.appendChild(cell);
  }

  $$('#taskList .item').forEach(row=>{
    row.addEventListener('dragstart', (e)=>{ e.dataTransfer?.setData('text/plain', row.dataset.id||''); });
  });
}

function renderAgenda(){
  const date = state.calSelected || todayKey();
  const agendaEl = $('#agendaList'); const agendaDate = $('#agendaDate');
  if(!agendaEl || !agendaDate) return;
  const items = getTasks().filter(t=>!t.done && t.due===date);
  agendaDate.textContent = date + (date===todayKey()?' (сегодня)':'');
  agendaEl.innerHTML = '';
  if(!items.length){ const e=document.createElement('div'); e.className='item'; e.innerHTML='<span>На этот день задач нет</span>'; agendaEl.appendChild(e); return; }
  items.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
  items.forEach(t=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<span>${t.title}</span><div class="actions"><button class="button" data-act="done">Готово</button><button class="button" data-act="clear">Убрать срок</button></div>`;
    row.querySelector('[data-act="done"]').onclick=()=>{ toggleDone(t.id); render(); };
    row.querySelector('[data-act="clear"]').onclick=()=>{ setDue(t.id, null); render(); };
    agendaEl.appendChild(row);
  });
}

function bindBulk(){
  const ids = ()=>state.selectedIds;
  const clearSel = ()=>{ state.selectedIds=[]; render(); };
  $('#bulkClear').onclick = clearSel;
  $('#bulkDone').onclick = ()=>{ ids().forEach(toggleDone); clearSel(); };
  $('#bulkDelete').onclick = ()=>{ ids().forEach(delTask); clearSel(); };
  $('#bulkToday').onclick = ()=>{ const d=todayKey(); ids().forEach(id=>setDue(id,d)); clearSel(); };
  $('#bulkTomorrow').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); const ymd=d.toISOString().slice(0,10); ids().forEach(id=>setDue(id,ymd)); clearSel(); };
  $('#bulkNextWeek').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); const ymd=d.toISOString().slice(0,10); ids().forEach(id=>setDue(id,ymd)); clearSel(); };
}

// init
(document.addEventListener('DOMContentLoaded', ()=>{ bind(); bindBulk(); render(); }));
