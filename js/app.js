/**
 * Точка входа приложения.
 *
 * Инициализирует оболочку, загружает состояние и синхронизирует интерфейс.
 */

import {
  initStateService,
  getAppState,
  updateAppState,
  replaceAppState,
  resetAppState,
  updateSessionState,
} from './state-service.js';
import {
  initShell,
  applyTheme,
  showSection,
  getNotificationsContainer,
  getModalRoot,
} from './ui.js';
import { initNotifications, showNotification, hideNotification } from './notifications.js';
import { initModals, openModal, closeModal, isModalOpen } from './modals.js';
import { initDashboard } from './dashboard.js';

export {
  getAppState,
  updateAppState,
  replaceAppState,
  resetAppState,
  updateSessionState,
  showNotification,
  hideNotification,
  openModal,
  closeModal,
  isModalOpen,
};

function bootstrap() {
  const appState = initStateService();

  initShell({
    onSectionChange(sectionId) {
      updateSessionState({ activeSection: sectionId });
    },
  });

  initNotifications(getNotificationsContainer());
  initModals(getModalRoot());
  initDashboard();

  applyTheme(appState.settings.theme);
  showSection(appState.ui.activeSection);
}

document.addEventListener('DOMContentLoaded', bootstrap);
