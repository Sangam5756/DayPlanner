import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { refreshGoogleAccessToken } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }

  const accessTokenExpired =
    !token.accessToken ||
    !token.accessTokenExpires ||
    Date.now() >= token.accessTokenExpires - 60_000;

  if (accessTokenExpired) {
    token = await refreshGoogleAccessToken(token as JWT);
  }

  if (!token.accessToken || token.error) {
    return NextResponse.json(
      {
        error:
          token.error === "MissingRefreshToken"
            ? "Calendar permission is missing. Sign out, then sign in and allow Google Calendar access."
            : "Google authorization expired. Sign out and connect Google again.",
        code: token.error,
      },
      { status: 401 }
    );
  }

  const { taskId, timeZone } = await request.json();
  await connectMongo();
  const task = await Task.findOne({ _id: taskId, userEmail: token.email });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const endpoint = task.calendarEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`
    : "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  const response = await fetch(endpoint, {
    method: task.calendarEventId ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
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
    console.error("Google Calendar sync failed", googleError);
    return NextResponse.json(
      { error: reason, code: googleError?.error?.status },
      { status: response.status }
    );
  }
  const event = await response.json();
  task.calendarEventId = event.id;
  await task.save();
  return NextResponse.json({ eventId: event.id });
}
