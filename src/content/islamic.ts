/**
 * Curated Islamic Journey content.
 *
 * Editorial policy (see README → "Religious content"):
 *  - No generated religious material. Every passage below was selected by hand.
 *  - Qur'an translations: Saheeh International (1997), quoted in English.
 *    Arabic is included only for short, well-known excerpts.
 *  - Hadith are limited to well-known narrations from major collections, with
 *    the collection and number given using the common numbering found on
 *    sunnah.com. Where a collection's compiler or later scholars graded the
 *    narration, the grading is stated.
 *  - Sayings of Companions are labelled as such and never attributed to the
 *    Prophet ﷺ.
 *  - All content requires review by qualified scholars before a public
 *    release. The app shows this notice to users.
 */

export interface QuranRef {
  surah: number;
  ayah: string; // "153" or "2-3"
  surahName: string;
  arabic?: string;
  translation: string;
}

export interface HadithRef {
  text: string;
  source: string;
  grading?: string;
  note?: string;
}

export interface TraditionNote {
  label: string;
  body: string;
}

export interface Topic {
  slug: string;
  arabic: string;
  name: string;
  gloss: string;
  summary: string;
  explanation: string[];
  quran: QuranRef[];
  hadith: HadithRef[];
  reflections: string[];
  practices: string[];
  traditions?: TraditionNote[];
}

export const TRANSLATION_NOTE =
  "Qur'an translations are from Saheeh International. A translation conveys an interpretation of meaning; it is not the Qur'an itself. Where Arabic is shown, it may be the key phrase of a longer passage — tap a reference to read it in full on quran.com.";

export const CONTENT_REVIEW_NOTE =
  "This prototype's religious content was carefully curated but has not yet been reviewed by a panel of scholars. Please verify references with a trusted teacher, and consult qualified scholars for any religious ruling — Sukoon does not issue them.";

export const TRADITION_POLICY =
  "Hadith references here are from collections central to Sunni scholarship (such as Sahih al-Bukhari and Sahih Muslim). Shia scholarship relies on its own hadith collections, such as al-Kafi; curated references from those collections are being prepared with scholarly review rather than added hastily. Where a concept is developed differently across traditions, a note says so and points to classical works for further reading.";

export const quranUrl = (q: QuranRef) => `https://quran.com/${q.surah}/${q.ayah}`;

export const TOPICS: Topic[] = [
  {
    slug: "niyyah",
    arabic: "نِيَّة",
    name: "Niyyah",
    gloss: "Intention",
    summary: "The inner purpose that gives an action its meaning.",
    explanation: [
      "Niyyah is the intention behind an act — the answer to the quiet question, “Why am I doing this?” In Islamic thought, the same outward action can carry very different weight depending on the intention that moves it.",
      "Attending to intention is not about perfection before acting. It is a habit of returning: noticing what moves us, and gently re-directing ordinary acts — studying, working, caring for family — toward something worthy.",
    ],
    quran: [
      {
        surah: 98,
        ayah: "5",
        surahName: "Al-Bayyinah",
        translation:
          "And they were not commanded except to worship Allah, [being] sincere to Him in religion, inclining to truth, and to establish prayer and to give zakah. And that is the correct religion.",
      },
      {
        surah: 6,
        ayah: "162",
        surahName: "Al-An‘am",
        translation: "Say, “Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds.”",
      },
    ],
    hadith: [
      {
        text: "Actions are only by intentions, and every person will have only what they intended…",
        source: "Sahih al-Bukhari 1; Sahih Muslim 1907",
        note: "Opening of a longer narration from ‘Umar ibn al-Khattab. Wording of English translations varies.",
      },
    ],
    reflections: [
      "Choose one ordinary thing you will do today. Why are you really doing it?",
      "Where do you notice yourself acting mainly to be seen, praised, or approved of?",
      "What would change if you renewed your intention before you began studying or working?",
    ],
    practices: [
      "Before opening your laptop to study, pause for one breath and name your intention silently.",
      "At the end of the day, recall one act and ask whether your intention shifted along the way.",
    ],
  },
  {
    slug: "taqwa",
    arabic: "تَقْوَى",
    name: "Taqwa",
    gloss: "God-consciousness",
    summary: "A living awareness of Allah that shapes how we act.",
    explanation: [
      "Taqwa is often translated as “piety,” “fear of God,” or “God-consciousness.” At its root is the idea of guarding or protecting — being mindful in a way that keeps one from harm and wrongdoing.",
      "Taqwa is located first in the heart, but it is visible in conduct: in honesty when no one is watching, in restraint, and in how we treat people.",
    ],
    quran: [
      {
        surah: 49,
        ayah: "13",
        surahName: "Al-Hujurat",
        translation:
          "O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another. Indeed, the most noble of you in the sight of Allah is the most righteous of you. Indeed, Allah is Knowing and Acquainted.",
      },
      {
        surah: 65,
        ayah: "2-3",
        surahName: "At-Talaq",
        translation: "…And whoever fears Allah — He will make for him a way out. And will provide for him from where he does not expect…",
      },
    ],
    hadith: [
      {
        text: "…Taqwa is here — and he pointed to his chest three times…",
        source: "Sahih Muslim 2564",
        note: "Part of a longer narration on the rights of Muslims toward one another.",
      },
      {
        text: "Be mindful of Allah wherever you are, follow a bad deed with a good deed and it will erase it, and treat people with good character.",
        source: "Jami‘ at-Tirmidhi 1987",
        grading: "Graded hasan sahih by at-Tirmidhi",
      },
    ],
    reflections: [
      "When do you feel most aware of Allah during an ordinary day?",
      "Is there something you do privately that you would not want to be seen doing? What does that tell you?",
      "How does God-consciousness show up in the way you treat people?",
    ],
    practices: [
      "Choose one moment today — a meal, a doorway, a notification — to pause and remember Allah.",
      "Follow one mistake today with a deliberate good deed, however small.",
    ],
  },
  {
    slug: "muhasabah",
    arabic: "مُحَاسَبَة",
    name: "Muhasabah",
    gloss: "Self-accountability",
    summary: "Honest, regular review of one's actions and states.",
    explanation: [
      "Muhasabah is the practice of taking account of oneself: looking back on one's actions, words, and intentions with honesty — and then looking forward with resolve.",
      "It is not self-punishment. Done well, muhasabah is calm and specific. It notices patterns, acknowledges what went well, turns to Allah in repentance for what did not, and chooses one thing to carry into tomorrow.",
    ],
    quran: [
      {
        surah: 59,
        ayah: "18",
        surahName: "Al-Hashr",
        arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ",
        translation:
          "O you who have believed, fear Allah. And let every soul look to what it has put forth for tomorrow — and fear Allah. Indeed, Allah is [fully] Acquainted with what you do.",
      },
    ],
    hadith: [
      {
        text: "Hold yourselves to account before you are held to account…",
        source: "Reported by at-Tirmidhi following hadith 2459",
        note: "This is a saying attributed to ‘Umar ibn al-Khattab, not a saying of the Prophet ﷺ.",
      },
    ],
    reflections: [
      "What did you do today that you are quietly glad about?",
      "Where did your actions today drift from what you intended this morning?",
      "Is there someone you owe an apology, a thank-you, or a returned favour?",
    ],
    practices: [
      "Five minutes before sleep: one thing to be grateful for, one thing to improve, one thing to let go of.",
      "Once a week, read back through your journal and notice patterns rather than single events.",
    ],
    traditions: [
      {
        label: "Further reading across traditions",
        body: "Self-accountability is treated at length in al-Ghazali’s Ihya’ ‘Ulum al-Din (in its book on vigilance and self-accounting), widely read in Sunni circles, and in Muhammad Mahdi al-Naraqi’s Jami‘ al-Sa‘adat, a classic of Shia ethical literature.",
      },
    ],
  },
  {
    slug: "muraqabah",
    arabic: "مُرَاقَبَة",
    name: "Muraqabah",
    gloss: "Awareness of Allah",
    summary: "Living with the awareness that Allah sees and is near.",
    explanation: [
      "Muraqabah comes from a root meaning to watch or observe. It describes a state of attentiveness: the awareness that Allah is always aware of us, which in turn makes us more attentive to our own hearts and actions.",
      "In a distracted age, muraqabah is a profound form of attention — not to a screen, but to the presence of the One who is nearer than we are to ourselves.",
    ],
    quran: [
      {
        surah: 50,
        ayah: "16",
        surahName: "Qaf",
        arabic: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
        translation: "And We have already created man and know what his soul whispers to him, and We are closer to him than [his] jugular vein.",
      },
      {
        surah: 57,
        ayah: "4",
        surahName: "Al-Hadid",
        translation: "…And He is with you wherever you are. And Allah, of what you do, is Seeing.",
      },
    ],
    hadith: [
      {
        text: "…[Ihsan is] that you worship Allah as though you see Him, and if you do not see Him, then indeed He sees you.",
        source: "Sahih Muslim 8; Sahih al-Bukhari 50",
        note: "From the well-known narration of Jibril.",
      },
    ],
    reflections: [
      "What fills your mind in the quiet moments between tasks?",
      "How would your next hour change if you held the awareness that Allah sees you — with mercy, not only scrutiny?",
    ],
    practices: [
      "Leave your phone in another room for ten minutes and sit in stillness with this verse.",
      "Before prayer, take three slow breaths and notice where your attention is.",
    ],
    traditions: [
      {
        label: "Across traditions",
        body: "Muraqabah is developed in depth in Sufi-influenced Sunni spirituality and in Shia traditions of ethics and ‘irfan. Practices and emphases differ; learn them with a qualified teacher from your tradition.",
      },
    ],
  },
  {
    slug: "tazkiyah",
    arabic: "تَزْكِيَة",
    name: "Tazkiyah",
    gloss: "Purification of the self",
    summary: "The lifelong work of refining the heart and character.",
    explanation: [
      "Tazkiyah refers to the purification and growth of the self (nafs). The word carries both senses: removing what harms, and nurturing what is good.",
      "It is gradual, ordinary work — noticing envy, pride, or impatience when it arises, and patiently cultivating their opposites.",
    ],
    quran: [
      {
        surah: 91,
        ayah: "9-10",
        surahName: "Ash-Shams",
        arabic: "قَدْ أَفْلَحَ مَن زَكَّاهَا ﴿٩﴾ وَقَدْ خَابَ مَن دَسَّاهَا ﴿١٠﴾",
        translation: "He has succeeded who purifies it, and he has failed who instills it [with corruption].",
      },
      {
        surah: 87,
        ayah: "14",
        surahName: "Al-A‘la",
        translation: "He has certainly succeeded who purifies himself.",
      },
    ],
    hadith: [
      {
        text: "…Truly in the body there is a morsel of flesh which, if it is sound, the whole body is sound, and if it is corrupt, the whole body is corrupt. Truly, it is the heart.",
        source: "Sahih al-Bukhari 52; Sahih Muslim 1599",
      },
    ],
    reflections: [
      "Which quality in yourself would you most like to soften this season?",
      "What tends to feed that quality — places, content, company, habits?",
      "What is one small, repeatable act that nurtures its opposite?",
    ],
    practices: [
      "Notice one moment of envy or comparison today, without judgment. Then make a quiet du‘a for that person’s good.",
      "Choose one input to reduce this week that you know unsettles your heart.",
    ],
    traditions: [
      {
        label: "Further reading across traditions",
        body: "Classical treatments include al-Ghazali’s Ihya’ ‘Ulum al-Din in Sunni scholarship and al-Naraqi’s Jami‘ al-Sa‘adat in Shia scholarship. Both organise the work of the self around specific vices and their corresponding virtues.",
      },
    ],
  },
  {
    slug: "sabr",
    arabic: "صَبْر",
    name: "Sabr",
    gloss: "Patience",
    summary: "Steadfastness in hardship, in obedience, and in restraint.",
    explanation: [
      "Sabr is far richer than waiting. Scholars often describe it in three forms: patience in obeying Allah, patience in refraining from what is harmful, and patience through what we cannot control.",
      "Patience is not passivity. It is the strength to stay steady — to keep acting well while feelings rise and fall.",
    ],
    quran: [
      {
        surah: 2,
        ayah: "153",
        surahName: "Al-Baqarah",
        arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        translation: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
      },
      {
        surah: 94,
        ayah: "5-6",
        surahName: "Ash-Sharh",
        arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾",
        translation: "For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.",
      },
    ],
    hadith: [
      {
        text: "Patience is at the first stroke [of a calamity].",
        source: "Sahih al-Bukhari 1283; Sahih Muslim 926",
      },
      {
        text: "How wonderful is the affair of the believer, for all of it is good… If something good happens to him, he is grateful, and that is good for him. If something harmful befalls him, he is patient, and that is good for him.",
        source: "Sahih Muslim 2999",
      },
    ],
    reflections: [
      "What are you being asked to be patient with right now?",
      "Which kind of patience is hardest for you: in doing, in refraining, or in accepting?",
      "What helps you stay steady when you feel overwhelmed?",
    ],
    practices: [
      "When frustration rises today, pause before responding and take one slow breath.",
      "Pair one difficult task with prayer: begin it right after salah.",
    ],
  },
  {
    slug: "shukr",
    arabic: "شُكْر",
    name: "Shukr",
    gloss: "Gratitude",
    summary: "Recognising blessings — in the heart, on the tongue, and in action.",
    explanation: [
      "Shukr is gratitude toward Allah, expressed in the heart by recognising blessings, on the tongue by acknowledging them, and in action by using them well.",
      "Gratitude is also an antidote to comparison. It returns attention from what others have to what one has been given.",
    ],
    quran: [
      {
        surah: 14,
        ayah: "7",
        surahName: "Ibrahim",
        arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
        translation:
          "And [remember] when your Lord proclaimed, “If you are grateful, I will surely increase you [in favor]; but if you deny, indeed, My punishment is severe.”",
      },
      {
        surah: 2,
        ayah: "152",
        surahName: "Al-Baqarah",
        arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
        translation: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
      },
    ],
    hadith: [
      {
        text: "Whoever does not thank people has not thanked Allah.",
        source: "Sunan Abi Dawud 4811; Jami‘ at-Tirmidhi 1954",
        grading: "Graded sahih by al-Albani; at-Tirmidhi graded it hasan sahih",
      },
    ],
    reflections: [
      "Name three specific blessings from today — the smaller, the better.",
      "Who has helped you recently that you have not thanked?",
      "How could you use one blessing you have in a way that honours it?",
    ],
    practices: [
      "Send one sincere message of thanks to someone today.",
      "When you notice comparison, name one thing you are grateful for instead.",
    ],
    traditions: [
      {
        label: "Further reading",
        body: "Al-Ghazali’s Ihya’ ‘Ulum al-Din pairs patience and gratitude in a single book, treating them as two halves of faith.",
      },
    ],
  },
  {
    slug: "tawakkul",
    arabic: "تَوَكُّل",
    name: "Tawakkul",
    gloss: "Reliance upon Allah",
    summary: "Doing one's part fully, and entrusting the outcome to Allah.",
    explanation: [
      "Tawakkul is reliance upon Allah. It does not mean abandoning effort; it means taking the means with care while trusting the result to Allah.",
      "For students and young professionals, tawakkul can release the grip of anxiety over outcomes we cannot control — exams, applications, other people’s decisions.",
    ],
    quran: [
      {
        surah: 65,
        ayah: "3",
        surahName: "At-Talaq",
        arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
        translation: "…And whoever relies upon Allah — then He is sufficient for him…",
      },
      {
        surah: 3,
        ayah: "159",
        surahName: "Ali ‘Imran",
        translation: "…And when you have decided, then rely upon Allah. Indeed, Allah loves those who rely [upon Him].",
      },
    ],
    hadith: [
      {
        text: "If you were to rely upon Allah with the reliance He is due, He would provide for you as He provides for the birds: they go out hungry in the morning and return full in the evening.",
        source: "Jami‘ at-Tirmidhi 2344",
        grading: "Graded hasan sahih by at-Tirmidhi",
      },
    ],
    reflections: [
      "What outcome are you holding too tightly right now?",
      "Which part of it is genuinely within your effort — and which part is not?",
      "What would it feel like to do your part fully today, and then let go?",
    ],
    practices: [
      "Write down one worry. Beside it, write the next action within your control. Do that, then make du‘a for the rest.",
    ],
  },
  {
    slug: "zuhd",
    arabic: "زُهْد",
    name: "Zuhd",
    gloss: "Detachment",
    summary: "Holding the world in the hand, not in the heart.",
    explanation: [
      "Zuhd is often translated as asceticism, but in its classical sense it is closer to inner detachment: not letting worldly things — possessions, status, approval — take hold of the heart.",
      "In a culture built on manufactured desire, zuhd is quietly radical. It asks: do I want this, or was I taught to want it?",
    ],
    quran: [
      {
        surah: 57,
        ayah: "20",
        surahName: "Al-Hadid",
        translation:
          "Know that the life of this world is but amusement and diversion and adornment and boasting to one another and competition in increase of wealth and children…",
      },
      {
        surah: 18,
        ayah: "46",
        surahName: "Al-Kahf",
        translation:
          "Wealth and children are [but] adornment of the worldly life. But the enduring good deeds are better to your Lord for reward and better for [one's] hope.",
      },
    ],
    hadith: [
      {
        text: "Be in this world as though you were a stranger or a traveller.",
        source: "Sahih al-Bukhari 6416",
      },
      {
        text: "Richness is not having many possessions; rather, true richness is the richness of the soul.",
        source: "Sahih al-Bukhari 6446; Sahih Muslim 1051",
      },
    ],
    reflections: [
      "What have you wanted recently that you did not want before you saw it online?",
      "What do you own, follow, or chase that feels heavier than it is worth?",
      "What would “enough” look like for you this month?",
    ],
    practices: [
      "Before buying something non-essential, wait three days and see whether the desire remains.",
      "Unfollow or mute one account that consistently leaves you wanting more.",
    ],
  },
  {
    slug: "ihsan",
    arabic: "إِحْسَان",
    name: "Ihsan",
    gloss: "Excellence",
    summary: "Doing what is beautiful — in worship, work, and conduct.",
    explanation: [
      "Ihsan means excellence, beauty, and doing good. In the narration of Jibril it is the highest level of religion: worshipping Allah as though you see Him.",
      "Ihsan extends to everything — the care with which we study, the gentleness of our words, the quality of our work when no one will notice.",
    ],
    quran: [
      {
        surah: 2,
        ayah: "195",
        surahName: "Al-Baqarah",
        arabic: "وَأَحْسِنُوا ۛ إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ",
        translation: "…And do good; indeed, Allah loves the doers of good.",
      },
      {
        surah: 16,
        ayah: "90",
        surahName: "An-Nahl",
        translation: "Indeed, Allah orders justice and good conduct and giving to relatives and forbids immorality and bad conduct and oppression…",
      },
    ],
    hadith: [
      {
        text: "…[Ihsan is] that you worship Allah as though you see Him, and if you do not see Him, then indeed He sees you.",
        source: "Sahih Muslim 8; Sahih al-Bukhari 50",
      },
      {
        text: "Indeed, Allah has prescribed ihsan (excellence) in all things…",
        source: "Sahih Muslim 1955",
      },
    ],
    reflections: [
      "What is one thing you do regularly that you could do more beautifully?",
      "Where do you do just enough to get by? Why there?",
    ],
    practices: [
      "Choose one routine task today and do it with complete care, start to finish.",
      "Speak to one person today with deliberate gentleness.",
    ],
  },
];

export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);
