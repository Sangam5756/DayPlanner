import { Schema, model, models } from "mongoose";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface BlueprintSlot {
  start: string; // "05:30"
  end: string; // "06:00"
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface BlueprintDay {
  slots: BlueprintSlot[];
}

const blueprintSlotSchema = new Schema<BlueprintSlot>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], required: true, default: "medium" },
    notes: { type: String },
  },
  { _id: false }
);

const blueprintDaySchema = new Schema<BlueprintDay>(
  {
    slots: { type: [blueprintSlotSchema], required: true, default: [] },
  },
  { _id: false }
);

interface Blueprint {
  userEmail: string;
  monday: BlueprintDay;
  tuesday: BlueprintDay;
  wednesday: BlueprintDay;
  thursday: BlueprintDay;
  friday: BlueprintDay;
  saturday: BlueprintDay;
  sunday: BlueprintDay;
}

const blueprintSchema = new Schema<Blueprint>(
  {
    userEmail: { type: String, required: true, unique: true, index: true },
    monday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    tuesday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    wednesday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    thursday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    friday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    saturday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
    sunday: { type: blueprintDaySchema, required: true, default: { slots: [] } },
  },
  { timestamps: true }
);

export const Blueprint =
  models.Blueprint || model("Blueprint", blueprintSchema);
