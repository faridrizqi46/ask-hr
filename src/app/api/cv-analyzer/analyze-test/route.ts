import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings";
import type { ParsedCV, CVAnalysis } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const QUICK_MATCH_THRESHOLD = 60;
const FINAL_SCORE_THRESHOLD = 70;

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

interface JobWithEmbedding {
  id: string;
  title: string;
  employmentType: string;
  workModel: string;
  description: string;
  embedding: number[] | null;
}

interface QuickMatchResult {
  jobId: string;
  jobTitle: string;
  similarityPercent: number;
}

interface MiniMaxAnalysisResult {
  matchPercentage: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  missingSkills: string[];
  candidateStrengths: string[];
  gaps: string[];
  reasoning: string;
  summary: string;
}

const analysisPrompt = `You are an expert HR recruitment analyst.

Your task is to evaluate how well a candidate's CV matches a job description.

IMPORTANT RULES:
- Only use information explicitly stated in the CV.
- Do NOT assume or infer skills that are not clearly mentioned.
- Be strict and realistic like a professional recruiter.

SCORING CRITERIA:
- Skills match (50%)
- Experience relevance (40%)
- Education (10%)

SCORING GUIDELINES:
- 90-100: Excellent fit
- 70-89: Good fit
- 50-69: Partial fit
- Below 50: Poor fit

Job: ${"${jobTitle}"}
Employment Type: ${"${employmentType}"}
Work Model: ${"${workModel}"}
Description: ${"${description}"}

CV: ${"${cvText}"}

Return ONLY JSON:
{
  "matchPercentage": number,
  "skillMatch": number,
  "experienceMatch": number,
  "educationMatch": number,
  "missingSkills": [],
  "candidateStrengths": [],
  "gaps": [],
  "reasoning": "",
  "summary": ""
}`;

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cv } = body as { cv: ParsedCV };

    if (!cv) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "No active jobs available for matching" },
        { status: 400 }
      );
    }

    const jobsWithEmbeddings = jobs as JobWithEmbedding[];
    const jobsMissingEmbeddings = jobsWithEmbeddings.filter((j) => !j.embedding);

    if (jobsMissingEmbeddings.length > 0) {
      console.warn(
        `${jobsMissingEmbeddings.length} jobs are missing embeddings. They will be skipped.`
      );
    }

    const jobsWithValidEmbeddings = jobsWithEmbeddings.filter(
      (j) => j.embedding && j.embedding.length > 0
    );

    if (jobsWithValidEmbeddings.length === 0) {
      return NextResponse.json(
        {
          error: "No jobs have valid embeddings. Please re-save jobs to generate embeddings.",
          matches: [],
        },
        { status: 400 }
      );
    }

    const cvText = cv.rawText;
    let cvEmbedding: number[];

    try {
      cvEmbedding = await generateEmbedding(cvText);
    } catch (error) {
      console.error("Error generating CV embedding:", error);
      return NextResponse.json(
        { error: "Failed to generate CV embedding" },
        { status: 500 }
      );
    }

    const quickMatchResults: QuickMatchResult[] = [];

    for (const job of jobsWithValidEmbeddings) {
      try {
        const similarity = cosineSimilarity(cvEmbedding, job.embedding!);
        const similarityPercent = Math.round(similarity * 100);

        quickMatchResults.push({
          jobId: job.id,
          jobTitle: job.title,
          similarityPercent,
        });
      } catch (error) {
        console.error(`Error calculating similarity for job ${job.id}:`, error);
        continue;
      }
    }

    quickMatchResults.sort((a, b) => b.similarityPercent - a.similarityPercent);

    const promisingJobs = quickMatchResults
      .filter((r) => r.similarityPercent >= QUICK_MATCH_THRESHOLD)
      .slice(0, 10);

    if (promisingJobs.length === 0) {
      return NextResponse.json({
        matches: [],
        totalJobsAnalyzed: jobsWithValidEmbeddings.length,
        promisingJobsCount: 0,
        quickMatchResults: quickMatchResults.slice(0, 5),
        message: `No jobs passed the quick match threshold (${QUICK_MATCH_THRESHOLD}%)`,
      });
    }

    const analysisResults: CVAnalysis[] = [];

    for (const promisingJob of promisingJobs) {
      const job = jobsWithValidEmbeddings.find((j) => j.id === promisingJob.jobId);
      if (!job) continue;

      try {
        const messages: ChatMessage[] = [
          {
            role: "system",
            content: analysisPrompt
              .replace("${jobTitle}", job.title)
              .replace("${employmentType}", job.employmentType)
              .replace("${workModel}", job.workModel)
              .replace("${description}", job.description)
              .replace("${cvText}", cvText),
          },
          {
            role: "user",
            content: "Analyze this CV against the job description and return the JSON result.",
          },
        ];

        let analysisText = "";
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
            temperature: 0.7,
            max_tokens: 8192,
          });
          analysisText = response.choices[0]?.message?.content || "";
        } catch (error) {
          console.error(`AI analysis error for job ${job.id}:`, error);
          continue;
        }

        const cleanedResponse = analysisText
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "");

        try {
          const parsed = JSON.parse(cleanedResponse) as MiniMaxAnalysisResult;

          if (parsed.matchPercentage < FINAL_SCORE_THRESHOLD) {
            continue;
          }

          const analysis: CVAnalysis = {
            matchPercentage: Math.min(
              100,
              Math.max(0, parsed.matchPercentage || 0)
            ),
            matchedJob: {
              id: job.id,
              title: job.title,
              department: job.employmentType,
            },
            reasoning: parsed.reasoning || "Unable to generate reasoning.",
            missingSkills: parsed.missingSkills || [],
            candidateStrengths: parsed.candidateStrengths || [],
            summary: parsed.summary || "No summary available.",
          };
          analysisResults.push(analysis);
        } catch (parseError) {
          console.error(`JSON parse error for job ${job.id}:`, parseError);
          continue;
        }
      } catch (error) {
        console.error(`Error analyzing job ${job.id}:`, error);
        continue;
      }
    }

    if (analysisResults.length === 0) {
      return NextResponse.json({
        matches: [],
        totalJobsAnalyzed: jobsWithValidEmbeddings.length,
        promisingJobsCount: promisingJobs.length,
        quickMatchResults: promisingJobs.slice(0, 5),
        message: `No jobs passed the final score threshold (${FINAL_SCORE_THRESHOLD}%) after AI analysis`,
      });
    }

    analysisResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const topMatches = analysisResults.slice(0, 3);

    return NextResponse.json({
      matches: topMatches,
      totalJobsAnalyzed: jobsWithValidEmbeddings.length,
      promisingJobsCount: promisingJobs.length,
      quickMatchResults: promisingJobs.slice(0, 5),
    });
  } catch (error) {
    console.error("Error analyzing CV:", error);
    return NextResponse.json(
      { error: "Failed to analyze CV" },
      { status: 500 }
    );
  }
}