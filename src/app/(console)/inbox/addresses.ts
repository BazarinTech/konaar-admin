const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/** "a@x.com, b@y.com; c@z.com" → the valid addresses, and the ones that are not. */
export function parseAddresses(raw: string): { valid: string[]; invalid: string[] } {
  const parts = raw
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const valid = [...new Set(parts.filter((p) => EMAIL.test(p)).map((p) => p.toLowerCase()))];
  const invalid = parts.filter((p) => !EMAIL.test(p));
  return { valid, invalid };
}
