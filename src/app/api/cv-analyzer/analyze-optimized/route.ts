import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMiniMaxClient, type ChatMessage } from "@/lib/ai";
import type { ParsedCV, CVAnalysis } from "@/lib/types";

const minimaxClient = createMiniMaxClient({
  apiKey: process.env.MINIMAX_API_KEY || "",
  groupId: process.env.MINIMAX_GROUP_ID || "",
});

function checkAuth(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET || "password123";
  const authHeader = request.headers.get("authorization");
  
  if (authHeader === `Bearer ${adminSecret}`) {
    return true;
  }
  
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );
  
  return cookies["admin_token"] === adminSecret;
}

const SKILL_KEYWORDS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin",
  "react", "vue", "angular", "nextjs", "nodejs", "express", "django", "flask", "spring", "laravel", "codeigniter",
  "html", "css", "sass", "tailwind", "bootstrap",
  "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "oracle", "sap",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd", "devops",
  "git", "github", "gitlab",
  "agile", "scrum", "kanban",
  "machine learning", "deep learning", "ai", "data science", "data analysis", "tableau", "power bi",
  "project management", "leadership", "communication",
  "figma", "adobe", "ui/ux",
  "rest api", "graphql", "grpc",
  "microservices", "serverless", "lambda",
  "excel", "powerpoint", "word",
  "abap", "sap mm", "sap fi", "sap co", "sap sd", "infor", "informatica", "etl",
];

function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSkills: string[] = [];
  
  for (const skill of SKILL_KEYWORDS) {
    if (lowerText.includes(skill.toLowerCase())) {
      const capitalizedSkill = skill
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      if (!foundSkills.includes(capitalizedSkill)) {
        foundSkills.push(capitalizedSkill);
      }
    }
  }
  
  return foundSkills;
}

function calculateQuickMatch(cvSkills: string[], jobDescription: string): number {
  if (cvSkills.length === 0) return 0;
  
  const jobSkills = extractSkillsFromText(jobDescription);
  const lowerCvSkills = cvSkills.map(s => s.toLowerCase());
  
  let matched = 0;
  for (const jobSkill of jobSkills) {
    const lowerJobSkill = jobSkill.toLowerCase();
    for (const cvSkill of lowerCvSkills) {
      if (cvSkill.includes(lowerJobSkill) || lowerJobSkill.includes(cvSkill)) {
        matched++;
        break;
      }
    }
  }
  
  const matchPercentage = Math.min(100, Math.round((matched / cvSkills.length) * 100));
  return matchPercentage;
}

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

    const cvText = cv.rawText;
    const cvSkills = cv.skills;

    const QUICK_MATCH_THRESHOLD = 20;

    const quickMatchResults: Array<{ jobId: string; jobTitle: string; quickMatchPercent: number }> = [];
    
    for (const job of jobs) {
      const quickMatchPercent = calculateQuickMatch(cvSkills, job.description);
      quickMatchResults.push({
        jobId: job.id,
        jobTitle: job.title,
        quickMatchPercent,
      });
    }

    const promisingJobs = quickMatchResults
      .filter(r => r.quickMatchPercent >= QUICK_MATCH_THRESHOLD)
      .sort((a, b) => b.quickMatchPercent - a.quickMatchPercent)
      .slice(0, 10);

    const analysisResults: CVAnalysis[] = [];

    for (const promisingJob of promisingJobs) {
      const job = jobs.find(j => j.id === promisingJob.jobId);
      if (!job) continue;

      try {
        const jobText = formatJobForAnalysis(job);
        
        const messages: ChatMessage[] = [
          {
            role: "system",
            content: `You are an expert HR recruitment analyst. Analyze CVs against job descriptions to provide detailed matching insights.

When analyzing, you MUST respond with ONLY a valid JSON object in this exact format, no other text:
{
  "matchPercentage": number between 0-100,
  "reasoning": "detailed explanation of why this candidate matches or doesn't match",
  "missingSkills": ["list of skills required by job but not found in CV"],
  "candidateStrengths": ["list of notable strengths from CV relevant to the job"],
  "summary": "brief overall assessment"
}`,
          },
          {
            role: "user",
            content: `Analyze this CV against the job description.

CV Information:
${cvText}

Job Description:
${jobText}

Respond with ONLY the JSON object as specified in the system prompt.`,
          },
        ];

        let analysisText = "";
        try {
          analysisText = await minimaxClient.chat(messages);
        } catch (error) {
          console.error(`AI analysis error for job ${job.id}:`, error);
          continue;
        }

        const cleanedResponse = analysisText
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "");

        try {
          const parsed = JSON.parse(cleanedResponse);
          const analysis: CVAnalysis = {
            matchPercentage: Math.min(100, Math.max(0, parsed.matchPercentage || 0)),
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
      return NextResponse.json(
        { 
          error: "No matching jobs found",
          matches: [],
          totalJobsAnalyzed: jobs.length,
          promisingJobs: promisingJobs.length,
          quickMatchResults: quickMatchResults.slice(0, 5),
          message: "No jobs passed the quick match threshold (20%)"
        },
        { status: 200 }
      );
    }

    analysisResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const topMatches = analysisResults.slice(0, 3);

    return NextResponse.json({
      matches: topMatches,
      totalJobsAnalyzed: jobs.length,
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

function formatJobForAnalysis(job: { title: string; employmentType: string; workModel: string; description: string }): string {
  return `
Title: ${job.title}
Employment Type: ${job.employmentType}
Work Model: ${job.workModel}
Description: ${job.description}
  `.trim();
}
