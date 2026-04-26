import type { BookSummary } from '../types/cbz';

export function groupBySeries(
  books: BookSummary[]
): { series: string | null; books: BookSummary[] }[] {
  const map = new Map<string, BookSummary[]>();
  for (const book of books) {
    const key = book.series ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(book);
  }
  for (const group of map.values()) {
    group.sort((a, b) => {
      const nA = parseFloat(a.number ?? '');
      const nB = parseFloat(b.number ?? '');
      if (!isNaN(nA) && !isNaN(nB) && nA !== nB) return nA - nB;
      return (a.title ?? '').localeCompare(b.title ?? '', undefined, { numeric: true });
    });
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b, undefined, { numeric: true });
    })
    .map(([series, books]) => ({ series: series || null, books }));
}
