/**
 * Модель данных приложения (App State).
 *
 * Единый источник структуры данных для всех модулей.
 * Два независимых направления учёта (раздел 1–2 ТЗ):
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

export const INCOME_TYPES = {
  PERMANENT: 'permanent',
  ONE_TIME: 'one-time',
  DEPOSIT_CAPITALIZATION: 'deposit-capitalization',
};

export const EXPENSE_CATEGORIES = {
  MANDATORY: 'category-mandatory',
  FOR_SOUL: 'category-for-soul',
};

export const LIMIT_TYPES = {
  CATEGORY: 'category',
  ARTICLE: 'article',
};

export const TEMPLATE_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const ACCOUNT_TYPES = {
  BANK_ACCOUNT: 'bank-account',
  CARD: 'card',
  DEPOSIT: 'deposit',
  CASH: 'cash',
  CUSTOM: 'custom',
};

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  REMINDER: 'reminder',
  WARNING: 'warning',
};

export const RECURRENCE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  INTERVAL: 'interval',
};

export const REPORT_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom',
};

export const CUSHION_CALCULATION_METHODS = {
  FIXED: 'fixed',
  INCOME_PERCENT: 'income-percent',
  ASSETS_PERCENT: 'assets-percent',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  JAPANESE: 'japanese',
};

/**
 * Генерирует уникальный идентификатор сущности.
 */
export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createDefaultReferences() {
  return {
    categories: [
      { id: EXPENSE_CATEGORIES.MANDATORY, name: 'Обязательные', isSystem: true },
      { id: EXPENSE_CATEGORIES.FOR_SOUL, name: 'Для души', isSystem: true },
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

function createDefaultSettings() {
  return {
    financialPeriodStartDay: 1,
    theme: THEMES.LIGHT,
    monthlySnapshotDay: 1,
    moodPhrases: {
      positive: [],
      warning: [],
      neutral: [],
      negative: [],
    },
  };
}

function createDefaultFinancialCushion() {
  return {
    enabled: true,
    calculationMethod: CUSHION_CALCULATION_METHODS.FIXED,
    fixedAmount: 0,
    incomePercent: 0,
    assetsPercent: 0,
  };
}

function createDefaultReports() {
  return {
    preferences: {
      defaultPeriod: REPORT_PERIODS.MONTH,
      customPeriod: {
        start: null,
        end: null,
      },
    },
  };
}

function createDefaultNotifications() {
  return {
    items: [],
  };
}

function createDefaultCurrentBudget() {
  return {
    incomes: [],
    expenses: [],
    limits: [],
    plannedExpenses: [],
    expectedIncomes: [],
  };
}

function createDefaultMyAssets() {
  return {
    accounts: [],
    snapshots: [],
  };
}

function createDefaultMeta() {
  const now = new Date().toISOString();

  return {
    version: APP_STATE_VERSION,
    budgetId: generateId('budget'),
    createdAt: now,
    lastSavedAt: null,
  };
}

/**
 * Создаёт новый бюджет с полной начальной структурой данных.
 */
export function createNewBudget() {
  return {
    meta: createDefaultMeta(),
    settings: createDefaultSettings(),
    financialCushion: createDefaultFinancialCushion(),
    references: createDefaultReferences(),
    currentBudget: createDefaultCurrentBudget(),
    templates: [],
    myAssets: createDefaultMyAssets(),
    notifications: createDefaultNotifications(),
    reports: createDefaultReports(),
    ui: {
      activeSection: 'dashboard',
    },
  };
}

/** @deprecated Используйте createNewBudget */
export function createEmptyAppState() {
  return createNewBudget();
}

/**
 * Шаблон подтверждённого дохода (раздел 7 ТЗ).
 */
export function createIncomeShape() {
  return {
    id: null,
    incomeType: null,
    name: '',
    date: null,
    amount: 0,
    comment: '',
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон расхода (раздел 8 ТЗ).
 */
export function createExpenseShape() {
  return {
    id: null,
    categoryId: null,
    articleId: null,
    name: '',
    date: null,
    amount: 0,
    comment: '',
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон пользовательской статьи расходов (раздел 8, 16 ТЗ).
 */
export function createExpenseArticleShape() {
  return {
    id: null,
    name: '',
    isSystem: false,
  };
}

/**
 * Шаблон лимита (раздел 9 ТЗ).
 */
export function createLimitShape() {
  return {
    id: null,
    limitType: null,
    targetId: null,
    amount: 0,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон планового расхода (раздел 10 ТЗ).
 */
export function createPlannedExpenseShape() {
  return {
    id: null,
    name: '',
    categoryId: null,
    articleId: null,
    amount: 0,
    firstDate: null,
    nextOccurrenceDate: null,
    comment: '',
    recurrence: createRecurrenceShape(),
    isEnabled: true,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон ожидаемого дохода (раздел 11 ТЗ).
 */
export function createExpectedIncomeShape() {
  return {
    id: null,
    incomeType: null,
    name: '',
    amount: 0,
    nextOccurrenceDate: null,
    comment: '',
    recurrence: createRecurrenceShape(),
    isEnabled: true,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон операции повторения (разделы 10–11 ТЗ).
 */
export function createRecurrenceShape() {
  return {
    frequency: null,
    intervalDays: null,
  };
}

/**
 * Шаблон шаблона операции (раздел 12 ТЗ).
 */
export function createTemplateShape() {
  return {
    id: null,
    templateType: null,
    name: '',
    isEnabled: true,
    income: null,
    expense: null,
    createdAt: null,
    updatedAt: null,
    lastUsedAt: null,
  };
}

/**
 * Шаблон счёта (раздел 14 ТЗ).
 */
export function createAccountShape() {
  return {
    id: null,
    name: '',
    accountType: null,
    balance: 0,
    comment: '',
    isHidden: false,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Шаблон ежемесячного снимка (раздел 14 ТЗ).
 */
export function createSnapshotShape() {
  return {
    id: null,
    date: null,
    accountBalances: [],
    totalAmount: 0,
  };
}

/**
 * Шаблон сохранённого уведомления (раздел 17 ТЗ).
 */
export function createNotificationShape() {
  return {
    id: null,
    type: null,
    message: '',
    source: '',
    relatedEntityType: null,
    relatedEntityId: null,
    createdAt: null,
    isDismissed: false,
  };
}

/**
 * Переносит финансовую подушку из старых настроек в отдельную сущность.
 */
function migrateLegacyState(rawState) {
  if (!rawState || typeof rawState !== 'object') {
    return rawState;
  }

  const migrated = structuredClone(rawState);

  if (migrated.settings?.financialCushion && !migrated.financialCushion) {
    migrated.financialCushion = migrated.settings.financialCushion;
    delete migrated.settings.financialCushion;
  }

  if (migrated.settings?.customExpenseArticles) {
    delete migrated.settings.customExpenseArticles;
  }

  return migrated;
}

/**
 * Восстанавливает целостность структуры после загрузки из хранилища.
 */
export function normalizeAppState(rawState) {
  const defaults = createNewBudget();
  const migrated = migrateLegacyState(rawState);

  if (!migrated || typeof migrated !== 'object') {
    return defaults;
  }

  return {
    meta: {
      ...defaults.meta,
      ...migrated.meta,
      version: APP_STATE_VERSION,
      budgetId: migrated.meta?.budgetId ?? defaults.meta.budgetId,
      createdAt: migrated.meta?.createdAt ?? defaults.meta.createdAt,
    },
    settings: deepMerge(defaults.settings, migrated.settings),
    financialCushion: deepMerge(defaults.financialCushion, migrated.financialCushion),
    references: mergeReferences(defaults.references, migrated.references),
    currentBudget: deepMerge(defaults.currentBudget, migrated.currentBudget),
    templates: Array.isArray(migrated.templates) ? migrated.templates : defaults.templates,
    myAssets: deepMerge(defaults.myAssets, migrated.myAssets),
    notifications: deepMerge(defaults.notifications, migrated.notifications),
    reports: deepMerge(defaults.reports, migrated.reports),
    ui: {
      ...defaults.ui,
      ...migrated.ui,
    },
  };
}

/**
 * Сохраняет системные справочники и добавляет пользовательские записи.
 */
function mergeReferences(defaults, override) {
  if (!override || typeof override !== 'object') {
    return structuredClone(defaults);
  }

  return {
    categories: mergeReferenceList(defaults.categories, override.categories),
    expenseArticles: mergeReferenceList(defaults.expenseArticles, override.expenseArticles),
  };
}

function mergeReferenceList(defaultList, overrideList) {
  if (!Array.isArray(overrideList)) {
    return structuredClone(defaultList);
  }

  const merged = structuredClone(defaultList);

  overrideList.forEach((item) => {
    if (!item || typeof item !== 'object' || !item.id) {
      return;
    }

    const index = merged.findIndex((existing) => existing.id === item.id);

    if (index === -1) {
      merged.push(structuredClone(item));
      return;
    }

    merged[index] = {
      ...merged[index],
      ...structuredClone(item),
      isSystem: merged[index].isSystem ?? item.isSystem,
    };
  });

  return merged;
}

/**
 * Отделяет сохраняемую часть состояния от сессионной.
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
