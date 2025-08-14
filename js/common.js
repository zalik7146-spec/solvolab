window.$id = (id) => document.getElementById(id);
window.uid = () => Math.random().toString(36).slice(2,10);
window.today = () => DB.todayKey();

document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop();
  document.querySelectorAll('.tab').forEach(a=>{
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
