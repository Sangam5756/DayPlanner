"use client";

import { useState, useCallback, useEffect } from "react";
import { UserPreferences } from "@/types";

export const useUserPreferences = (status: string) => {
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);

  const loadUserPrefs = useCallback(async () => {
    if (status !== "authenticated") return;
    setPrefsLoading(true);
    const response = await fetch("/api/user-preferences");
    if (response.ok) setUserPrefs(await response.json());
    setPrefsLoading(false);
  }, [status]);

  useEffect(() => {
    loadUserPrefs();
  }, [loadUserPrefs]);

  return {
    userPrefs,
    setUserPrefs,
    prefsLoading,
    loadUserPrefs,
  };
};
