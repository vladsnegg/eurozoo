type DigestError = { digest?: unknown };

export function rethrowNotFound(error: unknown): void {
  if (typeof error !== 'object' || error === null) return;
  const digest = (error as DigestError).digest;
  if (typeof digest !== 'string') return;
  if (digest.includes('NEXT_NOT_FOUND') || digest.includes('NEXT_HTTP_ERROR_FALLBACK')) {
    throw error;
  }
}
