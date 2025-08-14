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

function addTask(title, due=null, repeat=null){
  const t = {
    id: uid(),
    title,
    done: false,
    created_at: nowISO(),
    completed_at: null,
    due, // YYYY-MM-DD | null
    repeat // null | string (daily | weekdays | weekly:1..7 | monthly:1..31)
  };
  const list = getTasks();
  list.unshift(t);
  setTasks(list);
}

function renameTask(id, title){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.title = title;
  setTasks(list);
}

function delTask(id){
  const list = getTasks().filter(x=>x.id!==id);
  setTasks(list);
}

function setDue(id, due){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.due = due || null;
  setTasks(list);
}

function setRepeat(id, repeat){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  t.repeat = repeat || null;
  setTasks(list);
}

function nextWeekday(fromYmd, targetDow){
  const d = fromYmd ? new Date(fromYmd) : new Date();
  const cur = d.getDay(); // 0..6 Sun..Sat
  let add = (targetDow - cur + 7) % 7;
  if (add === 0) add = 7; // next occurrence, not today
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0,10);
}

function nextMonthly(fromYmd, dom){
  const d = fromYmd ? new Date(fromYmd) : new Date();
  const y = d.getFullYear(); const m = d.getMonth();
  // go to next month
  const nd = new Date(y, m+1, 1);
  const days = new Date(nd.getFullYear(), nd.getMonth()+1, 0).getDate();
  const day = Math.min(dom, days);
  nd.setDate(day);
  return nd.toISOString().slice(0,10);
}

function computeNextDue(currentYmd, repeat){
  if(!repeat) return null;
  const base = currentYmd || todayKey();
  if(repeat === 'daily'){
    const d = new Date(base); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10);
  }
  if(repeat === 'weekdays'){
    const d = new Date(base); const dow = d.getDay();
    // Mon-Fri: 1..5; if Fri or Sat/Sun -> next Monday
    let add = 1; if(dow===5) add=3; if(dow===6) add=2; // Fri->Mon, Sat->Mon
    d.setDate(d.getDate()+add); return d.toISOString().slice(0,10);
  }
  if(repeat.startsWith('weekly:')){
    const target = Number(repeat.split(':')[1]||1); // 0..6
    return nextWeekday(base, target);
  }
  if(repeat.startsWith('monthly:')){
    const dom = Number(repeat.split(':')[1]||1);
    return nextMonthly(base, dom);
  }
  return null;
}

function toggleDone(id){
  const list = getTasks();
  const t = list.find(x=>x.id===id); if(!t) return;
  if(!t.done){
    // completing now
    if(t.repeat){
      const next = computeNextDue(t.due || todayKey(), t.repeat);
      t.due = next; t.completed_at = nowISO(); // keep recurring active
    } else {
      t.done = true; t.completed_at = nowISO();
    }
  } else {
    // revert done
    t.done = false; t.completed_at = null;
  }
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

// --- Natural language parsing (RU/EN basics) ---
function parseQuick(text){
  let title = text.trim(); let due = null; let repeat = null;
  const lower = title.toLowerCase();

  // direct ISO or dd.mm.yyyy
  const iso = lower.match(/(\d{4}-\d{2}-\d{2})/);
  if(iso){ due = iso[1]; title = title.replace(iso[1], '').trim(); }
  const dmy = lower.match(/(\b\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if(!due && dmy){ const ymd = `${dmy[3]}-${String(dmy[2]).padStart(2,'0')}-${String(dmy[1]).padStart(2,'0')}`; due = ymd; title = title.replace(dmy[0], '').trim(); }

  // today/tomorrow/next week
  if(!due && /(сегодня|today)\b/.test(lower)){ due = todayKey(); title = title.replace(/(сегодня|today)\b/i, '').trim(); }
  if(!due && /(завтра|tomorrow)\b/.test(lower)){ const d=new Date(); d.setDate(d.getDate()+1); due=d.toISOString().slice(0,10); title = title.replace(/(завтра|tomorrow)\b/i, '').trim(); }
  if(!due && /(послезавтра)\b/.test(lower)){ const d=new Date(); d.setDate(d.getDate()+2); due=d.toISOString().slice(0,10); title = title.replace(/(послезавтра)\b/i, '').trim(); }
  if(!due && /(через\s+(\d+)\s+д(ен|ня|ней)\b)/.test(lower)){
    const m = lower.match(/через\s+(\d+)\s+д(ен|ня|ней)\b/); const add=Number(m[1]); const d=new Date(); d.setDate(d.getDate()+add); due=d.toISOString().slice(0,10); title = title.replace(m[0], '').trim();
  }
  if(!due && /(через\s+недел(ю|и)|next\s+week)/.test(lower)){
    const d=new Date(); d.setDate(d.getDate()+7); due=d.toISOString().slice(0,10); title = title.replace(/(через\s+недел(ю|и)|next\s+week)/i, '').trim();
  }

  // weekdays (ru short and full), map to next occurrence
  const ruFull = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const ruShort = ['вс','пн','вт','ср','чт','пт','сб'];
  for(let i=0;i<7 && !due;i++){
    const re = new RegExp(`(в\\s+${ruFull[i]}|${ruShort[i]}\\b)`, 'i');
    const m = lower.match(re);
    if(m){ due = nextWeekday(todayKey(), i); title = title.replace(m[0], '').trim(); }
  }

  // recurrence phrases
  if(/(каждый день|ежедневно|every day)/i.test(lower)){ repeat='daily'; title=title.replace(/(каждый день|ежедневно|every day)/ig,'').trim(); }
  if(/(по будням|будни|weekdays)/i.test(lower)){ repeat='weekdays'; title=title.replace(/(по будням|будни|weekdays)/ig,'').trim(); }
  if(/(еженедельно|кажд(ую|ой) недел(ю|и)|weekly)/i.test(lower)){ repeat=repeat||'weekly:1'; title=title.replace(/(еженедельно|кажд(ую|ой) недел(ю|и)|weekly)/ig,'').trim(); }
  // every monday etc.
  for(let i=0;i<7;i++){
    const re = new RegExp(`(каждый\\s+${ruFull[i]}|every\\s+(sun|mon|tue|wed|thu|fri|sat))`,'i');
    if(re.test(lower)){ repeat = `weekly:${i}`; title = title.replace(re,'').trim(); break; }
  }
  if(/(ежемесячно|кажд(ый|ого) месяц|monthly)/i.test(lower)){
    // if a day-of-month present in text, use it; else use today's date
    const domMatch = lower.match(/(\b[1-2]?\d|30|31)\b\s*(числа|дня)?/);
    const base = domMatch ? Number(domMatch[1]) : (new Date().getDate());
    repeat = `monthly:${base}`;
    title = title.replace(/(ежемесячно|кажд(ый|ого) месяц|monthly)/ig,'').trim();
  }

  // clean separators
  title = title.replace(/\s{2,}/g,' ').trim();
  return { title, due, repeat };
}

function repeatLabel(rep){
  if(!rep) return '';
  if(rep==='daily') return 'Ежедневно';
  if(rep==='weekdays') return 'По будням';
  if(rep.startsWith('weekly:')){
    const i=Number(rep.split(':')[1]||1);
    const names=['Вс','Пн','Вт','Ср','Чт','Пт','Сб']; return `Каждую ${names[i]}`;
  }
  if(rep.startsWith('monthly:')){ const n=Number(rep.split(':')[1]||1); return `Ежемесячно (${n})`; }
  return 'Повтор';
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

  let dragIndex = null;

  list.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item'; row.draggable = true; row.dataset.index = String(idx); row.dataset.id = t.id;
    if(state.selectedIds.includes(t.id)) row.classList.add('selected');
    const dueBadge = t.due ? `<span class="badge">${t.due===todayKey()?'Сегодня':t.due}</span>` : '';
    const repBadge = t.repeat ? `<span class="badge">${repeatLabel(t.repeat)}</span>` : '';
    const timeBadge = t.time ? `<span class="badge time">${t.time}</span>` : '';
    const projBadge = t.project ? `<span class="badge project">#${t.project}</span>` : '';

    row.innerHTML = `
      <div class="task">
        <input type="checkbox" class="sel" ${state.selectedIds.includes(t.id)?'checked':''} />
        <span class="chk ${t.done?'done':''}" data-act="toggle">${t.done?'✓':''}</span>
        <div class="title ${t.done?'done':''}" contenteditable="true" spellcheck="false">${t.title}</div>
        ${dueBadge} ${timeBadge} ${projBadge} ${repBadge}
      </div>
      <div class="actions">
        <button class="button" data-act="due">Срок</button>
        <button class="button" data-act="time">Время</button>
        <button class="button" data-act="project">Проект</button>
        <button class="button" data-act="repeat">Повтор</button>
        <button class="button" data-act="today">Сегодня</button>
        <button class="button" data-act="tomorrow">Завтра</button>
        <button class="button" data-act="nextweek">Через неделю</button>
        <button class="button" data-act="del">Удалить</button>
      </div>
    `;

    // details panel
    const details = document.createElement('div'); details.className='details'; details.hidden = true;
    details.innerHTML = `
      <div class="row">
        <span class="badge">Подзадачи</span>
      </div>
      <div class="subtasks"></div>
      <div class="row">
        <input class="input" placeholder="Новая подзадача"/>
        <button class="button" data-act="add-sub">Добавить</button>
      </div>
      <div class="row">
        <span class="badge">Заметки</span>
      </div>
      <div class="notes"></div>
      <div class="row">
        <input class="input" placeholder="Новая заметка"/>
        <button class="button" data-act="add-note">Добавить</button>
      </div>
      <div class="small">ID: ${t.id}</div>
    `;

    function save(){ const full=getTasks(); const it=full.find(x=>x.id===t.id); if(it){ Object.assign(it, t); setTasks(full); } }

    const subtasksWrap = details.querySelector('.subtasks');
    const notesWrap = details.querySelector('.notes');
    const subInput = details.querySelectorAll('.input')[0];
    const noteInput = details.querySelectorAll('.input')[1];

    function renderSub(){
      subtasksWrap.innerHTML='';
      (t.subtasks||[]).forEach((s,i)=>{
        const r=document.createElement('div'); r.className='item';
        r.innerHTML=`<span>${s.done?'✅':'⬜️'} ${s.title}</span><div class="actions"><button class="button" data-act="st">Готово</button><button class="button" data-act="sd">Удалить</button></div>`;
        r.querySelector('[data-act="st"]').onclick=()=>{ s.done=!s.done; save(); renderSub(); };
        r.querySelector('[data-act="sd"]').onclick=()=>{ t.subtasks.splice(i,1); save(); renderSub(); };
        subtasksWrap.appendChild(r);
      });
    }
    function renderNotes(){
      notesWrap.innerHTML='';
      (t.notes||[]).forEach((n,i)=>{
        const r=document.createElement('div'); r.className='note';
        r.innerHTML=`<div>${n.text}</div><small class="small">${new Date(n.ts).toLocaleString()}</small>`;
        r.ondblclick=()=>{ t.notes.splice(i,1); save(); renderNotes(); };
        notesWrap.appendChild(r);
      });
    }

    details.querySelector('[data-act="add-sub"]').onclick=()=>{
      const v=(subInput.value||'').trim(); if(!v) return; t.subtasks=t.subtasks||[]; t.subtasks.push({id:uid(),title:v,done:false}); subInput.value=''; save(); renderSub(); };
    details.querySelector('[data-act="add-note"]').onclick=()=>{
      const v=(noteInput.value||'').trim(); if(!v) return; t.notes=t.notes||[]; t.notes.unshift({id:uid(),text:v,ts:Date.now()}); noteInput.value=''; save(); renderNotes(); };

    renderSub(); renderNotes();

    row.appendChild(details);

    // selection
    row.querySelector('.sel').onchange = (e)=>{ if(e.target.checked){ if(!state.selectedIds.includes(t.id)) state.selectedIds.push(t.id); } else { state.selectedIds = state.selectedIds.filter(id=>id!==t.id); } render(); };

    // DnD within list
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
      setTasks(reordered); render();
    });

    // actions
    row.querySelector('[data-act="toggle"]').onclick = ()=>{ toggleDone(t.id); render(); };

    const titleEl = row.querySelector('.title');
    titleEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); titleEl.blur(); } });
    titleEl.addEventListener('blur', ()=>{ const v = titleEl.textContent.trim(); if(v && v!==t.title){ renameTask(t.id, v); } render(); });

    row.querySelector('[data-act="due"]').onclick = async ()=>{
      const current = t.due || '';
      const d = prompt('Срок в формате ГГГГ-ММ-ДД (пусто — убрать срок):', current) || '';
      const val = d.trim(); if(val===''){ setDue(t.id, null); render(); return; }
      if(/^\d{4}-\d{2}-\d{2}$/.test(val)){ setDue(t.id, val); render(); } else alert('Неверный формат даты. Пример: 2025-08-13');
    };

    row.querySelector('[data-act="time"]').onclick = ()=>{
      const cur = t.time || '';
      const val = prompt('Время (HH:MM, 24ч) или пусто', cur) || '';
      const clean = val.trim();
      if(!clean){ delete t.time; const full=getTasks(); Object.assign(full.find(x=>x.id===t.id)||{}, t); setTasks(full); render(); return; }
      if(/^([01]?\d|2[0-3]):[0-5]\d$/.test(clean)){ t.time=clean; const full=getTasks(); Object.assign(full.find(x=>x.id===t.id)||{}, t); setTasks(full); render(); }
      else alert('Неверный формат времени. Пример: 18:30');
    };

    row.querySelector('[data-act="project"]').onclick = ()=>{
      const cur = t.project || '';
      const val = prompt('Проект (тег), пусто — убрать', cur) || '';
      const clean = val.trim(); t.project = clean || null; const full=getTasks(); Object.assign(full.find(x=>x.id===t.id)||{}, t); setTasks(full); render();
    };

    row.querySelector('[data-act="repeat"]').onclick = ()=>{
      const cur = t.repeat || '';
      const val = prompt('Повтор: daily | weekdays | weekly:0..6 (0=Вс) | monthly:1..31 | пусто — снять', cur) || '';
      const clean = val.trim();
      if(!clean){ setRepeat(t.id, null); render(); return; }
      if(clean==='daily' || clean==='weekdays' || /^weekly:\d$/.test(clean) || /^monthly:(?:[1-9]|[12]\d|3[01])$/.test(clean)){
        setRepeat(t.id, clean); render();
      } else alert('Неверный формат. Примеры: daily, weekdays, weekly:1, monthly:15');
    };

    row.querySelector('[data-act="today"]').onclick = ()=>{ setDue(t.id, todayKey()); render(); };
    row.querySelector('[data-act="tomorrow"]').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); setDue(t.id, d.toISOString().slice(0,10)); render(); };
    row.querySelector('[data-act="nextweek"]').onclick = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); setDue(t.id, d.toISOString().slice(0,10)); render(); };

    row.querySelector('[data-act="del"]').onclick = ()=>{ delTask(t.id); state.selectedIds = state.selectedIds.filter(id=>id!==t.id); render(); };

    // toggle details on title double click
    titleEl.addEventListener('dblclick', ()=>{ details.hidden = !details.hidden; });

    wrap.appendChild(row);
  });

  renderCalendar();
  renderAgenda();
}

// --- ICS export for current list ---
function exportICS(){
  const list = bySearchAndSort(byView(state.view, getTasks()));
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Solvo//Tasks//RU'];
  list.forEach(t=>{
    const uid = t.id + '@solvo';
    const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const summary = (t.title||'').replace(/[\n\r]/g,' ');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + dtstamp);
    if(t.due){ lines.push('DTSTART;VALUE=DATE:' + t.due.replace(/-/g,'')); lines.push('DTEND;VALUE=DATE:' + t.due.replace(/-/g,'')); }
    lines.push('SUMMARY:' + summary);
    if(t.repeat){
      if(t.repeat==='daily') lines.push('RRULE:FREQ=DAILY');
      else if(t.repeat==='weekdays') lines.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
      else if(t.repeat.startsWith('weekly:')){
        const map=['SU','MO','TU','WE','TH','FR','SA']; const i=Number(t.repeat.split(':')[1]||1); lines.push('RRULE:FREQ=WEEKLY;BYDAY='+map[i]);
      } else if(t.repeat.startsWith('monthly:')){
        const dom=Number(t.repeat.split(':')[1]||1); lines.push('RRULE:FREQ=MONTHLY;BYMONTHDAY='+dom);
      }
    }
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\n')], { type:'text/calendar' });
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='solvo-tasks.ics'; a.click(); URL.revokeObjectURL(a.href);
}

function bind(){
  $('#viewSeg').addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    state.view = btn.dataset.view; render();
  });

  const t = $('#quickTitle'), d = $('#quickDue'), add = $('#quickAdd');
  add.onclick = ()=>{
    const raw = (t.value||'').trim(); if(!raw) return;
    const parsed = parseQuick(raw);
    const due = parsed.due || (d.value||'').trim() || null;
    addTask(parsed.title || raw, due, parsed.repeat||null);
    t.value=''; d.value=''; render();
  };
  t.addEventListener('keydown',(e)=>{ if((e.key==='Enter' || (e.key==='Enter' && e.metaKey))){ e.preventDefault(); add.click(); } });

  const s = $('#taskSearch'); const sel = $('#taskSort');
  s.oninput = ()=>{ state.search = s.value; render(); };
  sel.onchange = ()=>{ state.sort = sel.value; render(); };

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

  $$('#taskList .item').forEach(row=>{ row.addEventListener('dragstart', (e)=>{ e.dataTransfer?.setData('text/plain', row.dataset.id||''); }); });
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
(document.addEventListener('DOMContentLoaded', ()=>{
  bind(); bindBulk(); render();
  // expose export via console or future button
  window.exportTasksICS = exportICS;
}));
