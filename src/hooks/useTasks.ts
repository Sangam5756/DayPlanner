"use client";

import { useState, useCallback, useEffect } from "react";
import { Task } from "@/types";

export const useTasks = (status: string, date: string, view: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  return {
    tasks,
    setTasks,
    loading,
    loadTasks,
  };
};
