import { connectMongo } from "@/lib/mongodb";
import { Blueprint } from "@/models/Blueprint";
import { Blueprint as BlueprintType } from "@/types";

export class BlueprintRepository {
  static async getBlueprint(userEmail: string) {
    await connectMongo();
    let blueprint = await Blueprint.findOne({ userEmail });
    if (!blueprint) {
      blueprint = await Blueprint.create({ userEmail });
    }
    return blueprint;
  }

  static async updateBlueprint(userEmail: string, updates: Partial<BlueprintType>) {
    await connectMongo();
    return Blueprint.findOneAndUpdate(
      { userEmail },
      { ...updates, userEmail },
      { new: true, upsert: true, runValidators: true }
    );
  }
}
