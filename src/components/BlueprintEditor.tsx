"use client";

import { useState, useEffect } from "react";
import { Blueprint, CategoryItem, DayOfWeek } from "@/types";
import { BlueprintSlotEditor } from "./BlueprintSlotEditor";

interface BlueprintEditorProps {
  blueprint: Blueprint;
  categories: CategoryItem[];
  onSave: (updatedBlueprint: Blueprint) => Promise<void>;
  onGenerateTasks: () => Promise<void>;
}

export function BlueprintEditor({ blueprint, categories, onSave, onGenerateTasks }: BlueprintEditorProps) {
  const [localBlueprint, setLocalBlueprint] = useState<Blueprint>({ ...blueprint });
  const [isSaving, setIsSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("monday");

  // Update local state when blueprint prop changes
  useEffect(() => {
    setLocalBlueprint({ ...blueprint });
  }, [blueprint]);

  const handleSave = async () => {
    setIsSaving(true);
    onSave(localBlueprint).finally(() => {
      setIsSaving(false);
    });
  };

  const updateDay = (dayName: DayOfWeek, updatedDay: any) => {
    const newBlueprint = { ...localBlueprint, [dayName]: updatedDay };
    setLocalBlueprint(newBlueprint);
  };

  const dayNames: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {dayNames.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: activeDay === day ? "2px solid var(--primary-button-bg)" : "1px solid var(--line)",
              background: activeDay === day ? "var(--primary-button-bg)" : "var(--panel)",
              color: activeDay === day ? "white" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="label" style={{ marginBottom: 0 }}>
          {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}'s Slots
        </p>
        <button
          type="button"
          onClick={() => updateDay(activeDay, {
            ...localBlueprint[activeDay],
            slots: [
              ...localBlueprint[activeDay].slots,
              {
                start: "07:00",
                end: "08:00",
                title: "New Task",
                category: categories[0]?.id || "dsa",
                priority: "medium"
              }
            ]
          })}
          style={{ padding: "6px 16px", border: "1px solid var(--line)", borderRadius: "6px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}
        >
          + Add Slot
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        {localBlueprint[activeDay].slots.map((slot, index) => (
          <BlueprintSlotEditor
            key={index}
            slot={slot}
            onUpdate={(updatedSlot) => {
              const newSlots = [...localBlueprint[activeDay].slots];
              newSlots[index] = updatedSlot;
              updateDay(activeDay, { ...localBlueprint[activeDay], slots: newSlots });
            }}
            onDelete={() => {
              updateDay(activeDay, {
                ...localBlueprint[activeDay],
                slots: localBlueprint[activeDay].slots.filter((_, i) => i !== index)
              });
            }}
            categories={categories}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button type="button" onClick={onGenerateTasks} style={{ flex: "1 1 auto", minWidth: "120px", padding: "10px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)", color: "var(--ink)", cursor: "pointer" }}>
          📅 Generate Tasks from Blueprint
        </button>
        <button type="button" onClick={handleSave} disabled={isSaving} className="primary" style={{ flex: "0 1 auto", minWidth: "120px", padding: "10px 24px" }}>
          {isSaving ? "Saving..." : "Save Blueprint"}
        </button>
      </div>
    </div>
  );
}
