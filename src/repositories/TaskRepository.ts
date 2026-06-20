import { connectMongo } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { TaskInput } from "@/types";

export class TaskRepository {
  static async getTasks(userEmail: string, date?: string) {
    await connectMongo();
    const query = date ? { userEmail, date } : { userEmail };
    return Task.find(query).sort({ date: 1, start: 1 }).lean();
  }

  static async createTask(userEmail: string, taskData: TaskInput) {
    await connectMongo();
    return Task.create({ ...taskData, userEmail });
  }

  static async updateTask(taskId: string, updates: Record<string, unknown>) {
    await connectMongo();
    return Task.findByIdAndUpdate(taskId, updates, { new: true, runValidators: true });
  }

  static async deleteTask(taskId: string) {
    await connectMongo();
    return Task.findByIdAndDelete(taskId);
  }

  static async getTaskById(taskId: string) {
    await connectMongo();
    return Task.findById(taskId);
  }
}
