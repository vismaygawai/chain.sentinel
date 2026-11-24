import crypto from 'node:crypto';

/**
 * Redacts API keys, tokens, and sensitive query parameters from strings before logging or returning errors.
 */
export function redactSecrets(input: string): string {
  if (!input) return '';
  return input
    .replace(/(\/v[23]\/)[A-Za-z0-9_-]{8,}/g, '$1[REDACTED]')
    .replace(/([?&](?:api[_-]?key|key|token|secret|auth|password)=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/\b(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{16,})\b/g, '[REDACTED]');
}

/**
 * Validates that an external service URL uses http or https.
 */
export function assertSafeExternalUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid external URL configuration');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }
  return parsed;
}

/**
 * Constant-time string comparison using SHA-256 digests so key length is not leaked via timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Strips control characters and bounds length on untrusted text fields.
 */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
}
