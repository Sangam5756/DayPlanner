"use client";

import { FormEvent, useState } from "react";
import { Task, TaskInput } from "@/types";

export const useTaskModal = (
  editingTask: Task | null,
  showNotice: (text: string) => void,
  updateTask: (id: string, updates: Record<string, unknown>) => Promise<void>,
  createTaskData: (input: TaskInput) => Promise<any>,
  syncCalendar: (taskId: string, announce?: boolean) => Promise<void>,
  loadTasks: () => Promise<void>,
  closeModal: () => void,
  date: string
) => {
  const [saving, setSaving] = useState(false);

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      if (editingTask) {
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
      closeModal();
      await loadTasks();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save task");
    } finally {
      setSaving(false);
    }
  };

  return { saving, handleTaskSubmit };
};
