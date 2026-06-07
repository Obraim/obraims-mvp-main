export type AiResponseLanguage = "en";

export function detectDominantLanguage(_text: string): AiResponseLanguage {
  return "en";
}

export function getBorrowerLanguageInstruction(_text: string) {
  return {
    language: "en" as AiResponseLanguage,
    instruction: "Answer in clear, professional English. Explain lending requirements clearly. Never promise loan approval."
  };
}
