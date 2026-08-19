/**
 * Модель данных приложения (App State).
 *
 * Единый источник структуры данных для всех модулей.
 * Два независимых направления учёта (раздел 1–2 ТЗ):
 * — currentBudget (текущий бюджет);
 * — myAssets (мои средства).
 */

export const APP_STATE_VERSION = '1.3.1';

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

/** Назначение средства (раздел 14 ТЗ). Независимо от типа счёта. */
export const ACCOUNT_PURPOSES = {
  CURRENT: 'current',
  RESERVE: 'reserve',
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
};

/** @deprecated Устаревший способ; при загрузке мигрирует в fixed. */
export const LEGACY_CUSHION_ASSETS_PERCENT = 'assets-percent';

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  JAPANESE: 'japanese',
  PEARL: 'pearl',
  BRONZE: 'bronze',
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
      critical: [],
    },
  };
}

function createDefaultFinancialCushion() {
  return {
    enabled: true,
    calculationMethod: CUSHION_CALCULATION_METHODS.FIXED,
    fixedAmount: 0,
    incomePercent: 0,
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
    sourceExpectedIncomeId: null,
    sourceOccurrenceDate: null,
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
    sourcePlannedExpenseId: null,
    sourceOccurrenceDate: null,
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
 * Все статьи расходов, включая скрытые.
 */
export function getAllExpenseArticles(state) {
  return state.references?.expenseArticles ?? [];
}

/**
 * Статья используется в расходах, плановых расходах, лимитах или шаблонах.
 */
export function isExpenseArticleInUse(state, articleId) {
  if (!articleId) {
    return false;
  }

  const inExpenses = (state.currentBudget?.expenses ?? []).some((item) => item.articleId === articleId);
  const inPlanned = (state.currentBudget?.plannedExpenses ?? []).some((item) => item.articleId === articleId);
  const inLimits = (state.currentBudget?.limits ?? []).some(
    (item) => item.limitType === LIMIT_TYPES.ARTICLE && item.targetId === articleId,
  );
  const inTemplates = (state.templates ?? []).some((template) => (
    template.expense?.articleId === articleId
    || template.plannedExpense?.articleId === articleId
  ));

  return inExpenses || inPlanned || inLimits || inTemplates;
}

/**
 * Валидация пользовательской статьи расходов.
 */
export function validateExpenseArticlePayload(payload, state, existingArticleId = null) {
  const errors = {};
  const name = String(payload.name ?? '').trim();

  if (!name) {
    errors.name = 'Укажите название статьи.';
  } else if (name.length > 80) {
    errors.name = 'Название не должно превышать 80 символов.';
  } else {
    const duplicate = getAllExpenseArticles(state).some((article) => (
      article.id !== existingArticleId
      && String(article.name ?? '').trim().toLowerCase() === name.toLowerCase()
    ));

    if (duplicate) {
      errors.name = 'Статья с таким названием уже существует.';
    }
  }

  return errors;
}

/**
 * Создаёт пользовательскую статью расходов.
 */
export function buildExpenseArticleFromPayload(payload, now = new Date().toISOString()) {
  return {
    ...createExpenseArticleShape(),
    id: generateId('article'),
    name: String(payload.name ?? '').trim(),
    isSystem: false,
    isStandard: false,
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Системные фразы финансового настроения (только для просмотра).
 */
export function getSystemMoodPhrases() {
  return structuredClone(SYSTEM_MOOD_PHRASES);
}

/**
 * Подписи групп фраз настроения.
 */
export function getMoodPhraseGroupLabel(group) {
  const labels = {
    [FINANCIAL_MOOD_PHRASE_GROUPS.POSITIVE]: 'Положительное (Стабильное)',
    [FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL]: 'Нейтральное (Допустимое)',
    [FINANCIAL_MOOD_PHRASE_GROUPS.WARNING]: 'Предупреждение (Требует внимания)',
    [FINANCIAL_MOOD_PHRASE_GROUPS.CRITICAL]: 'Критическое',
  };

  return labels[group] ?? group;
}

/**
 * Валидация дня месяца (1–31).
 */
export function validateDayOfMonth(value, fieldName = 'day') {
  const errors = {};
  const day = Number(value);

  if (!String(value ?? '').trim()) {
    errors[fieldName] = 'Укажите день месяца.';
  } else if (!Number.isInteger(day) || day < 1 || day > 31) {
    errors[fieldName] = 'Укажите день от 1 до 31.';
  }

  return errors;
}

/**
 * Нормализует пользовательские настройки.
 */
export function normalizeSettings(settings) {
  const defaults = createDefaultSettings();

  if (!settings || typeof settings !== 'object') {
    return structuredClone(defaults);
  }

  const periodDay = Number(settings.financialPeriodStartDay);
  const snapshotDay = Number(settings.monthlySnapshotDay);
  const theme = Object.values(THEMES).includes(settings.theme)
    ? settings.theme
    : defaults.theme;

  return {
    financialPeriodStartDay: Number.isInteger(periodDay) && periodDay >= 1 && periodDay <= 31
      ? periodDay
      : defaults.financialPeriodStartDay,
    theme,
    monthlySnapshotDay: Number.isInteger(snapshotDay) && snapshotDay >= 1 && snapshotDay <= 31
      ? snapshotDay
      : defaults.monthlySnapshotDay,
    moodPhrases: normalizeMoodPhrases(settings.moodPhrases),
  };
}

/**
 * Сбрасывает пользовательские параметры, не трогая операции и историю.
 */
export function createDefaultUserSettingsState() {
  return {
    settings: createDefaultSettings(),
    financialCushion: createDefaultFinancialCushion(),
  };
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
 * Создаёт или обновляет объект расходной операции из проверенных данных.
 */
export function buildExpenseFromPayload(payload, existingExpense = null, now = new Date().toISOString()) {
  const fields = {
    categoryId: String(payload.categoryId).trim(),
    articleId: String(payload.articleId).trim(),
    name: String(payload.name ?? '').trim(),
    date: String(payload.date).trim(),
    amount: Number(payload.amount),
    comment: String(payload.comment ?? '').trim(),
    updatedAt: now,
  };

  if (payload.sourcePlannedExpenseId != null) {
    fields.sourcePlannedExpenseId = String(payload.sourcePlannedExpenseId).trim() || null;
  }

  if (payload.sourceOccurrenceDate != null) {
    fields.sourceOccurrenceDate = String(payload.sourceOccurrenceDate).trim() || null;
  }

  if (existingExpense) {
    return {
      ...existingExpense,
      ...fields,
    };
  }

  return {
    ...createExpenseShape(),
    id: generateId('expense'),
    ...fields,
    createdAt: now,
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
 * Создаёт или обновляет объект доходной операции из проверенных данных.
 */
export function buildIncomeFromPayload(payload, existingIncome = null, now = new Date().toISOString()) {
  const fields = {
    incomeType: String(payload.category ?? payload.incomeType).trim(),
    name: String(payload.source ?? payload.name ?? '').trim(),
    date: String(payload.date).trim(),
    amount: Number(payload.amount),
    comment: String(payload.comment ?? '').trim(),
    updatedAt: now,
  };

  if (payload.sourceExpectedIncomeId != null) {
    fields.sourceExpectedIncomeId = String(payload.sourceExpectedIncomeId).trim() || null;
  }

  if (payload.sourceOccurrenceDate != null) {
    fields.sourceOccurrenceDate = String(payload.sourceOccurrenceDate).trim() || null;
  }

  if (existingIncome) {
    return {
      ...existingIncome,
      ...fields,
    };
  }

  return {
    ...createIncomeShape(),
    id: generateId('income'),
    ...fields,
    createdAt: now,
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
 * Ищет уже созданный фактический доход по ожидаемому наступлению.
 */
export function findIncomeByExpectedOccurrence(state, expectedIncomeId, occurrenceDate) {
  if (!expectedIncomeId || !occurrenceDate) {
    return null;
  }

  return (state.currentBudget?.incomes ?? []).find((income) => (
    income.sourceExpectedIncomeId === expectedIncomeId
    && income.sourceOccurrenceDate === occurrenceDate
  )) ?? null;
}

/**
 * Ищет уже созданный фактический расход по плановому наступлению.
 */
export function findExpenseByPlannedOccurrence(state, plannedExpenseId, occurrenceDate) {
  if (!plannedExpenseId || !occurrenceDate) {
    return null;
  }

  return (state.currentBudget?.expenses ?? []).find((expense) => (
    expense.sourcePlannedExpenseId === plannedExpenseId
    && expense.sourceOccurrenceDate === occurrenceDate
  )) ?? null;
}

/**
 * Подтверждает ожидаемый доход: создаёт фактическую операцию и сдвигает план.
 * Не создаёт дубликат, если это наступление уже подтверждено.
 *
 * @returns {{ status: 'created'|'already-confirmed'|'not-found'|'not-due', income: object|null, occurrenceDate: string|null }}
 */
export function applyExpectedIncomeConfirmation(draft, expectedIncomeId, confirmation = {}, now = new Date().toISOString()) {
  const index = draft.currentBudget.expectedIncomes.findIndex((item) => item.id === expectedIncomeId);

  if (index === -1) {
    return { status: 'not-found', income: null, occurrenceDate: null };
  }

  const expectedIncome = draft.currentBudget.expectedIncomes[index];
  const occurrenceDate = expectedIncome.nextOccurrenceDate;

  if (!expectedIncome.isEnabled || !occurrenceDate) {
    return { status: 'not-due', income: null, occurrenceDate };
  }

  const existing = findIncomeByExpectedOccurrence(draft, expectedIncomeId, occurrenceDate);

  if (existing) {
    return { status: 'already-confirmed', income: existing, occurrenceDate };
  }

  const amount = confirmation.amount != null ? confirmation.amount : expectedIncome.amount;
  const date = confirmation.date != null ? confirmation.date : occurrenceDate;
  const income = buildIncomeFromPayload({
    category: expectedIncome.incomeType,
    source: expectedIncome.name,
    date,
    amount,
    comment: expectedIncome.comment ?? '',
    sourceExpectedIncomeId: expectedIncomeId,
    sourceOccurrenceDate: occurrenceDate,
  }, null, now);

  draft.currentBudget.incomes.push(income);

  const isRecurring = isExpectedIncomeRecurring(expectedIncome.recurrence);

  draft.currentBudget.expectedIncomes[index] = {
    ...expectedIncome,
    nextOccurrenceDate: isRecurring
      ? calculateNextOccurrenceDate(occurrenceDate, expectedIncome.recurrence)
      : occurrenceDate,
    isEnabled: isRecurring,
    updatedAt: now,
  };

  return { status: 'created', income, occurrenceDate };
}

/**
 * Подтверждает плановый расход: создаёт фактическую операцию и сдвигает план.
 * Не создаёт дубликат, если это наступление уже подтверждено.
 *
 * @returns {{ status: 'created'|'already-confirmed'|'not-found'|'not-due', expense: object|null, occurrenceDate: string|null }}
 */
export function applyPlannedExpenseConfirmation(draft, plannedExpenseId, confirmation = {}, now = new Date().toISOString()) {
  const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

  if (index === -1) {
    return { status: 'not-found', expense: null, occurrenceDate: null };
  }

  const plannedExpense = draft.currentBudget.plannedExpenses[index];
  const occurrenceDate = plannedExpense.nextOccurrenceDate;

  if (!plannedExpense.isEnabled || !occurrenceDate) {
    return { status: 'not-due', expense: null, occurrenceDate };
  }

  const existing = findExpenseByPlannedOccurrence(draft, plannedExpenseId, occurrenceDate);

  if (existing) {
    return { status: 'already-confirmed', expense: existing, occurrenceDate };
  }

  const amount = confirmation.amount != null ? confirmation.amount : plannedExpense.amount;
  const date = confirmation.date != null ? confirmation.date : occurrenceDate;
  const expense = buildExpenseFromPayload({
    categoryId: plannedExpense.categoryId,
    articleId: plannedExpense.articleId,
    name: plannedExpense.name,
    date,
    amount,
    comment: plannedExpense.comment ?? '',
    sourcePlannedExpenseId: plannedExpenseId,
    sourceOccurrenceDate: occurrenceDate,
  }, null, now);

  draft.currentBudget.expenses.push(expense);

  const isRecurring = isPlannedExpenseRecurring(plannedExpense.recurrence);

  draft.currentBudget.plannedExpenses[index] = {
    ...plannedExpense,
    nextOccurrenceDate: isRecurring
      ? calculateNextOccurrenceDate(occurrenceDate, plannedExpense.recurrence)
      : occurrenceDate,
    isEnabled: isRecurring,
    updatedAt: now,
  };

  return { status: 'created', expense, occurrenceDate };
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
 * Есть ли подходящий шаблон, через который можно восстановить операцию.
 */
export function hasRelatedTemplate(templates, templateType, nameCandidates = []) {
  const normalizedType = normalizeTemplateType(templateType);
  const names = new Set(
    nameCandidates
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter(Boolean),
  );

  if (!normalizedType || names.size === 0) {
    return false;
  }

  return (templates ?? []).some((template) => {
    if (!template || template.isEnabled === false) {
      return false;
    }

    if (normalizeTemplateType(template.templateType) !== normalizedType) {
      return false;
    }

    const candidates = [
      template.name,
      template.income?.source,
      template.expense?.name,
      template.expectedIncome?.name,
      template.plannedExpense?.name,
    ]
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter(Boolean);

    return candidates.some((candidate) => names.has(candidate));
  });
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

  const allowedTypes = new Set(Object.values(TEMPLATE_TYPES));

  return uniqueById(templates
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => {
      const templateType = normalizeTemplateType(item.templateType);

      return {
        ...createTemplateShape(),
        ...structuredClone(item),
        templateType: allowedTypes.has(templateType) ? templateType : null,
        name: String(item.name ?? '').trim(),
        comment: String(item.comment ?? '').trim(),
        isEnabled: item.isEnabled !== false,
        lastUsedAt: item.lastUsedAt ?? null,
      };
    })
    .filter((item) => item.templateType));
}

const ACCOUNT_TYPE_VALUES = new Set(Object.values(ACCOUNT_TYPES));
const ACCOUNT_PURPOSE_VALUES = new Set(Object.values(ACCOUNT_PURPOSES));

const ACCOUNT_TYPE_LABELS = {
  [ACCOUNT_TYPES.BANK_ACCOUNT]: 'Банковский счёт',
  [ACCOUNT_TYPES.CARD]: 'Банковская карта',
  [ACCOUNT_TYPES.DEPOSIT]: 'Вклад',
  [ACCOUNT_TYPES.CASH]: 'Наличные',
  [ACCOUNT_TYPES.CUSTOM]: 'Пользовательский счёт',
};

const ACCOUNT_PURPOSE_LABELS = {
  [ACCOUNT_PURPOSES.CURRENT]: 'Текущие денежные средства',
  [ACCOUNT_PURPOSES.RESERVE]: 'Финансовые запасы',
};

/**
 * Возвращает читаемое название типа средства.
 */
export function getAccountTypeLabel(accountType) {
  return ACCOUNT_TYPE_LABELS[accountType] ?? accountType ?? '—';
}

/**
 * Возвращает читаемое название назначения средства.
 */
export function getAccountPurposeLabel(purpose) {
  return ACCOUNT_PURPOSE_LABELS[purpose] ?? purpose ?? '—';
}

/**
 * Нормализует назначение средства.
 * Средства без purpose считаются текущими (миграция существующих данных).
 */
export function normalizeAccountPurpose(purpose) {
  return ACCOUNT_PURPOSE_VALUES.has(purpose) ? purpose : ACCOUNT_PURPOSES.CURRENT;
}

/**
 * Шаблон счёта (раздел 14 ТЗ).
 */
export function createAccountShape() {
  return {
    id: null,
    name: '',
    accountType: null,
    purpose: ACCOUNT_PURPOSES.CURRENT,
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
  const purpose = String(payload.purpose ?? '').trim();
  const balanceString = String(payload.balance ?? '').trim();
  const parsedBalance = Number(balanceString);

  if (!name) {
    errors.name = 'Укажите название.';
  }

  if (!accountType) {
    errors.accountType = 'Выберите тип денежных средств.';
  } else if (!ACCOUNT_TYPE_VALUES.has(accountType)) {
    errors.accountType = 'Выберите тип из списка.';
  }

  if (!purpose) {
    errors.purpose = 'Выберите назначение денежных средств.';
  } else if (!ACCOUNT_PURPOSE_VALUES.has(purpose)) {
    errors.purpose = 'Выберите назначение из списка.';
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
  const purpose = normalizeAccountPurpose(String(payload.purpose ?? '').trim());

  if (existingAccount) {
    return {
      ...existingAccount,
      name: String(payload.name ?? '').trim(),
      accountType: String(payload.accountType ?? '').trim(),
      purpose,
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
    purpose,
    balance: parsedBalance,
    comment: String(payload.comment ?? '').trim(),
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Нормализует массив средств после загрузки.
 * Средства без purpose получают назначение «Текущие средства».
 */
export function normalizeAccounts(accounts) {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return uniqueById(accounts
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createAccountShape(),
      ...structuredClone(item),
      name: String(item.name ?? '').trim(),
      accountType: ACCOUNT_TYPE_VALUES.has(item.accountType) ? item.accountType : null,
      purpose: normalizeAccountPurpose(item.purpose),
      balance: normalizeFiniteNumber(item.balance, 0),
      comment: String(item.comment ?? '').trim(),
      isHidden: Boolean(item.isHidden),
    })));
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
    snapshots: normalizeSnapshots(myAssets.snapshots),
  };
}

/**
 * Возвращает активные (не отключённые) средства.
 */
export function getActiveAccounts(state) {
  return (state.myAssets?.accounts ?? []).filter((account) => !account.isHidden);
}

/**
 * Сумма остатков активных средств с указанным назначением.
 */
function sumActiveAccountsByPurpose(state, purpose) {
  return getActiveAccounts(state)
    .filter((account) => normalizeAccountPurpose(account.purpose) === purpose)
    .reduce((total, account) => total + Number(account.balance ?? 0), 0);
}

/**
 * Текущие средства — сумма активных средств с назначением «Текущие средства».
 */
export function calculateCurrentFunds(state) {
  return sumActiveAccountsByPurpose(state, ACCOUNT_PURPOSES.CURRENT);
}

/**
 * Финансовые запасы — сумма активных средств с назначением «Финансовые запасы».
 */
export function calculateReserveFunds(state) {
  return sumActiveAccountsByPurpose(state, ACCOUNT_PURPOSES.RESERVE);
}

/**
 * Общие средства = Текущие средства + Финансовые запасы.
 */
export function calculateTotalFunds(state) {
  return calculateCurrentFunds(state) + calculateReserveFunds(state);
}

/**
 * @deprecated Используйте calculateTotalFunds.
 * Сохранено для совместимости внутренних вызовов.
 */
export function calculateTotalActiveAssets(state) {
  return calculateTotalFunds(state);
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

/**
 * Суммы активных средств по назначению.
 */
export function calculateAssetsTotalsByPurpose(state) {
  return {
    [ACCOUNT_PURPOSES.CURRENT]: calculateCurrentFunds(state),
    [ACCOUNT_PURPOSES.RESERVE]: calculateReserveFunds(state),
    total: calculateTotalFunds(state),
  };
}

const CUSHION_METHOD_LABELS = {
  [CUSHION_CALCULATION_METHODS.FIXED]: 'Фиксированная сумма',
  [CUSHION_CALCULATION_METHODS.INCOME_PERCENT]: 'Процент от дохода',
};

/** Состояния финансового настроения на главном экране. */
export const FINANCIAL_MOOD_STATES = {
  STABLE: 'stable',
  ACCEPTABLE: 'acceptable',
  ALERT: 'alert',
  CRITICAL: 'critical',
};

/** Группы фраз финансового настроения (раздел 16–17 ТЗ). */
export const FINANCIAL_MOOD_PHRASE_GROUPS = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

const MOOD_STATE_LABELS = {
  [FINANCIAL_MOOD_STATES.STABLE]: 'Стабильное',
  [FINANCIAL_MOOD_STATES.ACCEPTABLE]: 'Допустимое',
  [FINANCIAL_MOOD_STATES.ALERT]: 'Требует внимания',
  [FINANCIAL_MOOD_STATES.CRITICAL]: 'Критическое',
};

const STATE_PHRASE_GROUPS = {
  [FINANCIAL_MOOD_STATES.STABLE]: [
    FINANCIAL_MOOD_PHRASE_GROUPS.POSITIVE,
  ],
  [FINANCIAL_MOOD_STATES.ACCEPTABLE]: [
    FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL,
  ],
  [FINANCIAL_MOOD_STATES.ALERT]: [
    FINANCIAL_MOOD_PHRASE_GROUPS.WARNING,
  ],
  [FINANCIAL_MOOD_STATES.CRITICAL]: [
    FINANCIAL_MOOD_PHRASE_GROUPS.CRITICAL,
  ],
};

/** Базовые тексты состояний: баланс периода ↔ финансовая подушка. */
const MOOD_STATE_DEFAULT_TEXTS = {
  [FINANCIAL_MOOD_STATES.STABLE]: 'Финансовая модель сбалансирована.',
  [FINANCIAL_MOOD_STATES.ACCEPTABLE]: 'Достигнут минимальный безопасный уровень.',
  [FINANCIAL_MOOD_STATES.ALERT]: 'Финансовая модель даёт сбой. Рекомендуется увеличить доходы или уменьшить расходы.',
  [FINANCIAL_MOOD_STATES.CRITICAL]: 'Расходы превышают доходы. Финансовая подушка не достигнута.',
};

const SYSTEM_MOOD_PHRASES = {
  [FINANCIAL_MOOD_PHRASE_GROUPS.POSITIVE]: [
    MOOD_STATE_DEFAULT_TEXTS[FINANCIAL_MOOD_STATES.STABLE],
  ],
  [FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL]: [
    MOOD_STATE_DEFAULT_TEXTS[FINANCIAL_MOOD_STATES.ACCEPTABLE],
  ],
  [FINANCIAL_MOOD_PHRASE_GROUPS.WARNING]: [
    MOOD_STATE_DEFAULT_TEXTS[FINANCIAL_MOOD_STATES.ALERT],
  ],
  [FINANCIAL_MOOD_PHRASE_GROUPS.CRITICAL]: [
    MOOD_STATE_DEFAULT_TEXTS[FINANCIAL_MOOD_STATES.CRITICAL],
  ],
};

/**
 * Округляет денежную сумму до копеек для корректного сравнения.
 */
function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

/**
 * Человекочитаемый способ расчёта финансовой подушки.
 */
export function getCushionMethodLabel(method) {
  return CUSHION_METHOD_LABELS[method] ?? '—';
}

/**
 * Человекочитаемое название состояния финансового настроения.
 */
export function getFinancialMoodStateLabel(stateId) {
  return MOOD_STATE_LABELS[stateId] ?? '—';
}

/**
 * Нормализует пользовательские фразы настроения.
 * Поддерживает миграцию устаревшего ключа negative → critical.
 */
export function normalizeMoodPhrases(moodPhrases) {
  const source = moodPhrases && typeof moodPhrases === 'object' ? moodPhrases : {};
  const criticalSource = Array.isArray(source.critical)
    ? source.critical
    : (Array.isArray(source.negative) ? source.negative : []);

  return {
    positive: Array.isArray(source.positive) ? source.positive.map((item) => String(item ?? '')) : [],
    neutral: Array.isArray(source.neutral) ? source.neutral.map((item) => String(item ?? '')) : [],
    warning: Array.isArray(source.warning) ? source.warning.map((item) => String(item ?? '')) : [],
    critical: criticalSource.map((item) => String(item ?? '')),
  };
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
 * Баланс периода = доходы периода − расходы периода.
 * Не зависит от «Мои средства», вкладов и финансовой подушки.
 */
export function calculatePeriodBalance(state, referenceDate = new Date()) {
  return calculateCurrentPeriodIncomesTotal(state, referenceDate)
    - calculateCurrentPeriodExpensesTotal(state, referenceDate);
}

/**
 * Человекочитаемое название периода отчёта.
 */
export function getReportPeriodLabel(periodType) {
  const labels = {
    [REPORT_PERIODS.WEEK]: 'Неделя',
    [REPORT_PERIODS.MONTH]: 'Месяц',
    [REPORT_PERIODS.YEAR]: 'Год',
    [REPORT_PERIODS.CUSTOM]: 'Произвольный период',
  };

  return labels[periodType] ?? 'Период';
}

/**
 * Границы выбранного периода отчёта (раздел 15 ТЗ).
 * Для месяца используется дата начала финансового периода из настроек.
 */
export function getReportPeriodBounds(state, options = {}) {
  const referenceDate = options.referenceDate ?? new Date();
  const periodType = options.periodType
    ?? state.reports?.preferences?.defaultPeriod
    ?? REPORT_PERIODS.MONTH;
  const customPeriod = options.customPeriod
    ?? state.reports?.preferences?.customPeriod
    ?? {};
  const startDay = state.settings?.financialPeriodStartDay ?? 1;
  const ref = startOfDay(referenceDate);

  if (periodType === REPORT_PERIODS.WEEK) {
    return {
      periodType,
      start: addDays(ref, -6),
      end: ref,
    };
  }

  if (periodType === REPORT_PERIODS.YEAR) {
    const current = getFinancialPeriodBounds(ref, startDay);
    const yearAgo = getFinancialPeriodBounds(addMonthsPreserveDay(ref, -11), startDay);

    return {
      periodType,
      start: yearAgo.start,
      end: current.end,
    };
  }

  if (periodType === REPORT_PERIODS.CUSTOM) {
    const parsedStart = parseIsoDate(customPeriod.start);
    const parsedEnd = parseIsoDate(customPeriod.end);
    const start = startOfDay(parsedStart ?? ref);
    const end = startOfDay(parsedEnd ?? ref);

    if (start <= end) {
      return { periodType, start, end };
    }

    return { periodType, start: end, end: start };
  }

  const monthBounds = getFinancialPeriodBounds(ref, startDay);

  return {
    periodType: REPORT_PERIODS.MONTH,
    start: monthBounds.start,
    end: monthBounds.end,
  };
}

function isDateWithinBounds(dateString, start, end) {
  const date = parseIsoDate(dateString);

  if (!date) {
    return false;
  }

  const target = startOfDay(date);
  return target >= start && target <= end;
}

/**
 * Подтверждённые доходы в произвольном диапазоне дат (без капитализации вклада).
 */
export function getIncomesInDateRange(state, start, end) {
  return (state.currentBudget?.incomes ?? []).filter((income) => {
    if (income.incomeType === INCOME_TYPES.DEPOSIT_CAPITALIZATION) {
      return false;
    }

    return isDateWithinBounds(income.date, start, end);
  });
}

/**
 * Подтверждённые расходы в произвольном диапазоне дат.
 */
export function getExpensesInDateRange(state, start, end) {
  return (state.currentBudget?.expenses ?? []).filter((expense) => (
    isDateWithinBounds(expense.date, start, end)
  ));
}

function sumOperationAmounts(operations) {
  return operations.reduce((total, item) => total + Number(item.amount ?? 0), 0);
}

function getInclusiveDayCount(start, end) {
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

function shiftPeriodBounds(start, end) {
  const days = getInclusiveDayCount(start, end);
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));

  return {
    start: previousStart,
    end: previousEnd,
  };
}

function buildShareBreakdown(groups, total) {
  return Object.entries(groups)
    .map(([id, amount]) => ({
      id,
      amount,
      sharePercent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .filter((item) => item.amount !== 0)
    .sort((first, second) => second.amount - first.amount);
}

/** Порог «значительного» улучшения баланса периода относительно прошлого. */
const SIGNIFICANT_BALANCE_IMPROVEMENT_RATIO = 0.25;
const SIGNIFICANT_BALANCE_IMPROVEMENT_MIN = 1000;

/**
 * Информационные финансовые наблюдения (разделы 15, 17 ТЗ).
 * Формируются автоматически только по фактическим подтверждённым данным.
 * Не являются уведомлениями, не требуют действий и не меняют показатели.
 *
 * @param {object} state
 * @param {{ referenceDate?: Date, start?: Date, end?: Date }} [options]
 * @returns {string[]}
 */
export function buildFinancialObservations(state, options = {}) {
  const observations = [];

  if (!state) {
    return observations;
  }

  const referenceDate = options.referenceDate ?? new Date();
  const startDay = state.settings?.financialPeriodStartDay ?? 1;
  const currentBounds = options.start instanceof Date && options.end instanceof Date
    ? { start: startOfDay(options.start), end: startOfDay(options.end) }
    : getFinancialPeriodBounds(referenceDate, startDay);

  const previousBounds = shiftPeriodBounds(currentBounds.start, currentBounds.end);

  const incomes = getIncomesInDateRange(state, currentBounds.start, currentBounds.end);
  const expenses = getExpensesInDateRange(state, currentBounds.start, currentBounds.end);
  const previousIncomes = getIncomesInDateRange(state, previousBounds.start, previousBounds.end);
  const previousExpenses = getExpensesInDateRange(state, previousBounds.start, previousBounds.end);

  const incomesTotal = sumOperationAmounts(incomes);
  const expensesTotal = sumOperationAmounts(expenses);
  const previousIncomesTotal = sumOperationAmounts(previousIncomes);
  const previousExpensesTotal = sumOperationAmounts(previousExpenses);
  const periodBalance = incomesTotal - expensesTotal;
  const previousPeriodBalance = previousIncomesTotal - previousExpensesTotal;
  const hasPreviousPeriodData = previousIncomes.length > 0 || previousExpenses.length > 0;

  if (hasPreviousPeriodData) {
    if (incomesTotal > previousIncomesTotal) {
      observations.push('Доходы выросли по сравнению с предыдущим периодом.');
    } else if (incomesTotal < previousIncomesTotal) {
      observations.push('Доходы снизились по сравнению с предыдущим периодом.');
    }

    if (expensesTotal < previousExpensesTotal) {
      observations.push('Расходы снизились по сравнению с предыдущим периодом.');
    } else if (expensesTotal > previousExpensesTotal) {
      observations.push('Расходы выросли по сравнению с предыдущим периодом.');
    }
  }

  const topArticle = findTopExpenseArticle(state, expenses);

  if (topArticle) {
    observations.push(`Самая крупная статья расходов — «${topArticle.name}».`);
  }

  const topIncomeSource = findTopIncomeSource(incomes);

  if (topIncomeSource) {
    observations.push(`Наибольший источник доходов — «${topIncomeSource}».`);
  }

  const totalFunds = calculateTotalFunds(state);
  const previousTotalFunds = getLatestSnapshotTotalFunds(state);

  if (previousTotalFunds !== null) {
    if (totalFunds > previousTotalFunds) {
      observations.push('Общая сумма денежных средств увеличилась.');
    } else if (totalFunds < previousTotalFunds) {
      observations.push('Общая сумма денежных средств уменьшилась.');
    }
  }

  const cushion = normalizeFinancialCushion(state.financialCushion);
  const cushionAmount = calculateCushionAmount(state, currentBounds.end);

  if (cushion.enabled && cushionAmount > 0 && periodBalance >= cushionAmount) {
    observations.push('Финансовая подушка полностью обеспечена.');
  }

  if (hasPreviousPeriodData) {
    const balanceDelta = periodBalance - previousPeriodBalance;
    const significantThreshold = Math.max(
      Math.abs(previousPeriodBalance) * SIGNIFICANT_BALANCE_IMPROVEMENT_RATIO,
      SIGNIFICANT_BALANCE_IMPROVEMENT_MIN,
    );

    if (
      balanceDelta >= significantThreshold
      || (previousPeriodBalance < 0 && periodBalance >= 0 && balanceDelta > 0)
    ) {
      observations.push('Баланс периода значительно улучшился.');
    } else if (periodBalance < previousPeriodBalance) {
      observations.push('Баланс периода снизился относительно прошлого периода.');
    }
  }

  return observations;
}

function findTopExpenseArticle(state, expenses) {
  if (!expenses.length) {
    return null;
  }

  const articleTotals = {};

  expenses.forEach((expense) => {
    const articleId = expense.articleId;

    if (!articleId) {
      return;
    }

    articleTotals[articleId] = (articleTotals[articleId] ?? 0) + Number(expense.amount ?? 0);
  });

  const topEntry = Object.entries(articleTotals)
    .sort((first, second) => second[1] - first[1])[0];

  if (!topEntry || topEntry[1] <= 0) {
    return null;
  }

  const [articleId, amount] = topEntry;
  const name = getReferenceName(getAllExpenseArticles(state), articleId);

  if (!name || name === '—') {
    return null;
  }

  return { id: articleId, name, amount };
}

function findTopIncomeSource(incomes) {
  if (!incomes.length) {
    return null;
  }

  const sourceTotals = {};

  incomes.forEach((income) => {
    const source = String(income.name ?? '').trim() || 'Без названия';
    sourceTotals[source] = (sourceTotals[source] ?? 0) + Number(income.amount ?? 0);
  });

  const topEntry = Object.entries(sourceTotals)
    .sort((first, second) => second[1] - first[1])[0];

  if (!topEntry || topEntry[1] <= 0) {
    return null;
  }

  return topEntry[0];
}

/**
 * Общая сумма из последнего ежемесячного снимка средств (если есть).
 */
function getLatestSnapshotTotalFunds(state) {
  const snapshots = state.myAssets?.snapshots ?? [];

  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return null;
  }

  const latest = [...snapshots]
    .filter((item) => item && typeof item === 'object')
    .sort((first, second) => String(second.date ?? '').localeCompare(String(first.date ?? '')))[0];

  if (!latest) {
    return null;
  }

  const directTotal = Number(latest.totalAmount ?? latest.totalFunds ?? latest.total);

  if (Number.isFinite(directTotal)) {
    return directTotal;
  }

  if (!Array.isArray(latest.accounts)) {
    return null;
  }

  const accountsTotal = latest.accounts.reduce(
    (sum, account) => sum + Number(account.balance ?? account.amount ?? 0),
    0,
  );

  return Number.isFinite(accountsTotal) ? accountsTotal : null;
}

/**
 * Сводка раздела «Отчёты и аналитика» за выбранный период.
 */
export function buildReportSummary(state, options = {}) {
  const bounds = getReportPeriodBounds(state, options);
  const incomes = getIncomesInDateRange(state, bounds.start, bounds.end);
  const expenses = getExpensesInDateRange(state, bounds.start, bounds.end);
  const incomesTotal = sumOperationAmounts(incomes);
  const expensesTotal = sumOperationAmounts(expenses);
  const periodBalance = incomesTotal - expensesTotal;

  const incomeTypeGroups = {};
  incomes.forEach((income) => {
    const key = income.incomeType || 'unknown';
    incomeTypeGroups[key] = (incomeTypeGroups[key] ?? 0) + Number(income.amount ?? 0);
  });

  const categoryGroups = {};
  const articleGroups = {};
  expenses.forEach((expense) => {
    const categoryId = expense.categoryId || 'unknown';
    const articleId = expense.articleId || 'unknown';
    categoryGroups[categoryId] = (categoryGroups[categoryId] ?? 0) + Number(expense.amount ?? 0);
    articleGroups[articleId] = (articleGroups[articleId] ?? 0) + Number(expense.amount ?? 0);
  });

  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);

  const expensesByCategory = buildShareBreakdown(categoryGroups, expensesTotal).map((item) => ({
    ...item,
    name: getReferenceName(categories, item.id),
  }));

  const expensesByArticle = buildShareBreakdown(articleGroups, expensesTotal).map((item) => ({
    ...item,
    name: getReferenceName(articles, item.id),
  }));

  const incomesByType = buildShareBreakdown(incomeTypeGroups, incomesTotal);

  const previousBounds = shiftPeriodBounds(bounds.start, bounds.end);
  const previousIncomesTotal = sumOperationAmounts(
    getIncomesInDateRange(state, previousBounds.start, previousBounds.end),
  );
  const previousExpensesTotal = sumOperationAmounts(
    getExpensesInDateRange(state, previousBounds.start, previousBounds.end),
  );

  const cushion = normalizeFinancialCushion(state.financialCushion);
  const cushionAmount = calculateCushionAmount(state, bounds.end);
  const currentFunds = calculateCurrentFunds(state);
  const reserveFunds = calculateReserveFunds(state);
  const totalFunds = calculateTotalFunds(state);

  const limits = (state.currentBudget?.limits ?? []).map((limit) => {
    const actualSpent = calculateActualSpentForLimit(limit, expenses);
    const limitAmount = Number(limit.amount) || 0;
    const remaining = Math.max(0, limitAmount - actualSpent);
    const overspend = Math.max(0, actualSpent - limitAmount);
    const usagePercent = limitAmount > 0
      ? Math.round((actualSpent / limitAmount) * 100)
      : (actualSpent > 0 ? 100 : 0);

    return {
      id: limit.id,
      name: getLimitTargetName(state, limit),
      typeLabel: getLimitTypeLabel(limit.limitType),
      limitAmount,
      actualSpent,
      remaining,
      overspend,
      usagePercent,
    };
  });

  const summary = {
    periodType: bounds.periodType,
    periodLabel: getReportPeriodLabel(bounds.periodType),
    startDate: formatIsoDate(bounds.start),
    endDate: formatIsoDate(bounds.end),
    incomesTotal,
    expensesTotal,
    periodBalance,
    incomesByType,
    expensesByCategory,
    expensesByArticle,
    limits,
    currentFunds,
    reserveFunds,
    totalFunds,
    cushion,
    cushionAmount,
    previous: {
      startDate: formatIsoDate(previousBounds.start),
      endDate: formatIsoDate(previousBounds.end),
      incomesTotal: previousIncomesTotal,
      expensesTotal: previousExpensesTotal,
      periodBalance: previousIncomesTotal - previousExpensesTotal,
    },
  };

  summary.observations = buildFinancialObservations(state, {
    referenceDate: options.referenceDate,
    start: bounds.start,
    end: bounds.end,
  });

  return summary;
}

/**
 * Нормализует предпочтения раздела отчётов.
 */
export function normalizeReports(reports) {
  const defaults = createDefaultReports();

  if (!reports || typeof reports !== 'object') {
    return structuredClone(defaults);
  }

  const periodType = Object.values(REPORT_PERIODS).includes(reports.preferences?.defaultPeriod)
    ? reports.preferences.defaultPeriod
    : defaults.preferences.defaultPeriod;

  const customStart = String(reports.preferences?.customPeriod?.start ?? '').trim() || null;
  const customEnd = String(reports.preferences?.customPeriod?.end ?? '').trim() || null;

  return {
    preferences: {
      defaultPeriod: periodType,
      customPeriod: {
        start: customStart && parseIsoDate(customStart) ? customStart : null,
        end: customEnd && parseIsoDate(customEnd) ? customEnd : null,
      },
    },
  };
}

/**
 * Нормализует настройки финансовой подушки.
 * Устаревший способ «процент от активов» мигрирует в фиксированную сумму.
 */
export function normalizeFinancialCushion(financialCushion) {
  const defaults = createDefaultFinancialCushion();

  if (!financialCushion || typeof financialCushion !== 'object') {
    return structuredClone(defaults);
  }

  let method = financialCushion.calculationMethod;

  if (method === LEGACY_CUSHION_ASSETS_PERCENT) {
    method = CUSHION_CALCULATION_METHODS.FIXED;
  }

  if (!Object.values(CUSHION_CALCULATION_METHODS).includes(method)) {
    method = defaults.calculationMethod;
  }

  return {
    enabled: financialCushion.enabled !== false,
    calculationMethod: method,
    fixedAmount: Number.isFinite(Number(financialCushion.fixedAmount))
      ? Math.max(0, Number(financialCushion.fixedAmount))
      : 0,
    incomePercent: Number.isFinite(Number(financialCushion.incomePercent))
      ? Math.min(100, Math.max(0, Number(financialCushion.incomePercent)))
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
      errors.incomePercent = 'Укажите процент от дохода.';
    } else if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      errors.incomePercent = 'Процент должен быть от 0 до 100.';
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
  });
}

/**
 * Рассчитывает целевой размер финансовой подушки (безопасный уровень).
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

  return 0;
}

/**
 * Сводка по балансу периода, средствам и финансовой подушке.
 * Подушка = минимальный безопасный уровень; сравнивается с балансом периода
 * и не вычитается из активов. Проценты покрытия не используются.
 */
export function calculateFinancialReserveSnapshot(state, referenceDate = new Date()) {
  const cushion = normalizeFinancialCushion(state.financialCushion);
  const currentFunds = calculateCurrentFunds(state);
  const reserveFunds = calculateReserveFunds(state);
  const totalFunds = calculateTotalFunds(state);
  const targetAmount = calculateCushionAmount(state, referenceDate);
  const periodIncomesTotal = calculateCurrentPeriodIncomesTotal(state, referenceDate);
  const periodExpensesTotal = calculateCurrentPeriodExpensesTotal(state, referenceDate);
  const periodBalance = periodIncomesTotal - periodExpensesTotal;

  return {
    cushion,
    currentFunds,
    reserveFunds,
    totalFunds,
    targetAmount,
    periodIncomesTotal,
    periodExpensesTotal,
    periodBalance,
  };
}

/**
 * Определяет состояние финансового настроения.
 * Сравнение: баланс периода ↔ финансовая подушка.
 */
export function determineFinancialMoodState(state, referenceDate = new Date()) {
  const snapshot = calculateFinancialReserveSnapshot(state, referenceDate);
  const periodBalance = roundMoney(snapshot.periodBalance);
  const cushionAmount = snapshot.cushion.enabled
    ? roundMoney(snapshot.targetAmount)
    : 0;

  if (periodBalance < 0) {
    return FINANCIAL_MOOD_STATES.CRITICAL;
  }

  if (!snapshot.cushion.enabled) {
    return FINANCIAL_MOOD_STATES.STABLE;
  }

  if (periodBalance > cushionAmount) {
    return FINANCIAL_MOOD_STATES.STABLE;
  }

  if (periodBalance === cushionAmount) {
    return FINANCIAL_MOOD_STATES.ACCEPTABLE;
  }

  return FINANCIAL_MOOD_STATES.ALERT;
}

/**
 * Определяет группу фраз для текущего состояния настроения.
 */
export function determineFinancialMoodGroup(state, referenceDate = new Date()) {
  const moodState = determineFinancialMoodState(state, referenceDate);
  return STATE_PHRASE_GROUPS[moodState]?.[0] ?? FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL;
}

/**
 * Базовый текст состояния финансового настроения.
 */
export function getFinancialMoodStatusText(moodState) {
  return MOOD_STATE_DEFAULT_TEXTS[moodState] ?? '';
}

/**
 * Выбирает фразу финансового настроения из пользовательских или системных фраз.
 */
export function pickFinancialMoodPhrase(state, referenceDate = new Date()) {
  const moodState = determineFinancialMoodState(state, referenceDate);
  const groups = STATE_PHRASE_GROUPS[moodState] ?? [FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL];
  const userPhrases = normalizeMoodPhrases(state.settings?.moodPhrases);

  for (const group of groups) {
    const available = (userPhrases[group] ?? [])
      .map((phrase) => String(phrase ?? '').trim())
      .filter(Boolean);

    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }

  return getFinancialMoodStatusText(moodState) || null;
}

/**
 * Шаблон ежемесячного снимка средств (раздел 14 ТЗ).
 * После сохранения не изменяется и не влияет на текущие остатки.
 */
export function createSnapshotShape() {
  return {
    id: null,
    date: null,
    periodKey: null,
    accountBalances: [],
    currentFunds: 0,
    reserveFunds: 0,
    totalAmount: 0,
    createdAt: null,
  };
}

/**
 * Ключ периода снимка (календарный месяц даты снимка).
 */
export function getAssetsSnapshotPeriodKey(dateString) {
  const date = parseIsoDate(dateString);

  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Снимки, отсортированные от новых к старым.
 */
export function getSortedAssetsSnapshots(state) {
  return [...(state.myAssets?.snapshots ?? [])]
    .filter((item) => item && item.id && item.date)
    .sort((first, second) => {
      const byDate = String(second.date).localeCompare(String(first.date));

      if (byDate !== 0) {
        return byDate;
      }

      return String(second.createdAt ?? '').localeCompare(String(first.createdAt ?? ''));
    });
}

/**
 * Есть ли снимок за тот же месяц, что и dateString.
 */
export function hasAssetsSnapshotForPeriod(state, dateString) {
  const periodKey = getAssetsSnapshotPeriodKey(dateString);

  if (!periodKey) {
    return false;
  }

  return (state.myAssets?.snapshots ?? []).some((snapshot) => (
    snapshot.periodKey === periodKey
    || getAssetsSnapshotPeriodKey(snapshot.date) === periodKey
  ));
}

/**
 * Снимок на точную дату (YYYY-MM-DD), если есть.
 */
export function findAssetsSnapshotByDate(state, dateString) {
  if (!dateString) {
    return null;
  }

  return (state.myAssets?.snapshots ?? []).find((snapshot) => snapshot?.date === dateString) ?? null;
}

/**
 * Предыдущий снимок относительно переданного (или последний, если snapshot не указан).
 */
export function getPreviousAssetsSnapshot(state, snapshot = null) {
  const sorted = getSortedAssetsSnapshots(state);

  if (!snapshot) {
    return sorted[0] ?? null;
  }

  const index = sorted.findIndex((item) => item.id === snapshot.id);

  if (index === -1) {
    return sorted.find((item) => String(item.date) < String(snapshot.date)) ?? null;
  }

  return sorted[index + 1] ?? null;
}

/**
 * Собирает неизменяемый снимок активных средств на указанную дату.
 */
export function buildAssetsSnapshotFromState(state, dateString = formatIsoDate(new Date()), now = new Date().toISOString()) {
  const date = parseIsoDate(dateString) ? dateString : formatIsoDate(new Date());
  const accounts = getActiveAccounts(state);
  const accountBalances = accounts.map((account) => ({
    accountId: account.id,
    name: String(account.name ?? '').trim(),
    accountType: account.accountType ?? null,
    purpose: normalizeAccountPurpose(account.purpose),
    balance: Number(account.balance ?? 0),
  }));

  const currentFunds = accountBalances
    .filter((item) => item.purpose === ACCOUNT_PURPOSES.CURRENT)
    .reduce((sum, item) => sum + item.balance, 0);
  const reserveFunds = accountBalances
    .filter((item) => item.purpose === ACCOUNT_PURPOSES.RESERVE)
    .reduce((sum, item) => sum + item.balance, 0);

  return {
    ...createSnapshotShape(),
    id: generateId('snapshot'),
    date,
    periodKey: getAssetsSnapshotPeriodKey(date),
    accountBalances,
    currentFunds,
    reserveFunds,
    totalAmount: currentFunds + reserveFunds,
    createdAt: now,
  };
}

/**
 * Изменение суммы относительно предыдущего снимка.
 */
export function calculateSnapshotAmountChange(currentAmount, previousAmount) {
  const current = Number(currentAmount ?? 0);
  const previous = previousAmount == null ? null : Number(previousAmount);

  if (previous == null || !Number.isFinite(previous)) {
    return { absolute: null, percent: null };
  }

  const absolute = current - previous;
  const percent = previous === 0
    ? (current === 0 ? 0 : null)
    : Math.round(((absolute / previous) * 1000)) / 10;

  return { absolute, percent };
}

/**
 * Напоминание о ежемесячном снимке: день наступил, снимка за текущий месяц ещё нет.
 */
export function isAssetsSnapshotReminderDue(state, referenceDate = new Date()) {
  const snapshotDay = Number(state.settings?.monthlySnapshotDay ?? 1);
  const day = Number.isInteger(snapshotDay) && snapshotDay >= 1 && snapshotDay <= 31
    ? snapshotDay
    : 1;
  const today = startOfDay(referenceDate);
  const dueDay = clampDay(today.getFullYear(), today.getMonth(), day);

  if (today.getDate() < dueDay) {
    return false;
  }

  return !hasAssetsSnapshotForPeriod(state, formatIsoDate(today));
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
 * Миграции устаревших структур перед возвращением нормализованного состояния.
 * Существующие данные не удаляются без необходимости; только перенос и очистка legacy-полей.
 */
function migrateLegacyState(rawState) {
  if (!rawState || typeof rawState !== 'object') {
    return rawState;
  }

  const migrated = structuredClone(rawState);

  // Подушка раньше жила в settings.
  if (migrated.settings?.financialCushion && !migrated.financialCushion) {
    migrated.financialCushion = migrated.settings.financialCushion;
    delete migrated.settings.financialCushion;
  }

  // Статьи перенесены в references.expenseArticles.
  if (migrated.settings?.customExpenseArticles) {
    const legacyArticles = Array.isArray(migrated.settings.customExpenseArticles)
      ? migrated.settings.customExpenseArticles
      : [];

    if (!migrated.references || typeof migrated.references !== 'object') {
      migrated.references = {};
    }

    if (!Array.isArray(migrated.references.expenseArticles)) {
      migrated.references.expenseArticles = [];
    }

    legacyArticles.forEach((article) => {
      if (!article || typeof article !== 'object' || !article.id) {
        return;
      }

      const exists = migrated.references.expenseArticles.some((item) => item.id === article.id);

      if (!exists) {
        migrated.references.expenseArticles.push({
          ...createExpenseArticleShape(),
          ...article,
          isSystem: false,
          isStandard: false,
          isHidden: Boolean(article.isHidden),
        });
      }
    });

    delete migrated.settings.customExpenseArticles;
  }

  if (migrated.settings?.moodPhrases) {
    migrated.settings.moodPhrases = normalizeMoodPhrases(migrated.settings.moodPhrases);
  }

  // Устаревший «Мой запас» / reserveFunds как отдельная сущность больше не используется.
  if (migrated.myReserve !== undefined) {
    delete migrated.myReserve;
  }

  if (migrated.reserve !== undefined) {
    delete migrated.reserve;
  }

  return migrated;
}

function uniqueById(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function normalizeFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRecurrence(recurrence) {
  const defaults = createRecurrenceShape();

  if (!recurrence || typeof recurrence !== 'object') {
    return structuredClone(defaults);
  }

  const allowedFrequencies = new Set([
    ...Object.values(RECURRENCE_FREQUENCIES),
    EXPECTED_INCOME_RECURRENCE_ONCE,
  ]);

  const frequency = allowedFrequencies.has(recurrence.frequency)
    ? recurrence.frequency
    : null;

  const intervalDays = recurrence.intervalDays == null || recurrence.intervalDays === ''
    ? null
    : normalizeFiniteNumber(recurrence.intervalDays, null);

  const intervalMonths = recurrence.intervalMonths == null || recurrence.intervalMonths === ''
    ? null
    : normalizeFiniteNumber(recurrence.intervalMonths, null);

  return {
    frequency,
    intervalDays: intervalDays === null || intervalDays > 0 ? intervalDays : null,
    intervalMonths: intervalMonths === null || intervalMonths > 0 ? intervalMonths : null,
  };
}

function normalizeIncomes(incomes) {
  if (!Array.isArray(incomes)) {
    return [];
  }

  return uniqueById(incomes
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createIncomeShape(),
      ...structuredClone(item),
      name: String(item.name ?? item.source ?? '').trim(),
      amount: normalizeFiniteNumber(item.amount, 0),
      comment: String(item.comment ?? '').trim(),
      sourceExpectedIncomeId: item.sourceExpectedIncomeId ?? null,
      sourceOccurrenceDate: item.sourceOccurrenceDate ?? null,
    })));
}

function normalizeExpenses(expenses) {
  if (!Array.isArray(expenses)) {
    return [];
  }

  return uniqueById(expenses
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createExpenseShape(),
      ...structuredClone(item),
      name: String(item.name ?? '').trim(),
      amount: normalizeFiniteNumber(item.amount, 0),
      comment: String(item.comment ?? '').trim(),
      sourcePlannedExpenseId: item.sourcePlannedExpenseId ?? null,
      sourceOccurrenceDate: item.sourceOccurrenceDate ?? null,
    })));
}

function normalizeLimitsList(limits) {
  if (!Array.isArray(limits)) {
    return [];
  }

  return uniqueById(limits
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createLimitShape(),
      ...structuredClone(item),
      amount: Math.max(0, normalizeFiniteNumber(item.amount, 0)),
    })));
}

function normalizePlannedExpenses(plannedExpenses) {
  if (!Array.isArray(plannedExpenses)) {
    return [];
  }

  return uniqueById(plannedExpenses
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => {
      const firstDate = item.firstDate ?? item.nextOccurrenceDate ?? null;
      const nextOccurrenceDate = item.nextOccurrenceDate ?? firstDate ?? null;

      return {
        ...createPlannedExpenseShape(),
        ...structuredClone(item),
        name: String(item.name ?? '').trim(),
        amount: normalizeFiniteNumber(item.amount, 0),
        comment: String(item.comment ?? '').trim(),
        firstDate,
        nextOccurrenceDate,
        recurrence: normalizeRecurrence(item.recurrence),
        isEnabled: item.isEnabled !== false,
      };
    }));
}

function normalizeExpectedIncomes(expectedIncomes) {
  if (!Array.isArray(expectedIncomes)) {
    return [];
  }

  return uniqueById(expectedIncomes
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => ({
      ...createExpectedIncomeShape(),
      ...structuredClone(item),
      name: String(item.name ?? '').trim(),
      amount: normalizeFiniteNumber(item.amount, 0),
      comment: String(item.comment ?? '').trim(),
      nextOccurrenceDate: item.nextOccurrenceDate ?? null,
      recurrence: normalizeRecurrence(item.recurrence),
      isEnabled: item.isEnabled !== false,
    })));
}

/**
 * Нормализует currentBudget: гарантирует массивы и поля операций.
 */
export function normalizeCurrentBudget(currentBudget) {
  if (!currentBudget || typeof currentBudget !== 'object') {
    return createDefaultCurrentBudget();
  }

  return {
    incomes: normalizeIncomes(currentBudget.incomes),
    expenses: normalizeExpenses(currentBudget.expenses),
    limits: normalizeLimitsList(currentBudget.limits),
    plannedExpenses: normalizePlannedExpenses(currentBudget.plannedExpenses),
    expectedIncomes: normalizeExpectedIncomes(currentBudget.expectedIncomes),
  };
}

function normalizeSnapshots(snapshots) {
  if (!Array.isArray(snapshots)) {
    return [];
  }

  return uniqueById(snapshots
    .filter((item) => item && typeof item === 'object' && item.id)
    .map((item) => {
      const legacyAccounts = Array.isArray(item.accounts) ? item.accounts : [];
      const sourceBalances = Array.isArray(item.accountBalances) && item.accountBalances.length > 0
        ? item.accountBalances
        : legacyAccounts;

      const accountBalances = sourceBalances
        .filter((balance) => balance && typeof balance === 'object' && (balance.accountId || balance.id))
        .map((balance) => ({
          accountId: balance.accountId ?? balance.id,
          name: String(balance.name ?? '').trim(),
          accountType: balance.accountType ?? null,
          purpose: normalizeAccountPurpose(balance.purpose),
          balance: normalizeFiniteNumber(balance.balance ?? balance.amount, 0),
        }));

      const currentFunds = Number.isFinite(Number(item.currentFunds))
        ? Number(item.currentFunds)
        : accountBalances
          .filter((entry) => entry.purpose === ACCOUNT_PURPOSES.CURRENT)
          .reduce((sum, entry) => sum + entry.balance, 0);

      const reserveFunds = Number.isFinite(Number(item.reserveFunds))
        ? Number(item.reserveFunds)
        : accountBalances
          .filter((entry) => entry.purpose === ACCOUNT_PURPOSES.RESERVE)
          .reduce((sum, entry) => sum + entry.balance, 0);

      const totalAmount = Number.isFinite(Number(item.totalAmount ?? item.totalFunds ?? item.total))
        ? Number(item.totalAmount ?? item.totalFunds ?? item.total)
        : currentFunds + reserveFunds;

      const date = item.date ?? null;

      return {
        ...createSnapshotShape(),
        id: item.id,
        date,
        periodKey: item.periodKey || getAssetsSnapshotPeriodKey(date),
        accountBalances,
        currentFunds,
        reserveFunds,
        totalAmount,
        createdAt: item.createdAt ?? null,
      };
    }));
}

/**
 * Нормализует сохранённый список уведомлений (не UI-панель).
 * Условные reminder/warning пересчитываются при запуске и здесь не дублируются.
 */
export function normalizeNotifications(notifications) {
  const defaults = createDefaultNotifications();

  if (!notifications || typeof notifications !== 'object') {
    return structuredClone(defaults);
  }

  const allowedTypes = new Set(Object.values(NOTIFICATION_TYPES));

  const items = Array.isArray(notifications.items)
    ? uniqueById(notifications.items
      .filter((item) => item && typeof item === 'object' && item.id)
      .map((item) => ({
        ...createNotificationShape(),
        ...structuredClone(item),
        type: allowedTypes.has(item.type) ? item.type : NOTIFICATION_TYPES.INFO,
        message: String(item.message ?? '').trim(),
        source: String(item.source ?? '').trim(),
        isDismissed: Boolean(item.isDismissed),
      })))
    : [];

  return { items };
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
      ...(migrated.meta && typeof migrated.meta === 'object' ? migrated.meta : {}),
      version: APP_STATE_VERSION,
      budgetId: migrated.meta?.budgetId ?? defaults.meta.budgetId,
      createdAt: migrated.meta?.createdAt ?? defaults.meta.createdAt,
      lastSavedAt: migrated.meta?.lastSavedAt ?? null,
    },
    settings: normalizeSettings(migrated.settings),
    financialCushion: normalizeFinancialCushion(migrated.financialCushion),
    references: mergeReferences(defaults.references, migrated.references),
    currentBudget: normalizeCurrentBudget(migrated.currentBudget),
    templates: normalizeTemplates(migrated.templates),
    myAssets: normalizeMyAssets(migrated.myAssets),
    notifications: normalizeNotifications(migrated.notifications),
    reports: normalizeReports(migrated.reports),
    ui: {
      ...defaults.ui,
      ...(migrated.ui && typeof migrated.ui === 'object' ? migrated.ui : {}),
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
