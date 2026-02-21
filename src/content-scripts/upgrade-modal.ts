import { CSS_PREFIX, ANIMATION } from '../shared/constants';
import { UPGRADE_STRINGS } from '../shared/constants/confirmation-ui';

export class UpgradeModal {
  private container: HTMLElement | null = null;
  private onUpgradeCallback: (() => void) | null = null;
  private onDismissCallback: (() => void) | null = null;

  /**
   * Show the upgrade modal
   */
  show(onUpgrade: () => void, onDismiss: () => void): void {
    this.onUpgradeCallback = onUpgrade;
    this.onDismissCallback = onDismiss;

    // Remove any existing modal
    this.hide();

    const strings = UPGRADE_STRINGS;

    // Create the modal container
    this.container = document.createElement('div');
    this.container.className = `${CSS_PREFIX}modal-overlay`;
    this.container.innerHTML = this.createModalHTML(strings);

    // Add to DOM
    document.body.appendChild(this.container);

    // Animate in
    requestAnimationFrame(() => {
      this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Hide and remove the modal
   */
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

  /**
   * Create the modal HTML
   */
  private createModalHTML(strings: typeof UPGRADE_STRINGS): string {
    return `
      <div class="${CSS_PREFIX}modal">
        <div class="${CSS_PREFIX}modal-content ${CSS_PREFIX}upgrade-modal">
          <div class="${CSS_PREFIX}upgrade-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
            </svg>
          </div>

          <h2 class="${CSS_PREFIX}upgrade-title">${strings.title}</h2>

          <p class="${CSS_PREFIX}upgrade-message">${strings.message}</p>

          <div class="${CSS_PREFIX}upgrade-features">
            <div class="${CSS_PREFIX}feature-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>100 voice prompts per day</span>
            </div>
            <div class="${CSS_PREFIX}feature-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Priority processing</span>
            </div>
            <div class="${CSS_PREFIX}feature-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Advanced prompt optimization</span>
            </div>
          </div>

          <div class="${CSS_PREFIX}modal-actions">
            <button class="${CSS_PREFIX}upgrade-btn ${CSS_PREFIX}btn-primary">
              ${strings.upgradeButton}
            </button>
            <button class="${CSS_PREFIX}dismiss-btn ${CSS_PREFIX}btn-secondary">
              ${strings.dismissButton}
            </button>
          </div>

          <div class="${CSS_PREFIX}upgrade-note">
            Your limit resets at midnight UTC
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    const upgradeBtn = this.container.querySelector(`.${CSS_PREFIX}upgrade-btn`);
    const dismissBtn = this.container.querySelector(`.${CSS_PREFIX}dismiss-btn`);
    const overlay = this.container;

    // Upgrade button
    upgradeBtn?.addEventListener('click', () => {
      this.onUpgradeCallback?.();
      this.hide();
    });

    // Dismiss button
    dismissBtn?.addEventListener('click', () => {
      this.onDismissCallback?.();
      this.hide();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onDismissCallback?.();
        this.hide();
      }
    });

    // Keyboard shortcuts
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
