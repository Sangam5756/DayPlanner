import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { UserPreference } from "@/models/UserPreference";

const validTime = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongo();
  const preferences = await UserPreference.findOneAndUpdate(
    { userEmail: email },
    { $setOnInsert: { userEmail: email, dayStart: "06:00", dayEnd: "23:00" } },
    { new: true, upsert: true }
  ).lean();

  return NextResponse.json({
    dayStart: preferences.dayStart,
    dayEnd: preferences.dayEnd,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayStart, dayEnd } = await request.json();
  if (!validTime(dayStart) || !validTime(dayEnd) || dayEnd <= dayStart) {
    return NextResponse.json(
      { error: "Day end must be later than day start." },
      { status: 400 }
    );
  }

  await connectMongo();
  const preferences = await UserPreference.findOneAndUpdate(
    { userEmail: email },
    { dayStart, dayEnd },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return NextResponse.json({
    dayStart: preferences.dayStart,
    dayEnd: preferences.dayEnd,
  });
}
