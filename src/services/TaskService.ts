import { TaskRepository } from "@/repositories/TaskRepository";
import { TaskInput } from "@/types";

export class TaskService {
  static async getTasks(userEmail: string, date?: string) {
    return TaskRepository.getTasks(userEmail, date);
  }

  static async createTask(userEmail: string, taskData: TaskInput) {
    // Validate task data
    if (!taskData.title?.trim()) {
      throw new Error("Title is required");
    }
    if (!taskData.date || !taskData.start || !taskData.end) {
      throw new Error("Date and time are required");
    }
    if (taskData.end <= taskData.start) {
      throw new Error("End time must be after start time");
    }
    if (taskData.resourceUrl) {
      try {
        const url = new URL(taskData.resourceUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        throw new Error("Resource link must be a valid http or https URL");
      }
    }

    return TaskRepository.createTask(userEmail, taskData);
  }

  static async updateTask(taskId: string, updates: Record<string, unknown>) {
    return TaskRepository.updateTask(taskId, updates);
  }

  static async deleteTask(taskId: string) {
    return TaskRepository.deleteTask(taskId);
  }

  static async getTaskById(taskId: string) {
    return TaskRepository.getTaskById(taskId);
  }
}
