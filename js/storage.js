/**
 * Слой работы с localStorage.
 *
 * Изолирует механизм хранения от бизнес-логики и интерфейса,
 * чтобы в будущем можно было заменить localStorage на облачное хранилище
 * без изменения остального кода (раздел 19 ТЗ).
 */

import {
  createEmptyAppState,
  normalizeAppState,
  extractPersistedState,
} from './state.js';

const STORAGE_KEY = 'family-budget-calculator';

/**
 * Загружает состояние приложения из localStorage.
 * При отсутствии или повреждении данных возвращает начальную структуру.
 */
export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyAppState();
    }

    const parsed = JSON.parse(raw);
    return normalizeAppState(parsed);
  } catch {
    return createEmptyAppState();
  }
}

/**
 * Сохраняет состояние приложения в localStorage.
 * Сессионная часть (ui) не сохраняется.
 */
export function saveAppState(state) {
  const persisted = extractPersistedState(state);
  persisted.meta.lastSavedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

  return {
    ...state,
    meta: { ...state.meta, lastSavedAt: persisted.meta.lastSavedAt },
  };
}

/**
 * Удаляет все сохранённые данные и возвращает начальную структуру.
 */
export function resetAppState() {
  localStorage.removeItem(STORAGE_KEY);
  return createEmptyAppState();
}

/**
 * Ключ хранилища — для диагностики и будущего экспорта данных.
 */
export function getStorageKey() {
  return STORAGE_KEY;
}
