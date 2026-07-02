import { CSS_PREFIX } from '../shared/constants';

/**
 * Adapter for interacting with Lovable.dev's DOM elements
 */
export class LovableAdapter {
  private micButtonContainer: HTMLElement | null = null;
  private micButton: HTMLElement | null = null;
  private usageBadge: HTMLElement | null = null;
  private isFloatingButton: boolean = false;

  /**
   * Initialize the adapter and inject the microphone button
   */
  async init(): Promise<void> {
    console.log('VibeBhasha: Initializing Lovable adapter...');

    // Wait for Lovable's UI to be ready
    await this.waitForLovableReady();
    console.log('VibeBhasha: Lovable UI ready');

    // Inject the microphone button
    this.injectMicrophoneButton();

    // Watch for DOM changes (in case Lovable re-renders)
    this.observeDOMChanges();
    console.log('VibeBhasha: Adapter initialized');
  }

  /**
   * Wait for Lovable's input area to be available
   */
  private async waitForLovableReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const inputArea = this.findInputArea();
        if (inputArea) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 200); // Reduced from 500ms to 200ms

      // Show floating button immediately while waiting
      setTimeout(() => {
        if (!this.micButton) {
          this.injectFloatingButton();
        }
      }, 1000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  /**
   * Find Lovable's input area with resilient selectors
   */
  private findInputArea(): HTMLElement | null {
    const selectors = [
      // Data attributes
      '[data-testid="prompt-input"]',
      '[data-testid="chat-input"]',
      // ARIA roles
      '[role="textbox"][aria-label*="prompt" i]',
      '[role="textbox"][aria-label*="message" i]',
      // React patterns
      '[class*="PromptInput"]',
      '[class*="ChatInput"]',
      // Placeholder-based
      'textarea[placeholder*="Lovable"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="describe"]',
      'textarea[placeholder*="create"]',
      'textarea[placeholder*="Build"]',
      'textarea[placeholder*="Type"]',
      // Class-based
      '.prompt-input',
      '.chat-input',
      // Generic fallbacks
      'form textarea',
      'textarea',
      '[contenteditable="true"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('VibeBhasha: Found input area with selector:', selector);
        return element as HTMLElement;
      }
    }

    console.warn('VibeBhasha: Could not find input area with any selector');
    return null;
  }

  /**
   * Find the container where we should inject our button
   */
  private findButtonContainer(): HTMLElement | null {
    const inputArea = this.findInputArea();
    if (!inputArea) {
      console.warn('VibeBhasha: No input area found, cannot find container');
      return null;
    }

    // Walk up the DOM tree to find a suitable container
    let current: HTMLElement = inputArea;
    for (let i = 0; i < 5; i++) {
      const parentEl: HTMLElement | null = current.parentElement;
      if (!parentEl) break;

      const classes = parentEl.classList.toString();
      if (parentEl.tagName === 'FORM' ||
          classes.includes('input') ||
          classes.includes('prompt') ||
          classes.includes('chat')) {
        return parentEl;
      }
      current = parentEl;
    }

    // Fallback: just use the input's parent
    return inputArea.parentElement || null;
  }

  /**
   * Inject the microphone button into Lovable's UI
   */
  private injectMicrophoneButton(): void {
    // Remove any existing button
    this.removeMicrophoneButton();

    const container = this.findButtonContainer();
    if (!container) {
      console.warn('VibeBhasha: Could not find container, using floating button');
      this.injectFloatingButton();
      return;
    }

    // Create the button container
    this.micButtonContainer = document.createElement('div');
    this.micButtonContainer.className = `${CSS_PREFIX}mic-button-container`;

    // Create the button
    this.micButton = document.createElement('button');
    this.micButton.className = `${CSS_PREFIX}mic-button`;
    this.micButton.title = 'VibeBhasha Voice Input (Alt+V)';
    this.micButton.setAttribute('data-vibebhasha', 'true');
    this.micButton.setAttribute('aria-label', 'Start voice recording');
    this.micButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;

    this.isFloatingButton = false;
    this.micButtonContainer.appendChild(this.micButton);
    container.appendChild(this.micButtonContainer);
    console.log('VibeBhasha: Mic button injected successfully');
  }

  /**
   * Inject a floating microphone button as fallback
   */
  private injectFloatingButton(): void {
    // Don't re-inject if floating button already exists and is in DOM
    if (this.micButton && this.isFloatingButton && document.contains(this.micButton)) {
      return;
    }

    // Remove any existing floating button
    document.querySelectorAll('.lvh-floating-mic').forEach(el => el.remove());

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'lvh-floating-mic lvh-mic-entering';
    floatingBtn.title = 'VibeBhasha Voice Input (Alt+V)';
    floatingBtn.setAttribute('data-vibebhasha', 'true');
    floatingBtn.setAttribute('aria-label', 'Start voice recording');
    floatingBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;

    document.body.appendChild(floatingBtn);
    this.micButton = floatingBtn;
    this.micButtonContainer = floatingBtn; // Track floating button to fix MutationObserver bug
    this.isFloatingButton = true;

    // Remove entrance animation class after it completes
    setTimeout(() => {
      floatingBtn.classList.remove('lvh-mic-entering');
    }, 600);

    console.log('VibeBhasha: Floating mic button injected');
  }

  /**
   * Remove the microphone button
   */
  private removeMicrophoneButton(): void {
    this.micButtonContainer?.remove();
    // Also clean up any orphaned floating buttons
    document.querySelectorAll('.lvh-floating-mic').forEach(el => el.remove());
    this.micButtonContainer = null;
    this.micButton = null;
    this.usageBadge = null;
    this.isFloatingButton = false;
  }

  /**
   * Set the click handler for the microphone button
   */
  setMicButtonClickHandler(handler: () => void): void {
    if (this.micButton) {
      this.micButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler();
      });
    } else {
      console.warn('VibeBhasha: No mic button found to attach handler');
      // Retry after a short delay in case button hasn't loaded yet
      setTimeout(() => {
        if (this.micButton) {
          this.micButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handler();
          });
        }
      }, 2000);
    }
  }

  /**
   * Update the microphone button state
   */
  setMicButtonState(state: 'idle' | 'recording' | 'processing'): void {
    if (!this.micButton) return;

    this.micButton.classList.remove(
      `${CSS_PREFIX}mic-recording`,
      `${CSS_PREFIX}mic-processing`,
      `${CSS_PREFIX}mic-last-prompt`,
      `${CSS_PREFIX}mic-exhausted`
    );

    if (state === 'recording') {
      this.micButton.classList.add(`${CSS_PREFIX}mic-recording`);
    } else if (state === 'processing') {
      this.micButton.classList.add(`${CSS_PREFIX}mic-processing`);
    }
  }

  /**
   * Update usage badge on mic button
   * @param remaining - number of prompts remaining (-1 for no badge / pro)
   */
  updateUsageBadge(remaining: number): void {
    if (!this.micButton) return;

    // Remove existing badge
    this.usageBadge?.remove();
    this.usageBadge = null;

    // Remove scarcity classes
    this.micButton.classList.remove(
      `${CSS_PREFIX}mic-last-prompt`,
      `${CSS_PREFIX}mic-exhausted`
    );

    // Pro users: no badge
    if (remaining < 0) return;

    // Exhausted
    if (remaining === 0) {
      this.micButton.classList.add(`${CSS_PREFIX}mic-exhausted`);
      this.micButton.title = 'Go Pro for unlimited voice prompts';
      return;
    }

    // Last prompt warning
    if (remaining === 1) {
      this.micButton.classList.add(`${CSS_PREFIX}mic-last-prompt`);
    }

    // Create badge
    this.usageBadge = document.createElement('span');
    this.usageBadge.className = `${CSS_PREFIX}usage-badge`;
    if (remaining === 1) {
      this.usageBadge.classList.add(`${CSS_PREFIX}badge-warning`);
    }
    this.usageBadge.textContent = `${remaining}`;
    this.usageBadge.title = `${remaining} free prompt${remaining !== 1 ? 's' : ''} left today`;

    // Insert badge relative to button position
    if (this.isFloatingButton) {
      this.micButton.style.position = 'relative';
      this.micButton.appendChild(this.usageBadge);
    } else if (this.micButtonContainer && this.micButtonContainer !== this.micButton) {
      this.micButtonContainer.style.position = 'relative';
      this.micButtonContainer.insertBefore(this.usageBadge, this.micButton);
    } else {
      this.micButton.style.position = 'relative';
      this.micButton.appendChild(this.usageBadge);
    }
  }

  /**
   * Get the mic button element
   */
  getMicButton(): HTMLElement | null {
    return this.micButton;
  }

  /**
   * Insert text into Lovable's input field
   */
  insertTextIntoInput(text: string): boolean {
    const inputArea = this.findInputArea();
    if (!inputArea) {
      console.warn('VibeBhasha: Could not find input area');
      return false;
    }

    if (inputArea.tagName.toLowerCase() === 'textarea') {
      const textarea = inputArea as HTMLTextAreaElement;
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.focus();
    } else if (inputArea.isContentEditable) {
      inputArea.textContent = text;
      inputArea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }));
      inputArea.focus();
      const range = document.createRange();
      range.selectNodeContents(inputArea);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else if (inputArea.tagName.toLowerCase() === 'input') {
      const input = inputArea as HTMLInputElement;
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
    }

    return true;
  }

  /**
   * Observe DOM changes to re-inject button if needed.
   * Fixed: tracks floating button via micButtonContainer to prevent infinite loop.
   */
  private observeDOMChanges(): void {
    const observer = new MutationObserver(() => {
      // Only re-inject if our tracked container is no longer in DOM
      if (this.micButtonContainer && !document.contains(this.micButtonContainer)) {
        this.injectMicrophoneButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if we're on a Lovable page
   */
  static isLovablePage(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'lovable.dev' || hostname.endsWith('.lovable.dev');
  }
}

// Singleton instance
let lovableAdapterInstance: LovableAdapter | null = null;

export function getLovableAdapter(): LovableAdapter {
  if (!lovableAdapterInstance) {
    lovableAdapterInstance = new LovableAdapter();
  }
  return lovableAdapterInstance;
}
