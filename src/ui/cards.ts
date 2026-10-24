import { ERASER_EVERY, ROUND_TICKS, TICK } from '../game/constants.ts';
import type { RunResult, TitleInfo } from '../game/session.ts';

export type TitleAction = 'daily' | 'endless';
export type DeathAction = 'again' | 'replay' | 'menu';

export interface Button<A extends string> {
  action: A;
  label: string;
  style: 'primary' | 'secondary' | 'ghost';
}

export interface LegendItem {
  dot: 'self' | 'echo' | 'orb' | 'erase';
  text: string;
}

export interface TitleCard {
  legend: readonly LegendItem[];
  today: string;
  /** Today's counted score, e.g. "3 orbs"; null until the counted attempt is done. */
  todayScore: string | null;
  shareLine: string | null;
  buttons: readonly Button<TitleAction>[];
}

export interface DeathCard {
  badge: { text: string; muted: boolean } | null;
  headline: string;
  score: number;
  summary: string;
  /** The endless best after this run; null for daily runs. */
  best: number | null;
  shareLine: string | null;
  buttons: readonly Button<DeathAction>[];
}

const plural = (n: number, word: string, many = `${word}s`): string => `${n} ${n === 1 ? word : many}`;

function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

const roundSeconds = `${Math.round(ROUND_TICKS * TICK)} seconds`;

const BADGES: Record<RunResult['outcome']['kind'], DeathCard['badge']> = {
  counted: { text: 'Daily result saved', muted: false },
  practice: { text: 'Practice run', muted: true },
  newBest: { text: 'New best', muted: false },
  plain: null,
};

export function titleCard(info: TitleInfo): TitleCard {
  const played = info.daily;
  return {
    legend: [
      { dot: 'self', text: 'You' },
      { dot: 'echo', text: 'Your echoes, copying every move you made' },
      { dot: 'orb', text: `The orb. Reach it within ${roundSeconds}` },
      { dot: 'erase', text: `Every ${ordinal(ERASER_EVERY)} round: an eraser that deletes your oldest echo` },
    ],
    today: info.today,
    todayScore: played ? plural(played.score, 'orb') : null,
    shareLine: played ? info.shareLine : null,
    buttons: [
      { action: 'daily', label: played ? 'Practice daily' : 'Daily run', style: 'primary' },
      { action: 'endless', label: 'Endless', style: 'secondary' },
    ],
  };
}

export function deathCard(result: RunResult): DeathCard {
  const { cause, score, erased, outcome } = result;
  const lead = cause.kind === 'time' ? `The orb fades after ${roundSeconds}. ` : '';
  const made = score === 0
    ? 'No orbs this time.'
    : `You made ${plural(score, 'echo', 'echoes')}${erased > 0 ? ` and erased ${erased}` : ''}.`;
  return {
    badge: BADGES[outcome.kind],
    headline: cause.kind === 'echo' ? `Caught by echo #${cause.n}` : 'Out of time',
    score,
    summary: lead + made,
    best: result.mode === 'endless' ? result.best : null,
    shareLine: outcome.kind === 'counted' ? outcome.shareLine : null,
    buttons: [
      { action: 'again', label: 'Run again', style: 'primary' },
      { action: 'replay', label: 'Watch replay', style: 'secondary' },
      { action: 'menu', label: 'Menu', style: 'ghost' },
    ],
  };
}
