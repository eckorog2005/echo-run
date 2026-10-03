import type { DailyRecord } from './daily.ts';

export function shareText(key: string, rec: DailyRecord): string {
  const parts = [`Echo Run ${key}`, `${rec.score} orb${rec.score === 1 ? '' : 's'}`];
  if (rec.erased > 0) parts.push(`${rec.erased} erased`);
  parts.push(rec.cause.kind === 'echo' ? `caught by #${rec.cause.n}` : 'out of time');
  return parts.join(' · ');
}
