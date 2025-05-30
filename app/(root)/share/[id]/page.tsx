"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SharePage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState("");
  const [interviewLink, setInterviewLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = params.id as string;
      const storedName = localStorage.getItem(`interview_user_name_${id}`);
      const link = `${window.location.origin}/interview/${id}`;
      
      setUserName(storedName || "Candidate");
      setInterviewLink(link);
    }
  }, [params.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(interviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="card-cta max-w-2xl w-full">
        <div className="flex flex-col gap-6 w-full text-center">
          <h2 className="text-4xl font-bold">RecruitSense</h2>
          <p className="text-lg">AI-Powered Interview Practice Platform</p>

          <div className="mt-4 p-6 bg-muted rounded-lg">
            <p className="text-lg font-medium mb-4">
              Interview link for {userName}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-4 py-3 rounded flex-1 break-all">
                {interviewLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 