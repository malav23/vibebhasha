import { CSS_PREFIX, ANIMATION } from '../shared/constants';
import { PREVIEW_STRINGS } from '../shared/constants/confirmation-ui';

export interface PreviewResult {
  action: 'insert' | 'edit' | 'cancel';
  editedPrompt?: string;
}

export class PreviewModal {
  private container: HTMLElement | null = null;
  private resolvePromise: ((result: PreviewResult) => void) | null = null;
  private originalPrompt: string = '';

  /**
   * Show the preview modal with the elaborated prompt
   */
  show(
    elaboratedPrompt: string,
    originalText: string,
    translatedText: string
  ): Promise<PreviewResult> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.originalPrompt = elaboratedPrompt;

      // Remove any existing modal
      this.hide(false);

      // Create the modal container
      this.container = document.createElement('div');
      this.container.className = `${CSS_PREFIX}modal-overlay`;
      this.container.innerHTML = this.createModalHTML(elaboratedPrompt, originalText, translatedText);

      // Add to DOM
      document.body.appendChild(this.container);

      // Animate in
      requestAnimationFrame(() => {
        this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
      });

      // Setup event listeners
      this.setupEventListeners();
    });
  }

  /**
   * Hide and remove the modal
   */
  hide(cancelled: boolean = true): void {
    if (this.container) {
      this.container.classList.remove(`${CSS_PREFIX}modal-visible`);

      if (cancelled && this.resolvePromise) {
        this.resolvePromise({ action: 'cancel' });
        this.resolvePromise = null;
      }

      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, ANIMATION.FADE_OUT);
    }
  }

  /**
   * Create the modal HTML
   */
  private createModalHTML(
    elaboratedPrompt: string,
    originalText: string,
    translatedText: string
  ): string {
    const strings = PREVIEW_STRINGS;

    return `
      <div class="${CSS_PREFIX}modal">
        <div class="${CSS_PREFIX}modal-content ${CSS_PREFIX}preview-modal">
          <div class="${CSS_PREFIX}preview-header">
            <h3>${strings.elaboratedPrompt}</h3>
          </div>

          <div class="${CSS_PREFIX}preview-sections">
            <div class="${CSS_PREFIX}preview-section ${CSS_PREFIX}preview-original">
              <div class="${CSS_PREFIX}preview-section-label">Original (transcribed):</div>
              <div class="${CSS_PREFIX}preview-section-content">"${this.escapeHtml(originalText)}"</div>
            </div>

            <div class="${CSS_PREFIX}preview-section ${CSS_PREFIX}preview-translated">
              <div class="${CSS_PREFIX}preview-section-label">Translated:</div>
              <div class="${CSS_PREFIX}preview-section-content">"${this.escapeHtml(translatedText)}"</div>
            </div>

            <div class="${CSS_PREFIX}preview-divider">
              <span>Elaborated for Lovable</span>
            </div>

            <div class="${CSS_PREFIX}preview-main">
              <div class="${CSS_PREFIX}preview-prompt-display" id="${CSS_PREFIX}prompt-display">
                ${this.escapeHtml(elaboratedPrompt)}
              </div>
              <textarea
                class="${CSS_PREFIX}preview-prompt-edit"
                id="${CSS_PREFIX}prompt-edit"
                style="display: none;"
              >${elaboratedPrompt}</textarea>
            </div>
          </div>

          <div class="${CSS_PREFIX}modal-actions ${CSS_PREFIX}preview-actions">
            <button class="${CSS_PREFIX}insert-btn ${CSS_PREFIX}btn-primary">
              ${strings.insertIntoLovable}
            </button>
            <button class="${CSS_PREFIX}edit-btn ${CSS_PREFIX}btn-secondary">
              ${strings.edit}
            </button>
            <button class="${CSS_PREFIX}cancel-btn ${CSS_PREFIX}btn-tertiary">
              ${strings.cancel}
            </button>
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

    const insertBtn = this.container.querySelector(`.${CSS_PREFIX}insert-btn`);
    const editBtn = this.container.querySelector(`.${CSS_PREFIX}edit-btn`) as HTMLButtonElement;
    const cancelBtn = this.container.querySelector(`.${CSS_PREFIX}cancel-btn`);
    const promptDisplay = this.container.querySelector(`#${CSS_PREFIX}prompt-display`) as HTMLElement;
    const promptEdit = this.container.querySelector(`#${CSS_PREFIX}prompt-edit`) as HTMLTextAreaElement;
    const overlay = this.container;

    let isEditing = false;

    // Insert button
    insertBtn?.addEventListener('click', () => {
      const finalPrompt = isEditing ? promptEdit.value : this.originalPrompt;
      this.handleAction('insert', finalPrompt);
    });

    // Edit toggle button
    editBtn?.addEventListener('click', () => {
      isEditing = !isEditing;

      if (isEditing) {
        promptDisplay.style.display = 'none';
        promptEdit.style.display = 'block';
        promptEdit.focus();
        editBtn.textContent = 'Done Editing';
      } else {
        promptDisplay.style.display = 'block';
        promptEdit.style.display = 'none';
        promptDisplay.textContent = promptEdit.value;
        editBtn.textContent = PREVIEW_STRINGS.edit;
      }
    });

    // Cancel button
    cancelBtn?.addEventListener('click', () => {
      this.handleAction('cancel');
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.handleAction('cancel');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.handleAction('cancel');
    } else if (e.key === 'Enter' && e.ctrlKey) {
      const promptEdit = this.container?.querySelector(`#${CSS_PREFIX}prompt-edit`) as HTMLTextAreaElement;
      this.handleAction('insert', promptEdit?.value || this.originalPrompt);
    }
  };

  /**
   * Handle action and resolve promise
   */
  private handleAction(action: 'insert' | 'edit' | 'cancel', editedPrompt?: string): void {
    if (!this.resolvePromise) return;

    document.removeEventListener('keydown', this.handleKeyDown);

    this.resolvePromise({
      action,
      editedPrompt: action === 'insert' ? editedPrompt : undefined,
    });
    this.resolvePromise = null;

    this.hide(false);
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton instance
let previewModalInstance: PreviewModal | null = null;

export function getPreviewModal(): PreviewModal {
  if (!previewModalInstance) {
    previewModalInstance = new PreviewModal();
  }
  return previewModalInstance;
}
