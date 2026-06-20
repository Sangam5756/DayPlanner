import { View } from "@/types";
import { today } from "@/utils";

interface PageHeaderProps {
  view: View;
  date: string;
  onMoveDate: (days: number) => void;
  onToday: () => void;
  onAdd: () => void;
  onAi: () => void;
}

export function PageHeader({ view, date, onMoveDate, onToday, onAdd, onAi }: PageHeaderProps) {
  const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })
    .format(new Date(`${date}T12:00:00`));

  let title = "";
  let kicker = "";
  let subtitle = "";
  if (view === "today") {
    title = date === today() ? "Today" : dateLabel;
    kicker = "DAILY COMMAND CENTER";
    subtitle = dateLabel;
  } else if (view === "tasks") {
    title = "All tasks";
    kicker = "DAILY COMMAND CENTER";
    subtitle = "Every promise in one place";
  } else if (view === "progress") {
    title = "Progress";
    kicker = "YOUR CONSISTENCY";
    subtitle = "An honest view of your follow-through";
  } else if (view === "settings") {
    title = "Blueprint";
    kicker = "YOUR WEEKLY ROUTINE";
    subtitle = "Define and customize your recurring weekly schedule";
  }

  return (
    <header className="topbar">
      <div><p className="kicker">{kicker}</p><h1>{title}</h1><small>{subtitle}</small></div>
      {view !== "settings" && (
        <div className="date-nav">
          {view === "today" && (
            <div className="day-pager">
              <button onClick={() => onMoveDate(-1)} aria-label="Previous day">&lt;</button>
              <button onClick={onToday}>Today</button>
              <button onClick={() => onMoveDate(1)} aria-label="Next day">&gt;</button>
            </div>
          )}
          <div className="action-buttons">
            <button className="ai-button" onClick={onAi} title="Plan with AI">AI plan</button>
            <button className="primary" onClick={onAdd}>+ <span>Plan a block</span></button>
          </div>
        </div>
      )}
    </header>
  );
}
