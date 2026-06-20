"use client";

import { useMemo } from "react";
import { Task, UserPreferences } from "@/types";
import {
  parseTimeToMinutes,
  formatRemainingTime,
  calculateTotalScheduledMinutes
} from "@/utils";

export const useProgress = (tasks: Task[], userPrefs: UserPreferences | null, now: Date) => {
  const completed = useMemo(() => tasks.filter((task) => task.status === "completed").length, [tasks]);
  const skipped = useMemo(() => tasks.filter((task) => task.status === "skipped").length, [tasks]);
  const planned = useMemo(() => tasks.filter((task) => task.status === "planned").length, [tasks]);
  const score = useMemo(() => {
    return tasks.length
      ? Math.round(((completed + planned * 0.2) / tasks.length) * 100)
      : 0;
  }, [tasks, completed, planned]);
  const nextTask = useMemo(() => tasks.find((task) => task.status === "planned"), [tasks]);
  const minutes = useMemo(
    () =>
      tasks.reduce((total, task) => {
        const [sh, sm] = task.start.split(":").map(Number);
        const [eh, em] = task.end.split(":").map(Number);
        return total + Math.max(0, eh * 60 + em - sh * 60 - sm);
      }, 0),
    [tasks]
  );
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

  return {
    completed,
    skipped,
    planned,
    score,
    nextTask,
    minutes,
    nowMinutes,
    remainingTimeInfo,
    scheduledMinutes,
    dayTotalMinutes
  };
};
