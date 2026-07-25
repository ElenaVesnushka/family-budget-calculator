/**
 * Единый сервис работы с состоянием приложения.
 *
 * Обеспечивает доступ к данным, безопасное обновление
 * и автоматическое сохранение после каждого изменения.
 */

import {
  initializeAppState,
  savePersistedState,
  resetStoredState,
  hasStoredData,
} from './storage.js';
import { normalizeAppState, extractPersistedState } from './state.js';

let appState = null;
let isInitialized = false;

const DEFAULT_UI = {
  activeSection: 'dashboard',
};

/**
 * Загружает или создаёт бюджет при первом запуске.
 */
export function initStateService() {
  const persisted = initializeAppState();

  appState = {
    ...persisted,
    ui: { ...DEFAULT_UI },
  };

  isInitialized = true;
  return appState;
}

/**
 * Возвращает текущее состояние приложения.
 */
export function getAppState() {
  ensureInitialized();
  return appState;
}

/**
 * Безопасно обновляет состояние через функцию-обновлятор или новый объект.
 * После изменения данные автоматически сохраняются в localStorage.
 */
export function updateAppState(updater) {
  ensureInitialized();

  const currentUi = { ...appState.ui };
  const baseState = {
    ...appState,
    ui: currentUi,
  };

  const nextState = typeof updater === 'function'
    ? updater(structuredClone(baseState))
    : updater;

  if (!nextState || typeof nextState !== 'object') {
    throw new TypeError('updateAppState: результат обновления должен быть объектом');
  }

  const normalized = normalizeAppState(extractPersistedState(nextState));

  appState = savePersistedState({
    ...normalized,
    ui: {
      ...currentUi,
      ...(nextState.ui ?? {}),
    },
  });

  document.dispatchEvent(new CustomEvent('appstate:updated'));

  return appState;
}

/**
 * Полностью заменяет сохраняемую часть состояния.
 */
export function replaceAppState(nextState) {
  ensureInitialized();

  if (!nextState || typeof nextState !== 'object') {
    throw new TypeError('replaceAppState: состояние должно быть объектом');
  }

  const normalized = normalizeAppState(extractPersistedState(nextState));

  appState = savePersistedState({
    ...normalized,
    ui: {
      ...DEFAULT_UI,
      ...(nextState.ui ?? appState.ui ?? {}),
    },
  });

  document.dispatchEvent(new CustomEvent('appstate:updated'));

  return appState;
}

/**
 * Полностью очищает сохранённые данные и создаёт новый пустой бюджет.
 * Сохраняет начальное состояние в localStorage и уведомляет интерфейс.
 */
export function resetAppState() {
  const newBudget = resetStoredState();

  appState = savePersistedState({
    ...newBudget,
    ui: { ...DEFAULT_UI },
  });

  isInitialized = true;
  document.dispatchEvent(new CustomEvent('appstate:updated'));

  return appState;
}

/**
 * Обновляет только сессионную часть интерфейса без сохранения.
 */
export function updateSessionState(sessionPatch) {
  ensureInitialized();

  appState = {
    ...appState,
    ui: {
      ...appState.ui,
      ...sessionPatch,
    },
  };

  return appState;
}

export function isStateInitialized() {
  return isInitialized;
}

export function isFirstLaunch() {
  return !hasStoredData();
}

function ensureInitialized() {
  if (!isInitialized || !appState) {
    throw new Error('StateService: состояние не инициализировано. Вызовите initStateService().');
  }
}
