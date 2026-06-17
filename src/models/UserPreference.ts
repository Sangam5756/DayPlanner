import { Schema, model, models } from "mongoose";

interface Category {
  id: string;
  label: string;
  color: string;
}

const categorySchema = new Schema<Category>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, required: true, default: "blue" },
  },
  { _id: false }
);

const userPreferenceSchema = new Schema(
  {
    userEmail: { type: String, required: true, unique: true, index: true },
    dayStart: { type: String, required: true, default: "06:00" },
    dayEnd: { type: String, required: true, default: "23:00" },
    categories: {
      type: [categorySchema],
      required: true,
      default: [
        { id: "dsa", label: "DSA", color: "orange" },
        { id: "learning", label: "Learning", color: "purple" },
        { id: "reading", label: "Reading", color: "teal" },
        { id: "personal", label: "Personal", color: "indigo" },
        { id: "office", label: "Office", color: "blue" },
        { id: "habit", label: "Habit", color: "green" },
      ],
    },
  },
  { timestamps: true }
);

export const UserPreference =
  models.UserPreference || model("UserPreference", userPreferenceSchema);
