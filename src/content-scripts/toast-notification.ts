import { CSS_PREFIX } from '../shared/constants';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

const ICONS: Record<ToastType, string> = {
  success: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

class ToastNotification {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();
  private toastId = 0;

  private ensureContainer(): HTMLElement {
    if (!this.container || !document.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = `${CSS_PREFIX}toast-container`;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(options: ToastOptions): string {
    const { message, type = 'info', duration = 4000, action } = options;
    const container = this.ensureContainer();
    const id = `toast-${++this.toastId}`;

    const toast = document.createElement('div');
    toast.className = `${CSS_PREFIX}toast ${CSS_PREFIX}toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="${CSS_PREFIX}toast-icon">${ICONS[type]}</div>
      <div class="${CSS_PREFIX}toast-message">${message}</div>
      ${action ? `<button class="${CSS_PREFIX}toast-action">${action.label}</button>` : ''}
      <button class="${CSS_PREFIX}toast-close" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);
    this.toasts.set(id, toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add(`${CSS_PREFIX}toast-visible`);
    });

    // Setup close button
    const closeBtn = toast.querySelector(`.${CSS_PREFIX}toast-close`);
    closeBtn?.addEventListener('click', () => this.dismiss(id));

    // Setup action button
    if (action) {
      const actionBtn = toast.querySelector(`.${CSS_PREFIX}toast-action`);
      actionBtn?.addEventListener('click', () => {
        action.onClick();
        this.dismiss(id);
      });
    }

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  dismiss(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.remove(`${CSS_PREFIX}toast-visible`);
    toast.classList.add(`${CSS_PREFIX}toast-hiding`);

    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);
    }, 300);
  }

  success(message: string, duration = 2000): string {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, action?: ToastAction): string {
    return this.show({ message, type: 'error', duration: 6000, action });
  }

  warning(message: string, duration = 4000): string {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration = 4000): string {
    return this.show({ message, type: 'info', duration });
  }
}

// Singleton
let toastInstance: ToastNotification | null = null;

export function getToast(): ToastNotification {
  if (!toastInstance) {
    toastInstance = new ToastNotification();
  }
  return toastInstance;
}
