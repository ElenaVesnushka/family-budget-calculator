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
      { id: 'article-food', name: 'Питание', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-animals', name: 'Животные', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-auto', name: 'Авто', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-home', name: 'Дом', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-credits', name: 'Кредиты', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-education', name: 'Обучение', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-health', name: 'Здоровье', isSystem: true, isStandard: true, isHidden: false },
      { id: 'article-personal', name: 'Личные', isSystem: true, isStandard: true, isHidden: false },
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
 * Шаблон статьи расходов (раздел 8, 16 ТЗ).
 * isStandard — участие в наборе стандартных статей пользователя (будущие настройки).
 * isHidden — скрытие неиспользуемых статей без удаления.
 */
export function createExpenseArticleShape() {
  return {
    id: null,
    name: '',
    isSystem: false,
    isStandard: false,
    isHidden: false,
  };
}

/**
 * Категории расходов из справочника приложения.
 */
export function getExpenseCategories(state) {
  return state.references?.categories ?? [];
}

/**
 * Статьи расходов, доступные для выбора (не скрытые).
 */
export function getAvailableExpenseArticles(state) {
  return (state.references?.expenseArticles ?? []).filter((article) => !article.isHidden);
}

/**
 * Название элемента справочника по идентификатору.
 */
export function getReferenceName(items, id) {
  if (!id) {
    return '—';
  }

  return items.find((item) => item.id === id)?.name ?? '—';
}

/**
 * Категории расходов, доступные для установки лимита (раздел 9, словарь ТЗ).
 */
export function getLimitCategories(state) {
  const allowedCategoryIds = new Set([
    EXPENSE_CATEGORIES.MANDATORY,
    EXPENSE_CATEGORIES.FOR_SOUL,
  ]);

  return getExpenseCategories(state).filter((category) => allowedCategoryIds.has(category.id));
}

/**
 * Статьи расходов, доступные для установки лимита (только существующий справочник).
 */
export function getLimitArticles(state) {
  return getAvailableExpenseArticles(state);
}

/** Порог использования лимита для предупреждающей индикации (раздел 9 ТЗ). */
export const LIMIT_USAGE_WARNING_THRESHOLD = 80;

const LIMIT_TYPE_LABELS = {
  [LIMIT_TYPES.CATEGORY]: 'Лимит по категории',
  [LIMIT_TYPES.ARTICLE]: 'Лимит по статье',
};

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(year, month, day) {
  return Math.min(day, daysInMonth(year, month));
}

function parseIsoDate(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/**
 * Границы текущего финансового периода (раздел 9, 16 ТЗ).
 */
export function getFinancialPeriodBounds(referenceDate = new Date(), startDay = 1) {
  const ref = startOfDay(referenceDate);
  const normalizedStartDay = Math.min(Math.max(Number(startDay) || 1, 1), 31);
  let year = ref.getFullYear();
  let month = ref.getMonth();

  if (ref.getDate() < normalizedStartDay) {
    month -= 1;

    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const start = startOfDay(new Date(year, month, clampDay(year, month, normalizedStartDay)));

  let nextMonth = month + 1;
  let nextYear = year;

  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  const nextStart = startOfDay(new Date(nextYear, nextMonth, clampDay(nextYear, nextMonth, normalizedStartDay)));
  const end = addDays(nextStart, -1);

  return { start, end };
}

/**
 * Проверяет, попадает ли дата операции в финансовый период.
 */
export function isDateInFinancialPeriod(dateString, referenceDate = new Date(), startDay = 1) {
  const date = parseIsoDate(dateString);

  if (!date) {
    return false;
  }

  const { start, end } = getFinancialPeriodBounds(referenceDate, startDay);
  const target = startOfDay(date);

  return target >= start && target <= end;
}

/**
 * Расходы текущего финансового периода.
 */
export function getCurrentFinancialPeriodExpenses(state, referenceDate = new Date()) {
  const startDay = state.settings?.financialPeriodStartDay ?? 1;
  const { start, end } = getFinancialPeriodBounds(referenceDate, startDay);

  return (state.currentBudget?.expenses ?? []).filter((expense) => {
    const date = parseIsoDate(expense.date);

    if (!date) {
      return false;
    }

    const target = startOfDay(date);
    return target >= start && target <= end;
  });
}

/**
 * Название цели лимита (категория или статья).
 */
export function getLimitTargetName(state, limit) {
  if (limit.limitType === LIMIT_TYPES.CATEGORY) {
    return getReferenceName(getLimitCategories(state), limit.targetId);
  }

  if (limit.limitType === LIMIT_TYPES.ARTICLE) {
    return getReferenceName(getLimitArticles(state), limit.targetId);
  }

  return '—';
}

/**
 * Человекочитаемый тип лимита.
 */
export function getLimitTypeLabel(limitType) {
  return LIMIT_TYPE_LABELS[limitType] ?? '—';
}

/**
 * Сумма фактических расходов по лимиту за переданный набор операций.
 */
export function calculateActualSpentForLimit(limit, expenses) {
  if (limit.limitType === LIMIT_TYPES.CATEGORY) {
    return expenses
      .filter((expense) => expense.categoryId === limit.targetId)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  }

  if (limit.limitType === LIMIT_TYPES.ARTICLE) {
    return expenses
      .filter((expense) => expense.articleId === limit.targetId)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  }

  return 0;
}

/**
 * Показатели использования лимита для текущего финансового периода.
 */
export function calculateLimitProgress(limit, state, referenceDate = new Date()) {
  const expenses = getCurrentFinancialPeriodExpenses(state, referenceDate);
  const actualSpent = calculateActualSpentForLimit(limit, expenses);
  const limitAmount = Number(limit.amount) || 0;
  const remaining = Math.max(0, limitAmount - actualSpent);
  const overspend = Math.max(0, actualSpent - limitAmount);
  const usagePercent = limitAmount > 0
    ? Math.round((actualSpent / limitAmount) * 100)
    : (actualSpent > 0 ? 100 : 0);

  let status = 'normal';

  if (overspend > 0) {
    status = 'exceeded';
  } else if (usagePercent >= LIMIT_USAGE_WARNING_THRESHOLD) {
    status = 'warning';
  }

  return {
    name: getLimitTargetName(state, limit),
    typeLabel: getLimitTypeLabel(limit.limitType),
    limitAmount,
    actualSpent,
    remaining,
    overspend,
    usagePercent,
    status,
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

const RECURRENCE_FREQUENCY_LABELS = {
  [RECURRENCE_FREQUENCIES.DAILY]: 'Ежедневно',
  [RECURRENCE_FREQUENCIES.WEEKLY]: 'Еженедельно',
  [RECURRENCE_FREQUENCIES.MONTHLY]: 'Ежемесячно',
  [RECURRENCE_FREQUENCIES.INTERVAL]: 'Каждые N дней',
};

/**
 * Форматирует дату в ISO-строку YYYY-MM-DD.
 */
export function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Проверяет допустимый диапазон даты расходной операции (раздел 8 ТЗ).
 */
export function isExpenseDateWithinAllowedRange(dateString, referenceDate = new Date()) {
  const date = parseIsoDate(dateString);

  if (!date) {
    return false;
  }

  const today = startOfDay(referenceDate);
  const minDate = addDays(today, -30);
  const maxDate = addDays(today, 60);
  const target = startOfDay(date);

  return target >= minDate && target <= maxDate;
}

/**
 * Валидация данных расходной операции.
 */
export function validateExpensePayload(payload, state) {
  const errors = {};
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);
  const categoryIds = new Set(categories.map((item) => item.id));
  const articleIds = new Set(articles.map((item) => item.id));
  const {
    categoryId = '',
    articleId = '',
    date = '',
    amount = '',
  } = payload;

  if (!String(categoryId).trim()) {
    errors.categoryId = 'Выберите категорию.';
  } else if (!categoryIds.has(categoryId)) {
    errors.categoryId = 'Выберите категорию из списка.';
  }

  if (!String(articleId).trim()) {
    errors.articleId = 'Выберите статью.';
  } else if (!articleIds.has(articleId)) {
    errors.articleId = 'Выберите статью из списка.';
  }

  if (!String(date).trim()) {
    errors.date = 'Укажите дату.';
  } else if (!isExpenseDateWithinAllowedRange(date, new Date())) {
    errors.date = 'Дата должна быть не ранее 30 дней назад и не позднее 60 дней вперёд.';
  }

  const parsedAmount = Number(amount);

  if (!String(amount).trim()) {
    errors.amount = 'Укажите сумму.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма должна быть больше нуля.';
  }

  return errors;
}

/**
 * Создаёт объект расходной операции из проверенных данных.
 */
export function buildExpenseFromPayload(payload, now = new Date().toISOString()) {
  return {
    ...createExpenseShape(),
    id: generateId('expense'),
    categoryId: String(payload.categoryId).trim(),
    articleId: String(payload.articleId).trim(),
    name: String(payload.name ?? '').trim(),
    date: String(payload.date).trim(),
    amount: Number(payload.amount),
    comment: String(payload.comment ?? '').trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Человекочитаемая периодичность планового расхода.
 */
export function getRecurrenceLabel(recurrence) {
  if (!recurrence?.frequency) {
    return '—';
  }

  if (recurrence.frequency === RECURRENCE_FREQUENCIES.INTERVAL) {
    const days = Number(recurrence.intervalDays);

    if (Number.isFinite(days) && days > 0) {
      return `Каждые ${days} дн.`;
    }

    return RECURRENCE_FREQUENCY_LABELS[RECURRENCE_FREQUENCIES.INTERVAL];
  }

  return RECURRENCE_FREQUENCY_LABELS[recurrence.frequency] ?? '—';
}

/**
 * Рассчитывает следующую дату повторения планового расхода.
 */
export function calculateNextOccurrenceDate(fromDateString, recurrence) {
  const date = parseIsoDate(fromDateString);

  if (!date || !recurrence?.frequency) {
    return fromDateString;
  }

  switch (recurrence.frequency) {
    case RECURRENCE_FREQUENCIES.DAILY:
      return formatIsoDate(addDays(date, 1));
    case RECURRENCE_FREQUENCIES.WEEKLY:
      return formatIsoDate(addDays(date, 7));
    case RECURRENCE_FREQUENCIES.MONTHLY: {
      const next = new Date(date);
      next.setMonth(next.getMonth() + 1);
      return formatIsoDate(next);
    }
    case RECURRENCE_FREQUENCIES.INTERVAL: {
      const intervalDays = Number(recurrence.intervalDays);

      if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
        return fromDateString;
      }

      return formatIsoDate(addDays(date, intervalDays));
    }
    default:
      return fromDateString;
  }
}

/**
 * Плановый расход ожидает подтверждения (дата наступила или прошла).
 */
export function isPlannedExpenseDue(plannedExpense, referenceDate = new Date()) {
  if (!plannedExpense?.isEnabled) {
    return false;
  }

  const nextDate = parseIsoDate(plannedExpense.nextOccurrenceDate);

  if (!nextDate) {
    return false;
  }

  return startOfDay(nextDate) <= startOfDay(referenceDate);
}

/**
 * Валидация данных планового расхода.
 */
export function validatePlannedExpensePayload(payload, state) {
  const errors = {};
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);
  const categoryIds = new Set(categories.map((item) => item.id));
  const articleIds = new Set(articles.map((item) => item.id));
  const {
    name = '',
    categoryId = '',
    articleId = '',
    amount = '',
    firstDate = '',
    frequency = '',
    intervalDays = '',
  } = payload;

  if (!String(name).trim()) {
    errors.name = 'Укажите название.';
  }

  if (!String(categoryId).trim()) {
    errors.categoryId = 'Выберите категорию.';
  } else if (!categoryIds.has(categoryId)) {
    errors.categoryId = 'Выберите категорию из списка.';
  }

  if (!String(articleId).trim()) {
    errors.articleId = 'Выберите статью.';
  } else if (!articleIds.has(articleId)) {
    errors.articleId = 'Выберите статью из списка.';
  }

  const parsedAmount = Number(amount);

  if (!String(amount).trim()) {
    errors.amount = 'Укажите сумму.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма должна быть больше нуля.';
  }

  if (!String(firstDate).trim()) {
    errors.firstDate = 'Укажите дату первого выполнения.';
  } else if (!parseIsoDate(firstDate)) {
    errors.firstDate = 'Укажите корректную дату.';
  }

  if (!frequency || !Object.values(RECURRENCE_FREQUENCIES).includes(frequency)) {
    errors.frequency = 'Выберите периодичность.';
  }

  if (frequency === RECURRENCE_FREQUENCIES.INTERVAL) {
    const parsedInterval = Number(intervalDays);

    if (!String(intervalDays).trim()) {
      errors.intervalDays = 'Укажите количество дней.';
    } else if (!Number.isInteger(parsedInterval) || parsedInterval <= 0) {
      errors.intervalDays = 'Количество дней должно быть целым числом больше нуля.';
    }
  }

  return errors;
}

/**
 * Создаёт объект планового расхода из проверенных данных.
 */
export function buildPlannedExpenseFromPayload(payload, now = new Date().toISOString()) {
  const recurrence = {
    frequency: payload.frequency,
    intervalDays: payload.frequency === RECURRENCE_FREQUENCIES.INTERVAL
      ? Number(payload.intervalDays)
      : null,
  };
  const firstDate = String(payload.firstDate).trim();

  return {
    ...createPlannedExpenseShape(),
    id: generateId('planned-expense'),
    name: String(payload.name).trim(),
    categoryId: String(payload.categoryId).trim(),
    articleId: String(payload.articleId).trim(),
    amount: Number(payload.amount),
    firstDate,
    nextOccurrenceDate: firstDate,
    comment: String(payload.comment ?? '').trim(),
    recurrence,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
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
