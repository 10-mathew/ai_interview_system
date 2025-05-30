"use client";

import React from "react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import type { Message, VapiInstance } from "@/types/vapi";
import type { CreateAssistantDTO, Call } from "@vapi-ai/web/dist/api";
import { saveInterviewData, getInterviewData } from "@/lib/actions/interview.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
  COMPLETED = "COMPLETED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
  timestamp: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview" | "call";
  questions?: string[];
  phoneNumber?: string;
  position?: string;
}

const Agent: React.FC<AgentProps> = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  phoneNumber,
  position,
}) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string>("");

  // Helper function to store transcript
  const storeTranscript = (messages: SavedMessage[], id: string) => {
    if (typeof window !== "undefined") {
      const transcriptKey = `interview_transcript_${id}`;
      localStorage.setItem(transcriptKey, JSON.stringify(messages));
    }
  };

  // Derived state for last message
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "";

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setError(""); // Clear any previous errors
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final" && message.transcript) {
        const newMessage: SavedMessage = { 
          role: message.role, 
          content: message.transcript,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("VAPI Error:", error);
      setError(error.message);
      setCallStatus(CallStatus.ERROR);
    };

    // Register event listeners
    const eventHandlers = {
      "call-start": onCallStart,
      "call-end": onCallEnd,
      "message": onMessage,
      "speech-start": onSpeechStart,
      "speech-end": onSpeechEnd,
      "error": onError,
    };

    // Attach all event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      (vapi as unknown as VapiInstance).on(event, handler);
    });

    // Cleanup function
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        (vapi as unknown as VapiInstance).off(event, handler);
      });
    };
  }, []);

  useEffect(() => {
    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if (!interviewId) {
        console.error("Missing required IDs for feedback generation");
        return;
      }

      // Type guard to ensure interviewId is a string
      const id = interviewId;
      if (typeof id !== "string") {
        console.error("Invalid interview ID");
        return;
      }

      try {
        // Store transcript in localStorage
        if (typeof window !== "undefined") {
          const transcriptKey = `interview_transcript_${id}`;
          localStorage.setItem(transcriptKey, JSON.stringify(messages));
          console.log("Transcript saved to localStorage:", transcriptKey);
        }

        const { success, feedbackId: newFeedbackId } = await createFeedback({
          interviewId: id,
          userId: id, // Use interview ID as user ID when userId is not provided
          transcript: messages,
          feedbackId: feedbackId || undefined,
        });

        if (success && newFeedbackId) {
          router.push(`/interview/${id}/feedback`);
        } else {
          throw new Error("Failed to save feedback");
        }
      } catch (err) {
        console.error("Error saving feedback:", err);
        setError(err instanceof Error ? err.message : "Failed to save feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type]);

  const handleCall = async () => {
    try {
      setError("");
      setCallStatus(CallStatus.CONNECTING);

      // Get data from Firebase instead of localStorage
      const interviewData = await getInterviewData(interviewId);
      
      if (!interviewData) {
        throw new Error("Interview data not found. Please start over.");
      }

      const { userName: storedUserName, position: storedPosition, 
              positionDescription: storedPositionDesc, cvContent } = interviewData;

      if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
        throw new Error("VAPI token is not configured. Please check your environment variables.");
      }

      const vapiInstance = vapi as unknown as VapiInstance;
      
      // Ensure we have the user's name
      if (!storedUserName && !userName) {
        throw new Error("User name not found. Please start over and enter your name.");
      }

      console.log("Starting interview with:", {
        userName: storedUserName || userName,
        position: storedPosition || position,
        hasPositionDesc: !!storedPositionDesc,
        hasCV: !!cvContent,
        interviewId
      });

      const handleMessage = (message: Message) => {
        console.log("Received message:", message);
        if (message.role === "assistant" && message.transcript) {
          const savedMessage: SavedMessage = {
            role: message.role,
            content: message.transcript,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, savedMessage]);
        }
      };

      const handleCallEnded = () => {
        console.log("Call ended");
        setCallStatus(CallStatus.COMPLETED);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("callEnded", handleCallEnded);
        vapiInstance.off("error", handleError);
      };

      const handleError = (error: Error) => {
        console.error("Vapi error:", error);
        setError(error.message);
        setCallStatus(CallStatus.COMPLETED);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("callEnded", handleCallEnded);
        vapiInstance.off("error", handleError);
      };

      vapiInstance.on("message", handleMessage);
      vapiInstance.on("callEnded", handleCallEnded);
      vapiInstance.on("error", handleError);

      const finalUserName = storedUserName || userName;
      const finalPosition = storedPosition || position;

      if (!finalUserName) {
        throw new Error("User name is required to start the interview");
      }

      const assistantConfig: CreateAssistantDTO = {
        name: "Interview Assistant",
        firstMessage: `Hello ${finalUserName}! I'm your AI interviewer for the ${finalPosition} position. Are you ready to begin the interview?`,
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
- Name: ${finalUserName}
- Position: ${finalPosition}
${storedPositionDesc ? `- Position Description: ${storedPositionDesc}\n` : ''}

${cvContent ? `CANDIDATE'S CV
==================
${cvContent}
==================

Please use this CV/resume information to:
1. Ask relevant questions about their experience and skills
2. Probe deeper into specific projects or achievements mentioned
3. Assess how their background aligns with the ${finalPosition} position
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
        },
      };

      console.log("Starting Vapi with config:", assistantConfig);
      await vapiInstance.start(assistantConfig);
      console.log("Vapi started successfully");
    } catch (err) {
      console.error("Error starting interview:", err);
      setError(err instanceof Error ? err.message : "Failed to start interview");
      setCallStatus(CallStatus.COMPLETED);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    (vapi as unknown as VapiInstance).stop();
  };

  return (
    <React.Fragment>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
          {type === "call" && (
            <p className="text-sm text-gray-500 mt-2">
              You will receive a call shortly...
            </p>
          )}
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-center mt-4">
          {error}
        </div>
      )}

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button 
            className="relative btn-call" 
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span className="absolute inset-0 flex items-center justify-center">
              {type === "call" ? "Request Call" : "Start Interview"}
            </span>
          </button>
        ) : (
          <button 
            className="relative btn-disconnect" 
            onClick={handleDisconnect}
          >
            <span className="absolute inset-0 flex items-center justify-center">
              End Interview
            </span>
          </button>
        )}
      </div>
    </React.Fragment>
  );
};

export default Agent;
