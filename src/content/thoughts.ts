/**
 * Thought of the day. Each entry is a real, attributable quotation.
 * Where wording depends on translation, that is stated. Quotes commonly
 * misattributed online (e.g. many "Rumi" quotes) are deliberately excluded.
 */
export interface Thought {
  text: string;
  author: string;
  source: string;
  kind: "quran" | "hadith" | "philosophy" | "literature";
  arabic?: string;
}

export const THOUGHTS_GENERAL: Thought[] = [
  {
    text: "Attention is the rarest and purest form of generosity.",
    author: "Simone Weil",
    source: "Letter to Joë Bousquet, 1942 (translated from French)",
    kind: "philosophy",
  },
  {
    text: "My experience is what I agree to attend to.",
    author: "William James",
    source: "The Principles of Psychology (1890), ch. XI",
    kind: "philosophy",
  },
  {
    text: "How we spend our days is, of course, how we spend our lives.",
    author: "Annie Dillard",
    source: "The Writing Life (1989)",
    kind: "literature",
  },
  {
    text: "Tell me, what is it you plan to do with your one wild and precious life?",
    author: "Mary Oliver",
    source: "“The Summer Day,” House of Light (1990)",
    kind: "literature",
  },
  {
    text: "A wealth of information creates a poverty of attention.",
    author: "Herbert A. Simon",
    source: "“Designing Organizations for an Information-Rich World” (1971)",
    kind: "philosophy",
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
    source: "On the Shortness of Life, I (wording varies by translation)",
    kind: "philosophy",
  },
  {
    text: "Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.",
    author: "Marcus Aurelius",
    source: "Meditations 5.16 (trans. George Long)",
    kind: "philosophy",
  },
];

export const THOUGHTS_ISLAMIC: Thought[] = [
  {
    text: "For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾",
    author: "The Qur'an",
    source: "Surah Ash-Sharh 94:5–6 (Saheeh International)",
    kind: "quran",
  },
  {
    text: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
    author: "The Qur'an",
    source: "Surah Al-Baqarah 2:152 (Saheeh International)",
    kind: "quran",
  },
  {
    text: "Actions are only by intentions, and every person will have only what they intended.",
    author: "The Prophet Muhammad ﷺ",
    source: "Sahih al-Bukhari 1; Sahih Muslim 1907",
    kind: "hadith",
  },
  {
    text: "He has succeeded who purifies it, and he has failed who instills it [with corruption].",
    arabic: "قَدْ أَفْلَحَ مَن زَكَّاهَا ﴿٩﴾ وَقَدْ خَابَ مَن دَسَّاهَا ﴿١٠﴾",
    author: "The Qur'an",
    source: "Surah Ash-Shams 91:9–10 (Saheeh International)",
    kind: "quran",
  },
  {
    text: "Richness is not having many possessions; rather, true richness is the richness of the soul.",
    author: "The Prophet Muhammad ﷺ",
    source: "Sahih al-Bukhari 6446; Sahih Muslim 1051",
    kind: "hadith",
  },
  {
    text: "And We are closer to him than [his] jugular vein.",
    arabic: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
    author: "The Qur'an",
    source: "Surah Qaf 50:16 (Saheeh International)",
    kind: "quran",
  },
  {
    text: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    author: "The Qur'an",
    source: "Surah Al-Baqarah 2:153 (Saheeh International)",
    kind: "quran",
  },
];

/** Islamic experience interleaves scripture with the general reflections. */
export function thoughtForDay(day: number, islamic: boolean): Thought {
  if (!islamic) return THOUGHTS_GENERAL[day % THOUGHTS_GENERAL.length];
  const pool = day % 3 === 2 ? THOUGHTS_GENERAL : THOUGHTS_ISLAMIC;
  return pool[day % pool.length];
}
