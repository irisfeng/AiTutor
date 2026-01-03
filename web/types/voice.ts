export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  audioData?: ArrayBuffer;
  timestamp: number;
}

export interface ConversationTurn {
  id: string;
  timestamp: number;
  userMessage?: string;
  aiResponse?: string;
}

export type ConversationRole = "user" | "assistant";

export interface StepFunRealtimeConfig {
  apiKey: string;
  wsUrl: string;
}

export interface StepFunEvent {
  type: string;
  data?: any;
}

export interface AudioLevel {
  level: number;
  timestamp: number;
}
