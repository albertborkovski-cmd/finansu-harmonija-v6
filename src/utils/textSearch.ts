function searchableText(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(searchableText).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(searchableText).join(' ');
  return String(value);
}

export function normalizeSearchText(value: unknown): string {
  return searchableText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Case- and accent-insensitive partial text matching. Every typed word must occur somewhere in the row. */
export function matchesTextSearch(value: unknown, query: string): boolean {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalizeSearchText(value);
  return terms.every(term => haystack.includes(term));
}
