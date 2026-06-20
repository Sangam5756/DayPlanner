"use client";

import { useState, useCallback, useEffect } from "react";
import { Blueprint } from "@/types";

export const useBlueprint = (status: string) => {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(true);

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

  useEffect(() => {
    loadBlueprint();
  }, [loadBlueprint]);

  return {
    blueprint,
    setBlueprint,
    blueprintLoading,
    loadBlueprint,
  };
};
