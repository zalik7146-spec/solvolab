const DB = (() => {
  const NS = 'solvo';
  const k = (key) => `${NS}:${key}`;

  let cloudEnabled = false;
  let onChange = null;

  let currentSpace = localStorage.getItem(k('space:current')) || 'default';

  const get = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(k(key))) ?? fallback; }
    catch { return fallback; }
  };
  const set = (key, value) => {
    try {
      localStorage.setItem(k(key), JSON.stringify(value));
      if (cloudEnabled && onChange) onChange();
    } catch {}
  };

  // space-scoped get/set with fallback to global
  const sg = (key, fallback) => get(`space:${currentSpace}:${key}`, fallback);
  const ss = (key, value) => set(`space:${currentSpace}:${key}`, value);

  const todayKey = () => new Date().toISOString().slice(0,10);

  function listSpaces(){
    const spaces = new Set(['default']);
    for (let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      if (key && key.startsWith(`${NS}:space:`)){
        const rest = key.slice(`${NS}:space:`.length);
        const space = rest.split(':')[0]; if(space) spaces.add(space);
      }
    }
    return Array.from(spaces);
  }
  function getSpace(){ return currentSpace; }
  function setSpace(space){ currentSpace = space || 'default'; localStorage.setItem(k('space:current'), currentSpace); }

  function snapshot() {
    const out = {};
    for (let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      if (key && key.startsWith(`${NS}:`)) {
        const short = key.slice(NS.length+1);
        try { out[short] = JSON.parse(localStorage.getItem(key)); } catch {}
      }
    }
    return out;
  }

  function mergeFromCloud(data) {
    Object.entries(data || {}).forEach(([shortKey, val]) => {
      try { localStorage.setItem(`${NS}:${shortKey}`, JSON.stringify(val)); } catch {}
    });
    if (cloudEnabled && onChange) onChange();
  }

  function setCloudEnabled(enabled, onChangeCb){
    cloudEnabled = !!enabled;
    onChange = onChangeCb || null;
  }

  return { get, set, sget: sg, sset: ss, todayKey, snapshot, mergeFromCloud, setCloudEnabled, listSpaces, setSpace, getSpace };
})();
