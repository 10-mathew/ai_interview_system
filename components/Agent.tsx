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
      if (!interviewId || !userId) {
        console.error("Missing required IDs for feedback generation");
        return;
      }

      try {
        const { success, feedbackId: id } = await createFeedback({
          interviewId,
          userId,
          transcript: messages,
          feedbackId,
        });

        if (success && id) {
          router.push(`/interview/${interviewId}/feedback`);
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
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    try {
      setError("");
      setCallStatus(CallStatus.CONNECTING);

      if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
        throw new Error("VAPI token is not configured");
      }

      const vapiInstance = vapi as unknown as VapiInstance;
      
      const handleMessage = (message: Message) => {
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
        setCallStatus(CallStatus.COMPLETED);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("callEnded", handleCallEnded);
        vapiInstance.off("error", handleError);
      };

      const handleError = (error: Error) => {
        setError(error.message);
        setCallStatus(CallStatus.COMPLETED);
        vapiInstance.off("message", handleMessage);
        vapiInstance.off("callEnded", handleCallEnded);
        vapiInstance.off("error", handleError);
      };

      vapiInstance.on("message", handleMessage);
      vapiInstance.on("callEnded", handleCallEnded);
      vapiInstance.on("error", handleError);

      const assistantConfig: CreateAssistantDTO = {
        name: "Interview Assistant",
        firstMessage: `Hello ${userName}! I'm your AI interviewer for the ${position} position. Are you ready to begin the interview?`,
        voice: {
          provider: "azure",
          voiceId: "andrew",
        },
        model: {
          provider: "anthropic",
          model: "claude-3-opus-20240229",
        },
      };

      await vapiInstance.start(assistantConfig);
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
