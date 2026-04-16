import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function checkAuth(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET || "password123";
  const authHeader = request.headers.get("authorization");

  if (authHeader === `Bearer ${adminSecret}`) {
    return true;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  return cookies["admin_token"] === adminSecret;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface JobInfo {
  title: string;
  employmentType: string;
  workModel: string;
  description: string;
}

async function getJobsContext(): Promise<string> {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      employmentType: true,
      workModel: true,
      description: true,
    },
  });

  return jobs
    .map(
      (job: JobInfo, index: number) => `
Job ${index + 1}:
- Title: ${job.title}
- Employment Type: ${job.employmentType}
- Work Model: ${job.workModel}
- Description: ${job.description}
`
    )
    .join("\n");
}

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history } = body as { message: string; history?: ChatMessage[] };

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const jobsContext = await getJobsContext();

    const systemPrompt = `You are an HR assistant for AskHR. Your knowledge is based on the company's job listings.

When answering questions, reference specific jobs from the provided list. Be helpful, professional, and accurate.

IMPORTANT: If you're unsure about something, say so. Only provide information that is based on the job listings provided.

Current Job Listings:
${jobsContext}

If a user asks about jobs and none match their criteria, politely say so and offer to help with other questions about our job openings.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    messages.push({
      role: "user",
      content: message,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}