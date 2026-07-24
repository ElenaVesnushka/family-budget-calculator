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
import { initIncomes } from './incomes.js';
import { initExpectedIncomes } from './expected-incomes.js';
import { initExpenses } from './expenses.js';
import { initLimits } from './limits.js';
import { initPlannedExpenses } from './planned-expenses.js';
import { initTemplates } from './templates.js';
import { initAssets } from './assets.js';
import { initCushion, syncReserveWarnings } from './cushion.js';

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

      if (sectionId === 'incomes') {
        initIncomes();
        initExpectedIncomes();
      }

      if (sectionId === 'expenses') {
        initExpenses();
        initPlannedExpenses();
      }

      if (sectionId === 'limits') {
        initLimits();
      }

      if (sectionId === 'templates') {
        initTemplates();
      }

      if (sectionId === 'assets') {
        initAssets();
      }

      if (sectionId === 'cushion') {
        initCushion();
      }
    },
  });

  initNotifications(getNotificationsContainer());
  initModals(getModalRoot());
  initDashboard();
  initIncomes();
  initExpectedIncomes();
  initExpenses();
  initPlannedExpenses();
  initLimits();
  initTemplates();
  initAssets();
  initCushion();
  syncReserveWarnings();

  applyTheme(appState.settings.theme);
  showSection(appState.ui.activeSection);
}

document.addEventListener('DOMContentLoaded', bootstrap);
