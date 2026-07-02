import { CSS_PREFIX, ANIMATION } from '../shared/constants';

export class UpgradeModal {
  private container: HTMLElement | null = null;
  private onUpgradeCallback: (() => void) | null = null;
  private onDismissCallback: (() => void) | null = null;

  /**
   * Show the upgrade modal as a conversion moment.
   * @param transcribedText - The text the user was trying to send (shown in modal)
   * @param onUpgrade - Called when user clicks upgrade
   * @param onDismiss - Called when user dismisses
   */
  show(transcribedText: string, onUpgrade: () => void, onDismiss: () => void): void {
    this.onUpgradeCallback = onUpgrade;
    this.onDismissCallback = onDismiss;

    this.hide();

    this.container = document.createElement('div');
    this.container.className = `${CSS_PREFIX}modal-overlay`;
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-label', 'Upgrade to VibeBhasha Pro');
    this.container.innerHTML = this.createModalHTML(transcribedText);

    document.body.appendChild(this.container);

    requestAnimationFrame(() => {
      this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
    });

    this.setupEventListeners();

    // Focus trap
    const firstButton = this.container.querySelector('button');
    (firstButton as HTMLElement)?.focus();
  }

  hide(): void {
    if (this.container) {
      this.container.classList.remove(`${CSS_PREFIX}modal-visible`);
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, ANIMATION.FADE_OUT);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private createModalHTML(transcribedText: string): string {
    const truncatedText = transcribedText.length > 80
      ? transcribedText.substring(0, 80) + '...'
      : transcribedText;

    return `
      <div class="${CSS_PREFIX}modal">
        <div class="${CSS_PREFIX}modal-content ${CSS_PREFIX}upgrade-modal-v2">

          ${transcribedText ? `
          <div class="${CSS_PREFIX}upgrade-context">
            <span class="${CSS_PREFIX}upgrade-context-label">You said:</span>
            <p class="${CSS_PREFIX}upgrade-context-text">"${truncatedText}"</p>
            <span class="${CSS_PREFIX}upgrade-context-hint">Upgrade to send it.</span>
          </div>
          ` : ''}

          <h2 class="${CSS_PREFIX}upgrade-title-v2">Unlock Unlimited Voice Prompts</h2>

          <div class="${CSS_PREFIX}upgrade-comparison">
            <div class="${CSS_PREFIX}upgrade-plan ${CSS_PREFIX}upgrade-plan-free">
              <div class="${CSS_PREFIX}plan-header">Free</div>
              <div class="${CSS_PREFIX}plan-price">$0<span>/mo</span></div>
              <ul class="${CSS_PREFIX}plan-features">
                <li>5 prompts total</li>
                <li>Standard speed</li>
                <li>Watermark on prompts</li>
              </ul>
            </div>

            <div class="${CSS_PREFIX}upgrade-plan ${CSS_PREFIX}upgrade-plan-pro">
              <div class="${CSS_PREFIX}plan-badge">RECOMMENDED</div>
              <div class="${CSS_PREFIX}plan-header">Pro</div>
              <div class="${CSS_PREFIX}plan-price">$4.99<span>/mo</span></div>
              <ul class="${CSS_PREFIX}plan-features">
                <li class="${CSS_PREFIX}feature-highlight">Unlimited prompts</li>
                <li class="${CSS_PREFIX}feature-highlight">Priority processing</li>
                <li class="${CSS_PREFIX}feature-highlight">No watermark</li>
                <li>Prompt history</li>
                <li>Dark mode</li>
                <li>Multi-platform</li>
              </ul>
            </div>
          </div>

          <div class="${CSS_PREFIX}upgrade-actions-v2">
            <button class="${CSS_PREFIX}upgrade-cta ${CSS_PREFIX}btn-primary">
              Start 7-day free trial
            </button>
            <button class="${CSS_PREFIX}upgrade-dismiss-v2 ${CSS_PREFIX}btn-tertiary">
              Not now
            </button>
          </div>

          <p class="${CSS_PREFIX}upgrade-social-proof">
            Join 2,000+ developers using VibeBhasha Pro
          </p>

          <p class="${CSS_PREFIX}upgrade-trial-note">
            Cancel anytime. No charge for 7 days.
          </p>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    const upgradeBtn = this.container.querySelector(`.${CSS_PREFIX}upgrade-cta`);
    const dismissBtn = this.container.querySelector(`.${CSS_PREFIX}upgrade-dismiss-v2`);
    const overlay = this.container;

    upgradeBtn?.addEventListener('click', () => {
      this.onUpgradeCallback?.();
      this.hide();
    });

    dismissBtn?.addEventListener('click', () => {
      this.onDismissCallback?.();
      this.hide();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onDismissCallback?.();
        this.hide();
      }
    });

    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.onDismissCallback?.();
      this.hide();
    }
  };
}

// Singleton instance
let upgradeModalInstance: UpgradeModal | null = null;

export function getUpgradeModal(): UpgradeModal {
  if (!upgradeModalInstance) {
    upgradeModalInstance = new UpgradeModal();
  }
  return upgradeModalInstance;
}
