import { Task, UserPreferences } from "@/types";
import { parseTimeToMinutes, formatMinutesToTime, calculateTotalScheduledMinutes } from "@/utils";
import { ScoreRing } from "./ScoreRing";
import { TaskPanel } from "./TaskPanel";

interface TodayViewProps {
  tasks: Task[];
  loading: boolean;
  score: number;
  minutes: number;
  completed: number;
  nextTask?: Task;
  onAdd: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onSkip: (task: Task) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  remainingTimeInfo: { remaining: number; started: boolean; remainingStr: string };
  scheduledMinutes: number;
  dayTotalMinutes: number;
  userPrefs: UserPreferences | null;
}

export function TodayView({
  tasks,
  loading,
  score,
  minutes,
  completed,
  nextTask,
  onAdd,
  onUpdate,
  onSkip,
  onSync,
  onEdit,
  onDelete,
  remainingTimeInfo,
  scheduledMinutes,
  dayTotalMinutes,
  userPrefs,
}: TodayViewProps) {
  const dayStartStr = userPrefs ? formatMinutesToTime(parseTimeToMinutes(userPrefs.dayStart)) : "05:30 AM";
  const dayEndStr = userPrefs ? formatMinutesToTime(parseTimeToMinutes(userPrefs.dayEnd)) : "10:20 PM";
  const scheduledHours = Math.floor(scheduledMinutes / 60);
  const scheduledMins = scheduledMinutes % 60;
  const dayHours = Math.floor(dayTotalMinutes / 60);
  const dayMins = dayTotalMinutes % 60;
  const remainingHours = Math.floor(remainingTimeInfo.remaining / 60);
  const remainingMins = remainingTimeInfo.remaining % 60;
  const remainingPercent = dayTotalMinutes > 0 ? Math.min(100, Math.max(0, (remainingTimeInfo.remaining / dayTotalMinutes) * 100)) : 0;
  const scheduledPercent = dayTotalMinutes > 0 ? Math.min(100, Math.max(0, (scheduledMinutes / dayTotalMinutes) * 100)) : 0;

  return (
    <>
      <section className="cards">
        {/* Remaining Time Card */}
        <article style={{ padding: "20px", background: "var(--paper)", borderRadius: "12px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p className="label">YOUR DAY</p>
            <h3 style={{ margin: 0, fontSize: "1.5rem" }}>
              {!remainingTimeInfo.started ? `Day starts at ${dayStartStr}` :
                remainingTimeInfo.remainingStr ? `${remainingHours}h ${remainingMins}m left` :
                  "Day complete"}
            </h3>
            <small style={{ color: "var(--muted)" }}>
              {dayStartStr} - {dayEndStr} ({dayHours}h {dayMins}m total)
            </small>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
              <small style={{ color: "var(--muted)" }}>
                Scheduled: {scheduledHours}h {scheduledMins}m ({Math.round(scheduledPercent)}%)
              </small>
              <small style={{ color: "var(--muted)" }}>
                Remaining: {remainingHours}h {remainingMins}m ({Math.round(remainingPercent)}%)
              </small>
            </div>
            <div style={{ height: "8px", background: "var(--panel)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${scheduledPercent}%`, background: "var(--primary-button-bg)", height: "100%" }}></div>
              <div style={{ width: `${remainingPercent}%`, background: "#e2e8f0", height: "100%" }}></div>
            </div>
          </div>
        </article>

        <article className="next">
          <p className="label">DO THIS NEXT</p>
          <h2>{nextTask?.title || (tasks.length ? "Day complete" : "Plan your first block")}</h2>
          <p>{nextTask ? `${nextTask.start}-${nextTask.end} - ${nextTask.category}` : "Your next clear action will appear here."}</p>
          {nextTask && (
            <div>
              <button onClick={() => onUpdate(nextTask._id, { status: "completed" })}>Mark complete</button>
              <button onClick={() => onSkip(nextTask)}>Skip</button>
            </div>
          )}
        </article>
        <article className="score">
          <ScoreRing score={score} />
          <div>
            <p className="label">DISCIPLINE SCORE</p>
            <h3>{score >= 80 ? "Strong day" : score >= 50 ? "Keep going" : "Start small"}</h3>
            <small>{completed} of {tasks.length} promises kept</small>
          </div>
        </article>
      </section>
      <TaskPanel
        title="Plan, then follow through."
        tasks={tasks}
        loading={loading}
        emptyAction={onAdd}
        onUpdate={onUpdate}
        onSkip={onSkip}
        onSync={onSync}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
