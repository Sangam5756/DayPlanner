import { FormEvent } from "react";
import { TaskInput } from "@/types";

interface AiModalProps {
  prompt: string;
  plan: TaskInput[];
  saving: boolean;
  onPrompt: (value: string) => void;
  onGenerate: (event: FormEvent) => Promise<void>;
  onAccept: () => Promise<void>;
  onClose: () => void;
}

export function AiModal({ prompt, plan, saving, onPrompt, onGenerate, onAccept, onClose }: AiModalProps) {
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="task-form" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div>
            <p className="label">AI PLAN</p>
            <h2>Let AI help you plan</h2>
          </div>
          <button type="button" onClick={onClose}>X</button>
        </header>
        <form onSubmit={onGenerate}>
          <label>
            What would you like to plan?
            <textarea
              value={prompt}
              onChange={(e) => onPrompt(e.target.value)}
              placeholder="I need to practice DSA for 1 hour, read 30 pages, and then work on my project..."
              rows={4}
              required
            />
          </label>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Generating..." : "Generate Plan"}
          </button>
        </form>
        {plan.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ marginBottom: "8px" }}>Your AI-generated plan:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {plan.map((task, index) => (
                <div key={index} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px" }}>
                  <strong>{task.title}</strong>
                  <small style={{ display: "block", color: "var(--muted)" }}>
                    {task.start} - {task.end} • {task.category} • {task.priority}
                  </small>
                  {task.notes && <p style={{ margin: "4px 0 0 0", fontSize: "0.9em" }}>{task.notes}</p>}
                </div>
              ))}
            </div>
            <button type="button" onClick={onAccept} className="primary" disabled={saving}>
              {saving ? "Adding..." : "Accept and Add to Plan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
