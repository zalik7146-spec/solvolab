// Workspace view combines spaces, today tasks, mini calendar, and focus timer

// minimal reuse of parser from tasks.js: copy simple function here for isolation
function wsParseQuick(text){
  let title = text.trim(); let due = null;
  const lower = title.toLowerCase();
  const iso = lower.match(/(\d{4}-\d{2}-\d{2})/); if(iso){ due=iso[1]; title=title.replace(iso[1],'').trim(); }
  if(!due && /(сегодня|today)\b/.test(lower)) due = DB.todayKey();
  if(!due && /(завтра|tomorrow)\b/.test(lower)){ const d=new Date(); d.setDate(d.getDate()+1); due=d.toISOString().slice(0,10); }
  title = title.replace(/(сегодня|today|завтра|tomorrow)/ig,'').trim();
  return { title, due };
}

const SKEY = 'tasks:v2';
function sgetTasks(){ return DB.sget(SKEY, []); }
function ssetTasks(arr){ DB.sset(SKEY, arr); }

function addTaskSpace(title, due=null){
  const t = { id: uid(), title, done:false, created_at: new Date().toISOString(), completed_at:null, due };
  const list = sgetTasks(); list.unshift(t); ssetTasks(list);
}

function sget(key, fb){ return DB.sget(key, fb); }
function sset(key, v){ return DB.sset(key, v); }

function renderProjects(){
  const list = sget('projects', []);
  const wrap = document.getElementById('wsProjects'); if(!wrap) return;
  wrap.innerHTML='';
  list.forEach((p,idx)=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<span>📁 ${p.name}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ const arr=sget('projects',[]); arr.splice(idx,1); sset('projects',arr); renderProjects(); };
    wrap.appendChild(row);
  });
}
function renderHabits(){
  const list = sget('habits', []);
  const wrap = document.getElementById('wsHabits'); if(!wrap) return;
  wrap.innerHTML='';
  list.forEach((h,idx)=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<span>🔥 ${h.title} — серия: <b>${h.streak||0}</b></span><div class="actions"><button class="button" data-act="done">Сегодня</button><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="done"]').onclick=()=>{ const d=DB.todayKey(); if(h.last!==d){ h.streak=(h.streak||0)+1; h.last=d; const arr=sget('habits',[]); arr[idx]=h; sset('habits',arr); renderHabits(); } };
    row.querySelector('[data-act="del"]').onclick=()=>{ const arr=sget('habits',[]); arr.splice(idx,1); sset('habits',arr); renderHabits(); };
    wrap.appendChild(row);
  });
}
function renderSomeday(){
  const list = sget('someday', []);
  const wrap = document.getElementById('wsSomeday'); if(!wrap) return;
  wrap.innerHTML='';
  list.forEach((t,idx)=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<span>🕰 ${t.title}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ const arr=sget('someday',[]); arr.splice(idx,1); sset('someday',arr); renderSomeday(); };
    wrap.appendChild(row);
  });
}

function bindExtras(){
  const pI=$id('wsProjectInput'), pAdd=$id('wsProjectAdd'); if(pAdd) pAdd.onclick=()=>{ const v=(pI.value||'').trim(); if(!v) return; const arr=sget('projects',[]); arr.push({name:v,created:Date.now()}); sset('projects',arr); pI.value=''; renderProjects(); };
  const hI=$id('wsHabitInput'), hAdd=$id('wsHabitAdd'); if(hAdd) hAdd.onclick=()=>{ const v=(hI.value||'').trim(); if(!v) return; const arr=sget('habits',[]); arr.push({title:v,streak:0,last:null}); sset('habits',arr); hI.value=''; renderHabits(); };
  const sI=$id('wsSomedayInput'), sAdd=$id('wsSomedayAdd'); if(sAdd) sAdd.onclick=()=>{ const v=(sI.value||'').trim(); if(!v) return; const arr=sget('someday',[]); arr.unshift({title:v,created:Date.now()}); sset('someday',arr); sI.value=''; renderSomeday(); };
}

function renderSpaces(){
  const sel = document.getElementById('spaceSelect'); if(!sel) return;
  sel.innerHTML = '';
  DB.listSpaces().forEach(name=>{ const o=document.createElement('option'); o.value=name; o.textContent=name; sel.appendChild(o); });
  sel.value = DB.getSpace();
}

function bindSpaces(){
  renderSpaces();
  document.getElementById('spaceSelect').onchange = (e)=>{ DB.setSpace(e.target.value); renderAll(); };
  document.getElementById('addSpace').onclick = ()=>{
    const name = prompt('Название нового пространства:'); if(!name) return;
    DB.setSpace(name.trim()); renderSpaces(); renderAll();
  };
}

function renderToday(){
  const wrap = document.getElementById('wsToday'); const label = document.getElementById('wsDate');
  if(!wrap || !label) return;
  const d = DB.todayKey(); label.textContent = d;
  const list = sgetTasks().filter(t=>!t.done && t.due===d);
  wrap.innerHTML='';
  if(!list.length){ const e=document.createElement('div'); e.className='item'; e.innerHTML='<span>На сегодня задач нет</span>'; wrap.appendChild(e); return; }
  list.forEach(t=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<span>${t.title}</span><div class="actions"><button class="button" data-act="done">Готово</button></div>`;
    row.querySelector('[data-act="done"]').onclick = ()=>{ const arr=sgetTasks(); const it=arr.find(x=>x.id===t.id); if(it){ it.done=true; it.completed_at=new Date().toISOString(); ssetTasks(arr); renderAll(); } };
    wrap.appendChild(row);
  });
}

function renderCal(){
  const grid = document.getElementById('wsCal'); if(!grid) return;
  grid.innerHTML=''; const n=new Date(); const y=n.getFullYear(); const m=n.getMonth();
  const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate(); const cells=Math.ceil((start+days)/7)*7;
  const counts = sgetTasks().reduce((acc,t)=>{ if(t.due) acc[t.due]=(acc[t.due]||0)+1; return acc; },{});
  for(let i=0;i<cells;i++){
    const d=new Date(y,m,i-start+1); const ymd=d.toISOString().slice(0,10);
    const cell=document.createElement('div'); cell.className='cal-day';
    if(d.getMonth()!==m) cell.classList.add('other');
    if(ymd===DB.todayKey()) cell.classList.add('today');
    cell.innerHTML = `<div class="date">${d.getDate()}</div>` + (counts[ymd]? `<div class="count"><span class="badge">${counts[ymd]} задач</span></div>`:'' );
    cell.onclick=()=>{};
    grid.appendChild(cell);
  }
}

function bindQuick(){
  const i=document.getElementById('wsQuick'); const b=document.getElementById('wsAdd');
  b.onclick = ()=>{ const raw=(i.value||'').trim(); if(!raw) return; const p=wsParseQuick(raw); addTaskSpace(p.title||raw, p.due||null); i.value=''; renderAll(); };
  i.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); b.click(); }});
}

function bindFocus(){
  const start=document.getElementById('wsStart'); const pause=document.getElementById('wsPause'); const reset=document.getElementById('wsReset');
  start.onclick = ()=>{ const s=DB.get('timer:state',{}); s.running=true; s.lastTs=Date.now(); DB.set('timer:state',s); };
  pause.onclick = ()=>{ const s=DB.get('timer:state',{}); s.running=false; DB.set('timer:state',s); };
  reset.onclick = ()=>{ const s=DB.get('timer:state',{}); s.running=false; s.left = (s.mode==='break'? (s.break||300) : (s.focus||1500)); DB.set('timer:state',s); };
}

function renderAll(){ renderToday(); renderCal(); renderProjects(); renderHabits(); renderSomeday(); }

document.addEventListener('DOMContentLoaded', ()=>{ bindSpaces(); bindQuick(); bindFocus(); bindExtras(); renderAll(); });