import { Task, CategoryItem } from "@/types";
import { ScoreRing } from "./ScoreRing";

interface ProgressProps {
  tasks: Task[];
  completed: number;
  skipped: number;
  planned: number;
  score: number;
  minutes: number;
  categories: CategoryItem[];
}

export function Progress({ tasks, completed, skipped, planned, score, minutes, categories }: ProgressProps) {
  return (
    <>
      <section className="progress-cards">
        <article>
          <ScoreRing score={score} />
          <div>
            <p className="label">OVERALL SCORE</p>
            <h2>{score}%</h2>
          </div>
        </article>
        <article>
          <p className="label">COMPLETED</p>
          <strong>{completed}</strong>
          <small>tasks finished</small>
        </article>
        <article>
          <p className="label">PLANNED TIME</p>
          <strong>{Math.floor(minutes / 60)}h {minutes % 60}m</strong>
          <small>across all tasks</small>
        </article>
        <article>
          <p className="label">STILL OPEN</p>
          <strong>{planned}</strong>
          <small>{skipped} skipped</small>
        </article>
      </section>
      <section className="timeline category-progress">
        <header>
          <p className="label">CATEGORY BREAKDOWN</p>
          <h2>Where your effort is going.</h2>
        </header>
        {categories.map((category) => {
          const categoryTasks = tasks.filter((task) => task.category === category.id);
          const done = categoryTasks.filter((task) => task.status === "completed").length;
          const percent = categoryTasks.length ? Math.round(done / categoryTasks.length * 100) : 0;
          return (
            <div className="progress-row" key={category.id}>
              <span className={`pill ${category.color}`}>{category.label}</span>
              <div><i style={{ width: `${percent}%` }} /></div>
              <b>{done}/{categoryTasks.length}</b>
            </div>
          );
        })}
      </section>
    </>
  );
}
