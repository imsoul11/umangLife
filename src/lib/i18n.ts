export type Locale = "en" | "hi";

const en = {
  "nav.benefits": "💰 My Benefits",
  "nav.calendar": "📅 Calendar",
  "nav.about": "ℹ️ About",
  "header.subtitle": "Life events → ordered government actions",
  "header.reset": "reset demo",
  "header.editProfile": "Edit profile & DigiLocker documents",
  "empty.title": "Tell me what happened in your life",
  "empty.body": "Describe a life event in plain words. I'll find every government action you need, in the right order.",
  "progress.completed": "completed",
  "calendar.title": "My Government Calendar",
  "status.locked": "locked",
  "status.ready": "ready",
  "status.in_progress": "in progress",
  "status.action_required": "action required",
  "status.done": "done",
} as const;

export type TranslationKey = keyof typeof en;

/** Hindi strings for the journey workspace; pages not yet translated stay English. */
const hi: Record<TranslationKey, string> = {
  "nav.benefits": "💰 मेरे लाभ",
  "nav.calendar": "📅 कैलेंडर",
  "nav.about": "ℹ️ परिचय",
  "header.subtitle": "जीवन की घटनाएँ → क्रमबद्ध सरकारी कदम",
  "header.reset": "डेमो रीसेट करें",
  "header.editProfile": "प्रोफ़ाइल और DigiLocker दस्तावेज़ बदलें",
  "empty.title": "बताइए, आपकी ज़िंदगी में क्या हुआ?",
  "empty.body": "जीवन की घटना अपने शब्दों में बताइए — मैं आपके हर ज़रूरी सरकारी कदम, सही क्रम में ढूँढ दूँगा।",
  "progress.completed": "पूर्ण",
  "calendar.title": "मेरा सरकारी कैलेंडर",
  "status.locked": "बंद",
  "status.ready": "तैयार",
  "status.in_progress": "चल रहा है",
  "status.action_required": "ध्यान दें",
  "status.done": "पूर्ण",
};

const DICT: Record<Locale, Record<TranslationKey, string>> = { en, hi };

export function translate(locale: Locale, key: TranslationKey): string {
  return DICT[locale][key] ?? en[key];
}
