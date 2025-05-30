"use client";

import { useEffect, useState, use } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
  timestamp: string;
}

const TranscriptPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [transcript, setTranscript] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscript = () => {
      try {
        // Get current user from Firebase Auth
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("No authenticated user found");
          setError("Please sign in to view transcript");
          setLoading(false);
          return;
        }

        // Get transcript from localStorage
        const transcriptKey = `interview_transcript_${resolvedParams.id}`;
        const storedTranscript = localStorage.getItem(transcriptKey);
        
        if (!storedTranscript) {
          console.error("Transcript not found in localStorage");
          setError("Transcript not found");
          setLoading(false);
          return;
        }

        const parsedTranscript = JSON.parse(storedTranscript) as SavedMessage[];
        setTranscript(parsedTranscript);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching transcript:", err);
        setError("Failed to load transcript");
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTranscript();
      } else {
        setError("Please sign in to view transcript");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading transcript...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!transcript.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">No transcript available</p>
        <Button onClick={() => router.push("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Interview Transcript
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          <div className="flex flex-row gap-2">
            <p>
              Date:{" "}
              {transcript[0]?.timestamp
                ? dayjs(transcript[0].timestamp).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <div className="transcript-container">
        {transcript.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === "assistant" ? "assistant" : "user"}`}
          >
            <div className="message-header">
              <span className="role">{message.role === "assistant" ? "AI Interviewer" : "You"}</span>
              <span className="timestamp">
                {dayjs(message.timestamp).format("h:mm A")}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${resolvedParams.id}/feedback`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              View Feedback
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default TranscriptPage; 