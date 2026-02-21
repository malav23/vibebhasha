import { CSS_PREFIX } from '../shared/constants';

/**
 * Adapter for interacting with Lovable.dev's DOM elements
 */
export class LovableAdapter {
  private micButtonContainer: HTMLElement | null = null;
  private micButton: HTMLElement | null = null;

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
      }, 500);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  /**
   * Find Lovable's input area
   * Note: These selectors may need to be updated based on Lovable's actual DOM structure
   */
  private findInputArea(): HTMLElement | null {
    // Try various selectors that might match Lovable's input area
    const selectors = [
      '[data-testid="prompt-input"]',
      '[data-testid="chat-input"]',
      'textarea[placeholder*="Lovable"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="describe"]',
      'textarea[placeholder*="create"]',
      '.prompt-input',
      '.chat-input',
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

    console.log('VibeBhasha: Looking for button container near input area');

    // Walk up the DOM tree to find a suitable container
    let current: HTMLElement = inputArea;
    for (let i = 0; i < 5; i++) {
      const parentEl: HTMLElement | null = current.parentElement;
      if (!parentEl) break;

      // Look for a container that looks like a form or input wrapper
      const classes = parentEl.classList.toString();
      if (parentEl.tagName === 'FORM' ||
          classes.includes('input') ||
          classes.includes('prompt') ||
          classes.includes('chat')) {
        console.log('VibeBhasha: Found form/input container:', parentEl.tagName, parentEl.className);
        return parentEl;
      }
      current = parentEl;
    }

    // Fallback: just use the input's parent
    const inputParent = inputArea.parentElement;
    if (inputParent) {
      console.log('VibeBhasha: Using input parent as container:', inputParent.tagName, inputParent.className);
      return inputParent;
    }

    return null;
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

    console.log('VibeBhasha: Found container, injecting mic button');

    // Create the button container
    this.micButtonContainer = document.createElement('div');
    this.micButtonContainer.className = `${CSS_PREFIX}mic-button-container`;

    // Create the button
    this.micButton = document.createElement('button');
    this.micButton.className = `${CSS_PREFIX}mic-button`;
    this.micButton.title = 'VibeBhasha Voice Input (Ctrl+Shift+I)';
    this.micButton.setAttribute('data-vibebhasha', 'true');
    this.micButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;

    this.micButtonContainer.appendChild(this.micButton);
    container.appendChild(this.micButtonContainer);
    console.log('VibeBhasha: Mic button injected successfully');
  }

  /**
   * Inject a floating microphone button as fallback
   */
  private injectFloatingButton(): void {
    // Remove any existing floating button
    document.querySelector('.lvh-floating-mic')?.remove();

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'lvh-floating-mic';
    floatingBtn.title = 'VibeBhasha Voice Input (Ctrl+Shift+I)';
    floatingBtn.setAttribute('data-vibebhasha', 'true');
    floatingBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;

    document.body.appendChild(floatingBtn);
    this.micButton = floatingBtn;
    console.log('VibeBhasha: Floating mic button injected');
  }

  /**
   * Remove the microphone button
   */
  private removeMicrophoneButton(): void {
    this.micButtonContainer?.remove();
    this.micButtonContainer = null;
    this.micButton = null;
  }

  /**
   * Set the click handler for the microphone button
   */
  setMicButtonClickHandler(handler: () => void): void {
    if (this.micButton) {
      console.log('VibeBhasha: Setting mic button click handler');
      this.micButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('VibeBhasha: Mic button clicked!');
        handler();
      });
    } else {
      console.warn('VibeBhasha: No mic button found to attach handler');
    }
  }

  /**
   * Update the microphone button state
   */
  setMicButtonState(state: 'idle' | 'recording' | 'processing'): void {
    if (!this.micButton) return;

    // Remove all state classes (both regular and floating)
    this.micButton.classList.remove(
      `${CSS_PREFIX}mic-recording`,
      `${CSS_PREFIX}mic-processing`
    );

    // Add appropriate class
    if (state === 'recording') {
      this.micButton.classList.add(`${CSS_PREFIX}mic-recording`);
    } else if (state === 'processing') {
      this.micButton.classList.add(`${CSS_PREFIX}mic-processing`);
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
      console.warn('Lovable Voice Helper: Could not find input area');
      return false;
    }

    // Handle different input types
    if (inputArea.tagName.toLowerCase() === 'textarea') {
      const textarea = inputArea as HTMLTextAreaElement;
      textarea.value = text;

      // Trigger input events so Lovable recognizes the change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      // Focus the textarea
      textarea.focus();
    } else if (inputArea.isContentEditable) {
      // Handle contenteditable elements
      inputArea.textContent = text;

      // Trigger input event
      inputArea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      }));

      // Focus the element
      inputArea.focus();

      // Move cursor to end
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
   * Observe DOM changes to re-inject button if needed
   */
  private observeDOMChanges(): void {
    const observer = new MutationObserver(() => {
      // Check if our button still exists
      if (!document.contains(this.micButtonContainer)) {
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
