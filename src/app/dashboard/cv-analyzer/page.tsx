"use client";

import { useState, useEffect } from "react";
import type { ParsedCV, CVAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, Plus, Trash2, Edit2, Clock, MapPin, Mail, Phone, User, Brain } from "lucide-react";
import { AnalysisResults } from "@/components/cv-analyzer/analysis-results";
import { JobFormDialog } from "@/components/cv-analyzer/job-form-dialog";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  employmentType: string;
  workModel: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CVAnalyzerTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [matches, setMatches] = useState<CVAnalysis[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  }

  async function handleDeleteJob(jobId: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    setDeletingJobId(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (response.ok) {
        setJobs(jobs.filter((j) => j.id !== jobId));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    } finally {
      setDeletingJobId(null);
    }
  }

  function handleEditJob(job: Job) {
    setEditingJob(job);
    setIsDialogOpen(true);
  }

  function handleAddJob() {
    setEditingJob(null);
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setEditingJob(null);
  }

  function handleJobSaved(savedJob: Job) {
    if (editingJob) {
      setJobs(jobs.map((j) => (j.id === savedJob.id ? savedJob : j)));
    } else {
      setJobs([savedJob, ...jobs]);
    }
    handleDialogClose();
  }

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setParsedCV(null);
    setMatches([]);
    setError(null);
    setStatusMessage("");

    setIsParsing(true);
    setStatusMessage("Parsing CV...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cv-analyzer/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to parse CV");
      }

      const parsedData = await response.json();
      setParsedCV(parsedData);
      setStatusMessage("CV parsed successfully. Click 'Analyze CV' to find matching jobs.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CV");
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleAnalyze() {
    if (!parsedCV) return;

    setError(null);
    setIsAnalyzing(true);
    setHasAnalyzed(true);
    setMatches([]);
    setStatusMessage(`Analyzing CV against ${jobs.length} jobs...`);

    try {
      const response = await fetch("/api/cv-analyzer/analyze-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: parsedCV }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze CV");
      }

      const result = await response.json();
      setMatches(result.matches || []);
      setStatusMessage(`Found ${result.matches?.length || 0} matching jobs.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze CV");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function formatEmploymentType(type: string): string {
    const map: Record<string, string> = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      CONTRACT: "Contract",
      INTERNSHIP: "Internship",
      TEMPORARY: "Temporary",
    };
    return map[type] || type;
  }

  function formatWorkModel(model: string): string {
    const map: Record<string, string> = {
      ON_SITE: "On-site",
      HYBRID: "Hybrid",
      REMOTE: "Remote",
    };
    return map[model] || model;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      handleFileSelect(file);
    }
  }

  function validateFile(file: File): boolean {
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return false;
    }
    return true;
  }

  return (
    <div className="h-full flex">
      <div className="w-80 flex-shrink-0 bg-card overflow-y-auto">
        <div className="pb-3 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Job List ({jobs.length})</CardTitle>
            <Button size="sm" onClick={handleAddJob}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        <div className="space-y-2 px-2 pb-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{job.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatEmploymentType(job.employmentType)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {formatWorkModel(job.workModel)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEditJob(job)} className="p-1 rounded hover:bg-muted" title="Edit">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1 rounded hover:bg-muted text-destructive"
                    disabled={deletingJobId === job.id}
                  >
                    {deletingJobId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "border border-dashed rounded-lg p-6 text-center transition-colors bg-muted/30",
              isParsing ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
            )}
          >
            {isParsing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Parsing CV...</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Drag and drop CV here</p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </label>
              </>
            )}
          </div>

          {selectedFile && !isParsing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={!parsedCV || isAnalyzing} className="w-full cursor-pointer">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze CV
                  </>
                )}
              </Button>
            </div>
          )}

          {statusMessage && (
            <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {parsedCV && (
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Candidate Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parsedCV.fullName && <p className="text-sm"><strong>Name:</strong> {parsedCV.fullName}</p>}
                  {parsedCV.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {parsedCV.email}
                    </p>
                  )}
                  {parsedCV.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {parsedCV.phone}
                    </p>
                  )}
                  {parsedCV.skills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {parsedCV.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Raw CV Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">
                    {parsedCV.rawText}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex-shrink-0 bg-card overflow-y-auto">
        <AnalysisResults matches={matches} isAnalyzing={isAnalyzing} hasAnalyzed={hasAnalyzed} />
      </div>

      <JobFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        job={editingJob}
        onSuccess={handleJobSaved}
      />
    </div>
  );
}
