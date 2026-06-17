import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { UserPreference } from "@/models/UserPreference";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongo();
  let prefs = await UserPreference.findOne({ userEmail });

  if (!prefs) {
    prefs = await UserPreference.create({ userEmail });
  }

  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  console.log("user-preferences PUT - updates:", updates);

  // Only allow certain fields
  const allowedFields = ["dayStart", "dayEnd", "categories"];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );
  console.log("user-preferences PUT - filteredUpdates:", filteredUpdates);

  await connectMongo();
  // For upsert, we need to make sure userEmail is included in the update
  const updateWithEmail = { ...filteredUpdates, userEmail };
  const prefs = await UserPreference.findOneAndUpdate(
    { userEmail },
    updateWithEmail,
    { new: true, upsert: true, runValidators: true }
  );
  console.log("user-preferences PUT - updated prefs:", prefs);

  return NextResponse.json(prefs);
}
