import type { ParsedCV } from "@/lib/types";

export async function parseCV(buffer: Buffer, fileType: string): Promise<ParsedCV> {
  const rawText = await extractText(buffer, fileType);
  
  return {
    fullName: extractName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    skills: extractSkills(rawText),
    experience: extractExperience(rawText),
    education: extractEducation(rawText),
    summary: extractSummary(rawText),
    rawText,
  };
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  const lowerType = fileType.toLowerCase();

  if (lowerType.includes("pdf")) {
    return extractPdfText(buffer);
  } else if (lowerType.includes("docx") || lowerType.includes("document")) {
    return extractDocxText(buffer);
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (pdfParseModule as any).default || pdfParseModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (pdfParse as any)(buffer);
  return data.text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches?.[0] || null;
}

function extractPhone(text: string): string | null {
  const phoneRegex = /(?:\+62|62|0)[0-9]{9,12}/g;
  const matches = text.match(phoneRegex);
  return matches?.[0] || null;
}

function extractName(text: string): string | null {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    if (cleaned.length > 2 && cleaned.length < 50) {
      if (!cleaned.includes("@") && !cleaned.match(/\d{5,}/)) {
        const capitalized = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
        return capitalized;
      }
    }
  }
  
  return null;
}

function extractSkills(text: string): string[] {
  const skillKeywords = [
    "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "rust",
    "react", "vue", "angular", "nextjs", "nodejs", "express", "django", "flask",
    "spring", "spring boot", "laravel", "codeigniter",
    "html", "css", "sass", "tailwind", "bootstrap",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "git", "github", "gitlab", "jenkins", "ci/cd",
    "agile", "scrum", "kanban",
    "machine learning", "deep learning", "ai", "data science", "data analysis",
    "project management", "leadership", "communication", "problem solving",
    "figma", "adobe xd", "sketch", "ui/ux",
    "rest api", "graphql", "grpc",
    "microservices", "serverless", "lambda",
    "excel", "powerpoint", "word", "google workspace",
  ];

  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill.toLowerCase())) {
      const capitalizedSkill = skill
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      if (!foundSkills.includes(capitalizedSkill)) {
        foundSkills.push(capitalizedSkill);
      }
    }
  }

  return foundSkills;
}

function extractExperience(text: string): Array<{ company: string; position: string; duration: string }> {
  const experience: Array<{ company: string; position: string; duration: string }> = [];
  
  const lines = text.split("\n");
  let currentExp: { company: string; position: string; duration: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (
      trimmed.match(/work(?:ing)? experience|riwayat kerja|pengalaman kerja|employment history/i) ||
      trimmed.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s*\d{4}/i) ||
      trimmed.match(/\d{4}\s*[-–]\s*(?:\d{4}|sekarang|present)/i)
    ) {
      if (currentExp) {
        experience.push(currentExp);
      }
      currentExp = { company: "", position: "", duration: "" };
      
      const dateMatch = trimmed.match(/\d{4}\s*[-–]\s*(?:\d{4}|sekarang|present)/i);
      if (dateMatch) {
        currentExp.duration = dateMatch[0];
      }
      
      const companyMatch = trimmed.match(/(?:at|@)\s*([A-Za-z0-9\s&.,]+?)(?:\n|,|$)/i);
      if (companyMatch) {
        currentExp.company = companyMatch[1].trim();
      }
    }
  }

  if (currentExp) {
    experience.push(currentExp);
  }

  if (experience.length === 0) {
    const genericPatterns = [
      /(?:Software Engineer|Frontend Developer|Backend Developer|Full Stack Developer|Project Manager|Data Analyst|UI\/UX Designer|Product Manager|Business Analyst|Consultant)\s*(?:at|@|,)?\s*([A-Za-z0-9\s&.,]+?(?:Corp|Ltd|Inc|Co\.|Technologies|Indonesia))/gi,
    ];

    for (const pattern of genericPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        experience.push({
          company: match[1]?.trim() || "Company not specified",
          position: match[0].replace(match[1] || "", "").trim(),
          duration: "Not specified",
        });
      }
    }
  }

  return experience.slice(0, 5);
}

function extractEducation(text: string): Array<{ institution: string; degree: string; year: string }> {
  const education: Array<{ institution: string; degree: string; year: string }> = [];
  
  const eduKeywords = [
    "university", "universitas", "institute", "institut", "college", "sekolah tinggi",
    "politeknik", "akademi", "s1", "s2", "s3", "bachelor", "master", "doctor",
    "teknik", "ekonomi", "bisnis", "ilmukomputer", "informatika", "si",
    "ti", " informatika", "ilmu komputer",
  ];

  const degreePatterns = [
    /(?:S\d|Teknik|Ekonomi|Bisnis|Ilmu)?\s*(?:Komputer|Informatika|Sistem Informasi|Teknik Informatika|Ilmu Komputer|Manajemen|Bisnis Administrasi| Akuntansi|Finance|Psychology|Psikologi|Communication|\w+)\s*(?:Degree)?/gi,
  ];

  const lines = text.split("\n");
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (eduKeywords.some((keyword) => lowerLine.includes(keyword))) {
      const yearMatch = line.match(/\d{4}\s*[-–]\s*\d{4}|\d{4}\s*(?:graduated|lulus)|(?:graduated|lulus)\s*(?:in\s*)?\d{4}/i);
      
      let institution = "";
      let degree = "";
      let year = "";

      if (yearMatch) {
        year = yearMatch[0];
      }

      const uniMatch = line.match(/(?:Universitas|Institute|Institut|College|Sekolah Tinggi|Politeknik|Akademi)\s+[A-Za-z0-9\s]+/i);
      if (uniMatch) {
        institution = uniMatch[0].trim();
      }

      for (const pattern of degreePatterns) {
        const match = line.match(pattern);
        if (match) {
          degree = match[0].trim();
          break;
        }
      }

      if (institution || degree) {
        education.push({
          institution: institution || "Institution not specified",
          degree: degree || "Degree not specified",
          year: year || "Year not specified",
        });
      }
    }
  }

  if (education.length === 0) {
    const gpaMatch = text.match(/(?:IPK|GPA)\s*[:\-]?\s*(\d\.\d{1,2})/i);
    if (gpaMatch) {
      education.push({
        institution: "Education detected (IPK available)",
        degree: `GPA: ${gpaMatch[1]}`,
        year: "Not specified",
      });
    }
  }

  return education.slice(0, 3);
}

function extractSummary(text: string): string | null {
  const summaryPatterns = [
    /(?:summary|profile|about me|tentang saya|ringkasan|deskripsi diri|professional summary)[\s:]*\s*([A-Za-z0-9\s.,!?-]{50,300})/gi,
  ];

  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const lines = text.split("\n").filter((line) => line.trim().length > 50);
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    if (cleaned.length > 50 && cleaned.length < 300) {
      if (!cleaned.includes("@") && !cleaned.match(/\d{5,}/)) {
        return cleaned;
      }
    }
  }

  return null;
}
