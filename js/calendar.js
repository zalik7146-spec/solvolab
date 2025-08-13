const datePick = $id('datePick');
const taskTitle = $id('taskTitle');
const plannedList = $id('plannedList');

const getPlanned = () => DB.get('planned', {});
const setPlanned = (o) => DB.set('planned', o);

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
