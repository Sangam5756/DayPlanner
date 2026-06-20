import { connectMongo } from "@/lib/mongodb";
import { UserPreference } from "@/models/UserPreference";
import { UserPreferences } from "@/types";

export class UserPreferenceRepository {
  static async getPreferences(userEmail: string) {
    await connectMongo();
    let prefs = await UserPreference.findOne({ userEmail });
    if (!prefs) {
      prefs = await UserPreference.create({ userEmail });
    }
    return prefs;
  }

  static async updatePreferences(userEmail: string, updates: Partial<UserPreferences>) {
    await connectMongo();
    return UserPreference.findOneAndUpdate(
      { userEmail },
      { ...updates, userEmail },
      { new: true, upsert: true, runValidators: true }
    );
  }
}
