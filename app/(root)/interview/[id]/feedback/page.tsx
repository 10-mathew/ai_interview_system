"use client";

import { useEffect, useState, use } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";
import { getInterviewData } from "@/lib/actions/interview.action";
import { Button } from "@/components/ui/button";

const Feedback = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [feedback, setFeedback] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const downloadFeedback = () => {
    if (!feedback || !interview) return;

    const content = `Interview Feedback - ${interview.position} Position
Date: ${dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")}
Overall Score: ${feedback.totalScore}/100

Final Assessment:
${feedback.finalAssessment}

Breakdown of the Interview:
${feedback.categoryScores?.map((category: any, index: number) => 
  `${index + 1}. ${category.name} (${category.score}/100)
   ${category.comment}`
).join('\n\n')}

Strengths:
${feedback.strengths?.map((strength: string) => `- ${strength}`).join('\n')}

Areas for Improvement:
${feedback.areasForImprovement?.map((area: string) => `- ${area}`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-feedback-${resolvedParams.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadTranscript = () => {
    const transcriptKey = `interview_transcript_${resolvedParams.id}`;
    const storedTranscript = localStorage.getItem(transcriptKey);
    
    if (!storedTranscript) {
      console.error("Transcript not found in localStorage");
      return;
    }

    const transcript = JSON.parse(storedTranscript);
    const content = `Interview Transcript - ${interview.position} Position
Date: ${dayjs(transcript[0]?.timestamp).format("MMM D, YYYY h:mm A")}

${transcript.map((message: any) => 
  `${message.role === "assistant" ? "AI Interviewer" : "You"} (${dayjs(message.timestamp).format("h:mm A")}):
${message.content}`
).join('\n\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${resolvedParams.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get interview data
        const interviewData = await getInterviewData(resolvedParams.id);
        if (!interviewData) {
          console.error("Interview not found");
          setError("Interview not found");
          return;
        }
        setInterview(interviewData);

        // Get feedback data
        const feedbackData = await getFeedbackByInterviewId({
          interviewId: resolvedParams.id,
          userId: "anonymous", // Use anonymous user ID
        });
        if (!feedbackData) {
          console.error("Feedback not found");
          setError("Feedback not found");
          return;
        }
        setFeedback(feedbackData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading feedback...</p>
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

  if (!feedback || !interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">No feedback available</p>
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
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.position}</span> Position
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback.categoryScores?.map((category: any, index: number) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback.strengths?.map((strength: string, index: number) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback.areasForImprovement?.map((area: string, index: number) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1" onClick={downloadFeedback}>
          <p className="text-sm font-semibold text-black text-center">
            Download Feedback
          </p>
        </Button>

        <Button className="btn-primary flex-1" onClick={downloadTranscript}>
          <p className="text-sm font-semibold text-black text-center">
            Download Transcript
          </p>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
