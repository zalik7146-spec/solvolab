const projectInput = $id('projectInput');
const projectList = $id('projectList');
const addProject = $id('addProject');

function renderProjects(){
  const items = DB.get('projects', []);
  projectList.innerHTML = '';
  items.forEach((p, idx)=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<span>📁 ${p.name}</span><div class="actions"><button class="button" data-act="del">Удалить</button></div>`;
    row.querySelector('[data-act="del"]').onclick=()=>{ items.splice(idx,1); DB.set('projects', items); renderProjects(); };
    projectList.appendChild(row);
  });
}
addProject.onclick = ()=>{
  const name=(projectInput.value||'').trim(); if(!name) return;
  const items=DB.get('projects',[]); items.push({ name, created: Date.now() }); DB.set('projects', items);
  projectInput.value=''; renderProjects();
};
document.addEventListener('DOMContentLoaded', renderProjects);
