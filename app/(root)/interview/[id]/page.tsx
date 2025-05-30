"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getInterviewById } from "@/lib/actions/general.action";
import { saveInterviewData } from "@/lib/actions/interview.action";

const InterviewPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [selectedOption, setSelectedOption] = useState<"immediate" | "call" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [position, setPosition] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user name from localStorage
        const storedName = localStorage.getItem(`interview_user_name_${resolvedParams.id}`);
        if (storedName) {
          setUserName(storedName);
        } else {
          console.error("No user name found in localStorage");
          setError("Please start over and enter your name");
          setLoading(false);
          return;
        }

        // Get position from localStorage
        const storedPosition = localStorage.getItem(`interview_position_${resolvedParams.id}`);
        const storedPositionDesc = localStorage.getItem(`interview_position_desc_${resolvedParams.id}`);
        const cvContent = localStorage.getItem(`interview_cv_${resolvedParams.id}`);

        if (storedPosition) {
          setPosition(storedPosition);
        } else {
          // Fallback to getting from interview data
          try {
            const interview = await getInterviewById(resolvedParams.id);
            if (interview) {
              setPosition(interview.role);
            }
          } catch (error) {
            console.error("Error fetching interview:", error);
            setError("Failed to load interview data");
            setLoading(false);
            return;
          }
        }

        // Save to Firebase if we have the data
        if (storedName && (storedPosition || position)) {
          const { success } = await saveInterviewData({
            interviewId: resolvedParams.id,
            userName: storedName,
            position: storedPosition || position,
            positionDescription: storedPositionDesc || undefined,
            cvContent: cvContent || undefined
          });

          if (!success) {
            console.error("Failed to save interview data to Firebase");
            setError("Failed to save interview data");
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("An error occurred while loading the interview");
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, position]);

  const handleOptionSelect = (option: "immediate" | "call") => {
    if (option === "call") {
      setShowPhoneInput(true);
    } else {
      setSelectedOption(option);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      try {
        setIsCalling(true);
        setCallError(null);

        // Get CV content from localStorage
        const cvContent = typeof window !== "undefined" 
          ? localStorage.getItem(`interview_cv_${resolvedParams.id}`) 
          : null;

        // Ensure phone number is in E.164 format
        const formattedNumber = phoneNumber.startsWith("+")
          ? phoneNumber
          : `+${phoneNumber}`;

        const response = await fetch("/api/call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: formattedNumber,
            userName: userName,
            interviewId: resolvedParams.id,
            position: position,
            cvContent: cvContent,
            type: "outboundPhoneCall",
            assistant: {
              name: "Interview Assistant",
              firstMessage: `Hello ${userName}! I'm your AI interviewer for the ${position} position. Are you ready to begin the interview?`,
              voice: {
                provider: "azure",
                voiceId: "andrew",
              },
              model: {
                provider: "anthropic",
                model: "claude-3-opus-20240229",
                messages: [
                  {
                    role: "system",
                    content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Candidate Information:
- Name: ${userName}
- Position: ${position}

${cvContent ? `CANDIDATE'S CV
==================
${cvContent}
==================

Please use this CV/resume information to:
1. Ask relevant questions about their experience and skills
2. Probe deeper into specific projects or achievements mentioned
3. Assess how their background aligns with the ${position} position
4. Identify areas where they might need to elaborate or provide more detail

Remember to:
- Start by acknowledging their name and the position they're interviewing for
- Reference specific details from their CV when asking questions
- Keep the conversation natural and flowing
- Listen actively to responses and ask relevant follow-up questions
- Be thorough in your assessment while maintaining a professional and friendly tone

` : ''}

Interview Guidelines:
- Be professional and polite
- Keep responses concise and conversational
- Ask follow-up questions when needed
- Focus on both technical skills and soft skills
- End the interview professionally with next steps

Remember to:
- Listen actively to responses
- Acknowledge answers before moving forward
- Keep the conversation flowing naturally
- Be thorough in your assessment`
                  }
                ]
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error("Failed to initiate call");
        }

        const data = await response.json();
        if (data.success) {
          setSelectedOption("call");
        } else {
          throw new Error(data.error || "Failed to initiate call");
        }
      } catch (err) {
        console.error("Error initiating call:", err);
        setCallError(err instanceof Error ? err.message : "Failed to initiate call");
      } finally {
        setIsCalling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading interview...</p>
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

  if (selectedOption) {
    return (
      <Agent
        userName={userName}
        interviewId={resolvedParams.id}
        type={selectedOption}
        phoneNumber={phoneNumber}
        position={position}
      />
    );
  }

  return (
    <section className="section-interview">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Start Your Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          <div className="flex flex-row gap-2">
            <p>
              Position:{" "}
              <span className="text-primary-200 font-bold capitalize">
                {position}
              </span>
            </p>
          </div>
        </div>
      </div>

      <hr />

      <div className="options">
        <button
          className="option"
          onClick={() => handleOptionSelect("immediate")}
        >
          <div className="option-content">
            <Image
              src="/immediate.svg"
              width={24}
              height={24}
              alt="immediate"
            />
            <p>Start Interview Now</p>
          </div>
        </button>

        <button
          className="option"
          onClick={() => handleOptionSelect("call")}
        >
          <div className="option-content">
            <Image
              src="/call.svg"
              width={24}
              height={24}
              alt="call"
            />
            <p>Receive a Call</p>
          </div>
        </button>
      </div>

      {showPhoneInput && (
        <form onSubmit={handlePhoneSubmit} className="phone-form">
          <div className="input-group">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number (e.g., +1234567890)"
              required
              className="input"
            />
            <button
              type="submit"
              disabled={isCalling}
              className="btn-primary"
            >
              {isCalling ? "Calling..." : "Start Call"}
            </button>
          </div>
          {callError && (
            <p className="text-red-500 mt-2">{callError}</p>
          )}
        </form>
      )}
    </section>
  );
};

export default InterviewPage;
