const datePick = $id('datePick');
const taskTitle = $id('taskTitle');
const plannedList = $id('plannedList');

const getPlanned = () => DB.get('planned', {});
const setPlanned = (o) => DB.set('planned', o);

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
  row.querySelector('[data-act="toggle"]').onclick = ()=>{ task.done = !task.done; saveFn(); renderPlanned(datePick.value); };
  row.querySelector('[data-act="del"]').onclick = ()=>{
    const idx = list.findIndex(x=>x.id===task.id);
    list.splice(idx,1); saveFn(); renderPlanned(datePick.value);
  };
  return row;
}

function renderPlanned(date){
  const all = getPlanned(); const items = all[date] || [];
  plannedList.innerHTML = `<div class="item"><b>${date}</b><small>${items.length} задач(и)</small></div>`;
  items.forEach(t=>{
    plannedList.appendChild(renderTaskRow(t, items, ()=>{ all[date]=items; setPlanned(all); }));
  });
}

datePick.value = today();
renderPlanned(datePick.value);

datePick.onchange = ()=> renderPlanned(datePick.value);

$id('addPlanned').onclick = ()=>{
  const date = datePick.value || today();
  const title = (taskTitle.value||'').trim(); if(!title) return;
  const all = getPlanned(); all[date] = all[date] || [];
  all[date].unshift({ id: uid(), title, done:false, created: Date.now(), subtasks:[], notes:[] });
  setPlanned(all); taskTitle.value=''; renderPlanned(date);
};
