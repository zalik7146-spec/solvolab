const somedayInput = $id('somedayInput');
const somedayList = $id('somedayList');
const addSomeday = $id('addSomeday');

function renderSomeday(){
  const items = DB.get('someday', []);
  somedayList.innerHTML = '';
  items.forEach((t, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>🕰 ${t.title}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ items.splice(idx,1); DB.set('someday', items); renderSomeday(); };
    somedayList.appendChild(row);
  });
}
addSomeday.onclick=()=>{
  const title=(somedayInput.value||'').trim(); if(!title) return;
  const items=DB.get('someday',[]); items.unshift({ title, created: Date.now() }); DB.set('someday',items);
  somedayInput.value=''; renderSomeday();
};
document.addEventListener('DOMContentLoaded', renderSomeday);
