/**
 * Единая структура состояния приложения (App State).
 *
 * Все модули обмениваются данными через этот объект.
 * Два независимых направления учёта из ТЗ:
 * — currentBudget (текущий бюджет);
 * — myAssets (мои средства).
 */

export const APP_STATE_VERSION = '1.0.0';

export const SECTION_IDS = [
  'dashboard',
  'incomes',
  'expenses',
  'limits',
  'cushion',
  'assets',
  'templates',
  'reports',
  'settings',
];

/**
 * Системные категории и статьи расходов первой версии (раздел 8 ТЗ).
 */
function createDefaultReferences() {
  return {
    categories: [
      { id: 'category-mandatory', name: 'Обязательные', isSystem: true },
      { id: 'category-for-soul', name: 'Для души', isSystem: true },
    ],
    expenseArticles: [
      { id: 'article-food', name: 'Питание', isSystem: true },
      { id: 'article-animals', name: 'Животные', isSystem: true },
      { id: 'article-auto', name: 'Авто', isSystem: true },
      { id: 'article-home', name: 'Дом', isSystem: true },
      { id: 'article-credits', name: 'Кредиты', isSystem: true },
      { id: 'article-education', name: 'Обучение', isSystem: true },
      { id: 'article-health', name: 'Здоровье', isSystem: true },
      { id: 'article-personal', name: 'Личные', isSystem: true },
    ],
  };
}

/**
 * Настройки приложения по умолчанию (раздел 16 ТЗ).
 */
function createDefaultSettings() {
  return {
    financialPeriodStartDay: 1,
    theme: 'light',
    monthlySnapshotDay: 1,
    financialCushion: {
      enabled: true,
      calculationMethod: 'fixed',
      fixedAmount: 0,
      incomePercent: 0,
      assetsPercent: 0,
    },
    customExpenseArticles: [],
    moodPhrases: {
      positive: [],
      warning: [],
      neutral: [],
      negative: [],
    },
  };
}

/**
 * Создаёт пустую структуру состояния для нового пользователя.
 */
export function createEmptyAppState() {
  return {
    meta: {
      version: APP_STATE_VERSION,
      lastSavedAt: null,
    },

    settings: createDefaultSettings(),

    references: createDefaultReferences(),

    /**
     * Текущий бюджет: доходы, расходы, лимиты, планирование.
     */
    currentBudget: {
      incomes: [],
      expenses: [],
      limits: [],
      plannedExpenses: [],
      expectedIncomes: [],
    },

    /**
     * Шаблоны операций хранятся отдельно от финансовых операций (раздел 12 ТЗ).
     */
    templates: [],

    /**
     * Мои средства: счета и история ежемесячных снимков (раздел 14 ТЗ).
     */
    myAssets: {
      accounts: [],
      snapshots: [],
    },

    /**
     * Сессионное состояние интерфейса (не сохраняется в localStorage).
     */
    ui: {
      activeSection: 'dashboard',
    },
  };
}

/**
 * Восстанавливает недостающие поля после загрузки из хранилища.
 * Гарантирует целостность структуры без потери сохранённых данных.
 */
export function normalizeAppState(rawState) {
  const defaults = createEmptyAppState();

  if (!rawState || typeof rawState !== 'object') {
    return defaults;
  }

  return {
    meta: {
      ...defaults.meta,
      ...rawState.meta,
      version: APP_STATE_VERSION,
    },
    settings: deepMerge(defaults.settings, rawState.settings),
    references: deepMerge(defaults.references, rawState.references),
    currentBudget: deepMerge(defaults.currentBudget, rawState.currentBudget),
    templates: Array.isArray(rawState.templates) ? rawState.templates : defaults.templates,
    myAssets: deepMerge(defaults.myAssets, rawState.myAssets),
    ui: {
      ...defaults.ui,
      ...rawState.ui,
    },
  };
}

/**
 * Разделяет состояние на сохраняемую и сессионную части.
 */
export function extractPersistedState(state) {
  const { ui, ...persisted } = state;
  return persisted;
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') {
    return structuredClone(base);
  }

  const result = structuredClone(base);

  for (const key of Object.keys(override)) {
    const baseValue = result[key];
    const overrideValue = override[key];

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = structuredClone(overrideValue);
    }
  }

  return result;
}
