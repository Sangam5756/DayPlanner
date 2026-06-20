export type CategoryItem = {
  id: string;
  label: string;
  color: string;
};

export type UserPreferences = {
  _id?: string;
  userEmail: string;
  dayStart: string;
  dayEnd: string;
  categories: CategoryItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type BlueprintSlot = {
  start: string;
  end: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  notes?: string;
};

export type BlueprintDay = {
  slots: BlueprintSlot[];
};

export type Blueprint = {
  _id?: string;
  userEmail: string;
  monday: BlueprintDay;
  tuesday: BlueprintDay;
  wednesday: BlueprintDay;
  thursday: BlueprintDay;
  friday: BlueprintDay;
  saturday: BlueprintDay;
  sunday: BlueprintDay;
  createdAt?: string;
  updatedAt?: string;
};

export type View = "today" | "tasks" | "progress" | "settings";

export type TaskInput = {
  title: string;
  category: string;
  date: string;
  start: string;
  end: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  resourceUrl?: string;
  syncToCalendar?: boolean;
};

export type Task = TaskInput & {
  _id: string;
  status: "planned" | "completed" | "skipped";
  skipReason?: string;
  calendarEventId?: string;
};
