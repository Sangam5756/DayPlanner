"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type CategoryItem = {
  id: string;
  label: string;
  color: string;
};

type UserPreferences = {
  _id?: string;
  userEmail: string;
  dayStart: string;
  dayEnd: string;
  categories: CategoryItem[];
  createdAt?: string;
  updatedAt?: string;
};

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type BlueprintSlot = {
  start: string;
  end: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  notes?: string;
};

type BlueprintDay = {
  slots: BlueprintSlot[];
};

type Blueprint = {
  _id?: string;
  userEmail: string;
  monday: BlueprintDay;
  tuesday: BlueprintDay;
  wednesday: BlueprintDay;
  thursday: BlueprintDay;
  friday: BlueprintDay;
  saturday: BlueprintDay;
  sunday: BlueprintDay;
  createdAt?: string;
  updatedAt?: string;
};

type View = "today" | "tasks" | "progress" | "settings";
type TaskInput = {
  title: string;
  category: string;
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
  const [modal, setModal] = useState<"task" | "ai" | "categories" | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlan, setAiPlan] = useState<TaskInput[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(true);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModal("task");
  };

  const closeModal = () => {
    setModal(null);
    setEditingTask(null);
  };

  const saveUserPreferences = async (updatedPrefs: UserPreferences) => {
    console.log("saveUserPreferences - updatedPrefs:", updatedPrefs);
    const response = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPrefs),
    });

    console.log("saveUserPreferences - response status:", response.status);

    if (response.ok) {
      const newPrefs = await response.json();
      console.log("saveUserPreferences - newPrefs from server:", newPrefs);
      setUserPrefs(newPrefs);
      showNotice("Settings saved!");
      return newPrefs;
    } else {
      const errorText = await response.text();
      console.error("saveUserPreferences - error:", errorText);
      showNotice("Failed to save settings");
      return null;
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("daymark-theme", newTheme);
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("daymark-theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const query = view === "today" ? `?date=${date}` : "";
    const response = await fetch(`/api/tasks${query}`);
    if (response.ok) setTasks(await response.json());
    setLoading(false);
  }, [date, status, view]);

  const loadUserPrefs = useCallback(async () => {
    if (status !== "authenticated") return;
    setPrefsLoading(true);
    const response = await fetch("/api/user-preferences");
    if (response.ok) setUserPrefs(await response.json());
    setPrefsLoading(false);
  }, [status]);

  const loadBlueprint = useCallback(async () => {
    if (status !== "authenticated") return;
    setBlueprintLoading(true);
    const response = await fetch("/api/blueprint");
    if (response.ok) setBlueprint(await response.json());
    setBlueprintLoading(false);
  }, [status]);

  const saveBlueprint = async (updatedBlueprint: Blueprint) => {
    console.log("saveBlueprint - updatedBlueprint:", updatedBlueprint);
    const response = await fetch("/api/blueprint", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedBlueprint),
    });

    console.log("saveBlueprint - response status:", response.status);

    if (response.ok) {
      const newBlueprint = await response.json();
      console.log("saveBlueprint - newBlueprint:", newBlueprint);
      setBlueprint(newBlueprint);
      showNotice("Blueprint saved!");
      return newBlueprint;
    } else {
      const errorText = await response.text();
      console.error("saveBlueprint - error:", errorText);
      showNotice("Failed to save blueprint");
      return null;
    }
  };

  const generateTasksFromBlueprint = async () => {
    console.log("generateTasksFromBlueprint - date being sent:", date);
    const response = await fetch("/api/blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    console.log("generateTasksFromBlueprint - response status:", response.status);
    const responseData = await response.text();
    console.log("generateTasksFromBlueprint - responseData:", responseData);

    if (response.ok) {
      showNotice("Generated tasks from blueprint!");
      await loadTasks();
    } else {
      showNotice(`Failed to generate tasks: ${responseData}`);
    }
  };

  useEffect(() => {
    loadTasks();
    loadUserPrefs();
    loadBlueprint();
  }, [loadTasks, loadUserPrefs, loadBlueprint]);



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

  async function deleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) {
      await loadTasks();
      showNotice("Task deleted");
    }
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      if (editingTask) {
        // Update existing task
        const updates = {
          title: form.get("title") as string,
          category: form.get("category") as string,
          priority: form.get("priority") as "low" | "medium" | "high",
          start: form.get("start") as string,
          end: form.get("end") as string,
          notes: form.get("notes") as string,
          resourceUrl: form.get("resourceUrl") as string,
          date: editingTask.date,
        };
        await updateTask(editingTask._id, updates);
        showNotice("Task updated");
      } else {
        // Create new task
        const input = {
          ...(Object.fromEntries(form.entries()) as unknown as TaskInput),
          date,
          syncToCalendar: form.has("sync"),
        };
        const task = await createTaskData(input);
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
      }
      setModal(null);
      setEditingTask(null);
      await loadTasks();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save task");
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
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={sidebarOpen ? "open" : ""}>
        <div className="brand">
          <span className="logo mini">D</span>
          <b>Daymark</b>
        </div>
        <nav>
          <button className={view === "today" ? "selected" : ""} onClick={() => { navigate("today", today()); setSidebarOpen(false); }}>Today</button>
          <button className={view === "tasks" ? "selected" : ""} onClick={() => { navigate("tasks"); setSidebarOpen(false); }}>All tasks</button>
          <button className={view === "progress" ? "selected" : ""} onClick={() => { navigate("progress"); setSidebarOpen(false); }}>Progress</button>
          <button className={view === "settings" ? "selected" : ""} onClick={() => { navigate("settings"); setSidebarOpen(false); }}>⚙️ Settings</button>
        </nav>
        <div className="account">
          {session.user?.image && <img src={session.user.image} alt="" />}
          <div><b>{session.user?.name}</b><small>{session.user?.email}</small></div>
          <div className="account-buttons">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? "☾" : "☀"}
            </button>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        {notice && <div className="notice">{notice}</div>}
        <div className="mobile-bar">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <span />
            <span />
            <span />
          </button>
          <div className="brand mini-brand">
            <span className="logo mini">D</span>
            <b>Daymark</b>
          </div>
          <button className="theme-toggle mobile-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
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
            onGenerateFromBlueprint={generateTasksFromBlueprint}
            onUpdate={updateTask}
            onSkip={skipTask}
            onSync={syncCalendar}
            onEdit={openEditModal}
            onDelete={deleteTask}
          />
        )}
        {view === "tasks" && (
          <AllTasks tasks={tasks} loading={loading} onUpdate={updateTask} onSkip={skipTask} onSync={syncCalendar} onEdit={openEditModal} onDelete={deleteTask} />
        )}
        {view === "progress" && (
        <Progress tasks={tasks} completed={completed} skipped={skipped} planned={planned} score={score} minutes={minutes} categories={userPrefs?.categories || []} />
      )}
      {view === "settings" && userPrefs && blueprint && (
        <Settings
          userPrefs={userPrefs}
          onSave={saveUserPreferences}
          blueprint={blueprint}
          onSaveBlueprint={saveBlueprint}
          onGenerateTasks={generateTasksFromBlueprint}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
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
          task={editingTask}
          date={editingTask?.date || date}
          categories={userPrefs?.categories || []}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleTaskSubmit}
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
  
  let title = "";
  let kicker = "";
  let subtitle = "";
  if (view === "today") {
    title = date === today() ? "Today" : dateLabel;
    kicker = "DAILY COMMAND CENTER";
    subtitle = dateLabel;
  } else if (view === "tasks") {
    title = "All tasks";
    kicker = "DAILY COMMAND CENTER";
    subtitle = "Every promise in one place";
  } else if (view === "progress") {
    title = "Progress";
    kicker = "YOUR CONSISTENCY";
    subtitle = "An honest view of your follow-through";
  } else if (view === "settings") {
    title = "Settings";
    kicker = "APPLICATION SETTINGS";
    subtitle = "Customize your planner";
  }

  return (
    <header className="topbar">
      <div><p className="kicker">{kicker}</p><h1>{title}</h1><small>{subtitle}</small></div>
      {view !== "settings" && (
        <div className="date-nav">
          {view === "today" && <div className="day-pager"><button onClick={() => onMoveDate(-1)} aria-label="Previous day">&lt;</button><button onClick={onToday}>Today</button><button onClick={() => onMoveDate(1)} aria-label="Next day">&gt;</button></div>}
          <div className="action-buttons">
            <button className="ai-button" onClick={onAi} title="Plan with AI">AI plan</button>
            <button className="primary" onClick={onAdd}>+ <span>Plan a block</span></button>
          </div>
        </div>
      )}
    </header>
  );
}

function TodayView({ tasks, loading, score, minutes, completed, nextTask, onAdd, onGenerateFromBlueprint, onUpdate, onSkip, onSync, onEdit, onDelete }: {
  tasks: Task[]; loading: boolean; score: number; minutes: number; completed: number; nextTask?: Task; onAdd: () => void;
  onGenerateFromBlueprint: () => Promise<void>;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void; onDelete: (id: string) => Promise<void>;
}) {
  return <>
    <section className="cards">
      <article className="next"><p className="label">DO THIS NEXT</p><h2>{nextTask?.title || (tasks.length ? "Day complete" : "Plan your first block")}</h2><p>{nextTask ? `${nextTask.start}-${nextTask.end} - ${nextTask.category}` : "Your next clear action will appear here."}</p>{nextTask && <div><button onClick={() => onUpdate(nextTask._id, { status: "completed" })}>Mark complete</button><button onClick={() => onSkip(nextTask)}>Skip</button></div>}</article>
      <article className="score"><ScoreRing score={score} /><div><p className="label">DISCIPLINE SCORE</p><h3>{score >= 80 ? "Strong day" : score >= 50 ? "Keep going" : "Start small"}</h3><small>{completed} of {tasks.length} promises kept</small></div></article>
      <article style={{ padding: "20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
        <p className="label">WEEKLY BLUEPRINT</p>
        <button
          className="primary"
          onClick={onGenerateFromBlueprint}
          style={{ marginTop: "10px" }}
        >
          📅 Generate Today from Blueprint
        </button>
      </article>
    </section>
    <TaskPanel title="Plan, then follow through." tasks={tasks} loading={loading} emptyAction={onAdd} onUpdate={onUpdate} onSkip={onSkip} onSync={onSync} onEdit={onEdit} onDelete={onDelete} />
  </>;
}

function AllTasks(props: { tasks: Task[]; loading: boolean; onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>; onEdit: (task: Task) => void; onDelete: (id: string) => Promise<void> }) {
  return <TaskPanel title="Everything you have planned." groupByDate {...props} />;
}

function TaskPanel({ title, tasks, loading, groupByDate, emptyAction, onUpdate, onSkip, onSync, onEdit, onDelete }: {
  title: string; tasks: Task[]; loading: boolean; groupByDate?: boolean; emptyAction?: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void; onDelete: (id: string) => Promise<void>;
}) {
  return <section className="timeline">
    <header><div><p className="label">{groupByDate ? "TASK LIBRARY" : "YOUR TIMELINE"}</p><h2>{title}</h2></div></header>
    {loading ? <div className="empty">Loading your plan...</div> : tasks.length === 0 ? <div className="empty"><b>No time blocks yet.</b><span>Give your day a shape before it fills itself.</span>{emptyAction && <button onClick={emptyAction}>Plan the first block</button>}</div> :
      <div>{tasks.map((task, index) => <div key={task._id}>{groupByDate && (index === 0 || tasks[index - 1].date !== task.date) && <h3 className="date-divider">{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${task.date}T12:00:00`))}</h3>}<TaskRow task={task} onUpdate={onUpdate} onSkip={onSkip} onSync={onSync} onEdit={onEdit} onDelete={onDelete} /></div>)}</div>}
  </section>;
}

function TaskRow({ task, onUpdate, onSkip, onSync, onEdit, onDelete }: { task: Task; onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>; onSkip: (task: Task) => Promise<void>; onSync: (id: string) => Promise<void>; onEdit: (task: Task) => void; onDelete: (id: string) => Promise<void> }) {
  return <article className={`task ${task.status}`}>
    <time>{task.start}<small>{task.end}</small></time><i className={task.category} />
    <div className="task-info"><span className={`pill ${task.category}`}>{task.category}</span>{task.priority === "high" && <span className="pill priority">high</span>}<h3>{task.title}</h3>{task.resourceUrl && <a href={task.resourceUrl} target="_blank" rel="noreferrer">Open resource</a>}{task.skipReason && <p>Skipped: {task.skipReason}</p>}</div>
    <div className="task-buttons">
      <button className="edit-btn" onClick={() => onEdit(task)} title="Edit">✏️</button>
      <button className="delete-btn" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
      {task.status === "planned" ? <><button onClick={() => onUpdate(task._id, { status: "completed" })} title="Complete">OK</button><button onClick={() => onSkip(task)} title="Skip">X</button></> : <small>{task.status}</small>}
      <button onClick={() => onSync(task._id)} title="Sync Google Calendar">G</button>
    </div>
  </article>;
}

function Progress({ tasks, completed, skipped, planned, score, minutes, categories }: { tasks: Task[]; completed: number; skipped: number; planned: number; score: number; minutes: number; categories: CategoryItem[] }) {
  return <>
    <section className="progress-cards"><article><ScoreRing score={score} /><div><p className="label">OVERALL SCORE</p><h2>{score}%</h2></div></article><article><p className="label">COMPLETED</p><strong>{completed}</strong><small>tasks finished</small></article><article><p className="label">PLANNED TIME</p><strong>{Math.floor(minutes / 60)}h {minutes % 60}m</strong><small>across all tasks</small></article><article><p className="label">STILL OPEN</p><strong>{planned}</strong><small>{skipped} skipped</small></article></section>
    <section className="timeline category-progress"><header><p className="label">CATEGORY BREAKDOWN</p><h2>Where your effort is going.</h2></header>{categories.map((category) => { const categoryTasks = tasks.filter((task) => task.category === category.id); const done = categoryTasks.filter((task) => task.status === "completed").length; const percent = categoryTasks.length ? Math.round(done / categoryTasks.length * 100) : 0; return <div className="progress-row" key={category.id}><span className={`pill ${category.color}`}>{category.label}</span><div><i style={{ width: `${percent}%` }} /></div><b>{done}/{categoryTasks.length}</b></div>; })}</section>
  </>;
}

function ScoreRing({ score }: { score: number }) {
  return <div className="ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}<small>%</small></span></div>;
}

function TaskModal({ task, date, categories, saving, onClose, onSubmit }: { task?: Task | null; date: string; categories: CategoryItem[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  return <div className="backdrop" onMouseDown={onClose}><form className="task-form" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><header><div><p className="label">{task ? "EDIT TIME BLOCK" : `NEW TIME BLOCK - ${date}`}</p><h2>{task ? "Update your promise." : "Make a clear promise."}</h2></div><button type="button" onClick={onClose}>X</button></header><label>Task name<input name="title" placeholder="Read React rendering article" required autoFocus defaultValue={task?.title} /></label><div className="form-grid"><label>Category<select name="category" defaultValue={task?.category || (categories[0]?.id || "")}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}</select></label><label>Priority<select name="priority" defaultValue={task?.priority || "medium"}><option>low</option><option>medium</option><option>high</option></select></label><label>Start<input type="time" name="start" defaultValue={task?.start || "07:00"} required /></label><label>End<input type="time" name="end" defaultValue={task?.end || "08:00"} required /></label></div><label>Resource or blog link<input type="url" name="resourceUrl" placeholder="https://example.com/article" defaultValue={task?.resourceUrl} /></label><label>Notes<textarea name="notes" placeholder="What does done look like?" defaultValue={task?.notes} /></label>{!task && <label className="check"><input type="checkbox" name="sync" /> Add to Google Calendar</label>}<button className="primary submit" disabled={saving}>{saving ? "Saving..." : task ? "Update task" : "Add to my day"}</button></form></div>;
}

function Settings({ userPrefs, onSave, blueprint, onSaveBlueprint, onGenerateTasks, theme, onToggleTheme }: { userPrefs: UserPreferences; onSave: (newPrefs: UserPreferences) => Promise<void>; blueprint: Blueprint; onSaveBlueprint: (newBlueprint: Blueprint) => Promise<void>; onGenerateTasks: () => Promise<void>; theme: "light" | "dark"; onToggleTheme: () => void; }) {
  const [dayStart, setDayStart] = useState(userPrefs.dayStart);
  const [dayEnd, setDayEnd] = useState(userPrefs.dayEnd);
  const [categories, setCategories] = useState<CategoryItem[]>([...userPrefs.categories]);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<"general" | "categories" | "blueprint">("general");

  useEffect(() => {
    console.log("Settings - categories changed:", categories);
  }, [categories]);

  const addCategory = () => {
    const id = `custom-${Date.now()}`;
    setCategories([...categories, { id, label: "New Category", color: "blue" }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, updates: Partial<CategoryItem>) => {
    const newCats = [...categories];
    newCats[index] = { ...newCats[index], ...updates };
    setCategories(newCats);
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    const newPrefs = { ...userPrefs, dayStart, dayEnd, categories };
    await onSave(newPrefs);
    setIsSavingPrefs(false);
  };

  const colorOptions = [
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Purple", value: "purple" },
    { name: "Orange", value: "orange" },
    { name: "Red", value: "red" },
    { name: "Teal", value: "teal" },
    { name: "Indigo", value: "indigo" },
  ];

  return (
    <section className="timeline">
      <header>
        <div>
          <p className="label">SETTINGS</p>
          <h1>Customize your experience</h1>
          <small>Tweak your planner to fit how you work</small>
        </div>
      </header>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("general")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "general" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "general" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "general" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("categories")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "categories" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "categories" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "categories" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          Categories
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("blueprint")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "blueprint" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "blueprint" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "blueprint" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          Weekly Blueprint
        </button>
      </div>

      {/* General Section */}
      {activeSettingsSection === "general" && (
        <>
          {/* Theme Setting */}
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", marginBottom: "16px", border: "1px solid var(--line)" }}>
            <p className="label" style={{ marginBottom: "12px" }}>THEME</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0 }}>Dark / Light mode</h3>
                <small style={{ color: "var(--muted)" }}>Choose your preferred visual style</small>
              </div>
              <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
                {theme === "light" ? "☾" : "☀"}
              </button>
            </div>
          </article>

          {/* Day Start/End */}
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", marginBottom: "16px", border: "1px solid var(--line)" }}>
            <p className="label" style={{ marginBottom: "12px" }}>WORKDAY HOURS</p>
            <div className="form-grid">
              <label>
                Day starts at
                <input
                  type="time"
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                />
              </label>
              <label>
                Day ends at
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                />
              </label>
            </div>
          </article>

          <button
            className="primary submit"
            onClick={handleSavePrefs}
            disabled={isSavingPrefs}
            style={{ marginTop: "24px", width: "100%", maxWidth: "200px", marginLeft: "auto" }}
          >
            {isSavingPrefs ? "Saving..." : "Save Settings"}
          </button>
        </>
      )}

      {/* Categories Section */}
      {activeSettingsSection === "categories" && (
        <>
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p className="label" style={{ marginBottom: 0 }}>CATEGORIES</p>
              <button type="button" onClick={addCategory} style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}>
                + Add Category
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {categories.map((cat, index) => (
                <div key={cat.id} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "12px", background: "var(--panel)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateCategory(index, { label: e.target.value })}
                    placeholder="Category name"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
                  />
                  <select
                    value={cat.color}
                    onChange={(e) => updateCategory(index, { color: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
                  >
                    {colorOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                  </select>
                  <button type="button" onClick={() => removeCategory(index)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", cursor: "pointer" }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </article>
          <button
            className="primary submit"
            onClick={handleSavePrefs}
            disabled={isSavingPrefs}
            style={{ marginTop: "24px", width: "100%", maxWidth: "200px", marginLeft: "auto" }}
          >
            {isSavingPrefs ? "Saving..." : "Save Categories"}
          </button>
        </>
      )}

      {/* Blueprint Section */}
      {activeSettingsSection === "blueprint" && (
        <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
          <p className="label" style={{ marginBottom: "12px" }}>WEEKLY BLUEPRINT</p>
          <BlueprintEditor
            blueprint={blueprint}
            categories={categories}
            onSave={onSaveBlueprint}
            onGenerateTasks={onGenerateTasks}
          />
        </article>
      )}
    </section>
  );
}

function AiModal({ prompt, plan, saving, onPrompt, onGenerate, onAccept, onClose }: { prompt: string; plan: TaskInput[]; saving: boolean; onPrompt: (value: string) => void; onGenerate: (event: FormEvent) => Promise<void>; onAccept: () => Promise<void>; onClose: () => void }) {
  return <div className="backdrop" onMouseDown={onClose}><section className="task-form ai-form" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="label">AI PLANNER</p><h2>Tell me what your day needs.</h2></div><button type="button" onClick={onClose}>X</button></header><form onSubmit={onGenerate}><label>Describe your plan<textarea value={prompt} onChange={(event) => onPrompt(event.target.value)} placeholder="Tomorrow 7-8 AM solve two array problems. At 8:30 read this article https://... for 45 minutes. Sync both." required autoFocus /></label><button className="primary submit" disabled={saving}>{saving ? "Thinking..." : "Create draft plan"}</button></form>{plan.length > 0 && <div className="ai-preview"><p className="label">REVIEW BEFORE ADDING</p>{plan.map((task, index) => <article key={`${task.date}-${task.start}-${index}`}><b>{task.title}</b><span>{task.date} - {task.start} to {task.end} - {task.category}{task.syncToCalendar ? " - Calendar" : ""}</span></article>)}<button className="primary submit" onClick={onAccept} disabled={saving}>{saving ? "Adding..." : `Add ${plan.length} tasks`}</button></div>}</section></div>;
}

function BlueprintSlotEditor({ slot, onUpdate, onDelete, categories }: { slot: BlueprintSlot; onUpdate: (updatedSlot: BlueprintSlot) => void; onDelete: () => void; categories: CategoryItem[]; }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "12px", background: "var(--panel)", borderRadius: "8px", border: "1px solid var(--line)" }}>
      <input
        type="time"
        value={slot.start}
        onChange={(e) => onUpdate({ ...slot, start: e.target.value })}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
      />
      <span style={{ color: "var(--muted)" }}>-</span>
      <input
        type="time"
        value={slot.end}
        onChange={(e) => onUpdate({ ...slot, end: e.target.value })}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
      />
      <input
        type="text"
        value={slot.title}
        onChange={(e) => onUpdate({ ...slot, title: e.target.value })}
        placeholder="Task Title"
        style={{ flex: "1", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
      />
      <select
        value={slot.category}
        onChange={(e) => onUpdate({ ...slot, category: e.target.value })}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.label}</option>
        ))}
      </select>
      <button type="button" onClick={onDelete} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", cursor: "pointer" }}>
        🗑️
      </button>
    </div>
  );
}

function BlueprintEditor({ blueprint, categories, onSave, onGenerateTasks }: { blueprint: Blueprint; categories: CategoryItem[]; onSave: (updatedBlueprint: Blueprint) => Promise<void>; onGenerateTasks: () => Promise<void>; }) {
  const [localBlueprint, setLocalBlueprint] = useState<Blueprint>({ ...blueprint });
  const [isSaving, setIsSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("monday");

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localBlueprint);
    setIsSaving(false);
  };

  const updateDay = (dayName: DayOfWeek, updatedDay: BlueprintDay) => {
    setLocalBlueprint({ ...localBlueprint, [dayName]: updatedDay });
  };

  const dayNames: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {dayNames.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: activeDay === day ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
              background: activeDay === day ? "var(--primary-button-bg)" : "var(--panel)",
              color: activeDay === day ? "white" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="label" style={{ marginBottom: 0 }}>
          {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}'s Slots
        </p>
        <button
          type="button"
          onClick={() => updateDay(activeDay, { ...localBlueprint[activeDay], slots: [...localBlueprint[activeDay].slots, {
            start: "07:00",
            end: "08:00",
            title: "New Task",
            category: categories[0]?.id || "dsa",
            priority: "medium"
          }] })}
          style={{ padding: "6px 16px", border: "1px solid var(--line)", borderRadius: "6px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}
        >
          + Add Slot
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        {localBlueprint[activeDay].slots.map((slot, index) => (
          <BlueprintSlotEditor
            key={index}
            slot={slot}
            onUpdate={(updatedSlot) => {
              const newSlots = [...localBlueprint[activeDay].slots];
              newSlots[index] = updatedSlot;
              updateDay(activeDay, { ...localBlueprint[activeDay], slots: newSlots });
            }}
            onDelete={() => {
              updateDay(activeDay, {
                ...localBlueprint[activeDay],
                slots: localBlueprint[activeDay].slots.filter((_, i) => i !== index)
              });
            }}
            categories={categories}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={onGenerateTasks} style={{ flex: 1, padding: "10px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}>
          📅 Generate Tasks from Blueprint
        </button>
        <button type="button" onClick={handleSave} disabled={isSaving} className="primary" style={{ padding: "10px 24px" }}>
          {isSaving ? "Saving..." : "Save Blueprint"}
        </button>
      </div>
    </div>
  );
}



function Login() {
  // Use same theme logic
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("daymark-theme", newTheme);
  };
  useEffect(() => {
    const savedTheme = localStorage.getItem("daymark-theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);
  
  return (
    <main className="login">
      <section className="login-copy">
        <div className="login-header">
          <div className="logo">D</div>
          <button className="theme-toggle login-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
        <p className="kicker">YOUR PERSONAL OPERATING SYSTEM</p>
        <h1>Turn intention into a day you can finish.</h1>
        <p className="intro">Plan focused work, DSA practice, learning, and life in one honest timeline.</p>
        <button className="google" onClick={() => signIn("google")}><span>G</span> Continue with Google</button>
        <small>Your plans stay private to your Google account.</small>
      </section>
      <section className="login-art">
        <div className="preview">
          <header><b>Today</b><strong>82% discipline</strong></header>
          <Preview time="07:00" title="Two pointer practice" meta="DSA - 60 min" kind="dsa" />
          <Preview time="10:00" title="Project focus block" meta="Office - 90 min" kind="office" />
          <Preview time="19:30" title="Read system design notes" meta="Reading - 45 min" kind="reading" />
        </div>
      </section>
    </main>
  );
}

function Preview({ time, title, meta, kind }: { time: string; title: string; meta: string; kind: string }) {
  return <div className="preview-row"><time>{time}</time><i className={kind} /><div><b>{title}</b><small>{meta}</small></div></div>;
}
