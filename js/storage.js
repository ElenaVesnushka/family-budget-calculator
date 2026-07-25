/**
 * Слой работы с localStorage.
 *
 * Изолирует механизм хранения от бизнес-логики и интерфейса,
 * чтобы в будущем можно было заменить localStorage на облачное хранилище
 * без изменения остального кода (раздел 19 ТЗ).
 */

import {
  APP_STATE_VERSION,
  createNewBudget,
  normalizeAppState,
  extractPersistedState,
} from './state.js';

const STORAGE_KEY = 'family-budget-calculator';

/**
 * Проверяет наличие сохранённых данных в localStorage.
 */
export function hasStoredData() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Загружает и нормализует состояние из localStorage.
 * Возвращает null, если сохранённых данных нет.
 * При смене версии структуры сразу перезаписывает мигрированные данные.
 */
export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const previousVersion = parsed?.meta?.version ?? null;
    const normalized = normalizeAppState(parsed);

    if (previousVersion !== APP_STATE_VERSION) {
      return savePersistedState(normalized);
    }

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Инициализирует состояние при запуске:
 * загружает сохранённые данные или создаёт новый бюджет.
 */
export function initializeAppState() {
  const persisted = loadPersistedState();

  if (persisted) {
    return persisted;
  }

  const newBudget = createNewBudget();
  return savePersistedState(newBudget);
}

/**
 * Сохраняет состояние в localStorage.
 * Сессионная часть (ui) не сохраняется.
 */
export function savePersistedState(state) {
  const normalized = normalizeAppState(extractPersistedState(state));
  normalized.meta.lastSavedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

  return {
    ...normalized,
    ui: state.ui ?? { activeSection: 'dashboard' },
    meta: { ...normalized.meta },
  };
}

/**
 * @deprecated Используйте initializeAppState через state-service.
 */
export function loadAppState() {
  return initializeAppState();
}

/**
 * @deprecated Используйте savePersistedState через state-service.
 */
export function saveAppState(state) {
  return savePersistedState(state);
}

/**
 * Удаляет все сохранённые данные и возвращает новый бюджет без сохранения.
 */
export function resetStoredState() {
  localStorage.removeItem(STORAGE_KEY);
  return createNewBudget();
}

/** @deprecated Используйте resetStoredState */
export function resetAppState() {
  return resetStoredState();
}

/**
 * Ключ хранилища — для диагностики и будущего экспорта данных.
 */
export function getStorageKey() {
  return STORAGE_KEY;
}
