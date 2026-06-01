export function formatDateTime(iso: string, locale: 'ja' | 'en'): string {
  try {
    const tag = locale === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.DateTimeFormat(tag, {
      year: 'numeric',
      month: locale === 'ja' ? 'long' : 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatShortDateTime(iso: string, locale: 'ja' | 'en'): string {
  try {
    const tag = locale === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.DateTimeFormat(tag, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}
