import { KEYBOARD_SHORTCUTS } from '../shared/constants';

export type KeyboardCallback = () => void;

export class KeyboardHandler {
  private callback: KeyboardCallback | null = null;
  private isListening: boolean = false;

  /**
   * Start listening for keyboard shortcuts
   */
  start(callback: KeyboardCallback): void {
    if (this.isListening) {
      this.stop();
    }

    this.callback = callback;
    this.isListening = true;

    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  stop(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
    this.callback = null;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Don't trigger if user is typing in an input field
    if (this.isTypingInInput(e.target as HTMLElement)) {
      return;
    }

    const isMac = navigator.platform.toLowerCase().includes('mac');
    const shortcut = isMac
      ? KEYBOARD_SHORTCUTS.TOGGLE_RECORDING_MAC
      : KEYBOARD_SHORTCUTS.TOGGLE_RECORDING;

    // Check if the shortcut matches
    const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatches = e.ctrlKey === shortcut.ctrlKey;
    const shiftMatches = e.shiftKey === shortcut.shiftKey;
    const metaMatches = e.metaKey === shortcut.metaKey;

    if (keyMatches && ctrlMatches && shiftMatches && metaMatches) {
      e.preventDefault();
      e.stopPropagation();
      this.callback?.();
    }
  };

  /**
   * Check if the user is typing in an input field
   */
  private isTypingInInput(target: HTMLElement): boolean {
    const tagName = target.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = target.isContentEditable;

    return isInput || isContentEditable;
  }
}

// Singleton instance
let keyboardHandlerInstance: KeyboardHandler | null = null;

export function getKeyboardHandler(): KeyboardHandler {
  if (!keyboardHandlerInstance) {
    keyboardHandlerInstance = new KeyboardHandler();
  }
  return keyboardHandlerInstance;
}
