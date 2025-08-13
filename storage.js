const DB = (() => {
  const NS = 'solvo';
  const k = (key) => `${NS}:${key}`;
  const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(k(key))) ?? fallback; } catch { return fallback; } };
  const set = (key, value) => { try { localStorage.setItem(k(key), JSON.stringify(value)); } catch {} };
  const todayKey = () => new Date().toISOString().slice(0,10);
  return { get, set, todayKey };
})();
