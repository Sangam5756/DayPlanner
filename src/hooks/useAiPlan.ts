"use client";

import { useState, FormEvent } from "react";
import { TaskInput } from "@/types";
import { today } from "@/utils";

export const useAiPlan = (
  showNotice: (text: string) => void,
  createTaskData: (input: TaskInput) => Promise<any>,
  syncCalendar: (taskId: string, announce?: boolean) => Promise<void>,
  navigate: (view: any, date?: string) => void,
  loadTasks: () => Promise<void>
) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlan, setAiPlan] = useState<TaskInput[]>([]);
  const [saving, setSaving] = useState(false);

  const generateAiPlan = async (event: FormEvent) => {
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
  };

  const acceptAiPlan = async () => {
    setSaving(true);
    try {
      const created: Array<{ task: any; input: TaskInput }> = [];
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
  };

  return {
    aiPrompt,
    setAiPrompt,
    aiPlan,
    setAiPlan,
    saving,
    generateAiPlan,
    acceptAiPlan
  };
};
