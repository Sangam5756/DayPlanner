import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { BlueprintService } from "@/services/BlueprintService";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blueprint = await BlueprintService.getBlueprint(userEmail);
  return NextResponse.json(blueprint);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  const blueprint = await BlueprintService.updateBlueprint(userEmail, updates);
  return NextResponse.json(blueprint);
}

// Generate tasks from blueprint for a specific date
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await request.json();
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  try {
    const tasks = await BlueprintService.generateTasksFromBlueprint(userEmail, date);
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
