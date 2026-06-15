"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Category = "dsa" | "learning" | "reading" | "personal" | "office" | "habit";
type View = "today" | "tasks" | "progress";
type TaskInput = {
  title: string;
  category: Category;
  date: string;
  start: string;
  end: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  resourceUrl?: string;
  syncToCalendar?: boolean;
};
type Task = TaskInput & {
  _id: string;
  status: "planned" | "completed" | "skipped";
  skipReason?: string;
  calendarEventId?: string;
};


const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

function readLocation() {
  if (typeof window === "undefined") return { view: "today" as View, date: today() };
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  return {
    view: (["today", "tasks", "progress"].includes(requestedView ?? "")
      ? requestedView
      : "today") as View,
    date: params.get("date") || today(),
  };
}

export default function Home() {
  const { data: session, status } = useSession();
  const initial = readLocation();
  const [view, setView] = useState<View>(initial.view);
  const [date, setDate] = useState(initial.date);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"task" | "ai" | "hours" | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlan, setAiPlan] = useState<TaskInput[]>([]);
  const [now, setNow] = useState(() => new Date());

  const loadTasks = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const query = view === "today" ? `?date=${date}` : "";
    const response = await fetch(`/api/tasks${query}`);
    if (response.ok) setTasks(await response.json());
    setLoading(false);
  }, [date, status, view]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);



  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const restore = () => {
      const location = readLocation();
      setView(location.view);
      setDate(location.date);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  const completed = tasks.filter((task) => task.status === "completed").length;
  const skipped = tasks.filter((task) => task.status === "skipped").length;
  const planned = tasks.filter((task) => task.status === "planned").length;
  const score = tasks.length
    ? Math.round(((completed + planned * 0.2) / tasks.length) * 100)
    : 0;
  const nextTask = tasks.find((task) => task.status === "planned");
  const minutes = useMemo(
    () =>
      tasks.reduce((total, task) => {
        const [sh, sm] = task.start.split(":").map(Number);
        const [eh, em] = task.end.split(":").map(Number);
        return total + Math.max(0, eh * 60 + em - sh * 60 - sm);
      }, 0),
    [tasks]
  );

  function navigate(nextView: View, nextDate = date) {
    const params = new URLSearchParams();
    params.set("view", nextView);
    if (nextView === "today") params.set("date", nextDate);
    window.history.pushState({}, "", `?${params.toString()}`);
    setView(nextView);
    setDate(nextDate);
  }

  function moveDate(days: number) {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + days);
    navigate("today", value.toISOString().slice(0, 10));
  }

  async function createTaskData(input: TaskInput) {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create task");
    return data as Task;
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      const input = {
        ...(Object.fromEntries(form.entries()) as unknown as TaskInput),
        date,
        syncToCalendar: form.has("sync"),
      };
      const task = await createTaskData(input);
      setModal(null);
      await loadTasks();
      if (input.syncToCalendar) {
        try {
          await syncCalendar(task._id, false);
          showNotice("Task added and synced to Google Calendar");
        } catch (error) {
          showNotice(`Task saved. ${error instanceof Error ? error.message : "Calendar sync failed."}`);
        }
      } else {
        showNotice("Task added to your plan");
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not create task");
    } finally {
      setSaving(false);
    }
  }

  async function generateAiPlan(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setAiPlan([]);
    const response = await fetch("/api/ai/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: aiPrompt,
        currentDate: today(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok) setAiPlan(data.tasks);
    else showNotice(data?.error || "AI could not create the plan");
    setSaving(false);
  }

  async function acceptAiPlan() {
    setSaving(true);
    try {
      const created: Array<{ task: Task; input: TaskInput }> = [];
      for (const input of aiPlan) {
        created.push({ task: await createTaskData(input), input });
      }
      let syncFailures = 0;
      for (const item of created.filter(({ input }) => input.syncToCalendar)) {
        try {
          await syncCalendar(item.task._id, false);
        } catch {
          syncFailures += 1;
        }
      }
      const firstDate = aiPlan[0]?.date || today();
      const count = aiPlan.length;
      setModal(null);
      setAiPlan([]);
      setAiPrompt("");
      navigate("today", firstDate);
      await loadTasks();
      showNotice(
        syncFailures
          ? `${count} tasks added; ${syncFailures} Calendar sync${syncFailures === 1 ? "" : "s"} failed`
          : `${count} tasks added${aiPlan.some((task) => task.syncToCalendar) ? " and synced" : ""}`
      );
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save the AI plan");
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id: string, updates: Record<string, unknown>) {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) await loadTasks();
  }


  async function skipTask(task: Task) {
    const reason = window.prompt("What got in the way? Be honest and brief.");
    if (reason?.trim()) await updateTask(task._id, { status: "skipped", skipReason: reason });
  }

  async function syncCalendar(taskId: string, announce = true) {
    const response = await fetch("/api/calendar/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await response.json().catch(() => null);
    if (announce) {
      showNotice(response.ok ? "Added to Google Calendar" : data?.error || "Calendar sync failed");
    }
    if (!response.ok) throw new Error(data?.error || "Calendar sync failed");
  }

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 4500);
  }

  if (status === "loading") return <main className="center"><div className="spinner" /></main>;
  if (!session) return <Login />;

  return (
    <main className="shell">
      <aside>
        <div className="brand"><span className="logo mini">D</span><b>Daymark</b></div>
        <nav>
          <button className={view === "today" ? "selected" : ""} onClick={() => navigate("today", today())}>Today</button>
          <button className={view === "tasks" ? "selected" : ""} onClick={() => navigate("tasks")}>All tasks</button>
          <button className={view === "progress" ? "selected" : ""} onClick={() => navigate("progress")}>Progress</button>
        </nav>
        <div className="account">
          {session.user?.image && <img src={session.user.image} alt="" />}
          <div><b>{session.user?.name}</b><small>{session.user?.email}</small></div>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </aside>

      <section className="workspace">
        {notice && <div className="notice">{notice}</div>}
        <PageHeader
          view={view}
          date={date}
          onMoveDate={moveDate}
          onToday={() => navigate("today", today())}
          onAdd={() => setModal("task")}
          onAi={() => setModal("ai")}
          // onHours={() => setModal("hours")}
        />
        {view === "today" && (
          <TodayView
            tasks={tasks}
            loading={loading}
            score={score}
            minutes={minutes}
            completed={completed}
            nextTask={nextTask}
            onAdd={() => setModal("task")}
            onUpdate={updateTask}
            onSkip={skipTask}
            onSync={syncCalendar}
          />
        )}
        {view === "tasks" && (
          <AllTasks tasks={tasks} loading={loading} onUpdate={updateTask} onSkip={skipTask} onSync={syncCalendar} />
        )}
        {view === "progress" && (
          <Progress tasks={tasks} completed={completed} skipped={skipped} planned={planned} score={score} minutes={minutes} />
        )}
      </section>

      {modal === "ai" && (
        <AiModal
          prompt={aiPrompt}
          plan={aiPlan}
          saving={saving}
          onPrompt={setAiPrompt}
          onGenerate={generateAiPlan}
          onAccept={acceptAiPlan}
          onClose={() => { setModal(null); setAiPlan([]); }}
        />
      )}
      
       {modal === "task" && (
        <TaskModal
          date={date}
          saving={saving}
          onClose={() => setModal(null)}
          onSubmit={createTask}
        />
      )}
    </main>
  );
}

function PageHeader({ view, date, onMoveDate, onToday, onAdd, onAi }: {
  view: View; date: string; onMoveDate: (days: number) => void; onToday: () => void; onAdd: () => void; onAi: () => void;
}) {
  const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })
    .format(new Date(`${date}T12:00:00`));
  const title = view === "today" ? (date === today() ? "Today" : dateLabel) : view === "tasks" ? "All tasks" : "Progress";
  return (
    <header className="topbar">
      <div><p className="kicker">{view === "progress" ? "YOUR CONSISTENCY" : "DAILY COMMAND CENTER"}</p><h1>{title}</h1><small>{view === "today" ? dateLabel : view === "tasks" ? "Every promise in one place" : "An honest view of your follow-through"}</small></div>
      <div className="date-nav">
        {view === "today" && <><button onClick={() => onMoveDate(-1)} aria-label="Previous day">&lt;</button><button onClick={onToday}>Today</button><button onClick={() => onMoveDate(1)} aria-label="Next day">&gt;</button></>}
        <button className="ai-button" onClick={onAi}>AI plan</button>
        <button className="primary" onClick={onAdd}>+ Plan a block</button>
      </div>
    </header>
  );
}

function TodayView({ tasks, loading, score, minutes, completed, nextTask, onAdd, onUpdate, onSkip, onSync }: {
  tasks: Task[]; loading: boolean; score: number; minutes: number; completed: number; nextTask?: Task; onAdd: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>;
}) {
  return <>
    <section className="cards">
      <article className="next"><p className="label">DO THIS NEXT</p><h2>{nextTask?.title || (tasks.length ? "Day complete" : "Plan your first block")}</h2><p>{nextTask ? `${nextTask.start}-${nextTask.end} - ${nextTask.category}` : "Your next clear action will appear here."}</p>{nextTask && <div><button onClick={() => onUpdate(nextTask._id, { status: "completed" })}>Mark complete</button><button onClick={() => onSkip(nextTask)}>Skip</button></div>}</article>
      <article className="score"><ScoreRing score={score} /><div><p className="label">DISCIPLINE SCORE</p><h3>{score >= 80 ? "Strong day" : score >= 50 ? "Keep going" : "Start small"}</h3><small>{completed} of {tasks.length} promises kept</small></div></article>
      <article className="focus"><p className="label">PLANNED FOCUS</p><strong>{Math.floor(minutes / 60)}h {minutes % 60}m</strong><small>across {tasks.length} blocks</small></article>
    </section>
    <TaskPanel title="Plan, then follow through." tasks={tasks} loading={loading} emptyAction={onAdd} onUpdate={onUpdate} onSkip={onSkip} onSync={onSync} />
  </>;
}

function AllTasks(props: { tasks: Task[]; loading: boolean; onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void> }) {
  return <TaskPanel title="Everything you have planned." groupByDate {...props} />;
}

function TaskPanel({ title, tasks, loading, groupByDate, emptyAction, onUpdate, onSkip, onSync }: {
  title: string; tasks: Task[]; loading: boolean; groupByDate?: boolean; emptyAction?: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>;
}) {
  return <section className="timeline">
    <header><div><p className="label">{groupByDate ? "TASK LIBRARY" : "YOUR TIMELINE"}</p><h2>{title}</h2></div></header>
    {loading ? <div className="empty">Loading your plan...</div> : tasks.length === 0 ? <div className="empty"><b>No time blocks yet.</b><span>Give your day a shape before it fills itself.</span>{emptyAction && <button onClick={emptyAction}>Plan the first block</button>}</div> :
      <div>{tasks.map((task, index) => <div key={task._id}>{groupByDate && (index === 0 || tasks[index - 1].date !== task.date) && <h3 className="date-divider">{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${task.date}T12:00:00`))}</h3>}<TaskRow task={task} onUpdate={onUpdate} onSkip={onSkip} onSync={onSync} /></div>)}</div>}
  </section>;
}

function TaskRow({ task, onUpdate, onSkip, onSync }: { task: Task; onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void> }) {
  return <article className={`task ${task.status}`}>
    <time>{task.start}<small>{task.end}</small></time><i className={task.category} />
    <div className="task-info"><span className={`pill ${task.category}`}>{task.category}</span>{task.priority === "high" && <span className="pill priority">high</span>}<h3>{task.title}</h3>{task.resourceUrl && <a href={task.resourceUrl} target="_blank" rel="noreferrer">Open resource</a>}{task.skipReason && <p>Skipped: {task.skipReason}</p>}</div>
    <div className="task-buttons">{task.status === "planned" ? <><button onClick={() => onUpdate(task._id, { status: "completed" })} title="Complete">OK</button><button onClick={() => onSkip(task)} title="Skip">X</button></> : <small>{task.status}</small>}<button onClick={() => onSync(task._id)} title="Sync Google Calendar">G</button></div>
  </article>;
}

function Progress({ tasks, completed, skipped, planned, score, minutes }: { tasks: Task[]; completed: number; skipped: number; planned: number; score: number; minutes: number }) {
  const categories = ["dsa", "learning", "reading", "personal", "office", "habit"] as Category[];
  return <>
    <section className="progress-cards"><article><ScoreRing score={score} /><div><p className="label">OVERALL SCORE</p><h2>{score}%</h2></div></article><article><p className="label">COMPLETED</p><strong>{completed}</strong><small>tasks finished</small></article><article><p className="label">PLANNED TIME</p><strong>{Math.floor(minutes / 60)}h {minutes % 60}m</strong><small>across all tasks</small></article><article><p className="label">STILL OPEN</p><strong>{planned}</strong><small>{skipped} skipped</small></article></section>
    <section className="timeline category-progress"><header><p className="label">CATEGORY BREAKDOWN</p><h2>Where your effort is going.</h2></header>{categories.map((category) => { const categoryTasks = tasks.filter((task) => task.category === category); const done = categoryTasks.filter((task) => task.status === "completed").length; const percent = categoryTasks.length ? Math.round(done / categoryTasks.length * 100) : 0; return <div className="progress-row" key={category}><span className={`pill ${category}`}>{category}</span><div><i style={{ width: `${percent}%` }} /></div><b>{done}/{categoryTasks.length}</b></div>; })}</section>
  </>;
}

function ScoreRing({ score }: { score: number }) {
  return <div className="ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}<small>%</small></span></div>;
}

function TaskModal({ date, saving, onClose, onSubmit }: { date: string; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <div className="backdrop" onMouseDown={onClose}><form className="task-form" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><header><div><p className="label">NEW TIME BLOCK - {date}</p><h2>Make a clear promise.</h2></div><button type="button" onClick={onClose}>X</button></header><label>Task name<input name="title" placeholder="Read React rendering article" required autoFocus /></label><div className="form-grid"><label>Category<select name="category" defaultValue="dsa"><option value="dsa">DSA</option><option value="learning">Learning</option><option value="reading">Reading</option><option value="personal">Personal</option><option value="office">Office task name</option><option value="habit">Habit</option></select></label><label>Priority<select name="priority" defaultValue="medium"><option>low</option><option>medium</option><option>high</option></select></label><label>Start<input type="time" name="start" defaultValue="07:00" required /></label><label>End<input type="time" name="end" defaultValue="08:00" required /></label></div><label>Resource or blog link<input type="url" name="resourceUrl" placeholder="https://example.com/article" /></label><label>Notes<textarea name="notes" placeholder="What does done look like?" /></label><label className="check"><input type="checkbox" name="sync" /> Add to Google Calendar</label><button className="primary submit" disabled={saving}>{saving ? "Planning..." : "Add to my day"}</button></form></div>;
}

function AiModal({ prompt, plan, saving, onPrompt, onGenerate, onAccept, onClose }: { prompt: string; plan: TaskInput[]; saving: boolean; onPrompt: (value: string) => void; onGenerate: (event: FormEvent) => Promise<void>; onAccept: () => Promise<void>; onClose: () => void }) {
  return <div className="backdrop" onMouseDown={onClose}><section className="task-form ai-form" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="label">AI PLANNER</p><h2>Tell me what your day needs.</h2></div><button type="button" onClick={onClose}>X</button></header><form onSubmit={onGenerate}><label>Describe your plan<textarea value={prompt} onChange={(event) => onPrompt(event.target.value)} placeholder="Tomorrow 7-8 AM solve two array problems. At 8:30 read this article https://... for 45 minutes. Sync both." required autoFocus /></label><button className="primary submit" disabled={saving}>{saving ? "Thinking..." : "Create draft plan"}</button></form>{plan.length > 0 && <div className="ai-preview"><p className="label">REVIEW BEFORE ADDING</p>{plan.map((task, index) => <article key={`${task.date}-${task.start}-${index}`}><b>{task.title}</b><span>{task.date} - {task.start} to {task.end} - {task.category}{task.syncToCalendar ? " - Calendar" : ""}</span></article>)}<button className="primary submit" onClick={onAccept} disabled={saving}>{saving ? "Adding..." : `Add ${plan.length} tasks`}</button></div>}</section></div>;
}

function Login() {
  return <main className="login"><section className="login-copy"><div className="logo">D</div><p className="kicker">YOUR PERSONAL OPERATING SYSTEM</p><h1>Turn intention into a day you can finish.</h1><p className="intro">Plan focused work, DSA practice, learning, and life in one honest timeline.</p><button className="google" onClick={() => signIn("google")}><span>G</span> Continue with Google</button><small>Your plans stay private to your Google account.</small></section><section className="login-art"><div className="preview"><header><b>Today</b><strong>82% discipline</strong></header><Preview time="07:00" title="Two pointer practice" meta="DSA - 60 min" kind="dsa" /><Preview time="10:00" title="Project focus block" meta="Office - 90 min" kind="office" /><Preview time="19:30" title="Read system design notes" meta="Reading - 45 min" kind="reading" /></div></section></main>;
}

function Preview({ time, title, meta, kind }: { time: string; title: string; meta: string; kind: string }) {
  return <div className="preview-row"><time>{time}</time><i className={kind} /><div><b>{title}</b><small>{meta}</small></div></div>;
}
