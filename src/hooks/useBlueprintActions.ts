import { Blueprint } from "@/types";

export const useBlueprintActions = (
  setBlueprint: (blueprint: Blueprint | null) => void,
  loadTasks: () => Promise<void>,
  showNotice: (text: string) => void
) => {
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

  const generateTasksFromBlueprint = async (date: string) => {
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

  return {
    saveBlueprint,
    generateTasksFromBlueprint,
  };
};
