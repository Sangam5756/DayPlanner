import { UserPreferences } from "@/types";

export const useUserPreferenceActions = (setUserPrefs: (prefs: UserPreferences | null) => void, showNotice: (text: string) => void) => {
  const saveUserPreferences = async (updatedPrefs: UserPreferences) => {
    const response = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPrefs),
    });

    if (response.ok) {
      const newPrefs = await response.json();
      setUserPrefs(newPrefs);
      showNotice("Settings saved!");
      return newPrefs;
    } else {
      showNotice("Failed to save settings");
      return null;
    }
  };

  return {
    saveUserPreferences,
  };
};
