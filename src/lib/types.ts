// Shared data model. Field names match the Postgres schema in
// supabase/migrations so Local Mode and Cloud Mode are interchangeable.

export type Experience = "islamic" | "general";
export type Tradition = "unspecified" | "sunni" | "shia" | "both";
export type AiMode = "off" | "local" | "cloud";

export interface Profile {
  id: string;
  display_name: string | null;
  experience: Experience;
  tradition: Tradition;
  motivations: string[];
  change_note: string | null;
  ai_mode: AiMode;
  ai_consent_at: string | null;
  onboarded_at: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Row {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Checkable {
  id: string;
  title: string;
  done: boolean;
}

export interface DailyIntention extends Row {
  date: string;
  text: string;
}

export type ReflectionKind = "daily" | "journal" | "soul" | "learning";
export interface Reflection extends Row {
  kind: ReflectionKind;
  date: string;
  prompt: string | null;
  body: string;
  /** Topic slug (soul) or learning journey id (learning). */
  context: string | null;
}

export interface AttentionCheckin extends Row {
  date: string;
  categories: string[];
  note: string | null;
}

export interface PersonalValue extends Row {
  name: string;
  meaning: string | null;
  position: number;
}

export interface Commitment extends Row {
  date: string;
  title: string;
  done: boolean;
  done_at: string | null;
}

export type JourneyStatus = "active" | "paused" | "complete";
export interface LearningJourney extends Row {
  title: string;
  objective: string | null;
  current_understanding: string | null;
  topics: Checkable[];
  status: JourneyStatus;
}

export interface KnowledgeNote extends Row {
  title: string;
  body: string | null;
  tags: string[];
  collection: string | null;
  journey_id: string | null;
}

export interface KnowledgeConnection extends Row {
  from_note_id: string;
  to_note_id: string;
  label: string | null;
}

export type ResourceKind = "book" | "article" | "lecture" | "paper" | "video" | "quote";
export type ResourceStatus = "to_explore" | "in_progress" | "finished";
export interface SavedResource extends Row {
  kind: ResourceKind;
  title: string;
  author: string | null;
  url: string | null;
  note: string | null;
  collection: string | null;
  status: ResourceStatus;
  journey_id: string | null;
}

export type GoalArea = "spiritual" | "intellectual" | "personal" | "professional" | "social" | "financial";
export interface PersonalGoal extends Row {
  area: GoalArea;
  title: string;
  why: string | null;
  steps: Checkable[];
  status: "active" | "complete" | "released";
}

export interface DietItem extends Row {
  direction: "more" | "less";
  label: string;
}

export interface Boundary extends Row {
  title: string;
  description: string | null;
  active: boolean;
}

export interface FocusSession extends Row {
  boundary_id: string | null;
  intention: string | null;
  planned_minutes: number;
  actual_minutes: number;
  reflection: string | null;
}

export interface OfflineAction extends Row {
  title: string;
  date: string;
  note: string | null;
}

export interface AlignmentReflection extends Row {
  value_id: string;
  current_behavior: string | null;
  small_change: string | null;
}

export interface TableMap {
  daily_intentions: DailyIntention;
  reflections: Reflection;
  attention_checkins: AttentionCheckin;
  personal_values: PersonalValue;
  commitments: Commitment;
  learning_journeys: LearningJourney;
  knowledge_notes: KnowledgeNote;
  knowledge_connections: KnowledgeConnection;
  saved_resources: SavedResource;
  personal_goals: PersonalGoal;
  diet_items: DietItem;
  boundaries: Boundary;
  focus_sessions: FocusSession;
  offline_actions: OfflineAction;
  alignment_reflections: AlignmentReflection;
}

export type TableName = keyof TableMap;
export const TABLES = [
  "daily_intentions",
  "reflections",
  "attention_checkins",
  "personal_values",
  "commitments",
  "learning_journeys",
  "knowledge_notes",
  "knowledge_connections",
  "saved_resources",
  "personal_goals",
  "diet_items",
  "boundaries",
  "focus_sessions",
  "offline_actions",
  "alignment_reflections",
] as const satisfies readonly TableName[];

/** Fields the caller supplies; ids, ownership and timestamps are managed by the store. */
export type NewRow<T> = Omit<T, "id" | "user_id" | "created_at" | "updated_at">;
