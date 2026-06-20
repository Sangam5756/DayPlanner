import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { UserPreferenceService } from "@/services/UserPreferenceService";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await UserPreferenceService.getPreferences(userEmail);
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  const prefs = await UserPreferenceService.updatePreferences(userEmail, updates);
  return NextResponse.json(prefs);
}
