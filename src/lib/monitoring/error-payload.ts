export type ClientErrorSource = 'REACT_BOUNDARY' | 'WINDOW_ERROR' | 'UNHANDLED_REJECTION'

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g
const TOKEN_PATTERN = /\b[A-Za-z0-9_-]{32,}\b/g

export function sanitizeClientError(value: unknown): string {
  const rawMessage =
    value instanceof Error
      ? value.message
      : typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint'
          ? String(value)
          : 'Error desconocido'

  return rawMessage
    .replace(EMAIL_PATTERN, '[email]')
    .replace(TOKEN_PATTERN, '[redacted]')
    .slice(0, 1000)
}

export function getClientErrorRoute(): string {
  if (typeof window === 'undefined') return '/unknown'
  return window.location.pathname.slice(0, 256) || '/'
}
