"use client";

import type { ParsedCV } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Briefcase, GraduationCap, FileText, Code } from "lucide-react";

interface ParsedCVDisplayProps {
  cv: ParsedCV | null;
}

export function ParsedCVDisplay({ cv }: ParsedCVDisplayProps) {
  if (!cv) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Upload a CV to see parsed results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 border-b">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cv.fullName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{cv.fullName}</span>
              </div>
            )}
            {cv.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{cv.email}</span>
              </div>
            )}
            {cv.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{cv.phone}</span>
              </div>
            )}
            {!cv.fullName && !cv.email && !cv.phone && (
              <p className="text-sm text-muted-foreground">No basic information found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cv.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {cv.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills detected</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cv.experience.length > 0 ? (
              <div className="space-y-3">
                {cv.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-3">
                    <p className="text-sm font-medium">{exp.position}</p>
                    <p className="text-xs text-muted-foreground">{exp.company}</p>
                    {exp.duration && (
                      <p className="text-xs text-muted-foreground">{exp.duration}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No experience data found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cv.education.length > 0 ? (
              <div className="space-y-3">
                {cv.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-3">
                    <p className="text-sm font-medium">{edu.degree}</p>
                    <p className="text-xs text-muted-foreground">{edu.institution}</p>
                    {edu.year && (
                      <p className="text-xs text-muted-foreground">{edu.year}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No education data found</p>
            )}
          </CardContent>
        </Card>

        {cv.summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{cv.summary}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="py-2 flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">Raw Parsed Text</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Full CV Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
              {cv.rawText}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
