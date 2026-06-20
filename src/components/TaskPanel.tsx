import { Task } from "@/types";
import { TaskRow } from "./TaskRow";

interface TaskPanelProps {
  title: string;
  tasks: Task[];
  loading: boolean;
  groupByDate?: boolean;
  emptyAction?: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onSkip: (task: Task) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TaskPanel({ title, tasks, loading, groupByDate, emptyAction, onUpdate, onSkip, onSync, onEdit, onDelete }: TaskPanelProps) {
  return (
    <section className="timeline">
      <header>
        <div>
          <p className="label">{groupByDate ? "TASK LIBRARY" : "YOUR TIMELINE"}</p>
          <h2>{title}</h2>
        </div>
      </header>
      {loading ? (
        <div className="empty">Loading your plan...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <b>No time blocks yet.</b>
          <span>Give your day a shape before it fills itself.</span>
          {emptyAction && <button onClick={emptyAction}>Plan the first block</button>}
        </div>
      ) : (
        <div>
          {tasks.map((task, index) => (
            <div key={task._id}>
              {groupByDate && (index === 0 || tasks[index - 1].date !== task.date) && (
                <h3 className="date-divider">
                  {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
                    new Date(`${task.date}T12:00:00`)
                  )}
                </h3>
              )}
              <TaskRow
                task={task}
                onUpdate={onUpdate}
                onSkip={onSkip}
                onSync={onSync}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
