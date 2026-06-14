import { Schema, model, models } from "mongoose";

const userPreferenceSchema = new Schema(
  {
    userEmail: { type: String, required: true, unique: true, index: true },
    dayStart: { type: String, required: true, default: "06:00" },
    dayEnd: { type: String, required: true, default: "23:00" },
  },
  { timestamps: true }
);

export const UserPreference =
  models.UserPreference || model("UserPreference", userPreferenceSchema);
