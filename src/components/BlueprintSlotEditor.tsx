import { BlueprintSlot, CategoryItem } from "@/types";

interface BlueprintSlotEditorProps {
  slot: BlueprintSlot;
  onUpdate: (updatedSlot: BlueprintSlot) => void;
  onDelete: () => void;
  categories: CategoryItem[];
}

export function BlueprintSlotEditor({ slot, onUpdate, onDelete, categories }: BlueprintSlotEditorProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      padding: "16px",
      background: "var(--panel)",
      borderRadius: "10px",
      border: "1px solid var(--line)",
      width: "100%"
    }}>
      {/* Time row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="time"
            value={slot.start}
            onChange={(e) => onUpdate({ ...slot, start: e.target.value })}
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
          />
          <span style={{ color: "var(--muted)", fontWeight: 600 }}>to</span>
        </div>
        <input
          type="time"
          value={slot.end}
          onChange={(e) => onUpdate({ ...slot, end: e.target.value })}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
        />
      </div>

      {/* Task info row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          value={slot.title}
          onChange={(e) => onUpdate({ ...slot, title: e.target.value })}
          placeholder="Task Title"
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
        />
        <select
          value={slot.category}
          onChange={(e) => onUpdate({ ...slot, category: e.target.value })}
          style={{ minWidth: "140px", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)" }}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <button type="button" onClick={onDelete} style={{
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid var(--line)",
          background: "var(--panel)",
          color: "var(--ink)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          🗑️
        </button>
      </div>
    </div>
  );
}
