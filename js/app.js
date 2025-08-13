// Утилиты
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => DB.todayKey();

// ----- Навигация -----
const views = {
  home: document.getElementById('homeView'),
  calendar: document.getElementById('calendarView'),
  projects: document.getElementById('projectsView'),
  someday: document.getElementById('somedayView'),
  focus: document.getElementById('focusView'),
};
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const id = tab.dataset.tab;
    Object.entries(views).forEach(([key, el]) => el.hidden = key !== id);
  });
});

// ----- Дом: Inbox с подзадачами и заметками -----
const inboxList = document.getElementById('inboxList');
const addInboxBtn = document.getElementById('addInbox');
const inboxInput = document.getElementById('inboxInput');

function getInbox(){ return DB.get('inbox', []); }
function setInbox(arr){ DB.set('inbox', arr); }

function renderTaskRow(task, list, saveFn){
  const row = document.createElement('div');
  row.className = 'item';
  const title = task.done ? `✅ <del>${task.title}</del>` : `⬜️ ${task.title}`;
  row.innerHTML = `
    <span>${title}</span>
    <div class="actions">
      <button class="button" data-act="details">Подробнее</button>
      <button class="button" data-act="toggle">${task.done ? 'Вернуть' : 'Готово'}</button>
      <button class="button" data-act="del">Удалить</button>
    </div>
  `;

  // Детали: подзадачи + заметки
  const details = document.createElement('div');
  details.className = 'details';
  details.hidden = true;
  details.innerHTML = `
    <div class="badge">Подзадачи</div>
    <div class="subtasks"></div>
    <div class="row">
      <input class="input" placeholder="Новая подзадача"/>
      <button class="button">Добавить</button>
    </div>
    <div class="badge" style="margin-top:8px">Заметки</div>
    <div class="notes"></div>
    <div class="row">
      <input class="input" placeholder="Новая заметка"/>
      <button class="button">Добавить</button>
    </div>
  `;
  const subtasksWrap = details.querySelector('.subtasks');
  const notesWrap = details.querySelector('.notes');
  const subInput = details.querySelectorAll('.input')[0];
  const noteInput = details.querySelectorAll('.input')[1];
  const subBtn = details.querySelectorAll('.button')[0];
  const noteBtn = details.querySelectorAll('.button')[1];

  function renderSubtasks(){
    subtasksWrap.innerHTML = '';
    (task.subtasks||[]).forEach((s, sidx) => {
      const st = document.createElement('div');
      st.className = 'subtask';
      st.innerHTML = `
        <span>${s.done ? '✅' : '⬜️'} ${s.title}</span>
        <div class="actions">
          <button class="button" data-act="st-toggle">Готово</button>
          <button class="button" data-act="st-del">Удалить</button>
        </div>
      `;
      st.querySelector('[data-act="st-toggle"]').onclick = ()=>{
        s.done = !s.done; saveFn(); renderSubtasks();
      };
      st.querySelector('[data-act="st-del"]').onclick = ()=>{
        task.subtasks.splice(sidx,1); saveFn(); renderSubtasks();
      };
      subtasksWrap.appendChild(st);
    });
  }
  function renderNotes(){
    notesWrap.innerHTML = '';
    (task.notes||[]).forEach((n, nidx) => {
      const nt = document.createElement('div');
      nt.className = 'note';
      nt.innerHTML = `
        <div>${n.text}</div>
        <small>${new Date(n.ts).toLocaleString()}</small>
      `;
      nt.addEventListener('dblclick', ()=>{
        task.notes.splice(nidx,1); saveFn(); renderNotes();
      });
      notesWrap.appendChild(nt);
    });
  }
  subBtn.onclick = ()=>{
    const val = (subInput.value||'').trim(); if(!val) return;
    task.subtasks = task.subtasks || [];
    task.subtasks.push({ id: uid(), title: val, done:false });
    subInput.value=''; saveFn(); renderSubtasks();
  };
  noteBtn.onclick = ()=>{
    const val = (noteInput.value||'').trim(); if(!val) return;
    task.notes = task.notes || [];
    task.notes.unshift({ id: uid(), text: val, ts: Date.now() });
    noteInput.value=''; saveFn(); renderNotes();
  };
  renderSubtasks(); renderNotes();
  row.appendChild(details);

  row.querySelector('[data-act="details"]').onclick = ()=> details.hidden = !details.hidden;
  row.querySelector('[data-act="toggle"]').onclick = ()=>{ task.done = !task.done; saveFn(); renderInbox(); };
  row.querySelector('[data-act="del"]').onclick = ()=>{
    const idx = list.findIndex(x=>x.id===task.id);
    list.splice(idx,1); saveFn(); renderInbox();
  };
  return row;
}

function renderInbox(){
  const items = getInbox();
  inboxList.innerHTML = '';
  items.forEach(t => {
    inboxList.appendChild(renderTaskRow(t, items, ()=>setInbox(items)));
  });
}

if(addInboxBtn){
  addInboxBtn.onclick = ()=>{
    const title=(inboxInput.value||'').trim(); if(!title) return;
    const items=getInbox();
    items.unshift({ id: uid(), title, done:false, created: Date.now(), subtasks:[], notes:[] });
    setInbox(items); inboxInput.value=''; renderInbox();
  };
}

// ----- Фокус дня -----
const focusInput = document.getElementById('focusInput');
const focusText = document.getElementById('focusText');
const focusDate = document.getElementById('focusDate');
const saveFocusBtn = document.getElementById('saveFocus');
if(saveFocusBtn){ saveFocusBtn.onclick = ()=>{
  const v=(focusInput.value||'').trim(); if(!v) return;
  const day=today(); DB.set(`focus:${day}`, v); focusText.textContent=v; focusDate.textContent=day; focusInput.value='';
};}
(function loadFocus(){
  const day = today(); const v = DB.get(`focus:${day}`, null);
  if(v){ focusText.textContent = v; focusDate.textContent = day; }
})();

// ----- Привычки -----
const habitInput = document.getElementById('habitInput');
const habitList = document.getElementById('habitList');
const addHabitBtn = document.getElementById('addHabit');
function renderHabits(){
  const habits = DB.get('habits', []);
  habitList.innerHTML = '';
  habits.forEach((h, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>🔥 ${h.title} — серия: <b>${h.streak}</b></span>
      <div class="actions">
        <button class="button" data-act="done">Сегодня</button>
        <button class="button" data-act="del">Удалить</button>
      </div>`;
    row.querySelector('[data-act="done"]').onclick=()=>{
      const d=today(); if(h.last !== d){ h.streak += 1; h.last = d; DB.set('habits', habits); renderHabits(); }
    };
    row.querySelector('[data-act="del"]').onclick=()=>{
      habits.splice(idx,1); DB.set('habits', habits); renderHabits();
    };
    habitList.appendChild(row);
  });
}
if(addHabitBtn){
  addHabitBtn.onclick = ()=>{
    const title=(habitInput.value||'').trim(); if(!title) return;
    const habits = DB.get('habits', []); habits.push({ title, streak:0, last:null });
    DB.set('habits', habits); habitInput.value=''; renderHabits();
  };
}

// ----- Настроение -----
const moodToday = document.getElementById('moodToday');
const moodTime = document.getElementById('moodTime');
document.querySelectorAll('.mood button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const val = btn.dataset.mood;
    DB.set(`mood:${today()}`, { val, ts: Date.now() }); renderMood();
  });
});
function renderMood(){
  const m = DB.get(`mood:${today()}`, null);
  if(!m){ moodToday.textContent='—'; moodTime.textContent=''; return; }
  const map = { good:'Хорошо', ok:'Нормально', bad:'Плохо' };
  moodToday.textContent = map[m.val] || '—'; moodTime.textContent = new Date(m.ts).toLocaleTimeString();
}

// ----- Stoic -----
const stoicList = [
  'Фокусируйся на том, что в твоей власти.',
  'Сложности — тренажёр для характера.',
  'Утром — цель, вечером — разбор.',
  'Всё временно: и помехи, и удача.',
  'Дисциплина — форма свободы.'
];
const stoicQuote = document.getElementById('stoicQuote');
function renderStoic(){
  const day = today();
  let q = DB.get(`stoic:${day}`, null);
  if(!q){ q = stoicList[new Date().getDate() % stoicList.length]; DB.set(`stoic:${day}`, q); }
  if(stoicQuote) stoicQuote.textContent = q;
}
const morning = document.getElementById('morning');
const evening = document.getElementById('evening');
const saveMorning = document.getElementById('saveMorning');
const saveEvening = document.getElementById('saveEvening');
if(saveMorning){ saveMorning.onclick = ()=>{ const v=(morning.value||'').trim(); if(!v) return; DB.set(`morning:${today()}`, v); morning.value=''; }; }
if(saveEvening){ saveEvening.onclick = ()=>{ const v=(evening.value||'').trim(); if(!v) return; DB.set(`evening:${today()}`, v); evening.value=''; }; }

// ----- Календарь / Планировщик (с деталями задач) -----
const datePick = document.getElementById('datePick');
const taskTitle = document.getElementById('taskTitle');
const plannedList = document.getElementById('plannedList');
function getPlanned(){ return DB.get('planned', {}); }
function setPlanned(obj){ DB.set('planned', obj); }

function renderPlanned(date){
  const all = getPlanned(); const items = all[date] || [];
  plannedList.innerHTML = `<div class="item"><b>${date}</b><small>${items.length} задач(и)</small></div>`;
  items.forEach(t=>{
    plannedList.appendChild(renderTaskRow(t, items, ()=>{ all[date]=items; setPlanned(all); }));
  });
}
if(datePick){ datePick.value = today(); renderPlanned(datePick.value); }
const addPlanned = document.getElementById('addPlanned');
if(addPlanned){ addPlanned.onclick=()=>{
  const date = datePick.value || today();
  const title = (taskTitle.value||'').trim(); if(!title) return;
  const all = getPlanned(); all[date] = all[date] || [];
  all[date].unshift({ id: uid(), title, done:false, created: Date.now(), subtasks:[], notes:[] });
  setPlanned(all); taskTitle.value=''; renderPlanned(date);
};}

// ----- Проекты -----
const projectInput = document.getElementById('projectInput');
const projectList = document.getElementById('projectList');
const addProject = document.getElementById('addProject');
function renderProjects(){
  const items = DB.get('projects', []);
  projectList.innerHTML = '';
  items.forEach((p, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>📁 ${p.name}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ items.splice(idx,1); DB.set('projects', items); renderProjects(); };
    projectList.appendChild(row);
  });
}
if(addProject){ addProject.onclick = ()=>{ const name=(projectInput.value||'').trim(); if(!name) return;
  const items=DB.get('projects',[]); items.push({ name, created: Date.now() }); DB.set('projects', items);
  projectInput.value=''; renderProjects(); }; }

// ----- Когда‑нибудь -----
const somedayInput = document.getElementById('somedayInput');
const somedayList = document.getElementById('somedayList');
const addSomeday = document.getElementById('addSomeday');
function renderSomeday(){
  const items = DB.get('someday', []);
  somedayList.innerHTML = '';
  items.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>🕰 ${t.title}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ items.splice(idx,1); DB.set('someday', items); renderSomeday(); };
    somedayList.appendChild(row);
  });
}
if(addSomeday){ addSomeday.onclick=()=>{ const title=(somedayInput.value||'').trim(); if(!title) return;
  const items=DB.get('someday',[]); items.unshift({ title, created: Date.now() }); DB.set('someday',items);
  somedayInput.value=''; renderSomeday(); }; }

// ----- Фокус‑сессия (чистое кольцо, плавные цвета) -----
const Timer = (()=> {
  const defaults = { mode:'focus', focus: 25*60, break: 5*60, left: 25*60, running:false, sessions:0, lastTs:null };
  let state = Object.assign({}, defaults, DB.get('timer:state', {}));
  let tickInterval = null;

  const save = ()=> DB.set('timer:state', state);
  const setMode = (mode)=>{
    state.mode = mode;
    state.left = mode==='focus' ? state.focus : state.break;
    state.running = false; state.lastTs = null; save(); renderTimer();
  };
  const start = ()=>{
    if(state.running) return;
    state.running = true; state.lastTs = Date.now(); save(); tick();
    tickInterval = setInterval(tick, 1000);
  };
  const pause = ()=>{
    if(!state.running) return;
    state.running = false; save();
    clearInterval(tickInterval); tickInterval = null;
  };
  const reset = ()=>{
    state.left = state.mode==='focus' ? state.focus : state.break;
    state.running = false; state.lastTs = null; save(); renderTimer();
  };
  const tick = ()=>{
    const now = Date.now();
    const dt = Math.round((now - (state.lastTs||now))/1000);
    state.lastTs = now;
    if(state.running){
      state.left = Math.max(0, state.left - dt);
      if(state.left <= 0){
        if(state.mode === 'focus'){ state.sessions += 1; setMode('break'); }
        else { setMode('focus'); }
      }
      save(); renderTimer();
    }
  };
  const fmt = (s)=> `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const progress = ()=>{
    const total = state.mode==='focus'? state.focus : state.break;
    return 360 * (1 - state.left/total);
  };

  const ui = {
    time: document.getElementById('timerTime'),
    ring: document.getElementById('timerRing'),
    mode: document.getElementById('timerMode'),
    count: document.getElementById('sessionCount'),
    startPause: document.getElementById('startPauseBtn'),
    reset: document.getElementById('resetBtn'),
    toFocus: document.getElementById('toFocus'),
    toBreak: document.getElementById('toBreak'),
  };

  function renderTimer(){
    if(!ui.time) return;
    ui.time.textContent = fmt(state.left);
    ui.mode.textContent = state.mode==='focus' ? 'Фокус' : 'Перерыв';
    ui.count.textContent = `Сессии: ${state.sessions}`;
    ui.startPause.textContent = state.running ? 'Пауза' : 'Старт';
    const deg = progress();
    const col = state.mode==='focus' ? '#60a5fa' : '#6ee7b7';
    ui.ring.style.setProperty('--p', `${deg}deg`);
    ui.ring.style.setProperty('--c', col);
  }

  function bind(){
    if(!ui.startPause) return;
    ui.startPause.onclick = ()=> state.running ? pause() : start();
    ui.reset.onclick = reset;
    ui.toFocus.onclick = ()=> setMode('focus');
    ui.toBreak.onclick = ()=> setMode('break');
    renderTimer();
  }

  const init = ()=> { bind(); renderTimer(); };
  return { init };
})();

// ----- Инициализация -----
function init(){
  renderInbox(); renderHabits(); renderMood(); renderStoic(); renderProjects(); renderSomeday();
  // календарь уже отрисован при установке datePick.value
  Timer.init();
}
document.addEventListener('DOMContentLoaded', init);
