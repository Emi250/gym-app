/**
 * Extract a useful human message from any thrown/returned value.
 * Supabase PostgrestError is a plain object with `.message` but does NOT
 * extend `Error`, so `err instanceof Error` is false and `String(err)`
 * produces the dreaded "[object Object]". This helper covers that case
 * plus regular Errors, strings, and unknowns.
 */
export function errorMessage(err: unknown): string {
  if (err == null) return "Error desconocido";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") {
      // Postgrest errors often have message + details + hint; concatenate
      // the parts that are present so the user gets actionable info.
      const parts = [obj.message];
      if (typeof obj.details === "string" && obj.details) parts.push(obj.details);
      if (typeof obj.hint === "string" && obj.hint) parts.push(`(${obj.hint})`);
      return parts.join(" · ");
    }
    try {
      return JSON.stringify(err);
    } catch {
      /* fall through */
    }
  }
  return String(err);
}
