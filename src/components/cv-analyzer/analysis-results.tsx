"use client";

import { useState } from "react";
import type { CVAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Brain, ChevronLeft, ChevronRight } from "lucide-react";

interface AnalysisResultsProps {
  matches: CVAnalysis[];
  isAnalyzing: boolean;
  hasAnalyzed?: boolean;
}

export function AnalysisResults({ matches, isAnalyzing, hasAnalyzed = false }: AnalysisResultsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing CV...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    if (hasAnalyzed) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <Card className="p-6 text-center max-w-sm">
            <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Currently, there are no job openings that match the skills and experience listed in the uploaded CV.
            </p>
          </Card>
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs">
          <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-1">
            No analysis available
          </p>
          <p className="text-xs text-muted-foreground">
            Upload a CV to see AI-powered insights
          </p>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  const matchColor =
    currentMatch.matchPercentage >= 70
      ? "text-green-600"
      : currentMatch.matchPercentage >= 40
      ? "text-yellow-600"
      : "text-red-600";

  function handlePrevious() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={matches.length <= 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <span className="text-sm font-medium">
            Rank {currentIndex + 1} of {matches.length}
          </span>
          {matches.length === 3 && (
            <div className="flex gap-1 justify-center mt-1">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={matches.length <= 1}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${matchColor}`}>
                {currentMatch.matchPercentage}%
              </div>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      currentMatch.matchPercentage >= 70
                        ? "bg-green-500"
                        : currentMatch.matchPercentage >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${currentMatch.matchPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentMatch.matchPercentage >= 70
                    ? "Strong match"
                    : currentMatch.matchPercentage >= 40
                    ? "Moderate match"
                    : "Low match"}
                </p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-muted rounded">
              <p className="text-xs font-medium">Matching with:</p>
              <p className="text-sm">{currentMatch.matchedJob.title}</p>
              <p className="text-xs text-muted-foreground">
                {currentMatch.matchedJob.department}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{currentMatch.reasoning}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentMatch.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {currentMatch.missingSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No significant missing skills
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Candidate Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentMatch.candidateStrengths.length > 0 ? (
              <ul className="space-y-1">
                {currentMatch.candidateStrengths.map((strength, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No significant strengths identified
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{currentMatch.summary}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
