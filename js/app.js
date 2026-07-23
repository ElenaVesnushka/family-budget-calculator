/**
 * Точка входа приложения.
 *
 * Инициализирует оболочку, загружает состояние и синхронизирует интерфейс.
 */

import { loadAppState, saveAppState } from './storage.js';
import {
  initShell,
  applyTheme,
  showSection,
  getNotificationsContainer,
  getModalRoot,
} from './ui.js';
import { initNotifications, showNotification, hideNotification } from './notifications.js';
import { initModals, openModal, closeModal, isModalOpen } from './modals.js';

/**
 * Глобальное состояние приложения.
 * Модули получают доступ через getAppState / setAppState.
 */
let appState = null;

export function getAppState() {
  return appState;
}

export function setAppState(nextState) {
  appState = saveAppState(nextState);
  return appState;
}

export { showNotification, hideNotification, openModal, closeModal, isModalOpen };

function bootstrap() {
  appState = loadAppState();

  initShell({
    onSectionChange(sectionId) {
      appState.ui.activeSection = sectionId;
    },
  });

  initNotifications(getNotificationsContainer());
  initModals(getModalRoot());

  applyTheme(appState.settings.theme);
  showSection(appState.ui.activeSection);
}

document.addEventListener('DOMContentLoaded', bootstrap);
