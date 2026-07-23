/**
 * Инфраструктура модальных окон.
 * Управляет открытием, закрытием и доступностью диалогов.
 */

let modalRoot = null;
let activeModal = null;
let previousFocus = null;

/**
 * @param {HTMLElement} rootElement
 */
export function initModals(rootElement) {
  modalRoot = rootElement;
}

/**
 * @param {{ title?: string, content?: HTMLElement|string }} options
 * @returns {HTMLElement|null} корневой элемент диалога
 */
export function openModal({ title = '', content = null } = {}) {
  if (!modalRoot) {
    return null;
  }

  closeModal();

  previousFocus = document.activeElement;

  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const header = document.createElement('header');
  header.className = 'modal__header';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'modal__close';
  closeButton.setAttribute('aria-label', 'Закрыть окно');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', closeModal);

  if (title) {
    const titleElement = document.createElement('h2');
    titleElement.className = 'modal__title';
    titleElement.id = 'modal-title';
    titleElement.textContent = title;
    dialog.setAttribute('aria-labelledby', 'modal-title');
    header.append(titleElement, closeButton);
  } else {
    dialog.setAttribute('aria-label', 'Диалоговое окно');
    header.classList.add('modal__header--close-only');
    header.append(closeButton);
  }

  const body = document.createElement('div');
  body.className = 'modal__body';

  if (content instanceof HTMLElement) {
    body.append(content);
  } else if (typeof content === 'string' && content.length > 0) {
    body.textContent = content;
  }

  dialog.append(header, body);
  modalRoot.append(dialog);
  modalRoot.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  modalRoot.addEventListener('click', handleBackdropClick);
  document.addEventListener('keydown', handleKeydown);

  activeModal = dialog;
  closeButton.focus();

  return dialog;
}

export function closeModal() {
  if (!modalRoot || !activeModal) {
    return;
  }

  modalRoot.removeEventListener('click', handleBackdropClick);
  document.removeEventListener('keydown', handleKeydown);

  modalRoot.replaceChildren();
  modalRoot.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }

  activeModal = null;
  previousFocus = null;
}

export function isModalOpen() {
  return activeModal !== null;
}

function handleBackdropClick(event) {
  if (event.target === modalRoot) {
    closeModal();
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
}
