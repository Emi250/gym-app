/**
 * Lowercases the string and removes Unicode combining diacritical marks so
 * accent-insensitive comparisons work ("dominadas" matches "Dominádas").
 */
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
