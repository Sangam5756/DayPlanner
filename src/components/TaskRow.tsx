import { Task } from "@/types";

interface TaskRowProps {
  task: Task;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onSkip: (task: Task) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TaskRow({ task, onUpdate, onSkip, onSync, onEdit, onDelete }: TaskRowProps) {
  return (
    <article className={`task ${task.status}`}>
      <time>{task.start}<small>{task.end}</small></time><i className={task.category} />
      <div className="task-info">
        <span className={`pill ${task.category}`}>{task.category}</span>
        {task.priority === "high" && <span className="pill priority">high</span>}
        <h3>{task.title}</h3>
        {task.resourceUrl && <a href={task.resourceUrl} target="_blank" rel="noreferrer">Open resource</a>}
        {task.skipReason && <p>Skipped: {task.skipReason}</p>}
      </div>
      <div className="task-buttons">
        <button className="edit-btn" onClick={() => onEdit(task)} title="Edit">✏️</button>
        <button className="delete-btn" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
        {task.status === "planned" ? (
          <>
            <button onClick={() => onUpdate(task._id, { status: "completed" })} title="Complete">OK</button>
            <button onClick={() => onSkip(task)} title="Skip">X</button>
          </>
        ) : (
          <small>{task.status}</small>
        )}
        <button onClick={() => onSync(task._id)} title="Sync Google Calendar">G</button>
      </div>
    </article>
  );
}
