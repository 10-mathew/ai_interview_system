"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { getInterviewById } from "@/lib/actions/general.action";
import { saveInterviewData } from "@/lib/actions/interview.action";
import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

const InterviewPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [selectedOption, setSelectedOption] = useState<"immediate" | "call" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [position, setPosition] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user from Firebase Auth
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("No authenticated user found");
          setError("Please sign in to start the interview");
          setLoading(false);
          return;
        }

        setUserId(currentUser.uid);

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

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        setError("Please sign in to start the interview");
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
            userId: userId,
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
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to initiate call");
        }

        // Show calling message for 5 seconds
        setTimeout(() => {
          setIsCalling(false);
          setShowPhoneInput(false);
          setPhoneNumber("");
        }, 5000);
      } catch (error) {
        setCallError(
          error instanceof Error ? error.message : "Failed to initiate call"
        );
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
        <button 
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (isCalling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Calling you...</h2>
          <p className="text-gray-600">
            Please wait while we connect your call.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedOption) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-8">Choose Interview Type</h1>
        {!showPhoneInput ? (
          <div className="space-y-4 w-full max-w-md">
            <button
              onClick={() => handleOptionSelect("immediate")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Start Immediate Interview
            </button>
            <button
              onClick={() => handleOptionSelect("call")}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Call Me for Interview
            </button>
          </div>
        ) : (
          <form
            onSubmit={handlePhoneSubmit}
            className="w-full max-w-md space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Enter your phone number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {callError && (
                <p className="text-red-500 text-sm mt-1">{callError}</p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowPhoneInput(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={isCalling}
              >
                {isCalling ? "Calling..." : "Request Call"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (selectedOption === "immediate") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Agent
          userName={userName}
          userId={userId}
          interviewId={resolvedParams.id}
          type="interview"
          position={position}
        />
      </div>
    );
  }

  return (
    <Agent
      userName={userName}
      userId={userId}
      interviewId={resolvedParams.id}
      type={selectedOption === "immediate" ? "interview" : "call"}
      phoneNumber={selectedOption === "call" ? phoneNumber : undefined}
      position={position}
    />
  );
};

export default InterviewPage;
