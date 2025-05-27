import type { CreateAssistantDTO, Call } from "@vapi-ai/web/dist/api";

export interface Message {
  type: "transcript" | "function-call" | "function-call-result" | "add-message";
  role: "user" | "system" | "assistant";
  transcriptType?: "partial" | "final";
  transcript?: string;
}

export interface VapiInstance {
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  start: (config: CreateAssistantDTO) => Promise<Call | null>;
  stop: () => void;
}

declare global {
  interface Window {
    process: {
      env: {
        NEXT_PUBLIC_VAPI_WEB_TOKEN?: string;
      };
    };
  }
}
