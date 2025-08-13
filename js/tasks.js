const inboxList = $id('inboxList');
const inboxInput = $id('inboxInput');
const addInboxBtn = $id('addInbox');

const getInbox = () => DB.get('inbox', []);
const setInbox = (v) => DB.set('inbox', v);

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
    (task.subtasks||[]).forEach((s, sidx)=>{
      const st = document.createElement('div');
      st.className = 'subtask';
      st.innerHTML = `
        <span>${s.done ? '✅' : '⬜️'} ${s.title}</span>
        <div class="actions">
          <button class="button" data-act="st-toggle">Готово</button>
          <button class="button" data-act="st-del">Удалить</button>
        </div>
      `;
      st.querySelector('[data-act="st-toggle"]').onclick=()=>{
        s.done = !s.done; saveFn(); renderSubtasks();
      };
      st.querySelector('[data-act="st-del"]').onclick=()=>{
        task.subtasks.splice(sidx,1); saveFn(); renderSubtasks();
      };
      subtasksWrap.appendChild(st);
    });
  }
  function renderNotes(){
    notesWrap.innerHTML = '';
    (task.notes||[]).forEach((n, nidx)=>{
      const nt = document.createElement('div'); nt.className='note';
      nt.innerHTML = `<div>${n.text}</div><small>${new Date(n.ts).toLocaleString()}</small>`;
      nt.ondblclick = ()=>{ task.notes.splice(nidx,1); saveFn(); renderNotes(); };
      notesWrap.appendChild(nt);
    });
  }
  subBtn.onclick=()=>{
    const val=(subInput.value||'').trim(); if(!val) return;
    task.subtasks = task.subtasks||[]; task.subtasks.push({ id:uid(), title:val, done:false });
    subInput.value=''; saveFn(); renderSubtasks();
  };
  noteBtn.onclick=()=>{
    const val=(noteInput.value||'').trim(); if(!val) return;
    task.notes = task.notes||[]; task.notes.unshift({ id:uid(), text:val, ts:Date.now() });
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
  items.forEach(t=>{
    inboxList.appendChild(renderTaskRow(t, items, ()=>setInbox(items)));
  });
}

addInboxBtn.onclick = ()=>{
  const title=(inboxInput.value||'').trim(); if(!title) return;
  const items=getInbox(); items.unshift({ id:uid(), title, done:false, created:Date.now(), subtasks:[], notes:[] });
  setInbox(items); inboxInput.value=''; renderInbox();
};

document.addEventListener('DOMContentLoaded', renderInbox);
