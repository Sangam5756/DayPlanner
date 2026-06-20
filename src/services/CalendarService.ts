import { TaskRepository } from "@/repositories/TaskRepository";

export class CalendarService {
  static async syncToGoogleCalendar(taskId: string, accessToken: string, timeZone: string) {
    const task = await TaskRepository.getTaskById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const endpoint = task.calendarEventId
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`
      : "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    const response = await fetch(endpoint, {
      method: task.calendarEventId ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: task.title,
        description: [
          `Daymark planner - ${task.category}`,
          task.notes,
          task.resourceUrl ? `Resource: ${task.resourceUrl}` : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
        start: {
          dateTime: `${task.date}T${task.start}:00`,
          timeZone: timeZone || "Asia/Kolkata",
        },
        end: {
          dateTime: `${task.date}T${task.end}:00`,
          timeZone: timeZone || "Asia/Kolkata",
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 10 }],
        },
      }),
    });

    if (!response.ok) {
      const googleError = await response.json().catch(() => null);
      const reason =
        googleError?.error?.message ||
        (response.status === 403
          ? "Google Calendar API is disabled or Calendar permission was not granted."
          : "Google Calendar rejected the event.");
      throw new Error(reason);
    }

    const event = await response.json();
    await TaskRepository.updateTask(taskId, { calendarEventId: event.id });
    return { eventId: event.id };
  }

  static async deleteFromGoogleCalendar(taskId: string, accessToken: string) {
    const task = await TaskRepository.getTaskById(taskId);
    if (!task || !task.calendarEventId) {
      // If no event ID, nothing to delete
      return;
    }

    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`;
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      // Ignore 404 (event already deleted) but throw other errors
      const googleError = await response.json().catch(() => null);
      const reason = googleError?.error?.message || "Failed to delete event from Google Calendar";
      throw new Error(reason);
    }
  }
}
