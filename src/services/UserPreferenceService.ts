import { UserPreferenceRepository } from "@/repositories/UserPreferenceRepository";
import { UserPreferences } from "@/types";

export class UserPreferenceService {
  static async getPreferences(userEmail: string) {
    return UserPreferenceRepository.getPreferences(userEmail);
  }

  static async updatePreferences(userEmail: string, updates: Partial<UserPreferences>) {
    // Only allow specific fields to be updated
    const allowedFields = ["dayStart", "dayEnd", "categories"];
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );
    return UserPreferenceRepository.updatePreferences(userEmail, filteredUpdates);
  }
}
