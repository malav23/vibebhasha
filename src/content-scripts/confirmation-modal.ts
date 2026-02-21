import { CSS_PREFIX, ANIMATION } from '../shared/constants';
import { LanguageCode, ObjectiveType, ConfirmationUIStrings } from '../shared/types';
import { getConfirmationStrings } from '../shared/constants/confirmation-ui';

export interface ConfirmationResult {
  confirmed: boolean;
  editedText?: string;
  objective: ObjectiveType;
  additionalContext?: string;
}

export class ConfirmationModal {
  private container: HTMLElement | null = null;
  private resolvePromise: ((result: ConfirmationResult) => void) | null = null;
  private currentLanguage: LanguageCode = 'hi';
  private originalText: string = '';

  /**
   * Show the confirmation modal and wait for user response
   */
  show(
    transcribedText: string,
    detectedLanguage: LanguageCode
  ): Promise<ConfirmationResult> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.currentLanguage = detectedLanguage;
      this.originalText = transcribedText;

      // Remove any existing modal
      this.hide(false);

      const strings = getConfirmationStrings(detectedLanguage);

      // Create the modal container
      this.container = document.createElement('div');
      this.container.className = `${CSS_PREFIX}modal-overlay`;
      this.container.innerHTML = this.createModalHTML(transcribedText, strings);

      // Add to DOM
      document.body.appendChild(this.container);

      // Animate in
      requestAnimationFrame(() => {
        this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
      });

      // Setup event listeners
      this.setupEventListeners(strings);

      // Focus the first radio button
      const firstRadio = this.container.querySelector('input[type="radio"]') as HTMLInputElement;
      firstRadio?.focus();
    });
  }

  /**
   * Hide and remove the modal
   */
  hide(cancelled: boolean = true): void {
    if (this.container) {
      this.container.classList.remove(`${CSS_PREFIX}modal-visible`);

      if (cancelled && this.resolvePromise) {
        this.resolvePromise({
          confirmed: false,
          objective: 'new_feature',
        });
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
  private createModalHTML(text: string, strings: ConfirmationUIStrings): string {
    return `
      <div class="${CSS_PREFIX}modal">
        <div class="${CSS_PREFIX}modal-content ${CSS_PREFIX}confirmation-modal">
          <div class="${CSS_PREFIX}modal-header">
            <span class="${CSS_PREFIX}you-said-label">${strings.youSaid}</span>
          </div>

          <div class="${CSS_PREFIX}transcription-container">
            <div class="${CSS_PREFIX}transcription-text" id="${CSS_PREFIX}transcription-display">
              "${text}"
            </div>
            <textarea
              class="${CSS_PREFIX}transcription-edit"
              id="${CSS_PREFIX}transcription-edit"
              style="display: none;"
            >${text}</textarea>
            <button class="${CSS_PREFIX}edit-btn" id="${CSS_PREFIX}edit-toggle">
              ${strings.edit}
            </button>
          </div>

          <div class="${CSS_PREFIX}is-correct-label">${strings.isCorrect}</div>

          <div class="${CSS_PREFIX}divider"></div>

          <div class="${CSS_PREFIX}objective-section">
            <label class="${CSS_PREFIX}objective-label">${strings.objectiveLabel}</label>
            <div class="${CSS_PREFIX}objective-options">
              <label class="${CSS_PREFIX}radio-option">
                <input type="radio" name="${CSS_PREFIX}objective" value="new_feature" checked>
                <span class="${CSS_PREFIX}radio-label">${strings.options.newFeature}</span>
              </label>
              <label class="${CSS_PREFIX}radio-option">
                <input type="radio" name="${CSS_PREFIX}objective" value="bug_fix">
                <span class="${CSS_PREFIX}radio-label">${strings.options.bugFix}</span>
              </label>
              <label class="${CSS_PREFIX}radio-option">
                <input type="radio" name="${CSS_PREFIX}objective" value="design_improvement">
                <span class="${CSS_PREFIX}radio-label">${strings.options.design}</span>
              </label>
              <label class="${CSS_PREFIX}radio-option">
                <input type="radio" name="${CSS_PREFIX}objective" value="other">
                <span class="${CSS_PREFIX}radio-label">${strings.options.other}</span>
              </label>
            </div>
          </div>

          <div class="${CSS_PREFIX}context-section">
            <label class="${CSS_PREFIX}context-label" for="${CSS_PREFIX}context-input">
              ${strings.contextLabel}
            </label>
            <textarea
              id="${CSS_PREFIX}context-input"
              class="${CSS_PREFIX}context-input"
              placeholder="${strings.contextPlaceholder}"
              rows="2"
            ></textarea>
          </div>

          <div class="${CSS_PREFIX}modal-actions">
            <button class="${CSS_PREFIX}proceed-btn ${CSS_PREFIX}btn-primary">
              ${strings.proceed}
            </button>
            <button class="${CSS_PREFIX}cancel-btn ${CSS_PREFIX}btn-secondary">
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
  private setupEventListeners(strings: ConfirmationUIStrings): void {
    if (!this.container) return;

    const editToggle = this.container.querySelector(`#${CSS_PREFIX}edit-toggle`) as HTMLButtonElement;
    const transcriptionDisplay = this.container.querySelector(`#${CSS_PREFIX}transcription-display`) as HTMLElement;
    const transcriptionEdit = this.container.querySelector(`#${CSS_PREFIX}transcription-edit`) as HTMLTextAreaElement;
    const proceedBtn = this.container.querySelector(`.${CSS_PREFIX}proceed-btn`);
    const cancelBtn = this.container.querySelector(`.${CSS_PREFIX}cancel-btn`);
    const overlay = this.container;

    let isEditing = false;

    // Edit toggle
    editToggle?.addEventListener('click', () => {
      isEditing = !isEditing;

      if (isEditing) {
        transcriptionDisplay.style.display = 'none';
        transcriptionEdit.style.display = 'block';
        transcriptionEdit.focus();
        transcriptionEdit.select();
        editToggle.textContent = strings.isCorrect.replace('?', '');
      } else {
        transcriptionDisplay.style.display = 'block';
        transcriptionEdit.style.display = 'none';
        transcriptionDisplay.textContent = `"${transcriptionEdit.value}"`;
        editToggle.textContent = strings.edit;
      }
    });

    // Proceed button
    proceedBtn?.addEventListener('click', () => {
      this.handleProceed(transcriptionEdit.value);
    });

    // Cancel button
    cancelBtn?.addEventListener('click', () => {
      this.hide(true);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide(true);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide(true);
    } else if (e.key === 'Enter' && e.ctrlKey) {
      const transcriptionEdit = this.container?.querySelector(`#${CSS_PREFIX}transcription-edit`) as HTMLTextAreaElement;
      this.handleProceed(transcriptionEdit?.value || this.originalText);
    }
  };

  /**
   * Handle the proceed action
   */
  private handleProceed(editedText: string): void {
    if (!this.container || !this.resolvePromise) return;

    // Get selected objective
    const selectedObjective = this.container.querySelector(
      `input[name="${CSS_PREFIX}objective"]:checked`
    ) as HTMLInputElement;
    const objective = (selectedObjective?.value || 'new_feature') as ObjectiveType;

    // Get additional context
    const contextInput = this.container.querySelector(`#${CSS_PREFIX}context-input`) as HTMLTextAreaElement;
    const additionalContext = contextInput?.value.trim() || undefined;

    // Resolve the promise
    this.resolvePromise({
      confirmed: true,
      editedText: editedText !== this.originalText ? editedText : undefined,
      objective,
      additionalContext,
    });
    this.resolvePromise = null;

    // Clean up
    document.removeEventListener('keydown', this.handleKeyDown);
    this.hide(false);
  }
}

// Singleton instance
let confirmationModalInstance: ConfirmationModal | null = null;

export function getConfirmationModal(): ConfirmationModal {
  if (!confirmationModalInstance) {
    confirmationModalInstance = new ConfirmationModal();
  }
  return confirmationModalInstance;
}
