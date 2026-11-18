const months: Record<string, string> = {
  jan: "yan",
  feb: "fev",
  mar: "mar",
  apr: "apr",
  may: "may",
  jun: "iyun",
  jul: "iyul",
  aug: "avg",
  sep: "sen",
  oct: "okt",
  nov: "noy",
  dec: "dek"
};

const phrases: Record<string, string> = {
  today: "Bugun",
  yesterday: "Kecha",
  "just now": "Hozir",
  "not applicable": "Amal qilmaydi",
  pending: "Kutilmoqda"
};

/** Localizes demo dates such as "30 Nov 2027" or "Today, 09:42" for the Uzbek UI. */
export function localizeDate(value: string) {
  return value
    .replace(/\b(today|yesterday|just now|not applicable|pending)\b/gi, (word) => phrases[word.toLowerCase()] ?? word)
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, (word) => `${months[word.slice(0, 3).toLowerCase()]}.`);
}
