"use client";

import { useState, useEffect, useCallback } from "react";
import { View } from "@/types";
import { readLocation, today } from "@/utils";

export const useNavigate = () => {
  const initial = readLocation();
  const [view, setView] = useState<View>(initial.view);
  const [date, setDate] = useState(initial.date);

  const navigate = useCallback((nextView: View, nextDate: string = date) => {
    const params = new URLSearchParams();
    params.set("view", nextView);
    if (nextView === "today") params.set("date", nextDate);
    window.history.pushState({}, "", `?${params.toString()}`);
    setView(nextView);
    setDate(nextDate);
  }, [date]);

  const moveDate = useCallback((days: number) => {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + days);
    navigate("today", value.toISOString().slice(0, 10));
  }, [date, navigate]);

  useEffect(() => {
    const restore = () => {
      const location = readLocation();
      setView(location.view);
      setDate(location.date);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  return {
    view,
    date,
    setView,
    setDate,
    navigate,
    moveDate,
  };
};
