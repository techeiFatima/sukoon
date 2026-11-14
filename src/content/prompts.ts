export const DAILY_QUESTIONS = [
  "What has been occupying your mind lately?",
  "What are you giving too much attention to?",
  "What have you been avoiding?",
  "What are you grateful for today?",
  "Are your actions reflecting your values?",
  "What would make today feel well spent?",
  "What do you keep reaching for when you feel restless?",
  "Who would you like to be more present with?",
  "What is something you understand better than you did a month ago?",
  "What are you carrying that isn't yours to carry?",
  "When did you last feel truly unhurried?",
  "What small thing went well recently that you didn't pause to notice?",
];

export const JOURNAL_PROMPTS = [
  "What did I do today that aligned with my values?",
  "Where did I act impulsively?",
  "What am I grateful for?",
  "What do I need to improve?",
  "What do I need to let go of?",
];

export const INTENTION_EXAMPLES_GENERAL = [
  "Learn something deeply",
  "Be more patient",
  "Protect my attention",
  "Spend meaningful time with family",
  "Do one thing with full care",
];
export const INTENTION_EXAMPLES_ISLAMIC = [
  "Learn something deeply",
  "Be more patient",
  "Protect my attention",
  "Strengthen my relationship with Allah",
  "Spend meaningful time with family",
];

export const COMMITMENT_SUGGESTIONS = [
  "Attend lectures",
  "Study for 45 minutes, phone in another room",
  "Spend time outside",
  "Contact family",
  "Read before bed instead of scrolling",
];
export const COMMITMENT_SUGGESTIONS_ISLAMIC = ["Read Qur'an with understanding", ...COMMITMENT_SUGGESTIONS];

export const ATTENTION_CATEGORIES = [
  { id: "learning", label: "Learning", color: "#233F35" },
  { id: "work", label: "Work", color: "#4E6B5C" },
  { id: "relationships", label: "Relationships", color: "#7E9A7A" },
  { id: "spirituality", label: "Spirituality", color: "#A5B5A0" },
  { id: "creativity", label: "Creativity", color: "#B9A27E" },
  { id: "entertainment", label: "Entertainment", color: "#CDBF9F" },
  { id: "social_media", label: "Social media", color: "#B08A72" },
  { id: "comparison", label: "Comparison", color: "#9A5B45" },
  { id: "worry", label: "Worry", color: "#6E6259" },
  { id: "other", label: "Other", color: "#A4A69E" },
] as const;

export const DIET_DEFAULTS = {
  more: ["Mathematics", "Qur'an", "Philosophy", "History", "Nature", "Creativity"],
  less: ["Appearance comparisons", "Celebrity gossip", "Endless scrolling", "Unnecessary controversy", "Lifestyle comparisons"],
};

export const BOUNDARY_SUGGESTIONS = [
  { title: "A quiet first hour", description: "No social media during the first hour after waking." },
  { title: "Focused study", description: "No unnecessary browsing while studying." },
  { title: "Dedicated reading time", description: "Twenty minutes with a book, every day." },
  { title: "An offline afternoon", description: "One afternoon a week, fully offline." },
];

export const VALUE_SUGGESTIONS = [
  "Faith", "Knowledge", "Family", "Service", "Independence", "Creativity", "Honesty", "Compassion",
  "Patience", "Courage", "Health", "Justice", "Friendship", "Gratitude", "Excellence", "Humility",
];

export const OFFLINE_IDEAS = [
  "Call someone you love",
  "Visit a library",
  "Take a walk in nature",
  "Volunteer for an hour",
  "Learn something with a friend",
  "Make something with your hands",
  "Cook a meal for someone",
  "Sit somewhere beautiful without your phone",
];
export const OFFLINE_IDEAS_ISLAMIC = ["Spend unhurried time in prayer and reflection", "Visit the masjid between prayers", ...OFFLINE_IDEAS];

export const GOAL_AREAS = [
  { id: "spiritual", label: "Spiritual" },
  { id: "intellectual", label: "Intellectual" },
  { id: "personal", label: "Personal" },
  { id: "professional", label: "Professional" },
  { id: "social", label: "Social" },
  { id: "financial", label: "Financial" },
] as const;
