import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Task } from "@/models/Task";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const allowed = [
    "status",
    "skipReason",
    "actualMinutes",
    "date",
    "start",
    "end",
    "calendarEventId",
  ];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );

  await connectMongo();
  const task = await Task.findOneAndUpdate(
    { _id: id, userEmail: email },
    updates,
    { new: true, runValidators: true }
  );
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  await connectMongo();
  const task = await Task.findOneAndDelete({ _id: id, userEmail: email });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
