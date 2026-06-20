"use client";

import { signOut, useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Task,
  TaskInput,
  UserPreferences,
  Blueprint,
  CategoryItem,
} from "@/types";
import {
  parseTimeToMinutes,
  formatRemainingTime,
  calculateTotalScheduledMinutes,
  today,
  readLocation,
} from "@/utils";
import { PageHeader } from "@/components/PageHeader";
import { TodayView } from "@/components/TodayView";
import { AllTasks } from "@/components/AllTasks";
import { Progress } from "@/components/Progress";
import { Settings } from "@/components/Settings";
import { TaskModal } from "@/components/TaskModal";
import { AiModal } from "@/components/AiModal";
import { Login } from "@/components/Login";

export default function Home() {
  const { data: session, status } = useSession();
  const initial = readLocation();
  const [view, setView] = useState<View>(initial.view);
  const [date, setDate] = useState(initial.date);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"task" | "ai" | null>(null);
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
    const response = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPrefs),
    });

    if (response.ok) {
      const newPrefs = await response.json();
      setUserPrefs(newPrefs);
      showNotice("Settings saved!");
      return newPrefs;
    } else {
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
    if (response.ok) {
      const blueprintData = await response.json();
      setBlueprint(blueprintData);
    }
    setBlueprintLoading(false);
  }, [status]);

  const saveBlueprint = async (updatedBlueprint: Blueprint) => {
    const response = await fetch("/api/blueprint", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedBlueprint),
    });

    if (response.ok) {
      const newBlueprint = await response.json();
      setBlueprint(newBlueprint);
      showNotice("Blueprint saved!");
      return newBlueprint;
    } else {
      showNotice("Failed to save blueprint");
      return null;
    }
  };

  const generateTasksFromBlueprint = async () => {
    const response = await fetch("/api/blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    const responseData = await response.text();

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

  // Calculate remaining time for today's tasks
  const nowMinutes = useMemo(() => {
    const hours = now.getHours();
    const mins = now.getMinutes();
    return hours * 60 + mins;
  }, [now]);

  const remainingTimeInfo = useMemo(() => {
    if (!userPrefs) return { remaining: 0, started: false, remainingStr: "" };
    return formatRemainingTime(
      nowMinutes,
      parseTimeToMinutes(userPrefs.dayStart),
      parseTimeToMinutes(userPrefs.dayEnd)
    );
  }, [nowMinutes, userPrefs]);

  const scheduledMinutes = useMemo(() => {
    return calculateTotalScheduledMinutes(tasks);
  }, [tasks]);

  const dayTotalMinutes = useMemo(() => {
    if (!userPrefs) return 0;
    const start = parseTimeToMinutes(userPrefs.dayStart);
    const end = parseTimeToMinutes(userPrefs.dayEnd);
    return end - start;
  }, [userPrefs]);

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
          <button className={view === "settings" ? "selected" : ""} onClick={() => { navigate("settings"); setSidebarOpen(false); }}>📅 Blueprint</button>
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
            onEdit={openEditModal}
            onDelete={deleteTask}
            remainingTimeInfo={remainingTimeInfo}
            scheduledMinutes={scheduledMinutes}
            dayTotalMinutes={dayTotalMinutes}
            userPrefs={userPrefs}
          />
        )}
        {view === "tasks" && (
          <AllTasks tasks={tasks} loading={loading} onUpdate={updateTask} onSkip={skipTask} onSync={syncCalendar} onEdit={openEditModal} onDelete={deleteTask} />
        )}
        {view === "progress" && (
          <Progress tasks={tasks} completed={completed} skipped={skipped} planned={planned} score={score} minutes={minutes} categories={userPrefs?.categories || []} />
        )}
        {view === "settings" && (
          prefsLoading || blueprintLoading ? (
            <div className="empty">Loading settings and blueprint...</div>
          ) : userPrefs && blueprint ? (
            <Settings
              userPrefs={userPrefs}
              onSave={saveUserPreferences}
              blueprint={blueprint}
              onSaveBlueprint={saveBlueprint}
              onGenerateTasks={generateTasksFromBlueprint}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          ) : null
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
