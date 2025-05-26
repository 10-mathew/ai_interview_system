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
  ];

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const nameInput = document.getElementById("name");
      const name = nameInput ? nameInput.value : "";
      if (name && interviewId) {
        localStorage.setItem(`interview_user_name_${interviewId}`, name);
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
              <Input id="name" placeholder="Enter your name" required />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="position" className="text-sm font-medium">
                Job Position
              </label>
              <Select>
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

            <div className="flex flex-col gap-2">
              <label htmlFor="cv" className="text-sm font-medium">
                Your CV
              </label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                required
              />
              <p className="text-sm text-muted-foreground">
                Upload your CV in PDF or DOC format
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
