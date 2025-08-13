const stoicList = [
  'Фокусируйся на том, что в твоей власти.',
  'Сложности — тренажёр для характера.',
  'Утром — цель, вечером — разбор.',
  'Всё временно: и помехи, и удача.',
  'Дисциплина — форма свободы.'
];
const stoicQuote = $id('stoicQuote');
const morning = $id('morning');
const evening = $id('evening');
const saveMorning = $id('saveMorning');
const saveEvening = $id('saveEvening');

function renderStoic(){
  const day = today();
  let q = DB.get(`stoic:${day}`, null);
  if(!q){ q = stoicList[new Date().getDate() % stoicList.length]; DB.set(`stoic:${day}`, q); }
  if(stoicQuote) stoicQuote.textContent = q;
}
saveMorning.onclick = ()=>{ const v=(morning.value||'').trim(); if(!v) return; DB.set(`morning:${today()}`, v); morning.value=''; };
saveEvening.onclick = ()=>{ const v=(evening.value||'').trim(); if(!v) return; DB.set(`evening:${today()}`, v); evening.value=''; };
document.addEventListener('DOMContentLoaded', renderStoic);
