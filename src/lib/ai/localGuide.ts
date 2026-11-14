/**
 * The on-device reflection guide. It runs entirely in the browser and never
 * sends text anywhere. It is not a language model: it recognises a handful of
 * themes and responds with carefully written reflective questions. For goals,
 * it walks through a short structured sequence and returns a plan built from
 * the person's own words.
 */
import { asksForDiagnosis, asksForRuling, CRISIS_RESPONSE, looksLikeCrisis } from "./safety";
import type { ChatMessage, Intent } from "./types";

interface Theme { id: string; match: RegExp; questions: string[] }

const THEMES: Theme[] = [
  {
    id: "comparison",
    match: /\b(compar|jealous|envy|envious|everyone else|other people|better than me|instagram|linkedin|not enough|behind)/i,
    questions: [
      "What tends to trigger that comparison? Is there something you feel you’re missing — or has evaluating yourself through other people’s lives simply become a habit?",
      "When you compare, whose lives are you usually looking at — and are they lives you would actually want, in full?",
      "If no one could ever see your achievements, what would you still want to work toward?",
      "What would it look like to measure today against who you were yesterday, rather than against someone else?",
    ],
  },
  {
    id: "attention",
    match: /\b(phone|scroll|tiktok|youtube|reels|social media|notification|screen|distract|doomscroll|online)/i,
    questions: [
      "What are you usually feeling in the moment just before you reach for it — bored, tired, anxious, lonely?",
      "What does the scrolling give you that you might be able to find somewhere else?",
      "If you got back one hour a day, what would you genuinely want to do with it?",
      "What’s one place or time of day where it would be easiest to leave the phone out of reach?",
    ],
  },
  {
    id: "avoidance",
    match: /\b(procrastinat|avoid|putting (it )?off|lazy|can'?t start|unmotivated|keep delaying|stuck)/i,
    questions: [
      "What feels uncomfortable about starting — the task itself, or what it might say about you if it doesn’t go well?",
      "If you only had to do the first five minutes, what exactly would those five minutes be?",
      "What would you tell a close friend who was avoiding the same thing?",
    ],
  },
  {
    id: "worry",
    match: /\b(anxious|anxiety|worr|stress|overwhelm|panic|afraid|scared|pressure|exam)/i,
    questions: [
      "Of everything you’re worried about, which part is genuinely within your control this week — and which part isn’t?",
      "What would it look like to do your part fully and then let the outcome rest?",
      "When you’ve felt this way before, what helped, even a little?",
      "Is there someone you trust you could talk to about this, in person?",
    ],
  },
  {
    id: "spirit",
    match: /\b(allah|god|prayer|pray|salah|salat|deen|iman|faith|qur'?an|dua|spiritual|masjid|mosque)/i,
    questions: [
      "When have you felt closest to Allah recently — and what was different about that moment?",
      "What gets between you and the kind of worship you long for? Time, distraction, something heavier?",
      "What would one small, sincere step toward that relationship look like this week?",
    ],
  },
  {
    id: "rest",
    match: /\b(tired|exhausted|burn(ed|t)? ?out|no energy|sleep|drained)/i,
    questions: [
      "What would real rest look like for you right now — not escape, but rest?",
      "What are you carrying that you might be able to set down, or share?",
      "When did you last feel unhurried? What made that possible?",
    ],
  },
  {
    id: "relationships",
    match: /\b(family|friend|parent|mother|father|mom|dad|sibling|brother|sister|lonely|alone|relationship)/i,
    questions: [
      "What do you wish this relationship had more of — and what part of that could you offer first?",
      "When did you last feel truly present with them?",
      "Is there something you’ve been meaning to say to someone, but haven’t?",
    ],
  },
  {
    id: "learning",
    match: /\b(learn|study|studying|understand|curious|research|read|book|course|math|science|philosophy|ai\b)/i,
    questions: [
      "What first drew you to this? What question were you hoping it would answer?",
      "Where do these interests overlap? Is there one question that sits underneath all of them?",
      "What do you understand now that you didn’t a month ago? Try explaining it in one sentence.",
      "What would it look like to go deeper on one of these, rather than wider?",
    ],
  },
  {
    id: "gratitude",
    match: /\b(grateful|thankful|blessed|alhamdulillah|appreciat)/i,
    questions: [
      "What made that moment feel like a gift?",
      "Who played a part in it — and do they know they did?",
    ],
  },
];

const GENERAL = [
  "What feels most important about that to you?",
  "What do you notice about yourself when you say that?",
  "What would you like to be different — and what would stay the same?",
  "If this went well a month from now, what would have changed?",
  "What’s one small thing within your control here?",
];

const ACKS = [
  "Thank you for putting that into words.",
  "That’s worth noticing.",
  "That sounds like it matters to you.",
  "I hear you.",
  "That’s an honest thing to say.",
];

const INTENT_FOLLOWUPS: Record<Exclude<Intent, "goal">, string[]> = {
  open: GENERAL,
  pattern: [
    "When does it tend to show up — a time of day, a place, a feeling, a person?",
    "What do you think it’s trying to give you, even if it isn’t helping?",
    "What would you like to do instead, the next time you notice it beginning?",
    "What would make that alternative a little easier to choose?",
  ],
  value: [
    "What does that value look like on an ordinary day, in practice?",
    "Where in your life is it showing up well right now?",
    "Where do your actions drift furthest from it?",
    "What small change this week would bring the two a little closer?",
  ],
  learning: [
    "Where do these interests overlap? Is there one question beneath all of them?",
    "Which one, if you understood it deeply, would make the others easier to understand?",
    "What would a first step into that look like — a book, a lecture, a conversation?",
    "Consider adding it as a learning journey in Intellect. What would its objective be, in one sentence?",
  ],
  day: [
    "What did that moment ask of you?",
    "Where did you act in line with your values today?",
    "Where did you act on impulse, and what was underneath it?",
    "What do you want to carry into tomorrow — and what would you like to let go of?",
  ],
};

export interface GoalPlan { goal: string; done: string; step: string; when: string }

function pick<T>(arr: T[], n: number): T { return arr[n % arr.length]; }

/** Returns the reply text, and for goal conversations, a plan once complete. */
export function localReply(history: ChatMessage[], intent: Intent): { reply: string; plan?: GoalPlan } {
  const userTurns = history.filter((m) => m.role === "user");
  const last = userTurns.at(-1)?.content ?? "";
  const n = userTurns.length;

  if (looksLikeCrisis(last)) return { reply: CRISIS_RESPONSE };
  if (asksForRuling(last))
    return { reply: "That’s an important question, and it deserves an answer from a qualified scholar you trust — not from an app. If it helps, we could reflect on what’s behind the question for you. What’s making it feel pressing right now?" };
  if (asksForDiagnosis(last))
    return { reply: "I can’t diagnose anything — and I’d be wary of anything that tried to. A doctor, counsellor, or psychologist can really help with that question. If you’d like, we can still reflect together: what have you been noticing in yourself that made you ask?" };

  if (intent === "goal") {
    const steps = [
      "What would it look like if this went well? How would you know you’d done it?",
      "What’s one step small enough to finish in twenty minutes this week?",
      "When exactly will you do it — which day, and where?",
    ];
    if (n <= 3) return { reply: `${pick(ACKS, n)} ${steps[n - 1]}` };
    if (n === 4) {
      const [goal, done, step, when] = userTurns.slice(0, 4).map((m) => m.content.trim());
      return {
        reply: "Here’s what you’ve shaped, in your own words. You can save it to your goals — then close the app and take the first step.",
        plan: { goal, done, step, when },
      };
    }
    return { reply: pick(GENERAL, n) };
  }

  const theme = THEMES.find((t) => t.match.test(last));
  const ack = pick(ACKS, n + last.length);
  if (theme && (intent === "open" || intent === "day" || n === 1)) return { reply: `${ack} ${pick(theme.questions, n - 1)}` };
  const pool = INTENT_FOLLOWUPS[intent];
  if (n > pool.length + 1) {
    return { reply: "You’ve thought carefully about this. It might be worth writing down what you’ve noticed in your journal — or simply stepping away and letting it settle. Is there anything else you’d like to look at?" };
  }
  return { reply: `${ack} ${pick(pool, n - 1)}` };
}
