import type { RunResult, TitleInfo } from '../game/session.ts';

type Actions = Record<string, () => void>;

const plural = (n: number, word: string, many = `${word}s`): string => `${n} ${n === 1 ? word : many}`;

function shareBlock(line: string): string {
  return `
    <div class="share">
      <code id="share-line">${line}</code>
      <button class="ghost-btn" type="button" data-action="copy">Copy</button>
    </div>`;
}

/** The card shown over the arena for the title, death, and result screens. */
export class Overlay {
  private primary: (() => void) | null = null;

  constructor(private readonly el: HTMLElement) {}

  get visible(): boolean {
    return !this.el.hidden;
  }

  /** Runs the card's main button (Space/Enter shortcut). */
  activatePrimary(): void {
    this.primary?.();
  }

  hide(): void {
    this.el.hidden = true;
    this.primary = null;
  }

  private show(html: string, actions: Actions, primary: string): void {
    this.el.innerHTML = `<div class="card">${html}</div>`;
    this.el.hidden = false;
    this.el.scrollTop = 0;
    this.primary = actions[primary] ?? null;
    this.el.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      const name = btn.dataset.action ?? '';
      btn.addEventListener('click', name === 'copy' ? () => this.copy(btn) : () => actions[name]?.());
    });
  }

  private copy(btn: HTMLButtonElement): void {
    const code = this.el.querySelector<HTMLElement>('#share-line');
    if (!code) return;
    const selectText = (): void => {
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      btn.textContent = 'Selected';
    };
    if (!navigator.clipboard) return selectText();
    navigator.clipboard.writeText(code.textContent ?? '').then(
      () => (btn.textContent = 'Copied'),
      selectText,
    );
  }

  showTitle(info: TitleInfo, actions: Actions): void {
    const played = info.daily;
    const dailySection = played
      ? `<p>Today's run: <strong>${plural(played.score, 'orb')}</strong>. A new course unlocks tomorrow.</p>
         ${info.shareLine ? shareBlock(info.shareLine) : ''}`
      : `<p>Today's course is the same for everyone. Your first daily run is the one that counts.</p>`;
    this.show(
      `
      <h2>Outrun <em>yourself.</em></h2>
      <p>Grab the orb. The route you took to reach it comes back as an <strong>echo</strong> that keeps repeating. Touch any echo and the run is over.</p>
      <ul class="legend">
        <li><span class="dot self"></span><span>You</span></li>
        <li><span class="dot echo"></span><span>Your echoes, copying every move you made</span></li>
        <li><span class="dot orb"></span><span>The orb. Reach it within 7 seconds</span></li>
        <li><span class="dot erase"></span><span>Every 5th round: an eraser that deletes your oldest echo</span></li>
      </ul>
      <div class="daily">
        <small>Daily · ${info.today}</small>
        ${dailySection}
      </div>
      <div class="row">
        <button class="primary" type="button" data-action="daily">${played ? 'Practice daily' : 'Daily run'}</button>
        <button class="secondary" type="button" data-action="endless">Endless</button>
        <span class="hint">or press <kbd>Space</kbd></span>
      </div>`,
      actions,
      played ? 'endless' : 'daily',
    );
  }

  showDeath(info: RunResult, actions: Actions): void {
    const badge = {
      counted: '<span class="badge">Daily result saved</span>',
      practice: '<span class="badge muted">Practice run</span>',
      newBest: '<span class="badge">New best</span>',
      plain: '',
    }[info.outcome.kind];
    const reason = info.cause.kind === 'echo' ? `Caught by echo #${info.cause.n}` : 'Out of time';
    const shareLine = info.outcome.kind === 'counted' ? info.outcome.shareLine : null;
    const made = info.score === 0 ? 'No orbs this time.' : `You made ${plural(info.score, 'echo', 'echoes')}`;
    const erasedNote = info.erased > 0 ? ` and erased ${info.erased}` : '';
    const lead = info.cause.kind === 'time' ? 'The orb fades after 7 seconds. ' : '';
    const bestNote = info.mode === 'endless' ? ` Best: <strong>${info.best}</strong>.` : '';
    this.show(
      `
      ${badge}
      <h2>${reason}</h2>
      <div class="big">${info.score}</div>
      <p>${lead}${made}${info.score === 0 ? '' : `${erasedNote}.`}${bestNote}</p>
      ${shareLine ? shareBlock(shareLine) : ''}
      <div class="row">
        <button class="primary" type="button" data-action="again">Run again</button>
        <button class="secondary" type="button" data-action="replay">Watch replay</button>
        <button class="ghost-btn" type="button" data-action="menu">Menu</button>
      </div>
      <span class="hint"><kbd>Space</kbd> runs again</span>`,
      actions,
      'again',
    );
  }
}
