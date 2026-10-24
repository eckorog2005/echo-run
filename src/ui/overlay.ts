import type { RunResult, TitleInfo } from '../game/session.ts';
import { parsePadSide, type PadSide } from '../render/view.ts';
import { deathCard, titleCard, type Button, type DeathAction, type TitleAction } from './cards.ts';

const BUTTON_CLASS: Record<Button<string>['style'], string> = { primary: 'primary', secondary: 'secondary', ghost: 'ghost-btn' };

function buttons<A extends string>(list: readonly Button<A>[]): string {
  return list
    .map((b) => `<button class="${BUTTON_CLASS[b.style]}" type="button" data-action="${b.action}">${b.label}</button>`)
    .join('\n        ');
}

function shareBlock(line: string): string {
  return `
    <div class="share">
      <code id="share-line">${line}</code>
      <button class="ghost-btn" type="button" data-action="copy">Copy</button>
    </div>`;
}

function padSideToggle(side: PadSide): string {
  const option = (value: PadSide, label: string): string =>
    `<button type="button" data-pad-side="${value}" aria-pressed="${side === value}">${label}</button>`;
  return `
    <div class="pad-side">
      <small id="pad-side-label">Steering pad in landscape</small>
      <div class="seg" role="group" aria-labelledby="pad-side-label">${option('left', 'Left')}${option('right', 'Right')}</div>
    </div>`;
}

/** The card shown over the arena for the title, death, and result screens. */
export class Overlay {
  constructor(private readonly el: HTMLElement) {}

  hide(): void {
    this.el.hidden = true;
  }

  private show<A extends string>(html: string, actions: Record<A, () => void>, kind: 'title' | 'death'): void {
    this.el.innerHTML = `<div class="card ${kind}">${html}</div>`;
    this.el.hidden = false;
    this.el.scrollTop = 0;
    this.el.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      const name = btn.dataset.action ?? '';
      const run = (actions as Record<string, (() => void) | undefined>)[name];
      btn.addEventListener('click', name === 'copy' ? () => this.copy(btn) : () => run?.());
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

  showTitle(info: TitleInfo, actions: Record<TitleAction, () => void>, padSide: { side: PadSide; choose: (side: PadSide) => void } | null): void {
    const card = titleCard(info);
    const dailySection = card.todayScore
      ? `<p>Today's run: <strong>${card.todayScore}</strong>. A new course unlocks tomorrow.</p>
         ${card.shareLine ? shareBlock(card.shareLine) : ''}`
      : `<p>Today's course is the same for everyone. Your first daily run is the one that counts.</p>`;
    const legend = card.legend.map((l) => `<li><span class="dot ${l.dot}"></span><span>${l.text}</span></li>`).join('\n        ');
    this.show(
      `
      <div class="rules">
        <h2>Outrun <em>yourself.</em></h2>
        <p>Grab the orb. The route you took to reach it comes back as an <strong>echo</strong> that keeps repeating. Touch any echo and the run is over.</p>
        <ul class="legend">
          ${legend}
        </ul>
      </div>
      <div class="play">
        <div class="daily">
          <small>Daily · ${card.today}</small>
          ${dailySection}
        </div>
        ${padSide ? padSideToggle(padSide.side) : ''}
        <div class="row">
          ${buttons(card.buttons)}
          <span class="hint">or press <kbd>Space</kbd></span>
        </div>
      </div>`,
      actions,
      'title',
    );
    if (padSide) this.bindPadSide(padSide.choose);
  }

  private bindPadSide(choose: (side: PadSide) => void): void {
    const buttons = [...this.el.querySelectorAll<HTMLButtonElement>('[data-pad-side]')];
    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        const side = parsePadSide(btn.dataset.padSide);
        for (const b of buttons) b.setAttribute('aria-pressed', String(b === btn));
        choose(side);
      });
    }
  }

  showDeath(result: RunResult, actions: Record<DeathAction, () => void>): void {
    const card = deathCard(result);
    const badge = card.badge ? `<span class="badge${card.badge.muted ? ' muted' : ''}">${card.badge.text}</span>` : '';
    const best = card.best === null ? '' : ` Best: <strong>${card.best}</strong>.`;
    this.show(
      `
      <div class="headline">
        ${badge}
        <h2>${card.headline}</h2>
        <div class="big">${card.score}</div>
      </div>
      <p>${card.summary}${best}</p>
      ${card.shareLine ? shareBlock(card.shareLine) : ''}
      <div class="row">
        ${buttons(card.buttons)}
      </div>
      <span class="hint"><kbd>Space</kbd> runs again</span>`,
      actions,
      'death',
    );
  }
}
