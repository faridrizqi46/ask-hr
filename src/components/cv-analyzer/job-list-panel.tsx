"use client";

import { useState, useEffect } from "react";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Briefcase, Loader2, MapPin, Clock } from "lucide-react";
import { JobFormDialog } from "./job-form-dialog";

interface JobListPanelProps {
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
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

export function JobListPanel({ selectedJobId, onSelectJob }: JobListPanelProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteJob(jobId: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    setDeletingJobId(jobId);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setJobs(jobs.filter((j) => j.id !== jobId));
        if (selectedJobId === jobId) {
          onSelectJob("");
        }
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-r">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Job List</CardTitle>
          <Button size="sm" onClick={handleAddJob}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {jobs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No jobs available</p>
            <p className="text-xs">Click &quot;Add&quot; to create a new job</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedJobId === job.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
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
                  <div
                    className="flex gap-1 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEditJob(job)}
                      className="p-1 rounded hover:bg-muted"
                      title="Edit job"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-1 rounded hover:bg-muted text-destructive"
                      title="Delete job"
                      disabled={deletingJobId === job.id}
                    >
                      {deletingJobId === job.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <JobFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        job={editingJob}
        onSuccess={handleJobSaved}
      />
    </div>
  );
}
