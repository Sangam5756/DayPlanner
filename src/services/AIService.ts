import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
  static async generatePlan(prompt: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest" });

    const systemPrompt = `You are a daily planner assistant. Your task is to convert a natural language plan into structured time-blocked tasks.

Return ONLY a JSON object with a "tasks" array. Each task must have:
- title: string (clear task description)
- category: string (one of: "dsa", "learning", "reading", "personal", "office", "habit" or custom, but keep it simple)
- date: string (ISO format, e.g., "2025-06-20")
- start: string (24h format, e.g., "09:00")
- end: string (24h format, after start time)
- priority: "low" | "medium" | "high"
- notes?: string (optional)
- resourceUrl?: string (optional, valid http/https URL)

Do not include any markdown, just pure JSON.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser's plan: ${prompt}`);
    const response = await result.response;
    let outputText = response.text();

    if (outputText.includes("```json")) {
      outputText = outputText.split("```json")[1].split("```")[0].trim();
    } else if (outputText.includes("```")) {
      outputText = outputText.split("```")[1].split("```")[0].trim();
    }

    return JSON.parse(outputText);
  }
}
