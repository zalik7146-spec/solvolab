// Focus — Minimal Assistant & Planner
// Local, private, fast. Data is stored in localStorage.

(function () {
  "use strict";

  const Storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const DateUtil = {
    today() {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    },
    fmt(d) {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt.toISOString().slice(0, 10);
    },
    isToday(d) {
      return this.fmt(d) === this.fmt(this.today());
    }
  };

  const Id = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  const State = {
    data: {
      tasks: Storage.get("focus.tasks", []),
      plannedByDate: Storage.get("focus.plannedByDate", {}),
      diaryByDate: Storage.get("focus.diaryByDate", {}),
      streak: Storage.get("focus.streak", { count: 0, last: null }),
      quotes: [
        "Small steps, big gains.",
        "Focus is a superpower.",
        "Do the next right thing.",
        "Consistency beats intensity.",
        "Make it simple. Make it happen."
      ]
    },
    save() {
      Storage.set("focus.tasks", this.data.tasks);
      Storage.set("focus.plannedByDate", this.data.plannedByDate);
      Storage.set("focus.diaryByDate", this.data.diaryByDate);
      Storage.set("focus.streak", this.data.streak);
    }
  };

  // Router
  const Router = (() => {
    const views = Array.from(document.querySelectorAll(".view"));
    const buttons = Array.from(document.querySelectorAll(".nav__item"));
    const go = (route) => {
      views.forEach(v => v.classList.toggle("is-hidden", v.dataset.route !== route));
      buttons.forEach(b => b.classList.toggle("is-active", b.dataset.route === route));
      history.replaceState({}, "", `#${route}`);
      document.getElementById(`view-${route}`).focus();
    };
    const init = () => {
      buttons.forEach(b => b.addEventListener("click", () => go(b.dataset.route)));
      const initial = location.hash?.slice(1) || "assistant";
      go(initial);
    };
    return { init, go };
  })();

  // Motivator
  const Motivator = (() => {
    const el = document.getElementById("motivator-quote");
    const streakEl = document.getElementById("streak-count");
    const rotateQuote = () => {
      const qs = State.data.quotes;
      if (!qs.length) return;
      const q = qs[Math.floor(Math.random() * qs.length)];
      el.textContent = q;
    };
    const updateStreak = () => {
      const today = DateUtil.fmt(new Date());
      const s = State.data.streak;
      if (s.last !== today) {
        const yesterday = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return DateUtil.fmt(d);
        })();
        s.count = s.last === yesterday ? s.count + 1 : 1;
        s.last = today;
        State.save();
      }
      streakEl.textContent = String(s.count);
    };
    const init = () => { rotateQuote(); updateStreak(); };
    return { init };
  })();

  // Tasks
  const Tasks = (() => {
    const listEl = document.getElementById("task-list");
    const emptyEl = document.getElementById("task-empty");
    const formEl = document.getElementById("task-form");
    const titleEl = document.getElementById("task-title");
    const dueEl = document.getElementById("task-due");
    const prioEl = document.getElementById("task-priority");
    const searchEl = document.getElementById("task-search");
    const filterEl = document.getElementById("task-filter");
    const sortEl = document.getElementById("task-sort");

    const createTask = (title, due, priority) => ({
      id: Id(),
      title: title.trim(),
      createdAt: Date.now(),
      due: due || null,
      priority: Number(priority || 2),
      done: false
    });

    const add = (task) => { State.data.tasks.unshift(task); State.save(); render(); };
    const toggle = (id) => {
      const t = State.data.tasks.find(t => t.id === id);
      if (t) { t.done = !t.done; State.save(); render(); }
    };
    const remove = (id) => { State.data.tasks = State.data.tasks.filter(t => t.id !== id); State.save(); render(); };
    const update = (id, fields) => { const t = State.data.tasks.find(t => t.id === id); if (t) { Object.assign(t, fields); State.save(); render(); } };

    const matchesFilter = (t) => {
      const q = (searchEl.value || "").toLowerCase();
      const f = filterEl.value;
      const now = DateUtil.today();
      const todayStr = DateUtil.fmt(now);
      const dueStr = t.due ? DateUtil.fmt(t.due) : null;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (f === "open" && t.done) return false;
      if (f === "done" && !t.done) return false;
      if (f === "today" && dueStr !== todayStr) return false;
      if (f === "overdue" && dueStr && dueStr < todayStr && !t.done) return true; // fall through
      if (f === "overdue" && (!dueStr || t.done)) return false;
      return true;
    };

    const sorters = {
      created: (a, b) => b.createdAt - a.createdAt,
      due: (a, b) => {
        const ad = a.due ? new Date(a.due).getTime() : Infinity;
        const bd = b.due ? new Date(b.due).getTime() : Infinity;
        return ad - bd;
      },
      priority: (a, b) => a.priority - b.priority
    };

    const render = () => {
      const items = State.data.tasks.filter(matchesFilter).sort(sorters[sortEl.value] || sorters.priority);
      listEl.innerHTML = "";
      emptyEl.style.display = items.length ? "none" : "block";
      for (const t of items) {
        const li = document.createElement("li");
        li.className = "list-item";
        const checkbox = document.createElement("button");
        checkbox.className = "checkbox" + (t.done ? " checkbox--on" : "");
        checkbox.setAttribute("aria-pressed", String(t.done));
        checkbox.addEventListener("click", () => toggle(t.id));
        checkbox.textContent = t.done ? "✓" : "";

        const title = document.createElement("div");
        title.className = "list-item__title";
        title.textContent = t.title;
        title.contentEditable = "true";
        title.spellcheck = false;
        title.addEventListener("blur", () => update(t.id, { title: title.textContent.trim() }));

        const meta = document.createElement("div");
        meta.className = "list-item__meta";
        const chips = [];
        if (t.due) chips.push(`Due ${DateUtil.fmt(t.due)}`);
        chips.push({ 1: "High", 2: "Med", 3: "Low" }[t.priority]);
        if (t.done) chips.push("Done");
        meta.append(...chips.map(c => { const e = document.createElement("span"); e.className = "chip"; e.textContent = c; return e; }));

        const actions = document.createElement("div");
        const del = document.createElement("button");
        del.className = "btn btn--ghost";
        del.textContent = "Delete";
        del.addEventListener("click", () => remove(t.id));
        actions.appendChild(del);

        li.append(checkbox, title, actions);
        listEl.appendChild(li);
      }
    };

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = titleEl.value.trim();
      if (!title) return;
      add(createTask(title, dueEl.value || null, prioEl.value));
      formEl.reset();
      titleEl.focus();
    });

    [searchEl, filterEl, sortEl].forEach(el => el.addEventListener("input", render));

    return { render, add };
  })();

  // Planner
  const Planner = (() => {
    const dateEl = document.getElementById("planner-date");
    const unplannedEl = document.getElementById("unplanned-list");
    const plannedEl = document.getElementById("planned-list");
    const suggestEl = document.getElementById("planner-suggest");
    const addForm = document.getElementById("planner-add");
    const addInput = document.getElementById("planner-input");

    const getDateKey = () => dateEl.value || DateUtil.fmt(new Date());
    const getPlan = (key) => State.data.plannedByDate[key] || [];
    const setPlan = (key, items) => { State.data.plannedByDate[key] = items; State.save(); render(); };

    const render = () => {
      const key = getDateKey();
      dateEl.value = key;
      // Unplanned: open tasks without due today
      const today = key;
      const unplanned = State.data.tasks.filter(t => !t.done && (t.due ? DateUtil.fmt(t.due) !== today : true));
      unplannedEl.innerHTML = "";
      for (const t of unplanned) {
        const li = document.createElement("li");
        li.className = "list-item";
        const add = document.createElement("button");
        add.className = "btn btn--ghost";
        add.textContent = "+";
        add.title = "Add to today's plan";
        add.addEventListener("click", () => {
          const plan = getPlan(key);
          plan.push({ id: Id(), text: t.title, taskId: t.id, done: false });
          setPlan(key, plan);
        });
        const title = document.createElement("div");
        title.className = "list-item__title";
        title.textContent = t.title;
        const meta = document.createElement("div");
        meta.className = "list-item__meta";
        const chip = document.createElement("span"); chip.className = "chip"; chip.textContent = t.due ? `Due ${DateUtil.fmt(t.due)}` : "No due";
        meta.appendChild(chip);
        li.append(add, title, meta);
        unplannedEl.appendChild(li);
      }

      // Planned
      const plan = getPlan(key);
      plannedEl.innerHTML = "";
      for (const p of plan) {
        const li = document.createElement("li");
        li.className = "list-item";
        const checkbox = document.createElement("button");
        checkbox.className = "checkbox" + (p.done ? " checkbox--on" : "");
        checkbox.textContent = p.done ? "✓" : "";
        checkbox.addEventListener("click", () => {
          p.done = !p.done;
          if (p.taskId) {
            const t = State.data.tasks.find(t => t.id === p.taskId);
            if (t) t.done = p.done;
          }
          State.save(); render();
        });
        const title = document.createElement("div");
        title.className = "list-item__title";
        title.textContent = p.text;
        title.contentEditable = "true";
        title.addEventListener("blur", () => { p.text = title.textContent.trim(); State.save(); });
        const actions = document.createElement("div");
        const del = document.createElement("button");
        del.className = "btn btn--ghost"; del.textContent = "Delete";
        del.addEventListener("click", () => {
          const next = getPlan(key).filter(x => x.id !== p.id);
          setPlan(key, next);
        });
        actions.appendChild(del);
        li.append(checkbox, title, actions);
        plannedEl.appendChild(li);
      }
    };

    const suggest = () => {
      const key = getDateKey();
      const open = State.data.tasks.filter(t => !t.done);
      const high = open.filter(t => t.priority === 1).slice(0, 2);
      const dueSoon = open.filter(t => t.due && DateUtil.fmt(t.due) <= DateUtil.fmt(new Date())).slice(0, 2);
      const misc = open.filter(t => t.priority !== 1 && (!t.due || DateUtil.fmt(t.due) > DateUtil.fmt(new Date()))).slice(0, 2);
      const items = [...high, ...dueSoon, ...misc];
      const plan = items.map(t => ({ id: Id(), text: t.title, taskId: t.id, done: false }));
      setPlan(key, plan);
    };

    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = (addInput.value || "").trim();
      if (!text) return;
      const key = getDateKey();
      const plan = getPlan(key);
      plan.push({ id: Id(), text, taskId: null, done: false });
      setPlan(key, plan);
      addForm.reset();
      addInput.focus();
    });

    dateEl.addEventListener("change", render);
    suggestEl.addEventListener("click", suggest);

    return { render };
  })();

  // Diary
  const Diary = (() => {
    const dateEl = document.getElementById("diary-date");
    const moodEl = document.getElementById("diary-mood");
    const textEl = document.getElementById("diary-text");
    const saveEl = document.getElementById("diary-save");
    const statusEl = document.getElementById("diary-status");
    const historyEl = document.getElementById("diary-history");

    const key = () => dateEl.value || DateUtil.fmt(new Date());
    const load = () => {
      const k = key();
      dateEl.value = k;
      const entry = State.data.diaryByDate[k] || { mood: "", text: "" };
      moodEl.value = entry.mood || "";
      textEl.value = entry.text || "";
      renderHistory();
    };
    const save = () => {
      const k = key();
      State.data.diaryByDate[k] = { mood: moodEl.value, text: textEl.value, ts: Date.now() };
      State.save();
      statusEl.textContent = "Saved.";
      setTimeout(() => statusEl.textContent = "", 1500);
      renderHistory();
    };
    const renderHistory = () => {
      const items = Object.entries(State.data.diaryByDate)
        .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0))
        .slice(0, 20);
      historyEl.innerHTML = "";
      for (const [d, e] of items) {
        const li = document.createElement("li");
        li.className = "list-item";
        const dot = document.createElement("div"); dot.className = "chip"; dot.textContent = e.mood || "•";
        const title = document.createElement("div"); title.className = "list-item__title"; title.textContent = `${d}`;
        const open = document.createElement("button"); open.className = "btn btn--ghost"; open.textContent = "Open";
        open.addEventListener("click", () => { dateEl.value = d; load(); });
        li.append(dot, title, open);
        historyEl.appendChild(li);
      }
    };
    dateEl.addEventListener("change", load);
    saveEl.addEventListener("click", save);
    return { load };
  })();

  // Assistant (rule-based + simple templated responses)
  const Assistant = (() => {
    const logEl = document.getElementById("assistant-log");
    const formEl = document.getElementById("assistant-form");
    const inputEl = document.getElementById("assistant-input");

    const addMsg = (text, who) => {
      const div = document.createElement("div");
      div.className = "message message--" + (who || "bot");
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    };

    const respond = (msg) => {
      const text = msg.toLowerCase();
      // intents
      if (/add task\b/.test(text)) {
        const title = msg.replace(/.*add task\b/i, "").trim() || "Untitled";
        Tasks.add({ id: Id(), title, createdAt: Date.now(), due: null, priority: 2, done: false });
        return `Added task: ${title}`;
      }
      if (/plan\b|today\b/.test(text)) {
        const open = State.data.tasks.filter(t => !t.done);
        if (!open.length) return "No open tasks. Add one to get started.";
        const picks = open.sort((a,b)=>a.priority-b.priority).slice(0,3).map(t=>`• ${t.title}`);
        return `Suggested focus for today:\n${picks.join("\n")}`;
      }
      if (/motivat(e|ion)|nudge|quote/.test(text)) {
        const qs = State.data.quotes; return qs[Math.floor(Math.random()*qs.length)];
      }
      if (/diary|reflect|journal/.test(text)) {
        return "Open the Diary to jot a few lines about today. What went well?";
      }
      // default
      return "I can add tasks, suggest a plan, or log a diary entry. Try: 'add task read for 20m'";
    };

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = inputEl.value.trim();
      if (!v) return;
      addMsg(v, "you");
      const reply = respond(v);
      addMsg(reply, "bot");
      formEl.reset();
      inputEl.focus();
    });

    return {};
  })();

  // Init
  function init() {
    Router.init();
    Motivator.init();
    Tasks.render();
    Planner.render();
    Diary.load();
    // Prefill dates
    const today = DateUtil.fmt(new Date());
    const plannerDate = document.getElementById("planner-date");
    const diaryDate = document.getElementById("diary-date");
    plannerDate.value = today;
    diaryDate.value = today;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

