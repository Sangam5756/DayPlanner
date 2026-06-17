import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Blueprint } from "@/models/Blueprint";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongo();
  let blueprint = await Blueprint.findOne({ userEmail });

  if (!blueprint) {
    blueprint = await Blueprint.create({ userEmail });
  }

  return NextResponse.json(blueprint);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  console.log("blueprint PUT - updates:", updates);

  // Only allow certain fields (all days)
  const allowedDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedDays.includes(key))
  );
  console.log("blueprint PUT - filteredUpdates:", filteredUpdates);

  await connectMongo();
  const updateWithEmail = { ...filteredUpdates, userEmail };
  const blueprint = await Blueprint.findOneAndUpdate(
    { userEmail },
    updateWithEmail,
    { new: true, upsert: true, runValidators: true }
  );
  console.log("blueprint PUT - updated blueprint:", blueprint);

  return NextResponse.json(blueprint);
}

// Generate tasks from blueprint for a specific date
export async function POST(request: Request) {
  console.log("blueprint POST - starting");
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  console.log("blueprint POST - userEmail:", userEmail);
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await request.json();
  console.log("blueprint POST - date received:", date);
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  await connectMongo();
  const blueprint = await Blueprint.findOne({ userEmail });
  console.log("blueprint POST - blueprint found:", blueprint);
  if (!blueprint) {
    return NextResponse.json({ error: "No blueprint found" }, { status: 404 });
  }

  // Get day of week from date
  const d = new Date(date);
  const dayIndex = d.getDay(); // 0 = Sunday, 1 = Monday
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[dayIndex] as keyof typeof blueprint;
  console.log("blueprint POST - dayName:", dayName);
  const dayBlueprint = blueprint[dayName];
  console.log("blueprint POST - dayBlueprint:", dayBlueprint);

  if (!dayBlueprint?.slots?.length) {
    console.log("blueprint POST - no slots found for day");
    return NextResponse.json({ tasks: [] });
  }

  // Import Task model
  const { Task } = await import("@/models/Task");

  // Create tasks from blueprint slots
  console.log("blueprint POST - creating tasks from slots:", dayBlueprint.slots);
  const tasks = await Promise.all(
    dayBlueprint.slots.map(async (slot) => {
      const taskData = {
        userEmail,
        title: slot.title,
        category: slot.category,
        date,
        start: slot.start,
        end: slot.end,
        priority: slot.priority,
        notes: slot.notes,
        status: "planned",
      };
      return Task.create(taskData);
    })
  );
  console.log("blueprint POST - created tasks:", tasks);

  return NextResponse.json({ tasks });
}
