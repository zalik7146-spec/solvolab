const moodToday = $id('moodToday');
const moodTime = $id('moodTime');

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
document.addEventListener('DOMContentLoaded', renderMood);
