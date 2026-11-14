export type Role = "user" | "assistant";
export interface ChatMessage { role: Role; content: string }

export type Intent = "open" | "pattern" | "value" | "goal" | "learning" | "day";

export const INTENTS: { id: Intent; label: string; opener: string }[] = [
  { id: "pattern", label: "Examine a recurring pattern", opener: "What’s a thought or habit that keeps coming back — one you’d like to understand better?" },
  { id: "value", label: "Explore a value", opener: "Which value has been on your mind lately? What made you think of it?" },
  { id: "goal", label: "Turn a vague goal into steps", opener: "What’s the goal, in a single sentence? It’s fine if it’s still vague." },
  { id: "learning", label: "Connect my learning", opener: "What are you learning or curious about right now? Name a few things, even if they seem unrelated." },
  { id: "day", label: "Reflect on my day", opener: "Looking back on today, what moment stays with you — for better or worse?" },
  { id: "open", label: "Something else", opener: "What’s on your mind? Take your time." },
];

export const LIMITS = { maxMessages: 40, maxChars: 4000 };
