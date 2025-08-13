const habitInput = $id('habitInput');
const habitList = $id('habitList');
const addHabitBtn = $id('addHabit');

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
addHabitBtn.onclick = ()=>{
  const title=(habitInput.value||'').trim(); if(!title) return;
  const habits = DB.get('habits', []); habits.push({ title, streak:0, last:null });
  DB.set('habits', habits); habitInput.value=''; renderHabits();
};
document.addEventListener('DOMContentLoaded', renderHabits);
