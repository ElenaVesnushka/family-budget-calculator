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
  ACTUAL_INCOME: 'actual-income',
  ACTUAL_EXPENSE: 'actual-expense',
  EXPECTED_INCOME: 'expected-income',
  PLANNED_EXPENSE: 'planned-expense',
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
  INTERVAL_MONTHS: 'interval-months',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
  UNLIMITED: 'unlimited',
};

/** Горизонт прогноза будущих поступлений (месяцы) для списка и календаря. */
export const DEFAULT_OCCURRENCE_HORIZON_MONTHS = 12;

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

function addMonthsPreserveDay(date, months) {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = date.getDate();

  return new Date(year, month, clampDay(year, month, day));
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
  [RECURRENCE_FREQUENCIES.INTERVAL_MONTHS]: 'Каждые N месяцев',
  [RECURRENCE_FREQUENCIES.YEARLY]: 'Ежегодно',
  [RECURRENCE_FREQUENCIES.CUSTOM]: 'Произвольный период',
  [RECURRENCE_FREQUENCIES.UNLIMITED]: 'Без ограничения',
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

  if (recurrence.frequency === EXPECTED_INCOME_RECURRENCE_ONCE) {
    return 'Разово';
  }

  if (recurrence.frequency === RECURRENCE_FREQUENCIES.INTERVAL) {
    const days = Number(recurrence.intervalDays);

    if (Number.isFinite(days) && days > 0) {
      return `Каждые ${days} дн.`;
    }

    return RECURRENCE_FREQUENCY_LABELS[RECURRENCE_FREQUENCIES.INTERVAL];
  }

  if (recurrence.frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS) {
    const months = Number(recurrence.intervalMonths);

    if (Number.isFinite(months) && months > 0) {
      return `Каждые ${months} мес.`;
    }

    return RECURRENCE_FREQUENCY_LABELS[RECURRENCE_FREQUENCIES.INTERVAL_MONTHS];
  }

  if (recurrence.frequency === RECURRENCE_FREQUENCIES.CUSTOM) {
    const days = Number(recurrence.intervalDays);
    const months = Number(recurrence.intervalMonths);
    const parts = [];

    if (Number.isFinite(months) && months > 0) {
      parts.push(`${months} мес.`);
    }

    if (Number.isFinite(days) && days > 0) {
      parts.push(`${days} дн.`);
    }

    if (parts.length > 0) {
      return `Каждые ${parts.join(' и ')}`;
    }

    return RECURRENCE_FREQUENCY_LABELS[RECURRENCE_FREQUENCIES.CUSTOM];
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
    case RECURRENCE_FREQUENCIES.INTERVAL_MONTHS: {
      const intervalMonths = Number(recurrence.intervalMonths);

      if (!Number.isFinite(intervalMonths) || intervalMonths <= 0) {
        return fromDateString;
      }

      return formatIsoDate(addMonthsPreserveDay(date, intervalMonths));
    }
    case RECURRENCE_FREQUENCIES.YEARLY:
      return formatIsoDate(addMonthsPreserveDay(date, 12));
    case RECURRENCE_FREQUENCIES.CUSTOM: {
      let next = date;
      const intervalMonths = Number(recurrence.intervalMonths);
      const intervalDays = Number(recurrence.intervalDays);

      if (Number.isFinite(intervalMonths) && intervalMonths > 0) {
        next = addMonthsPreserveDay(next, intervalMonths);
      }

      if (Number.isFinite(intervalDays) && intervalDays > 0) {
        next = addDays(next, intervalDays);
      }

      if (next.getTime() === date.getTime()) {
        return fromDateString;
      }

      return formatIsoDate(next);
    }
    case RECURRENCE_FREQUENCIES.UNLIMITED:
    case EXPECTED_INCOME_RECURRENCE_ONCE:
      return fromDateString;
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
 * Плановый расход является повторяющимся.
 */
export function isPlannedExpenseRecurring(recurrence) {
  if (!recurrence?.frequency) {
    return false;
  }

  const nonRecurring = new Set([
    EXPECTED_INCOME_RECURRENCE_ONCE,
    RECURRENCE_FREQUENCIES.UNLIMITED,
  ]);

  return !nonRecurring.has(recurrence.frequency);
}

/**
 * Статус конкретного наступления планового расхода.
 */
export function getPlannedExpenseOccurrenceStatus(plannedExpense, occurrenceDate, referenceDate = new Date()) {
  if (!plannedExpense?.isEnabled) {
    return isPlannedExpenseRecurring(plannedExpense?.recurrence) ? 'Отключён' : 'Завершён';
  }

  if (
    occurrenceDate === plannedExpense.nextOccurrenceDate
    && isPlannedExpenseDue(plannedExpense, referenceDate)
  ) {
    return 'Ожидает подтверждения';
  }

  return 'Запланирован';
}

/**
 * Генерирует наступления планового расхода в заданном горизонте.
 */
export function generatePlannedExpenseOccurrences(plannedExpense, options = {}) {
  if (!plannedExpense?.isEnabled || !plannedExpense.nextOccurrenceDate) {
    return [];
  }

  const {
    referenceDate = new Date(),
    rangeEnd = getOccurrenceRangeEnd(referenceDate),
    maxOccurrences = 200,
  } = options;
  const isRecurring = isPlannedExpenseRecurring(plannedExpense.recurrence);
  const today = startOfDay(referenceDate);
  const endDate = parseIsoDate(rangeEnd);

  if (!endDate) {
    return [];
  }

  const occurrences = [];
  let currentDate = plannedExpense.nextOccurrenceDate;
  let guard = 0;

  while (guard < maxOccurrences) {
    const parsedDate = parseIsoDate(currentDate);

    if (!parsedDate || startOfDay(parsedDate) > endDate) {
      break;
    }

    const isCurrent = currentDate === plannedExpense.nextOccurrenceDate;
    const includeOccurrence = isCurrent || startOfDay(parsedDate) >= today;

    if (includeOccurrence) {
      occurrences.push({
        id: `${plannedExpense.id}:${currentDate}`,
        plannedExpenseId: plannedExpense.id,
        occurrenceDate: currentDate,
        plannedExpense,
        isCurrent,
        status: getPlannedExpenseOccurrenceStatus(plannedExpense, currentDate, referenceDate),
      });
    }

    if (!isRecurring) {
      break;
    }

    const nextDate = calculateNextOccurrenceDate(currentDate, plannedExpense.recurrence);

    if (nextDate === currentDate) {
      break;
    }

    currentDate = nextDate;
    guard += 1;
  }

  return occurrences;
}

/**
 * Собирает наступления всех активных плановых расходов.
 */
export function collectPlannedExpenseOccurrences(plannedExpenses, options = {}) {
  return (plannedExpenses ?? [])
    .filter((item) => item.isEnabled)
    .flatMap((item) => generatePlannedExpenseOccurrences(item, options))
    .sort((first, second) => first.occurrenceDate.localeCompare(second.occurrenceDate));
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
    intervalMonths = '',
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

  const allowedFrequencies = [
    ...Object.values(RECURRENCE_FREQUENCIES),
    EXPECTED_INCOME_RECURRENCE_ONCE,
  ];

  if (!frequency || !allowedFrequencies.includes(frequency)) {
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

  if (frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS) {
    const parsedInterval = Number(intervalMonths);

    if (!String(intervalMonths).trim()) {
      errors.intervalMonths = 'Укажите количество месяцев.';
    } else if (!Number.isInteger(parsedInterval) || parsedInterval <= 0) {
      errors.intervalMonths = 'Количество месяцев должно быть целым числом больше нуля.';
    }
  }

  if (frequency === RECURRENCE_FREQUENCIES.CUSTOM) {
    const parsedDays = Number(intervalDays);
    const parsedMonths = Number(intervalMonths);
    const hasDays = String(intervalDays).trim() && Number.isInteger(parsedDays) && parsedDays > 0;
    const hasMonths = String(intervalMonths).trim() && Number.isInteger(parsedMonths) && parsedMonths > 0;

    if (!hasDays && !hasMonths) {
      errors.intervalDays = 'Укажите количество дней и/или месяцев.';
      errors.intervalMonths = 'Укажите количество дней и/или месяцев.';
    } else {
      if (String(intervalDays).trim() && !hasDays) {
        errors.intervalDays = 'Количество дней должно быть целым числом больше нуля.';
      }

      if (String(intervalMonths).trim() && !hasMonths) {
        errors.intervalMonths = 'Количество месяцев должно быть целым числом больше нуля.';
      }
    }
  }

  return errors;
}

/**
 * Создаёт объект планового расхода из проверенных данных.
 */
export function buildPlannedExpenseFromPayload(payload, now = new Date().toISOString()) {
  const recurrence = buildRecurrenceFromPayload(payload);
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

/** Периодичность «разово» для ожидаемых доходов (раздел 11 ТЗ). */
export const EXPECTED_INCOME_RECURRENCE_ONCE = 'once';

const INCOME_TYPE_VALUES = new Set(Object.values(INCOME_TYPES));

/**
 * Проверяет допустимый диапазон даты доходной операции (раздел 7, 16 ТЗ).
 */
export function isIncomeDateWithinAllowedRange(dateString, referenceDate = new Date()) {
  return isExpenseDateWithinAllowedRange(dateString, referenceDate);
}

/**
 * Валидация данных доходной операции.
 */
export function validateIncomePayload(payload) {
  const errors = {};
  const incomeType = String(payload.category ?? payload.incomeType ?? '').trim();
  const date = String(payload.date ?? '').trim();
  const amount = String(payload.amount ?? '').trim();

  if (!date) {
    errors.date = 'Укажите дату.';
  } else if (!isIncomeDateWithinAllowedRange(date, new Date())) {
    errors.date = 'Дата должна быть не ранее 30 дней назад и не позднее 60 дней вперёд.';
  }

  const parsedAmount = Number(amount);

  if (!amount) {
    errors.amount = 'Укажите сумму.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма должна быть больше нуля.';
  }

  if (!incomeType) {
    errors.category = 'Выберите категорию.';
  } else if (!INCOME_TYPE_VALUES.has(incomeType)) {
    errors.category = 'Выберите категорию из списка.';
  }

  return errors;
}

/**
 * Создаёт объект доходной операции из проверенных данных.
 */
export function buildIncomeFromPayload(payload, now = new Date().toISOString()) {
  return {
    ...createIncomeShape(),
    id: generateId('income'),
    incomeType: String(payload.category ?? payload.incomeType).trim(),
    name: String(payload.source ?? payload.name ?? '').trim(),
    date: String(payload.date).trim(),
    amount: Number(payload.amount),
    comment: String(payload.comment ?? '').trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Ожидаемый доход является повторяющимся.
 */
export function isExpectedIncomeRecurring(recurrence) {
  if (!recurrence?.frequency) {
    return false;
  }

  const nonRecurring = new Set([
    EXPECTED_INCOME_RECURRENCE_ONCE,
    RECURRENCE_FREQUENCIES.UNLIMITED,
  ]);

  return !nonRecurring.has(recurrence.frequency);
}

/**
 * Конец горизонта прогноза будущих поступлений.
 */
export function getOccurrenceRangeEnd(
  referenceDate = new Date(),
  horizonMonths = DEFAULT_OCCURRENCE_HORIZON_MONTHS,
) {
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  end.setMonth(end.getMonth() + horizonMonths);
  return formatIsoDate(end);
}

/**
 * Статус конкретного наступления ожидаемого дохода.
 */
export function getExpectedIncomeOccurrenceStatus(expectedIncome, occurrenceDate, referenceDate = new Date()) {
  if (!expectedIncome?.isEnabled) {
    return isExpectedIncomeRecurring(expectedIncome?.recurrence) ? 'Отключён' : 'Завершён';
  }

  if (
    occurrenceDate === expectedIncome.nextOccurrenceDate
    && isExpectedIncomeDue(expectedIncome, referenceDate)
  ) {
    return 'Ожидает подтверждения';
  }

  return 'Запланирован';
}

/**
 * Генерирует наступления ожидаемого дохода в заданном горизонте.
 */
export function generateExpectedIncomeOccurrences(expectedIncome, options = {}) {
  if (!expectedIncome?.isEnabled || !expectedIncome.nextOccurrenceDate) {
    return [];
  }

  const {
    referenceDate = new Date(),
    rangeEnd = getOccurrenceRangeEnd(referenceDate),
    maxOccurrences = 200,
  } = options;
  const isRecurring = isExpectedIncomeRecurring(expectedIncome.recurrence);
  const today = startOfDay(referenceDate);
  const endDate = parseIsoDate(rangeEnd);

  if (!endDate) {
    return [];
  }

  const occurrences = [];
  let currentDate = expectedIncome.nextOccurrenceDate;
  let guard = 0;

  while (guard < maxOccurrences) {
    const parsedDate = parseIsoDate(currentDate);

    if (!parsedDate || startOfDay(parsedDate) > endDate) {
      break;
    }

    const isCurrent = currentDate === expectedIncome.nextOccurrenceDate;
    const includeOccurrence = isCurrent || startOfDay(parsedDate) >= today;

    if (includeOccurrence) {
      occurrences.push({
        id: `${expectedIncome.id}:${currentDate}`,
        expectedIncomeId: expectedIncome.id,
        occurrenceDate: currentDate,
        expectedIncome,
        isCurrent,
        status: getExpectedIncomeOccurrenceStatus(expectedIncome, currentDate, referenceDate),
      });
    }

    if (!isRecurring) {
      break;
    }

    const nextDate = calculateNextOccurrenceDate(currentDate, expectedIncome.recurrence);

    if (nextDate === currentDate) {
      break;
    }

    currentDate = nextDate;
    guard += 1;
  }

  return occurrences;
}

/**
 * Собирает наступления всех активных ожидаемых доходов.
 */
export function collectExpectedIncomeOccurrences(expectedIncomes, options = {}) {
  return (expectedIncomes ?? [])
    .filter((item) => item.isEnabled)
    .flatMap((item) => generateExpectedIncomeOccurrences(item, options))
    .sort((first, second) => first.occurrenceDate.localeCompare(second.occurrenceDate));
}

/**
 * Создаёт объект периодичности из данных формы.
 */
export function buildRecurrenceFromPayload(payload) {
  const frequency = payload.frequency;

  return {
    frequency,
    intervalDays: (
      frequency === RECURRENCE_FREQUENCIES.INTERVAL
      || frequency === RECURRENCE_FREQUENCIES.CUSTOM
    ) && String(payload.intervalDays ?? '').trim()
      ? Number(payload.intervalDays)
      : null,
    intervalMonths: (
      frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS
      || frequency === RECURRENCE_FREQUENCIES.CUSTOM
    ) && String(payload.intervalMonths ?? '').trim()
      ? Number(payload.intervalMonths)
      : null,
  };
}

/**
 * Ожидаемый доход ожидает подтверждения (дата наступила или прошла).
 */
export function isExpectedIncomeDue(expectedIncome, referenceDate = new Date()) {
  if (!expectedIncome?.isEnabled) {
    return false;
  }

  const nextDate = parseIsoDate(expectedIncome.nextOccurrenceDate);

  if (!nextDate) {
    return false;
  }

  return startOfDay(nextDate) <= startOfDay(referenceDate);
}

/**
 * Валидация данных ожидаемого дохода.
 */
export function validateExpectedIncomePayload(payload) {
  const errors = {};
  const {
    incomeType = '',
    name = '',
    amount = '',
    nextOccurrenceDate = '',
    frequency = '',
    intervalDays = '',
    intervalMonths = '',
  } = payload;

  if (!String(incomeType).trim()) {
    errors.incomeType = 'Выберите вид дохода.';
  } else if (!INCOME_TYPE_VALUES.has(incomeType)) {
    errors.incomeType = 'Выберите вид дохода из списка.';
  }

  if (!String(name).trim()) {
    errors.name = 'Укажите название.';
  }

  const parsedAmount = Number(amount);

  if (!String(amount).trim()) {
    errors.amount = 'Укажите сумму.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма должна быть больше нуля.';
  }

  if (!String(nextOccurrenceDate).trim()) {
    errors.nextOccurrenceDate = 'Укажите дату поступления.';
  } else if (!parseIsoDate(nextOccurrenceDate)) {
    errors.nextOccurrenceDate = 'Укажите корректную дату.';
  }

  const allowedFrequencies = [
    ...Object.values(RECURRENCE_FREQUENCIES),
    EXPECTED_INCOME_RECURRENCE_ONCE,
  ];

  if (!frequency || !allowedFrequencies.includes(frequency)) {
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

  if (frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS) {
    const parsedInterval = Number(intervalMonths);

    if (!String(intervalMonths).trim()) {
      errors.intervalMonths = 'Укажите количество месяцев.';
    } else if (!Number.isInteger(parsedInterval) || parsedInterval <= 0) {
      errors.intervalMonths = 'Количество месяцев должно быть целым числом больше нуля.';
    }
  }

  if (frequency === RECURRENCE_FREQUENCIES.CUSTOM) {
    const parsedDays = Number(intervalDays);
    const parsedMonths = Number(intervalMonths);
    const hasDays = String(intervalDays).trim() && Number.isInteger(parsedDays) && parsedDays > 0;
    const hasMonths = String(intervalMonths).trim() && Number.isInteger(parsedMonths) && parsedMonths > 0;

    if (!hasDays && !hasMonths) {
      errors.intervalDays = 'Укажите количество дней и/или месяцев.';
      errors.intervalMonths = 'Укажите количество дней и/или месяцев.';
    } else {
      if (String(intervalDays).trim() && !hasDays) {
        errors.intervalDays = 'Количество дней должно быть целым числом больше нуля.';
      }

      if (String(intervalMonths).trim() && !hasMonths) {
        errors.intervalMonths = 'Количество месяцев должно быть целым числом больше нуля.';
      }
    }
  }

  return errors;
}

/**
 * Создаёт объект ожидаемого дохода из проверенных данных.
 */
export function buildExpectedIncomeFromPayload(payload, now = new Date().toISOString()) {
  const recurrence = buildRecurrenceFromPayload(payload);
  const nextOccurrenceDate = String(payload.nextOccurrenceDate).trim();

  return {
    ...createExpectedIncomeShape(),
    id: generateId('expected-income'),
    incomeType: String(payload.incomeType).trim(),
    name: String(payload.name).trim(),
    amount: Number(payload.amount),
    nextOccurrenceDate,
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
    intervalMonths: null,
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
    comment: '',
    isEnabled: true,
    income: null,
    expense: null,
    expectedIncome: null,
    plannedExpense: null,
    createdAt: null,
    updatedAt: null,
    lastUsedAt: null,
  };
}

const TEMPLATE_TYPE_LABELS = {
  [TEMPLATE_TYPES.ACTUAL_INCOME]: 'Фактический доход',
  [TEMPLATE_TYPES.ACTUAL_EXPENSE]: 'Фактический расход',
  [TEMPLATE_TYPES.EXPECTED_INCOME]: 'Ожидаемый доход',
  [TEMPLATE_TYPES.PLANNED_EXPENSE]: 'Плановый расход',
};

/**
 * Человекочитаемый тип шаблона.
 */
export function getTemplateTypeLabel(templateType) {
  if (templateType === 'income') {
    return TEMPLATE_TYPE_LABELS[TEMPLATE_TYPES.ACTUAL_INCOME];
  }

  if (templateType === 'expense') {
    return TEMPLATE_TYPE_LABELS[TEMPLATE_TYPES.ACTUAL_EXPENSE];
  }

  return TEMPLATE_TYPE_LABELS[templateType] ?? '—';
}

/**
 * Нормализует тип шаблона (миграция старых значений).
 */
export function normalizeTemplateType(templateType) {
  if (templateType === 'income') {
    return TEMPLATE_TYPES.ACTUAL_INCOME;
  }

  if (templateType === 'expense') {
    return TEMPLATE_TYPES.ACTUAL_EXPENSE;
  }

  return templateType;
}

/**
 * Валидация данных шаблона.
 */
export function validateTemplatePayload(payload, state) {
  const errors = {};
  const templateType = normalizeTemplateType(String(payload.templateType ?? '').trim());
  const name = String(payload.name ?? '').trim();
  const allowedTypes = Object.values(TEMPLATE_TYPES);

  if (!name) {
    errors.name = 'Укажите название шаблона.';
  }

  if (!templateType || !allowedTypes.includes(templateType)) {
    errors.templateType = 'Выберите тип операции.';
  }

  if (templateType === TEMPLATE_TYPES.ACTUAL_INCOME) {
    const incomeType = String(payload.incomeType ?? '').trim();
    const amount = String(payload.amount ?? '').trim();

    if (!incomeType || !Object.values(INCOME_TYPES).includes(incomeType)) {
      errors.incomeType = 'Выберите вид дохода.';
    }

    const parsedAmount = Number(amount);

    if (!amount) {
      errors.amount = 'Укажите сумму.';
    } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Сумма должна быть больше нуля.';
    }
  }

  if (templateType === TEMPLATE_TYPES.ACTUAL_EXPENSE) {
    Object.assign(errors, validateExpensePayload({
      categoryId: payload.categoryId,
      articleId: payload.articleId,
      date: formatIsoDate(new Date()),
      amount: payload.amount,
    }, state));
    delete errors.date;
  }

  if (templateType === TEMPLATE_TYPES.EXPECTED_INCOME) {
    if (!String(payload.operationName ?? '').trim()) {
      errors.operationName = 'Укажите название операции.';
    }

    Object.assign(errors, validateExpectedIncomePayload({
      incomeType: payload.incomeType,
      name: payload.operationName,
      amount: payload.amount,
      nextOccurrenceDate: payload.nextOccurrenceDate,
      frequency: payload.frequency,
      intervalDays: payload.intervalDays,
      intervalMonths: payload.intervalMonths,
    }));
    delete errors.name;
  }

  if (templateType === TEMPLATE_TYPES.PLANNED_EXPENSE) {
    if (!String(payload.operationName ?? '').trim()) {
      errors.operationName = 'Укажите название операции.';
    }

    Object.assign(errors, validatePlannedExpensePayload({
      name: payload.operationName,
      categoryId: payload.categoryId,
      articleId: payload.articleId,
      amount: payload.amount,
      firstDate: payload.firstDate,
      frequency: payload.frequency,
      intervalDays: payload.intervalDays,
      intervalMonths: payload.intervalMonths,
    }, state));
    delete errors.name;
  }

  return errors;
}

/**
 * Создаёт шаблон из проверенных данных формы.
 */
export function buildTemplateFromPayload(payload, now = new Date().toISOString()) {
  const templateType = normalizeTemplateType(String(payload.templateType).trim());
  const template = {
    ...createTemplateShape(),
    id: generateId('template'),
    templateType,
    name: String(payload.name).trim(),
    comment: String(payload.comment ?? '').trim(),
    isEnabled: payload.isEnabled !== false,
    createdAt: now,
    updatedAt: now,
  };

  switch (templateType) {
    case TEMPLATE_TYPES.ACTUAL_INCOME:
      template.income = {
        incomeType: String(payload.incomeType).trim(),
        amount: Number(payload.amount),
        source: String(payload.source ?? '').trim(),
      };
      break;
    case TEMPLATE_TYPES.ACTUAL_EXPENSE:
      template.expense = {
        categoryId: String(payload.categoryId).trim(),
        articleId: String(payload.articleId).trim(),
        amount: Number(payload.amount),
        name: String(payload.operationName ?? '').trim(),
      };
      break;
    case TEMPLATE_TYPES.EXPECTED_INCOME:
      template.expectedIncome = {
        incomeType: String(payload.incomeType).trim(),
        name: String(payload.operationName ?? '').trim(),
        amount: Number(payload.amount),
        nextOccurrenceDate: String(payload.nextOccurrenceDate).trim(),
        recurrence: buildRecurrenceFromPayload(payload),
      };
      break;
    case TEMPLATE_TYPES.PLANNED_EXPENSE:
      template.plannedExpense = {
        name: String(payload.operationName ?? '').trim(),
        categoryId: String(payload.categoryId).trim(),
        articleId: String(payload.articleId).trim(),
        amount: Number(payload.amount),
        firstDate: String(payload.firstDate).trim(),
        recurrence: buildRecurrenceFromPayload(payload),
      };
      break;
    default:
      break;
  }

  return template;
}

/**
 * Создаёт шаблон фактического дохода из сохранённой операции.
 */
export function buildTemplateFromIncome(income, templateName, now = new Date().toISOString()) {
  return {
    ...createTemplateShape(),
    id: generateId('template'),
    templateType: TEMPLATE_TYPES.ACTUAL_INCOME,
    name: String(templateName || income.name || 'Доход').trim(),
    comment: String(income.comment ?? '').trim(),
    income: {
      incomeType: income.incomeType,
      amount: Number(income.amount),
      source: String(income.name ?? '').trim(),
    },
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Создаёт шаблон фактического расхода из сохранённой операции.
 */
export function buildTemplateFromExpense(expense, templateName, now = new Date().toISOString()) {
  return {
    ...createTemplateShape(),
    id: generateId('template'),
    templateType: TEMPLATE_TYPES.ACTUAL_EXPENSE,
    name: String(templateName || expense.name || 'Расход').trim(),
    comment: String(expense.comment ?? '').trim(),
    expense: {
      categoryId: expense.categoryId,
      articleId: expense.articleId,
      amount: Number(expense.amount),
      name: String(expense.name ?? '').trim(),
    },
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Нормализует массив шаблонов после загрузки.
 */
export function normalizeTemplates(templates) {
  if (!Array.isArray(templates)) {
    return [];
  }

  return templates
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createTemplateShape(),
      ...structuredClone(item),
      templateType: normalizeTemplateType(item.templateType),
      comment: item.comment ?? '',
      isEnabled: item.isEnabled !== false,
    }));
}

const ACCOUNT_TYPE_VALUES = new Set(Object.values(ACCOUNT_TYPES));

const ACCOUNT_TYPE_LABELS = {
  [ACCOUNT_TYPES.BANK_ACCOUNT]: 'Банковский счёт',
  [ACCOUNT_TYPES.CARD]: 'Банковская карта',
  [ACCOUNT_TYPES.DEPOSIT]: 'Вклад',
  [ACCOUNT_TYPES.CASH]: 'Наличные',
  [ACCOUNT_TYPES.CUSTOM]: 'Пользовательский счёт',
};

/**
 * Возвращает читаемое название типа средства.
 */
export function getAccountTypeLabel(accountType) {
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType ?? '—';
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
 * Валидация данных средства (раздел 14 ТЗ).
 */
export function validateAccountPayload(payload) {
  const errors = {};
  const name = String(payload.name ?? '').trim();
  const accountType = String(payload.accountType ?? '').trim();
  const balanceString = String(payload.balance ?? '').trim();
  const parsedBalance = Number(balanceString);

  if (!name) {
    errors.name = 'Укажите название.';
  }

  if (!accountType) {
    errors.accountType = 'Выберите тип средства.';
  } else if (!ACCOUNT_TYPE_VALUES.has(accountType)) {
    errors.accountType = 'Выберите тип из списка.';
  }

  if (!balanceString) {
    errors.balance = 'Укажите текущую сумму.';
  } else if (!Number.isFinite(parsedBalance)) {
    errors.balance = 'Укажите корректную сумму.';
  }

  return errors;
}

/**
 * Собирает объект средства из данных формы.
 */
export function buildAccountFromPayload(payload, existingAccount = null) {
  const now = new Date().toISOString();
  const parsedBalance = Number(String(payload.balance ?? '').trim());

  if (existingAccount) {
    return {
      ...existingAccount,
      name: String(payload.name ?? '').trim(),
      accountType: String(payload.accountType ?? '').trim(),
      balance: parsedBalance,
      comment: String(payload.comment ?? '').trim(),
      updatedAt: now,
    };
  }

  return {
    ...createAccountShape(),
    id: generateId('account'),
    name: String(payload.name ?? '').trim(),
    accountType: String(payload.accountType ?? '').trim(),
    balance: parsedBalance,
    comment: String(payload.comment ?? '').trim(),
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Нормализует массив средств после загрузки.
 */
export function normalizeAccounts(accounts) {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createAccountShape(),
      ...structuredClone(item),
      name: String(item.name ?? '').trim(),
      accountType: ACCOUNT_TYPE_VALUES.has(item.accountType) ? item.accountType : null,
      balance: Number.isFinite(Number(item.balance)) ? Number(item.balance) : 0,
      comment: String(item.comment ?? '').trim(),
      isHidden: Boolean(item.isHidden),
    }));
}

/**
 * Нормализует раздел «Мои средства».
 */
export function normalizeMyAssets(myAssets) {
  const defaults = createDefaultMyAssets();

  if (!myAssets || typeof myAssets !== 'object') {
    return structuredClone(defaults);
  }

  return {
    accounts: normalizeAccounts(myAssets.accounts),
    snapshots: Array.isArray(myAssets.snapshots)
      ? structuredClone(myAssets.snapshots)
      : [],
  };
}

/**
 * Возвращает активные (не отключённые) средства.
 */
export function getActiveAccounts(state) {
  return (state.myAssets?.accounts ?? []).filter((account) => !account.isHidden);
}

/**
 * Общая сумма остатков всех активных средств (раздел 14 ТЗ).
 */
export function calculateTotalActiveAssets(state) {
  return getActiveAccounts(state).reduce(
    (total, account) => total + Number(account.balance ?? 0),
    0,
  );
}

/**
 * Суммы остатков активных средств по каждому типу.
 */
export function calculateAssetsTotalsByType(state) {
  const totals = Object.fromEntries(
    Object.values(ACCOUNT_TYPES).map((type) => [type, 0]),
  );

  getActiveAccounts(state).forEach((account) => {
    if (account.accountType && Object.hasOwn(totals, account.accountType)) {
      totals[account.accountType] += Number(account.balance ?? 0);
    }
  });

  return totals;
}

const CUSHION_METHOD_LABELS = {
  [CUSHION_CALCULATION_METHODS.FIXED]: 'Фиксированная сумма',
  [CUSHION_CALCULATION_METHODS.INCOME_PERCENT]: 'Процент от доходов',
  [CUSHION_CALCULATION_METHODS.ASSETS_PERCENT]: 'Процент от общего объёма средств',
};

const MOOD_GROUPS = {
  POSITIVE: 'positive',
  WARNING: 'warning',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
};

/**
 * Человекочитаемый способ расчёта финансовой подушки.
 */
export function getCushionMethodLabel(method) {
  return CUSHION_METHOD_LABELS[method] ?? '—';
}

/**
 * Доходы текущего финансового периода (без капитализации вклада).
 */
export function getCurrentFinancialPeriodIncomes(state, referenceDate = new Date()) {
  const startDay = state.settings?.financialPeriodStartDay ?? 1;
  const { start, end } = getFinancialPeriodBounds(referenceDate, startDay);

  return (state.currentBudget?.incomes ?? []).filter((income) => {
    if (income.incomeType === INCOME_TYPES.DEPOSIT_CAPITALIZATION) {
      return false;
    }

    const date = parseIsoDate(income.date);

    if (!date) {
      return false;
    }

    const target = startOfDay(date);
    return target >= start && target <= end;
  });
}

/**
 * Сумма доходов текущего финансового периода.
 */
export function calculateCurrentPeriodIncomesTotal(state, referenceDate = new Date()) {
  return getCurrentFinancialPeriodIncomes(state, referenceDate)
    .reduce((total, income) => total + Number(income.amount ?? 0), 0);
}

/**
 * Сумма расходов текущего финансового периода.
 */
export function calculateCurrentPeriodExpensesTotal(state, referenceDate = new Date()) {
  return getCurrentFinancialPeriodExpenses(state, referenceDate)
    .reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
}

/**
 * Нормализует настройки финансовой подушки.
 */
export function normalizeFinancialCushion(financialCushion) {
  const defaults = createDefaultFinancialCushion();

  if (!financialCushion || typeof financialCushion !== 'object') {
    return structuredClone(defaults);
  }

  const method = Object.values(CUSHION_CALCULATION_METHODS).includes(financialCushion.calculationMethod)
    ? financialCushion.calculationMethod
    : defaults.calculationMethod;

  return {
    enabled: financialCushion.enabled !== false,
    calculationMethod: method,
    fixedAmount: Number.isFinite(Number(financialCushion.fixedAmount))
      ? Math.max(0, Number(financialCushion.fixedAmount))
      : 0,
    incomePercent: Number.isFinite(Number(financialCushion.incomePercent))
      ? Math.min(100, Math.max(0, Number(financialCushion.incomePercent)))
      : 0,
    assetsPercent: Number.isFinite(Number(financialCushion.assetsPercent))
      ? Math.min(100, Math.max(0, Number(financialCushion.assetsPercent)))
      : 0,
  };
}

/**
 * Валидация настроек финансовой подушки.
 */
export function validateFinancialCushionPayload(payload) {
  const errors = {};
  const enabled = payload.enabled !== false && payload.enabled !== 'false';
  const method = String(payload.calculationMethod ?? '').trim();

  if (!enabled) {
    return errors;
  }

  if (!method || !Object.values(CUSHION_CALCULATION_METHODS).includes(method)) {
    errors.calculationMethod = 'Выберите способ расчёта.';
    return errors;
  }

  if (method === CUSHION_CALCULATION_METHODS.FIXED) {
    const amount = Number(String(payload.fixedAmount ?? '').trim());

    if (!String(payload.fixedAmount ?? '').trim()) {
      errors.fixedAmount = 'Укажите сумму финансовой подушки.';
    } else if (!Number.isFinite(amount) || amount < 0) {
      errors.fixedAmount = 'Укажите корректную сумму.';
    }
  }

  if (method === CUSHION_CALCULATION_METHODS.INCOME_PERCENT) {
    const percent = Number(String(payload.incomePercent ?? '').trim());

    if (!String(payload.incomePercent ?? '').trim()) {
      errors.incomePercent = 'Укажите процент от доходов.';
    } else if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      errors.incomePercent = 'Процент должен быть от 0 до 100.';
    }
  }

  if (method === CUSHION_CALCULATION_METHODS.ASSETS_PERCENT) {
    const percent = Number(String(payload.assetsPercent ?? '').trim());

    if (!String(payload.assetsPercent ?? '').trim()) {
      errors.assetsPercent = 'Укажите процент от общего объёма средств.';
    } else if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      errors.assetsPercent = 'Процент должен быть от 0 до 100.';
    }
  }

  return errors;
}

/**
 * Собирает настройки подушки из данных формы.
 */
export function buildFinancialCushionFromPayload(payload, existingCushion = null) {
  const enabled = payload.enabled !== false && payload.enabled !== 'false';
  const base = existingCushion
    ? { ...existingCushion }
    : createDefaultFinancialCushion();

  return normalizeFinancialCushion({
    ...base,
    enabled,
    calculationMethod: String(payload.calculationMethod ?? base.calculationMethod).trim(),
    fixedAmount: String(payload.fixedAmount ?? base.fixedAmount).trim(),
    incomePercent: String(payload.incomePercent ?? base.incomePercent).trim(),
    assetsPercent: String(payload.assetsPercent ?? base.assetsPercent).trim(),
  });
}

/**
 * Доступные средства для расчёта «Мой запас» (активные средства, раздел 14 ТЗ).
 */
export function calculateAvailableFunds(state) {
  return calculateTotalActiveAssets(state);
}

/**
 * Рассчитывает целевой размер финансовой подушки.
 */
export function calculateCushionAmount(state, referenceDate = new Date()) {
  const cushion = normalizeFinancialCushion(state.financialCushion);

  if (!cushion.enabled) {
    return 0;
  }

  if (cushion.calculationMethod === CUSHION_CALCULATION_METHODS.FIXED) {
    return cushion.fixedAmount;
  }

  if (cushion.calculationMethod === CUSHION_CALCULATION_METHODS.INCOME_PERCENT) {
    const incomesTotal = calculateCurrentPeriodIncomesTotal(state, referenceDate);
    return (incomesTotal * cushion.incomePercent) / 100;
  }

  if (cushion.calculationMethod === CUSHION_CALCULATION_METHODS.ASSETS_PERCENT) {
    const assetsTotal = calculateTotalActiveAssets(state);
    return (assetsTotal * cushion.assetsPercent) / 100;
  }

  return 0;
}

/**
 * Рассчитывает показатель «Мой запас» (раздел 13 ТЗ).
 */
export function calculateMyReserve(state, referenceDate = new Date()) {
  const availableFunds = calculateAvailableFunds(state);
  const cushionAmount = calculateCushionAmount(state, referenceDate);

  return availableFunds - cushionAmount;
}

/**
 * Сводка по финансовой подушке и «Мой запас».
 */
export function calculateFinancialReserveSnapshot(state, referenceDate = new Date()) {
  const cushion = normalizeFinancialCushion(state.financialCushion);
  const availableFunds = calculateAvailableFunds(state);
  const targetAmount = calculateCushionAmount(state, referenceDate);
  const myReserve = availableFunds - targetAmount;
  const currentCoverage = Math.min(availableFunds, targetAmount);
  const achievementPercent = targetAmount > 0
    ? Math.min(100, (availableFunds / targetAmount) * 100)
    : (cushion.enabled ? 100 : 0);
  const remainderToGoal = Math.max(0, targetAmount - availableFunds);
  const periodIncomesTotal = calculateCurrentPeriodIncomesTotal(state, referenceDate);

  return {
    cushion,
    availableFunds,
    targetAmount,
    currentCoverage,
    achievementPercent,
    remainderToGoal,
    myReserve,
    periodIncomesTotal,
  };
}

/**
 * Определяет группу финансового настроения.
 */
export function determineFinancialMoodGroup(state, referenceDate = new Date()) {
  const snapshot = calculateFinancialReserveSnapshot(state, referenceDate);

  if (!snapshot.cushion.enabled) {
    return snapshot.availableFunds > 0 ? MOOD_GROUPS.NEUTRAL : MOOD_GROUPS.NEUTRAL;
  }

  if (snapshot.myReserve < 0) {
    return MOOD_GROUPS.NEGATIVE;
  }

  if (snapshot.achievementPercent >= 100 && snapshot.myReserve >= 0) {
    return MOOD_GROUPS.POSITIVE;
  }

  if (snapshot.remainderToGoal > 0 || snapshot.myReserve < snapshot.targetAmount * 0.2) {
    return MOOD_GROUPS.WARNING;
  }

  return MOOD_GROUPS.NEUTRAL;
}

/**
 * Выбирает фразу финансового настроения из настроек пользователя.
 */
export function pickFinancialMoodPhrase(state, referenceDate = new Date()) {
  const group = determineFinancialMoodGroup(state, referenceDate);
  const phrases = state.settings?.moodPhrases?.[group] ?? [];

  if (!Array.isArray(phrases) || phrases.length === 0) {
    return null;
  }

  const available = phrases
    .map((phrase) => String(phrase ?? '').trim())
    .filter(Boolean);

  if (available.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index];
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
    financialCushion: normalizeFinancialCushion(deepMerge(defaults.financialCushion, migrated.financialCushion)),
    references: mergeReferences(defaults.references, migrated.references),
    currentBudget: deepMerge(defaults.currentBudget, migrated.currentBudget),
    templates: normalizeTemplates(migrated.templates),
    myAssets: normalizeMyAssets(deepMerge(defaults.myAssets, migrated.myAssets)),
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
