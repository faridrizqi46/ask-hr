export interface Job {
  id: string;
  title: string;
  employmentType: string;
  workModel: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedCV {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  summary: string | null;
  rawText: string;
}

export interface CVAnalysis {
  matchPercentage: number;
  matchedJob: {
    id: string;
    title: string;
    department: string;
  };
  reasoning: string;
  missingSkills: string[];
  candidateStrengths: string[];
  summary: string;
}
