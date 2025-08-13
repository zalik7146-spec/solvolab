const Timer = (()=> {
  const defaults = { mode:'focus', focus:25*60, break:5*60, left:25*60, running:false, sessions:0, lastTs:null };
  let state = Object.assign({}, defaults, DB.get('timer:state', {}));
  let tickInterval = null;

  const save = ()=> DB.set('timer:state', state);
  const setMode = (mode)=>{ state.mode=mode; state.left = mode==='focus'? state.focus : state.break; state.running=false; state.lastTs=null; save(); render(); };
  const start = ()=>{ if(state.running) return; state.running=true; state.lastTs=Date.now(); save(); tick(); tickInterval=setInterval(tick,1000); };
  const pause = ()=>{ if(!state.running) return; state.running=false; save(); clearInterval(tickInterval); tickInterval=null; };
  const reset = ()=>{ state.left = state.mode==='focus'? state.focus : state.break; state.running=false; state.lastTs=null; save(); render(); };

  const tick = ()=>{
    const now=Date.now(); const dt=Math.round((now-(state.lastTs||now))/1000); state.lastTs=now;
    if(state.running){
      state.left=Math.max(0,state.left-dt);
      if(state.left<=0){
        if(state.mode==='focus'){ state.sessions+=1; setMode('break'); }
        else { setMode('focus'); }
      }
      save(); render();
    }
  };
  const fmt = (s)=> `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const progress = ()=>{ const total=state.mode==='focus'? state.focus : state.break; return 360*(1-state.left/total); };

  const ui = {
    time: $id('timerTime'), ring: $id('timerRing'),
    mode: $id('timerMode'), count: $id('sessionCount'),
    startPause: $id('startPauseBtn'), reset: $id('resetBtn'), toFocus: $id('toFocus'), toBreak: $id('toBreak')
  };

  function render(){
    ui.time.textContent = fmt(state.left);
    ui.mode.textContent = state.mode==='focus' ? 'Фокус' : 'Перерыв';
    ui.count.textContent = `Сессии: ${state.sessions}`;
    ui.startPause.textContent = state.running ? 'Пауза' : 'Старт';
    ui.ring.style.setProperty('--p', `${progress()}deg`);
    ui.ring.style.setProperty('--c', state.mode==='focus' ? '#ffffff' : '#dbe1ea');
  }

  function bind(){
    ui.startPause.onclick = ()=> state.running ? pause() : start();
    ui.reset.onclick = reset;
    ui.toFocus.onclick = ()=> setMode('focus');
    ui.toBreak.onclick = ()=> setMode('break');
  }

  return { init(){ bind(); render(); } };
})();
document.addEventListener('DOMContentLoaded', ()=> Timer.init());
