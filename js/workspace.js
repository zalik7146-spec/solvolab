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

function renderAll(){ renderToday(); renderCal(); }

document.addEventListener('DOMContentLoaded', ()=>{ bindSpaces(); bindQuick(); bindFocus(); renderAll(); });