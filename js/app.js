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
  isStateInitialized,
} from './state-service.js';
import {
  initShell,
  applyTheme,
  showSection,
  getNotificationsContainer,
  getModalRoot,
} from './ui.js';
import { initNotifications, showNotification, hideNotification, hideAllNotifications } from './notifications.js?v=20260725-12';
import { initModals, openModal, closeModal, isModalOpen } from './modals.js';
import { initDashboard } from './dashboard.js?v=20260725-20';
import { initIncomes } from './incomes.js';
import { initExpectedIncomes, syncExpectedIncomeReminders } from './expected-incomes.js';
import { initExpenses } from './expenses.js';
import { initLimits, syncLimitWarnings } from './limits.js';
import { initPlannedExpenses, syncPlannedExpenseReminders } from './planned-expenses.js';
import { initTemplates } from './templates.js';
import { initAssets, syncAssetsSnapshotReminders } from './assets.js?v=20260725-16';
import { initCushion, syncReserveWarnings } from './cushion.js?v=20260725-20';
import { initReports } from './reports.js';
import { initSettings } from './settings.js?v=20260725-18';

let conditionalNotificationsListenerAttached = false;

export {
  getAppState,
  updateAppState,
  replaceAppState,
  resetAppState,
  updateSessionState,
  showNotification,
  hideNotification,
  hideAllNotifications,
  openModal,
  closeModal,
  isModalOpen,
};

/**
 * Пересчитывает условные уведомления панели (раздел 17 ТЗ).
 * Не затрагивает финансовое настроение, наблюдения и аналитику.
 */
function syncConditionalNotifications() {
  if (!isStateInitialized()) {
    return;
  }

  syncReserveWarnings();
  syncLimitWarnings();
  syncPlannedExpenseReminders();
  syncExpectedIncomeReminders();
  syncAssetsSnapshotReminders();
}

function attachConditionalNotificationsListener() {
  if (conditionalNotificationsListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    syncConditionalNotifications();
  });

  conditionalNotificationsListenerAttached = true;
}

function bootstrap() {
  const appState = initStateService();

  initShell({
    onSectionChange(sectionId) {
      updateSessionState({ activeSection: sectionId });

      if (sectionId === 'dashboard') {
        initDashboard();
      }

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

      if (sectionId === 'reports') {
        initReports();
      }

      if (sectionId === 'settings') {
        initSettings();
      }

      if (sectionId === 'cushion') {
        initCushion();
      }
    },
  });

  initNotifications(getNotificationsContainer());
  initModals(getModalRoot());
  attachConditionalNotificationsListener();
  initDashboard();
  initIncomes();
  initExpectedIncomes();
  initExpenses();
  initPlannedExpenses();
  initLimits();
  initTemplates();
  initAssets();
  initCushion();
  initReports();
  initSettings();
  syncConditionalNotifications();

  applyTheme(appState.settings.theme);
  showSection(appState.ui.activeSection);
}

document.addEventListener('DOMContentLoaded', bootstrap);
