"use client";

import { signOut, useSession } from "next-auth/react";
import { 
  today
} from "@/utils";
import { PageHeader } from "@/components/PageHeader";
import { TodayView } from "@/components/TodayView";
import { AllTasks } from "@/components/AllTasks";
import { Progress } from "@/components/Progress";
import { Settings } from "@/components/Settings";
import { TaskModal } from "@/components/TaskModal";
import { AiModal } from "@/components/AiModal";
import { Login } from "@/components/Login";
import { useTheme } from "@/hooks/useTheme";
import { useNotice } from "@/hooks/useNotice";
import { useNavigate } from "@/hooks/useNavigate";
import { useTasks } from "@/hooks/useTasks";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useBlueprint } from "@/hooks/useBlueprint";
import { useTaskActions } from "@/hooks/useTaskActions";
import { useUserPreferenceActions } from "@/hooks/useUserPreferenceActions";
import { useBlueprintActions } from "@/hooks/useBlueprintActions";
import { useNow } from "@/hooks/useNow";
import { useAiPlan } from "@/hooks/useAiPlan";
import { useModals } from "@/hooks/useModals";
import { useSidebar } from "@/hooks/useSidebar";
import { useTaskModal } from "@/hooks/useTaskModal";
import { useProgress } from "@/hooks/useProgress";



export default function Home() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { notice, showNotice } = useNotice();
  const { view, date, navigate, moveDate } = useNavigate();
  const { tasks, loading, loadTasks } = useTasks(status, date, view);
  const { userPrefs, setUserPrefs, prefsLoading } = useUserPreferences(status);
  const { blueprint, setBlueprint, blueprintLoading } = useBlueprint(status);
  const { createTaskData, deleteTask, updateTask, skipTask, syncCalendar } = useTaskActions(loadTasks, showNotice);
  const { saveUserPreferences } = useUserPreferenceActions(setUserPrefs, showNotice);
  const { saveBlueprint, generateTasksFromBlueprint } = useBlueprintActions(setBlueprint, loadTasks, showNotice);
  const now = useNow();
  const { modal, setModal, editingTask, openEditModal, closeModal } = useModals();
  const { aiPrompt, setAiPrompt, aiPlan, setAiPlan, saving: aiSaving, generateAiPlan, acceptAiPlan } = useAiPlan(
    showNotice,
    createTaskData,
    syncCalendar,
    navigate,
    loadTasks
  );
  const { saving: taskSaving, handleTaskSubmit } = useTaskModal(
    editingTask,
    showNotice,
    updateTask,
    createTaskData,
    syncCalendar,
    loadTasks,
    closeModal,
    date
  );
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const {
    completed,
    skipped,
    planned,
    score,
    nextTask,
    minutes,
    remainingTimeInfo,
    scheduledMinutes,
    dayTotalMinutes
  } = useProgress(tasks, userPrefs, now);

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
          <button className={view === "settings" ? "selected" : ""} onClick={() => { navigate("settings"); setSidebarOpen(false); }}>Settings</button>
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
              onGenerateTasks={() => generateTasksFromBlueprint(date)}
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
          saving={aiSaving}
          onPrompt={setAiPrompt}
          onGenerate={generateAiPlan}
          onAccept={async () => {
            await acceptAiPlan();
            setModal(null);
            setAiPlan([]);
          }}
          onClose={() => { setModal(null); setAiPlan([]); }}
        />
      )}
      
      {modal === "task" && (
        <TaskModal
          task={editingTask}
          date={editingTask?.date || date}
          categories={userPrefs?.categories || []}
          saving={taskSaving}
          onClose={closeModal}
          onSubmit={handleTaskSubmit}
        />
      )}
    </main>
  );
}
