import { FormEvent } from "react";
import { Task, TaskInput, CategoryItem } from "@/types";

interface TaskModalProps {
  task?: Task | null;
  date: string;
  categories: CategoryItem[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function TaskModal({ task, date, categories, saving, onClose, onSubmit }: TaskModalProps) {
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <form className="task-form" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="label">{task ? "EDIT TIME BLOCK" : `NEW TIME BLOCK - ${date}`}</p>
            <h2>{task ? "Update your promise." : "Make a clear promise."}</h2>
          </div>
          <button type="button" onClick={onClose}>X</button>
        </header>
        <label>
          Task name
          <input name="title" placeholder="Read React rendering article" required autoFocus defaultValue={task?.title} />
        </label>
        <div className="form-grid">
          <label>
            Category
            <select name="category" defaultValue={task?.category || (categories[0]?.id || "")}>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" defaultValue={task?.priority || "medium"}>
              <option>low</option>
              <option>medium</option>
              <option>high</option>
            </select>
          </label>
          <label>
            Start
            <input type="time" name="start" defaultValue={task?.start || "07:00"} required />
          </label>
          <label>
            End
            <input type="time" name="end" defaultValue={task?.end || "08:00"} required />
          </label>
        </div>
        <label>
          Resource or blog link
          <input type="url" name="resourceUrl" placeholder="https://example.com/article" defaultValue={task?.resourceUrl} />
        </label>
        <label>
          Notes
          <textarea name="notes" placeholder="What does done look like?" defaultValue={task?.notes} />
        </label>
        {!task && (
          <label className="check">
            <input type="checkbox" name="sync" /> Add to Google Calendar
          </label>
        )}
        <button className="primary submit" disabled={saving}>
          {saving ? "Saving..." : task ? "Update task" : "Add to my day"}
        </button>
      </form>
    </div>
  );
}
