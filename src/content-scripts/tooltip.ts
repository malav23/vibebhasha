import { CSS_PREFIX, STORAGE_KEYS } from '../shared/constants';

/**
 * Shows a pulsing tooltip on the mic button after first sign-in.
 * Shown once, then dismissed permanently.
 */
export async function showMicTooltip(micButton: HTMLElement | null): Promise<void> {
  if (!micButton) return;

  // Check if already shown
  const storage = await chrome.storage.local.get('tooltip_shown');
  if (storage.tooltip_shown) return;

  const tooltip = document.createElement('div');
  tooltip.className = `${CSS_PREFIX}tooltip`;
  tooltip.textContent = 'Click here or press Alt+V to start';

  // Position relative to mic button
  const container = micButton.parentElement || micButton;
  container.style.position = 'relative';
  container.appendChild(tooltip);

  // Mark as shown
  await chrome.storage.local.set({ tooltip_shown: true });

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    setTimeout(() => tooltip.remove(), 300);
  }, 8000);

  // Dismiss on click
  micButton.addEventListener('click', () => {
    tooltip.remove();
  }, { once: true });
}
