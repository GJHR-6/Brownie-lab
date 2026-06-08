// Strip HTML tags and control characters from user-supplied strings.
export function sanitizeText(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLen);
}

// Allow digits, spaces, +, -, ( ) only — typical phone chars.
export function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\d\s+\-() ]/g, '').trim().slice(0, 25);
}

// Honduras: 8 digits starting with 2, 3, 8 or 9. Accepts +504 prefix.
export function isValidHonduranPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  // Strip country code 504 if present
  const local = digits.startsWith('504') && digits.length === 11 ? digits.slice(3) : digits;
  return /^[2389]\d{7}$/.test(local);
}

// Promo codes: alphanumeric + hyphen/underscore only.
export function sanitizePromoCode(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^A-Za-z0-9\-_]/g, '').trim().slice(0, 30);
}

// Validate a push subscription endpoint is an HTTPS URL.
export function isValidPushEndpoint(input: unknown): boolean {
  if (typeof input !== 'string' || input.length > 2048) return false;
  try {
    const url = new URL(input);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate base64url string (p256dh / auth keys).
export function isValidBase64(input: unknown, maxLen = 512): boolean {
  if (typeof input !== 'string' || input.length > maxLen) return false;
  return /^[A-Za-z0-9+/\-_]+=*$/.test(input);
}
