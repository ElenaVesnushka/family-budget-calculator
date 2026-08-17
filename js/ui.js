/**
 * Слой пользовательского интерфейса оболочки приложения.
 *
 * Отвечает за навигацию между разделами и применение темы оформления.
 * Конкретное наполнение разделов добавляется отдельными модулями.
 */

import { SECTION_IDS } from './state.js';

const DOM = {
  html: document.documentElement,
  navLinks: null,
  sections: null,
  main: null,
  notificationsList: null,
  modalRoot: null,
};

let onSectionChange = null;

/**
 * Кэширует ссылки на элементы оболочки.
 * @param {{ onSectionChange?: (sectionId: string) => void }} options
 */
export function initShell(options = {}) {
  onSectionChange = options.onSectionChange ?? null;

  DOM.navLinks = document.querySelectorAll('.app-nav__link[data-section]');
  DOM.sections = document.querySelectorAll('.app-section[data-section]');
  DOM.main = document.getElementById('main-content');
  DOM.notificationsList = document.getElementById('notifications-list');
  DOM.modalRoot = document.getElementById('modal-root');

  bindNavigation();
}

/**
 * Применяет тему оформления из настроек.
 */
export function applyTheme(theme) {
  const allowedThemes = ['light', 'dark', 'japanese', 'pearl'];
  const resolvedTheme = allowedThemes.includes(theme) ? theme : 'light';
  DOM.html.setAttribute('data-theme', resolvedTheme);
}

/**
 * Переключает активный раздел приложения.
 */
export function showSection(sectionId) {
  if (!SECTION_IDS.includes(sectionId)) {
    return;
  }

  DOM.navLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  DOM.sections.forEach((section) => {
    const isActive = section.dataset.section === sectionId;
    section.classList.toggle('app-section--active', isActive);
    section.hidden = !isActive;
  });

  DOM.main?.scrollTo({ top: 0, behavior: 'smooth' });
  DOM.main?.focus({ preventScroll: true });

  onSectionChange?.(sectionId);
}

/**
 * Возвращает контейнер для наполнения указанного раздела.
 */
export function getSectionRegion(sectionId) {
  const section = document.querySelector(`.app-section[data-section="${sectionId}"]`);
  return section?.querySelector('[data-region]') ?? null;
}

/**
 * Возвращает контейнер списка уведомлений.
 */
export function getNotificationsContainer() {
  return DOM.notificationsList;
}

/**
 * Возвращает корневой элемент модальных окон.
 */
export function getModalRoot() {
  return DOM.modalRoot;
}

function bindNavigation() {
  DOM.navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      showSection(link.dataset.section);
    });
  });
}
