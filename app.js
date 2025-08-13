// ----- Навигация по вкладкам -----
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

// ----- Дом: Inbox -----
const inboxList = document.getElementById('inboxList');
const addInboxBtn = document.getElementById('addInbox');
const inboxInput = document.getElementById('inboxInput');

function renderInbox(){
  const items = DB.get('inbox', []);
  inboxList.innerHTML = '';
  items.forEach((t, idx)=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `<span>${t.done?'✅':'⬜️'} ${t.title}</span>
      <div class="row">
        <button class="button" data-act="toggle">Готово</button>
        <button class="button" data-act="del">Удалить</button>
      </div>`;
    row.querySelector('[data-act="toggle"]').onclick=()=>{
      items[idx].done = !items[idx].done; DB.set('inbox', items); renderInbox();
    };
    row.querySelector('[data-act="del"]').onclick=()=>{
      items.splice(idx,1); DB.set('inbox', items); renderInbox();
    };
    inboxList.appendChild(row);
  });
}
if(addInboxBtn){ addInboxBtn.onclick = ()=>{ const title=(inboxInput.value||'').trim(); if(!title) return;
  const items=DB.get('inbox',[]); items.unshift({ title, done:false, created: Date.now() }); DB.set('inbox',items);
  inboxInput.value=''; renderInbox(); }; }

// ----- Дом: Фокус дня -----
const focusInput = document.getElementById('focusInput');
const focusText = document.getElementById('focusText');
const focusDate = document.getElementById('focusDate');
const saveFocusBtn = document.getElementById('saveFocus');
if(saveFocusBtn){ saveFocusBtn.onclick = ()=>{
  const v=(focusInput.value||'').trim(); if(!v) return;
  const day=DB.todayKey(); DB.set(`focus:${day}`, v); focusText.textContent=v; focusDate.textContent=day; focusInput.value='';
};}
(function loadFocus(){
  const day = DB.todayKey(); const v = DB.get(`focus:${day}`, null);
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
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `<span>${h.title} — серия: ${h.streak}</span>
      <div class="row">
        <button class="button" data-act="done">Сегодня</button>
        <button class="button" data-act="del">Удалить</button>
      </div>`;
    row.querySelector('[data-act="done"]').onclick=()=>{
      const today = DB.todayKey();
      if(h.last !== today){ h.streak += 1; h.last = today; DB.set('habits', habits); renderHabits(); }
    };
    row.querySelector('[data-act="del"]').onclick=()=>{
      habits.splice(idx,1); DB.set('habits', habits); renderHabits();
    };
    habitList.appendChild(row);
  });
}
if(addHabitBtn){ addHabitBtn.onclick = ()=>{
  const title=(habitInput.value||'').trim(); if(!title) return;
  const habits = DB.get('habits', []); habits.push({ title, streak:0, last:null }); DB.set('habits', habits);
  habitInput.value=''; renderHabits();
};}

// ----- Настроение -----
const moodToday = document.getElementById('moodToday');
const moodTime = document.getElementById('moodTime');
document.querySelectorAll('.mood button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const val = btn.dataset.mood;
    const day = DB.todayKey();
    DB.set(`mood:${day}`, { val, ts: Date.now() }); renderMood();
  });
});
function renderMood(){
  const day = DB.todayKey(); const m = DB.get(`mood:${day}`, null);
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
function pickStoic(){ return stoicList[new Date().getDate() % stoicList.length]; }
const stoicQuote = document.getElementById('stoicQuote');
const dailyStoicBadge = document.getElementById('dailyStoicBadge');
function renderStoic(){
  const day = DB.todayKey();
  let q = DB.get(`stoic:${day}`, null);
  if(!q){ q = pickStoic(); DB.set(`stoic:${day}`, q); }
  if(stoicQuote) stoicQuote.textContent = q;
  if(dailyStoicBadge) dailyStoicBadge.textContent = 'Stoic • ' + day.slice(5);
}
const morning = document.getElementById('morning');
const evening = document.getElementById('evening');
const saveMorning = document.getElementById('saveMorning');
const saveEvening = document.getElementById('saveEvening');
if(saveMorning){ saveMorning.onclick = ()=>{ const v=(morning.value||'').trim(); if(!v) return; DB.set(`morning:${DB.todayKey()}`, v); morning.value=''; }; }
if(saveEvening){ saveEvening.onclick = ()=>{ const v=(evening.value||'').trim(); if(!v) return; DB.set(`evening:${DB.todayKey()}`, v); evening.value=''; }; }

// ----- Календарь / Планировщик -----
const datePick = document.getElementById('datePick');
const taskTitle = document.getElementById('taskTitle');
const plannedList = document.getElementById('plannedList');
function renderPlanned(date){
  const all = DB.get('planned', {}); const items = all[date] || [];
  plannedList.innerHTML = `<div class="item"><b>${date}</b><small>${items.length} задач(и)</small></div>`;
  items.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>${t.done?'✅':'⬜️'} ${t.title}</span>
      <div class="row"><button class="button" data-act="toggle">Готово</button><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="toggle"]').onclick=()=>{
      items[idx].done = !items[idx].done; DB.set('planned', all); renderPlanned(date);
    };
    row.querySelector('[data-act="del"]').onclick=()=>{
      items.splice(idx,1); DB.set('planned', all); renderPlanned(date);
    };
    plannedList.appendChild(row);
  });
}
if(datePick){ datePick.value = DB.todayKey(); renderPlanned(datePick.value); }
const addPlanned = document.getElementById('addPlanned');
if(addPlanned){ addPlanned.onclick=()=>{
  const date = datePick.value || DB.todayKey();
  const title = (taskTitle.value||'').trim(); if(!title) return;
  const all = DB.get('planned', {}); all[date] = all[date] || []; all[date].push({ title, done:false, created: Date.now() });
  DB.set('planned', all); taskTitle.value=''; renderPlanned(date);
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
    row.innerHTML = `<span>${p.name}</span><div class="row"><button class="button" data-act="del">Удалить</button></div>`;
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
    row.innerHTML = `<span>${t.title}</span><div class="row"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ items.splice(idx,1); DB.set('someday', items); renderSomeday(); };
    somedayList.appendChild(row);
  });
}
if(addSomeday){ addSomeday.onclick=()=>{ const title=(somedayInput.value||'').trim(); if(!title) return;
  const items=DB.get('someday',[]); items.unshift({ title, created: Date.now() }); DB.set('someday',items);
  somedayInput.value=''; renderSomeday(); }; }

// ----- Фокус‑сессия (Pomodoro) -----
const Timer = (()=> {
  const defaults = { mode:'focus', focus: 25*60, break: 5*60, left: 25*60, running:false, sessions:0, lastTs:null };
  let state = Object.assign({}, defaults, DB.get('timer:state', {}));
  let rafId = null, tickInterval = null;

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
        // авто‑переключение
        if(state.mode === 'focus'){ state.sessions += 1; state.mode = 'break'; state.left = state.break; }
        else { state.mode = 'focus'; state.left = state.focus; }
        state.running = false;
      }
      save(); renderTimer();
    }
  };
  const fmt = (s)=> {
    const m = Math.floor(s/60), ss = String(s%60).padStart(2,'0');
    return `${m}:${ss}`;
  };
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
    ui.ring.style.setProperty('--p', `${deg}deg`);
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
  Timer.init();
}
document.addEventListener('DOMContentLoaded', init);
