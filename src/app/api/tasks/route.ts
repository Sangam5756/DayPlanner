import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Task } from "@/models/Task";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = new URL(request.url).searchParams.get("date");
  await connectMongo();
  const tasks = await Task.find({ userEmail: email, ...(date ? { date } : {}) })
    .sort({ date: 1, start: 1 })
    .lean();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title?.trim() || !body.date || !body.start || !body.end) {
    return NextResponse.json({ error: "Complete all required fields" }, { status: 400 });
  }
  if (body.end <= body.start) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }
  if (body.resourceUrl) {
    try {
      const resource = new URL(body.resourceUrl);
      if (!["http:", "https:"].includes(resource.protocol)) throw new Error();
    } catch {
      return NextResponse.json(
        { error: "Resource link must be a valid http or https URL" },
        { status: 400 }
      );
    }
  }

  await connectMongo();
  const task = await Task.create({
    userEmail: email,
    title: body.title,
    category: body.category,
    date: body.date,
    start: body.start,
    end: body.end,
    priority: body.priority,
    notes: body.notes,
    resourceUrl: body.resourceUrl || undefined,
  });
  return NextResponse.json(task, { status: 201 });
}
