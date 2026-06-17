import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { connectMongo } from "@/lib/mongodb";
import { UserPreference } from "@/models/UserPreference";

const taskSchema: Schema = {
  description: "A list of structured planner time blocks",
  type: SchemaType.OBJECT,
  nullable: false,
  properties: {
    tasks: {
      type: SchemaType.ARRAY,
      description: "Array of tasks to be added to the planner",
      nullable: false,
      items: {
        type: SchemaType.OBJECT,
        nullable: false,
        properties: {
          title: { type: SchemaType.STRING, description: "Title of the task", nullable: false },
          category: {
            type: SchemaType.STRING,
            description: "Category of the task (must use one of the provided category IDs)",
            nullable: false,
          },
          date: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD format", nullable: false },
          start: { type: SchemaType.STRING, description: "24-hour time in HH:MM format", nullable: false },
          end: { type: SchemaType.STRING, description: "24-hour time in HH:MM format", nullable: false },
          priority: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high"],
            description: "Priority level",
            format: "enum",
            nullable: false,
          },
          notes: { type: SchemaType.STRING, description: "Additional details or notes", nullable: false },
          resourceUrl: { type: SchemaType.STRING, description: "URL for resources, or empty string", nullable: false },
          syncToCalendar: { type: SchemaType.BOOLEAN, description: "Whether to sync to Google Calendar", nullable: false },
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add GEMINI_API_KEY to .env to enable the AI planner." },
      { status: 503 }
    );
  }

  const { prompt, currentDate, timeZone, dayStart, dayEnd } = await request.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Describe what you need to plan." }, { status: 400 });
  }

  // Load user's custom categories
  await connectMongo();
  let userPrefs = await UserPreference.findOne({ userEmail: session.user.email });
  const categories = userPrefs?.categories || [
    { id: "dsa", label: "DSA", color: "orange" },
    { id: "learning", label: "Learning", color: "purple" },
    { id: "reading", label: "Reading", color: "teal" },
    { id: "personal", label: "Personal", color: "indigo" },
    { id: "office", label: "Office", color: "blue" },
    { id: "habit", label: "Habit", color: "green" },
  ];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `Convert the user's request into realistic planner time blocks. 
Do not invent confidential office details. 
Resolve relative dates from the supplied current date: ${currentDate}. 
Time zone: ${timeZone}.
Usable day: ${dayStart || "06:00"} to ${dayEnd || "23:00"}.
Keep every task inside the usable day.
Avoid overlapping blocks. 
Use 'reading' for books, blogs, articles, or documentation. 
Put any supplied URL in resourceUrl, otherwise use an empty string. 
Default syncToCalendar to true unless the user says not to sync. 
If no duration is given, use 45 minutes.

IMPORTANT: Only use these category IDs (do not create new categories):
${categories.map((cat: any) => `- ${cat.id} (${cat.label})`).join("\n")}`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: taskSchema,
      },
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let outputText = response.text();

    if (!outputText) {
      return NextResponse.json({ error: "AI returned an empty plan." }, { status: 502 });
    }

    // Strip markdown if present
    if (outputText.includes("```json")) {
      outputText = outputText.split("```json")[1].split("```")[0].trim();
    } else if (outputText.includes("```")) {
      outputText = outputText.split("```")[1].split("```")[0].trim();
    }

    return NextResponse.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error("Gemini planner failed", error);
    return NextResponse.json(
      { error: error?.message || "AI could not create the plan." },
      { status: 500 }
    );
  }
}
