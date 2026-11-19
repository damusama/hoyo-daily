import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { v4 as uuid } from "uuid";
import type { AppData, GameId, StaminaState, TaskKind, Todo } from "./types";
import { initTodos } from "./initTodos";
import WelcomeMessage from "./WelcomeMessage";
import TodoList from "./TodoList";

const STORAGE_KEY = "astral-daily-v1";
const games: { id: GameId; name: string; en: string; logo: string; color: string; stamina: string; max: number; regen: number }[] = [
  { id: "genshin", name: "原神", en: "GENSHIN IMPACT", logo: `${import.meta.env.BASE_URL}gnsn.jpg`, color: "#b99b68", stamina: "天然樹脂", max: 200, regen: 8 },
  { id: "starrail", name: "崩壊：スターレイル", en: "HONKAI: STAR RAIL", logo: `${import.meta.env.BASE_URL}str.jpg`, color: "#c48bb8", stamina: "開拓力", max: 300, regen: 6 },
  { id: "hi3", name: "崩壊3rd", en: "HONKAI IMPACT 3RD", logo: `${import.meta.env.BASE_URL}hi3.jpg`, color: "#7166d3", stamina: "AP", max: 168, regen: 6 },
];
const initialStamina = (): Record<GameId, StaminaState> => ({
  genshin: { current: 120, max: 200, updatedAt: new Date().toISOString(), regenMinutes: 8 },
  starrail: { current: 180, max: 300, updatedAt: new Date().toISOString(), regenMinutes: 6 },
  hi3: { current: 90, max: 168, updatedAt: new Date().toISOString(), regenMinutes: 6 },
});
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const blankData = (): AppData => ({ todos: initTodos, stamina: initialStamina(), uids: { genshin: "", starrail: "", hi3: "" }, history: [], resetHour: { genshin: 4, starrail: 4, hi3: 4 } });
function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankData();
    const parsed = JSON.parse(raw) as AppData & { savedDate?: string };
    const data = { ...blankData(), ...parsed };
    if (parsed.savedDate && parsed.savedDate !== todayKey()) {
      const completed = data.todos.filter((t) => t.isDone).map((t) => t.id);
      data.history = [...(data.history || []).filter((h) => h.date !== parsed.savedDate), { date: parsed.savedDate, completed }].slice(-60);
      data.todos = data.todos.map((t) => ({ ...t, isDone: false }));
    }
    return data;
  } catch { return blankData(); }
}
const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}時間${minutes % 60}分`;
function getStamina(state: StaminaState) {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(state.updatedAt).getTime()) / 60000));
  const gained = Math.floor(elapsed / state.regenMinutes);
  const current = Math.min(state.max, state.current + gained);
  const remaining = current >= state.max ? 0 : state.regenMinutes - (elapsed % state.regenMinutes);
  return { current, next: remaining, full: current >= state.max, fullIn: current >= state.max ? 0 : (state.max - current - 1) * state.regenMinutes + remaining };
}

const App = () => {
  const [data, setData] = useState<AppData>(loadData);
  const [active, setActive] = useState<GameId | "all">("all");
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newKind, setNewKind] = useState<TaskKind>("daily");
  const [showComposer, setShowComposer] = useState(false);
  const [uidOpen, setUidOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedDate: todayKey() }));
  }, [data]);

  const visibleTodos = useMemo(() => active === "all" ? data.todos : data.todos.filter((t) => t.gameId === active || t.gameId === "all"), [active, data.todos]);
  const doneCount = visibleTodos.filter((t) => t.isDone).length;
  const remainingCount = visibleTodos.length - doneCount;
  const progress = visibleTodos.length ? Math.round(doneCount / visibleTodos.length * 100) : 0;
  const activeGame = games.find((g) => g.id === active);
  const dateLabel = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date(clock));

  const update = (fn: (prev: AppData) => AppData) => setData((prev) => fn(prev));
  const toggleTask = (id: string) => update((prev) => ({ ...prev, todos: prev.todos.map((t) => t.id === id ? { ...t, isDone: !t.isDone } : t) }));
  const deleteTask = (id: string) => update((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }));
  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Todo = { id: uuid(), name: newTask.trim(), note: newNote.trim() || undefined, isDone: false, priority: 2, deadline: null, gameId: active, kind: newKind, isCustom: true, createdAt: new Date().toISOString() };
    update((prev) => ({ ...prev, todos: [...prev.todos, task] }));
    setNewTask(""); setNewNote(""); setNewKind("daily"); setShowComposer(false);
  };
  const updateStamina = (gameId: GameId, value: number) => update((prev) => ({ ...prev, stamina: { ...prev.stamina, [gameId]: { ...prev.stamina[gameId], current: Math.max(0, Math.min(prev.stamina[gameId].max, value)), updatedAt: new Date().toISOString() } } }));
  const changeUid = (gameId: GameId, value: string) => update((prev) => ({ ...prev, uids: { ...prev.uids, [gameId]: value } }));
  const resetTasks = () => { if (window.confirm("すべての項目を未完了に戻しますか？ 完了履歴は保存されます。")) { update((prev) => ({ ...prev, history: [...prev.history, { date: todayKey(), completed: prev.todos.filter((t) => t.isDone).map((t) => t.id) }].slice(-60), todos: prev.todos.map((t) => ({ ...t, isDone: false })) })); setNotice("今日のチェック状態をリセットしました"); } };
  return <div className="app-shell">
    <header className="site-header">
      <button className="brand" onClick={() => setActive("all")} aria-label="トップへ"><span className="brand-mark">✦</span><span><strong>HOYO DAILY</strong><small>TRAVELER'S RECORD</small></span></button>
      <nav className="main-nav" aria-label="ゲーム選択">
        <button className={active === "all" ? "active" : ""} onClick={() => setActive("all")}>TOP</button>
        {games.map((g) => <button key={g.id} className={active === g.id ? "active" : ""} onClick={() => setActive(g.id)}>{g.name}</button>)}
      </nav>
      <div className="header-date"><span className="status-dot"/> {dateLabel}</div>
    </header>

    <main>
      <section className={`hero ${active !== "all" ? `hero-${active}` : ""}`}>
        <div className="hero-text">
          <span className="eyebrow">PERSONAL GAME COMPANION / NO. 001</span>
          <h1>{activeGame ? activeGame.name : "今日の記録"}<span>{activeGame ? activeGame.en : "DAILY ROUTINE COLLECTION"}</span></h1>
        </div>
        <div className={`game-logo-list${activeGame ? " single" : ""}`} aria-label="ゲームロゴ">
          {games.filter((game) => active === "all" || game.id === active).map((game) => (
            <button
              className={`game-logo${active === game.id ? " selected" : ""}`}
              key={game.id}
              onClick={() => setActive(game.id)}
              style={{ "--game-accent": game.color } as CSSProperties}
              aria-label={`${game.name}を表示`}
              aria-pressed={active === game.id}
            >
              <img className="game-logo-image" src={game.logo} alt={game.name} />
            </button>
          ))}
        </div>
        <div className="hero-line"/>
      </section>

      {notice && <button className="notice" onClick={() => setNotice("")}>{notice} ×</button>}

      {active === "all" ? <>
        <section className="intro-row"><div><span className="section-kicker">YOUR COLLECTION</span><h2>本日のステータス</h2></div><div className="intro-side"><WelcomeMessage name="旅人" uncompletedCount={remainingCount}/></div></section>
        <section className="game-overview-grid">
          {games.map((g) => <button className="game-tile" key={g.id} onClick={() => setActive(g.id)} style={{ "--game-accent": g.color } as CSSProperties}>
            <span className="tile-number">0{games.indexOf(g) + 1}</span><span className="tile-title">{g.name}</span><span className="tile-en">{g.en}</span>
            <span className="tile-bottom"><span>{g.stamina} {getStamina(data.stamina[g.id]).current}/{data.stamina[g.id].max}</span><span>OPEN ↗</span></span>
            <span className="tile-progress"><i style={{ width: `${getStamina(data.stamina[g.id]).current / data.stamina[g.id].max * 100}%` }}/></span>
          </button>)}
        </section>
        <section className="overview-lower">
          <div className="panel task-panel"><div className="panel-heading"><div><span className="section-kicker">ALL GAMES</span><h2>今日のチェックリスト</h2></div><span className="count-label">{doneCount} / {visibleTodos.length} COMPLETE</span></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }}/></div>
            <TodoList todos={visibleTodos} onToggle={toggleTask} onDelete={deleteTask}/>
          </div>
          <aside className="side-panel"><span className="section-kicker">QUICK ACCESS</span><h3>記録を整える</h3><p>日課の追加やチェック状態のリセットはこちらから。</p><button className="outline-button" onClick={() => { setActive("genshin"); setShowComposer(true); }}>＋ 日課を追加する</button><button className="text-button" onClick={resetTasks}>チェック状態をリセット</button><div className="side-note">LOCAL DATA<br/>この端末のブラウザに保存されます。</div></aside>
        </section>
      </> : activeGame && <>
        <section className="detail-layout">
          <div className="detail-main">
            <div className="section-heading"><div><span className="section-kicker">DAILY MANAGEMENT</span><h2>日課チェック</h2></div><span className="count-label">{doneCount} / {visibleTodos.length} COMPLETE</span></div>
            <div className="progress-track large"><i style={{ width: `${progress}%` }}/></div>
            <div className="filter-caption">TODAY'S TASKS <span>{remainingCount} ITEMS LEFT</span></div>
            <TodoList todos={visibleTodos} onToggle={toggleTask} onDelete={deleteTask}/>
            {showComposer ? <div className="composer"><select aria-label="日課の種類" value={newKind} onChange={(e) => setNewKind(e.target.value as TaskKind)}><option value="login">ログイン</option><option value="daily">デイリー</option><option value="weekly">ウィークリー</option></select><input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="追加する日課の名前" onKeyDown={(e) => e.key === "Enter" && addTask()}/><input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="メモ（任意）"/><div><button className="solid-button" onClick={addTask}>追加する</button><button className="cancel-button" onClick={() => setShowComposer(false)}>キャンセル</button></div></div> : <button className="add-row" onClick={() => setShowComposer(true)}>＋ 日課の追加</button>}
          </div>
          <aside className="detail-aside">
            <div className="resource-panel"><span className="section-kicker">RESOURCE STATUS</span><h3>{activeGame.stamina}</h3><div className="resource-number"><strong>{getStamina(data.stamina[active]).current}</strong><span>/ {data.stamina[active].max}</span></div><div className="resource-track"><i style={{ width: `${getStamina(data.stamina[active]).current / data.stamina[active].max * 100}%` }}/></div><div className="resource-meta"><span>{getStamina(data.stamina[active]).full ? "上限に到達しています" : `次の回復まで ${formatDuration(getStamina(data.stamina[active]).next)}`}</span><span>{getStamina(data.stamina[active]).full ? "FULL" : `全回復まで ${formatDuration(getStamina(data.stamina[active]).fullIn)}`}</span></div><label className="field-label" htmlFor="stamina-input">現在の{activeGame.stamina}（手動入力）</label><div className="number-control"><input id="stamina-input" type="number" min="0" max={data.stamina[active].max} value={getStamina(data.stamina[active]).current} onChange={(e) => updateStamina(active, Number(e.target.value))}/><span>/ {data.stamina[active].max}</span></div><p className="fine-print">入力した時刻から回復量を予測します。ゲーム内の値は自動取得しません。</p></div>
            <div className="account-panel"><span className="section-kicker">PLAYER INFORMATION</span><h3>アカウント情報</h3><button className="text-button" onClick={() => setUidOpen(!uidOpen)}>{uidOpen ? "UID欄を閉じる" : "UIDを登録する ＋"}</button>{uidOpen && <label className="field-label">UID<input className="uid-input" value={data.uids[active]} onChange={(e) => changeUid(active, e.target.value)} placeholder="UID（任意）"/></label>}<p className="fine-print">UIDはこの端末内に保存するメモ用です。ログイン認証や非公開データの取得は行いません。</p></div>
            <div className="account-panel"><span className="section-kicker">TOOLS</span><button className="text-button" onClick={resetTasks}>今日のチェックをリセット</button></div>
          </aside>
        </section>
      </>}
      <section className="footnote"><span>HOYO DAILY ✦</span><span>YOUR JOURNEY, YOUR RECORD.</span><span>DATA SAVED LOCALLY</span></section>
    </main>
  </div>;
};
export default App;
