import { Schema, model, models } from "mongoose";

const taskSchema = new Schema(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ["dsa", "learning", "reading", "personal", "office", "habit"],
      required: true,
    },
    date: { type: String, required: true, index: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["planned", "completed", "skipped"],
      default: "planned",
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    resourceUrl: { type: String, trim: true, maxlength: 1000 },
    skipReason: { type: String, trim: true, maxlength: 240 },
    actualMinutes: { type: Number, min: 0, default: 0 },
    calendarEventId: String,
  },
  { timestamps: true }
);

taskSchema.index({ userEmail: 1, date: 1, start: 1 });

export const Task = models.Task || model("Task", taskSchema);
