const SUPABASE_URL = 'https://wssdmxwtgnnkbefwtcpa.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indzc2RteHd0Z25ua2JlZnd0Y3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzEyMjMsImV4cCI6MjA3MDY0NzIyM30.Vl2glbQwC_3guzeHgWmmumVxqWnpDG69DP-BIxJFF8s';

const CFG_OK = (typeof supabase !== 'undefined')
  && SUPABASE_URL.startsWith('http')
  && !SUPABASE_URL.includes('YOUR-')
  && !SUPABASE_ANON.includes('YOUR-');

let supa = null;
if (CFG_OK) {
  supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true } });
}

const Auth = (() => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  async function signIn() {
    if (!CFG_OK) { alert('Синхронизация ещё не настроена. Добавь ключи Supabase в js/supabase.js'); return; }
    const email = prompt('Введи e‑mail (пришлём ссылку для входа):');
    if (!email) return;
    const { error } = await supa.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + '/app.html' }
    });
    if (error) { alert('Ошибка входа: ' + error.message); return; }
    alert('Письмо отправлено. Проверь почту и открой ссылку.');
  }

  async function signOut() {
    if (!CFG_OK) { alert('Локальный режим — вход не активирован.'); return; }
    await supa.auth.signOut();
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
    Cloud.disable();
    alert('Вышли из аккаунта.');
  }

  async function onReady() {
    if (!CFG_OK) {
      if (loginBtn) loginBtn.onclick = signIn;
      if (logoutBtn) logoutBtn.style.display = 'none';
      return;
    }
    const { data: { session } } = await supa.auth.getSession();
    if (session?.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = '';
      await Cloud.enable(session.user.id);
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  function bind() {
    if (loginBtn) loginBtn.onclick = signIn;
    if (logoutBtn) logoutBtn.onclick = signOut;

    if (CFG_OK) {
      supa.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          if (loginBtn) loginBtn.style.display = 'none';
          if (logoutBtn) logoutBtn.style.display = '';
          Cloud.enable(session.user.id);
        } else {
          if (logoutBtn) logoutBtn.style.display = 'none';
          if (loginBtn) loginBtn.style.display = '';
          Cloud.disable();
        }
      });
    }
    onReady();
  }

  return { bind };
})();

const Cloud = (() => {
  let userId = null;
  let saving = false;
  let pending = false;

  function enable(uid) { userId = uid; pull(); DB.setCloudEnabled(true, pushDebounced); }
  function disable() { userId = null; DB.setCloudEnabled(false, null); }

  async function pull() {
    if (!userId || !CFG_OK) return;
    const { data, error } = await supa.from('vaults').select('data').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') { console.warn('pull error', error); return; }
    if (data?.data) DB.mergeFromCloud(data.data);
    else await supa.from('vaults').insert({ user_id: userId, data: {} }).select();
  }

  async function push() {
    if (!userId || !CFG_OK) return;
    if (saving) { pending = true; return; }
    saving = true;
    const snapshot = DB.snapshot();
    const { error } = await supa.from('vaults')
      .upsert({ user_id: userId, data: snapshot, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    saving = false;
    if (error) { console.warn('push error', error); return; }
    if (pending) { pending = false; push(); }
  }

  const pushDebounced = (() => {
    let t = null;
    return () => { clearTimeout(t); t = setTimeout(push, 600); };
  })();

  return { enable, disable, pull, push, pushDebounced };
})();

document.addEventListener('DOMContentLoaded', () => Auth.bind());
