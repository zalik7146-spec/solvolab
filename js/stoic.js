const stoicList = [
  'Фокусируйся на том, что в твоей власти.',
  'Сложности — тренажёр для характера.',
  'Утром — цель, вечером — разбор.',
  'Всё временно: и помехи, и удача.',
  'Дисциплина — форма свободы.',
  'Путь к спокойствию — через принятие.',
  'Не беспокойся о будущем: делай шаг сейчас.',
  'Трудности показывают, кто мы есть.',
  'Характер выше обстоятельств.',
  'Мужество — быть с реальностью честным.'
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

  // Optional background image of the day (cached per day)
  const key = `stoic:bg:${day}`;
  let bg = DB.get(key, null);
  if(!bg){
    // Use a lightweight random image URL (no API key), themed
    bg = `https://source.unsplash.com/featured/1200x600/?nature,minimal,calm&sig=${new Date().getDate()}`;
    DB.set(key, bg);
  }
  // Attach if we have a quote container
  if (stoicQuote) {
    stoicQuote.style.backgroundImage = `url('${bg}')`;
    stoicQuote.style.backgroundSize = 'cover';
    stoicQuote.style.backgroundPosition = 'center';
    stoicQuote.style.padding = '16px';
    stoicQuote.style.borderRadius = '12px';
    stoicQuote.style.color = '#111';
    stoicQuote.style.display = 'grid';
  }
}
saveMorning.onclick = ()=>{ const v=(morning.value||'').trim(); if(!v) return; DB.set(`morning:${today()}`, v); morning.value=''; };
saveEvening.onclick = ()=>{ const v=(evening.value||'').trim(); if(!v) return; DB.set(`evening:${today()}`, v); evening.value=''; };
document.addEventListener('DOMContentLoaded', renderStoic);
