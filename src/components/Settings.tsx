"use client";

import { useState } from "react";
import { UserPreferences, Blueprint, CategoryItem } from "@/types";
import { BlueprintEditor } from "./BlueprintEditor";

interface SettingsProps {
  userPrefs: UserPreferences;
  onSave: (newPrefs: UserPreferences) => Promise<void>;
  blueprint: Blueprint;
  onSaveBlueprint: (newBlueprint: Blueprint) => Promise<void>;
  onGenerateTasks: () => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Settings({
  userPrefs,
  onSave,
  blueprint,
  onSaveBlueprint,
  onGenerateTasks,
  theme,
  onToggleTheme,
}: SettingsProps) {
  const [dayStart, setDayStart] = useState(userPrefs.dayStart);
  const [dayEnd, setDayEnd] = useState(userPrefs.dayEnd);
  const [categories, setCategories] = useState<CategoryItem[]>([...userPrefs.categories]);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<"general" | "categories" | "blueprint">("blueprint");

  const addCategory = () => {
    const id = `custom-${Date.now()}`;
    setCategories([...categories, { id, label: "New Category", color: "blue" }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, updates: Partial<CategoryItem>) => {
    const newCats = [...categories];
    newCats[index] = { ...newCats[index], ...updates };
    setCategories(newCats);
  };

  const handleSavePrefs = async () => {
    setIsSavingPrefs(true);
    const newPrefs = { ...userPrefs, dayStart, dayEnd, categories };
    await onSave(newPrefs);
    setIsSavingPrefs(false);
  };

  const colorOptions = [
    { name: "Blue", value: "blue" },
    { name: "Green", value: "green" },
    { name: "Purple", value: "purple" },
    { name: "Orange", value: "orange" },
    { name: "Red", value: "red" },
    { name: "Teal", value: "teal" },
    { name: "Indigo", value: "indigo" },
  ];

  return (
    <section className="timeline">
      <header>
        <div>
          <p className="label">BLUEPRINT</p>
          <h1>Manage your weekly routine</h1>
          <small>Define your recurring schedule and preferences</small>
        </div>
      </header>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("general")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "general" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "general" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "general" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("categories")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "categories" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "categories" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "categories" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          Categories
        </button>
        <button
          type="button"
          onClick={() => setActiveSettingsSection("blueprint")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeSettingsSection === "blueprint" ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
            background: activeSettingsSection === "blueprint" ? "var(--primary-button-bg)" : "var(--panel)",
            color: activeSettingsSection === "blueprint" ? "white" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          Weekly Blueprint
        </button>
      </div>

      {/* General Section */}
      {activeSettingsSection === "general" && (
        <>
          {/* Theme Setting */}
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", marginBottom: "16px", border: "1px solid var(--line)" }}>
            <p className="label" style={{ marginBottom: "12px" }}>THEME</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0 }}>Dark / Light mode</h3>
                <small style={{ color: "var(--muted)" }}>Choose your preferred visual style</small>
              </div>
              <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
                {theme === "light" ? "☾" : "☀"}
              </button>
            </div>
          </article>

          {/* Day Start/End */}
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", marginBottom: "16px", border: "1px solid var(--line)" }}>
            <p className="label" style={{ marginBottom: "12px" }}>WORKDAY HOURS</p>
            <div className="form-grid">
              <label>
                Day starts at
                <input
                  type="time"
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                />
              </label>
              <label>
                Day ends at
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                />
              </label>
            </div>
          </article>

          <button
            className="primary submit"
            onClick={handleSavePrefs}
            disabled={isSavingPrefs}
            style={{ marginTop: "24px", width: "100%" }}
          >
            {isSavingPrefs ? "Saving..." : "Save Settings"}
          </button>
        </>
      )}

      {/* Categories Section */}
      {activeSettingsSection === "categories" && (
        <>
          <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <p className="label" style={{ marginBottom: 0 }}>CATEGORIES</p>
              <button type="button" onClick={addCategory} style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}>
                + Add Category
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {categories.map((cat, index) => (
                <div key={cat.id} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "12px", background: "var(--panel)", borderRadius: "8px", border: "1px solid var(--line)", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateCategory(index, { label: e.target.value })}
                    placeholder="Category name"
                    style={{ flex: "1 1 120px", minWidth: "0", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
                  />
                  <select
                    value={cat.color}
                    onChange={(e) => updateCategory(index, { color: e.target.value })}
                    style={{ flex: "0 0 auto", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
                  >
                    {colorOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                  </select>
                  <button type="button" onClick={() => removeCategory(index)} style={{ flex: "0 0 auto", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", cursor: "pointer" }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </article>
          <button
            className="primary submit"
            onClick={handleSavePrefs}
            disabled={isSavingPrefs}
            style={{ marginTop: "24px", width: "100%" }}
          >
            {isSavingPrefs ? "Saving..." : "Save Categories"}
          </button>
        </>
      )}

      {/* Blueprint Section */}
      {activeSettingsSection === "blueprint" && (
        <article style={{ padding: "24px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)" }}>
          <p className="label" style={{ marginBottom: "12px" }}>WEEKLY BLUEPRINT</p>
          <BlueprintEditor
            blueprint={blueprint}
            categories={categories}
            onSave={onSaveBlueprint}
            onGenerateTasks={onGenerateTasks}
          />
        </article>
      )}
    </section>
  );
}
