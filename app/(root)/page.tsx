"use client";

import Link from "next/link";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [interviewId, setInterviewId] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  useEffect(() => {
    setInterviewId(uuidv4());
  }, []);

  // Job positions
  const jobPositions = [
    "Java Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "Software Architect",
    "Other", // Add 'Other' option
  ];

  const [customPosition, setCustomPosition] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create a FormData object to send the file to our API
      const formData = new FormData();
      formData.append('file', file);

      // Send the file to our API endpoint for processing
      const response = await fetch('/api/process-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process CV file');
      }

      const { text } = await response.json();
      
      if (interviewId) {
        localStorage.setItem(`interview_cv_${interviewId}`, text);
      }
    } catch (error) {
      console.error("Error processing CV file:", error);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      let positionToSave = selectedPosition;
      if (selectedPosition === "Other" && customPosition) {
        positionToSave = customPosition;
      }
      if (userName && interviewId) {
        localStorage.setItem(`interview_user_name_${interviewId}`, userName);
        localStorage.setItem(
          `interview_position_${interviewId}`,
          positionToSave
        );
        if (selectedPosition === "Other" && customDescription) {
          localStorage.setItem(
            `interview_position_desc_${interviewId}`,
            customDescription
          );
        }
      }
      const interviewLink = `${window.location.origin}/interview/${interviewId}`;
      navigator.clipboard.writeText(interviewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="card-cta max-w-2xl w-full">
        <div className="flex flex-col gap-6 w-full text-center">
          <h2 className="text-4xl font-bold">RecruitSense</h2>
          <p className="text-lg">AI-Powered Interview Practice Platform</p>

          <form className="flex flex-col gap-4 w-full max-w-md mx-auto">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <Input 
                id="name" 
                placeholder="Enter your name" 
                required 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="position" className="text-sm font-medium">
                Job Position
              </label>
              <Select onValueChange={setSelectedPosition} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {jobPositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show custom input fields if 'Other' is selected */}
            {selectedPosition === "Other" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="customPosition" className="text-sm font-medium">
                  Enter Job Title
                </label>
                <Input
                  id="customPosition"
                  placeholder="Enter job title"
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  required
                />
                <label
                  htmlFor="customDescription"
                  className="text-sm font-medium"
                >
                  Enter Job Description
                </label>
                <Input
                  id="customDescription"
                  placeholder="Enter job description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="cv" className="text-sm font-medium">
                Your CV
              </label>
              <Input
                id="cv"
                type="file"
                accept=".txt"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                required
                onChange={handleCVUpload}
              />
              <p className="text-sm text-muted-foreground">
                Upload your CV in TXT format
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <Button onClick={handleCopyLink} className="btn-primary w-full">
                {copied ? "Link Copied!" : "Create Interview Link"}
              </Button>
              {interviewId && (
                <div className="text-sm text-muted-foreground break-all">
                  {`${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }/interview/${interviewId}`}
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
