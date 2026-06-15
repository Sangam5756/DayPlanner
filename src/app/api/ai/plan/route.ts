import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const taskSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          category: {
            type: "string",
            enum: ["dsa", "learning", "reading", "personal", "office", "habit"],
          },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          start: { type: "string", description: "24-hour time in HH:MM format" },
          end: { type: "string", description: "24-hour time in HH:MM format" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          notes: { type: "string" },
          resourceUrl: { type: "string" },
          syncToCalendar: { type: "boolean" },
        },
        required: [
          "title",
          "category",
          "date",
          "start",
          "end",
          "priority",
          "notes",
          "resourceUrl",
          "syncToCalendar",
        ],
      },
    },
  },
  required: ["tasks"],
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Add OPENAI_API_KEY to .env to enable the AI planner." },
      { status: 503 }
    );
  }

  const { prompt, currentDate, timeZone, dayStart, dayEnd } = await request.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Describe what you need to plan." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions:
        "Convert the user's request into realistic planner time blocks. Do not invent confidential office details. Resolve relative dates from the supplied current date. Avoid overlapping blocks. Use reading for books, blogs, articles, or documentation. Put any supplied URL in resourceUrl, otherwise use an empty string. Default syncToCalendar to true unless the user says not to sync. If no duration is given, use 45 minutes.",
      input: `Current date: ${currentDate}\nTime zone: ${timeZone}\nUsable day: ${dayStart || "06:00"} to ${dayEnd || "23:00"}\nKeep every task inside the usable day.\nPlan request: ${prompt}`,
      text: {
        format: {
          type: "json_schema",
          name: "daily_plan",
          strict: true,
          schema: taskSchema,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI planner failed", data);
    return NextResponse.json(
      { error: data?.error?.message || "AI could not create the plan." },
      { status: response.status }
    );
  }

  const outputText = data.output
    ?.flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content ?? [])
    .find((item: { type: string }) => item.type === "output_text")?.text;

  if (!outputText) {
    return NextResponse.json({ error: "AI returned an empty plan." }, { status: 502 });
  }

  return NextResponse.json(JSON.parse(outputText));
}
