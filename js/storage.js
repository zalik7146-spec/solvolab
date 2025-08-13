const DB = (() => {
  const NS = 'solvo';
  const k = (key) => `${NS}:${key}`;

  let cloudEnabled = false;
  let onChange = null;

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

  const todayKey = () => new Date().toISOString().slice(0,10);

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

  return { get, set, todayKey, snapshot, mergeFromCloud, setCloudEnabled };
})();
