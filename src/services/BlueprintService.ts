import { BlueprintRepository } from "@/repositories/BlueprintRepository";
import { TaskRepository } from "@/repositories/TaskRepository";
import { Blueprint as BlueprintType, BlueprintSlot, DayOfWeek } from "@/types";

export class BlueprintService {
  static async getBlueprint(userEmail: string) {
    return BlueprintRepository.getBlueprint(userEmail);
  }

  static async updateBlueprint(userEmail: string, updates: Partial<BlueprintType>) {
    const allowedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedDays.includes(key))
    );
    return BlueprintRepository.updateBlueprint(userEmail, filteredUpdates);
  }

  static async generateTasksFromBlueprint(userEmail: string, date: string) {
    const blueprint = await BlueprintRepository.getBlueprint(userEmail) as BlueprintType;
    if (!blueprint) {
      throw new Error("No blueprint found");
    }

    const d = new Date(date);
    const dayIndex = d.getDay();
    const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayIndex];
    const dayBlueprint = blueprint[dayName];

    if (!dayBlueprint?.slots?.length) {
      return [];
    }

    const tasks = await Promise.all(
      dayBlueprint.slots.map((slot: BlueprintSlot) =>
        TaskRepository.createTask(userEmail, {
          title: slot.title,
          category: slot.category,
          date,
          start: slot.start,
          end: slot.end,
          priority: slot.priority,
          notes: slot.notes,
        })
      )
    );

    return tasks;
  }
}
