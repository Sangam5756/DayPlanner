import { Task } from "@/types";
import { TaskPanel } from "./TaskPanel";

interface AllTasksProps {
  tasks: Task[];
  loading: boolean;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onSkip: (task: Task) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export function AllTasks(props: AllTasksProps) {
  return <TaskPanel title="Everything you have planned." groupByDate {...props} />;
}
