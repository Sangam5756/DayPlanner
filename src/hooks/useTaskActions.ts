import { Task, TaskInput } from "@/types";

export const useTaskActions = (loadTasks: () => Promise<void>, showNotice: (text: string) => void) => {
  const createTaskData = async (input: TaskInput) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create task");
    return data as Task;
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    // Try to delete from Google Calendar first
    const calendarDeleteResponse = await fetch("/api/calendar/sync", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    
    // Even if calendar delete fails, still try to delete the task locally
    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (response.ok) {
      await loadTasks();
      showNotice("Task deleted");
    }
  };

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) await loadTasks();
  };

  const skipTask = async (task: Task) => {
    const reason = window.prompt("What got in the way? Be honest and brief.");
    if (reason?.trim()) await updateTask(task._id, { status: "skipped", skipReason: reason });
  };

  const syncCalendar = async (taskId: string, announce = true) => {
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
  };

  return {
    createTaskData,
    deleteTask,
    updateTask,
    skipTask,
    syncCalendar,
  };
};
