import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { refreshGoogleAccessToken } from "@/lib/auth";
import { CalendarService } from "@/services/CalendarService";
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
  try {
    const result = await CalendarService.syncToGoogleCalendar(taskId, token.accessToken, timeZone);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

  const { taskId } = await request.json();
  try {
    await CalendarService.deleteFromGoogleCalendar(taskId, token.accessToken);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
