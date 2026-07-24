/**
 * Общие утилиты календаря финансовых событий.
 * Используются в «Ожидаемых доходах»; позже — в отчётах с плановыми расходами.
 */

export const CALENDAR_EVENT_TYPES = {
  EXPECTED_INCOME: 'expected-income',
  PLANNED_EXPENSE: 'planned-expense',
};

/**
 * Создаёт унифицированное событие календаря.
 */
export function createCalendarEvent({
  type,
  sourceId,
  date,
  title,
  amount,
  payload = {},
}) {
  return {
    id: `${type}:${sourceId}:${date}`,
    type,
    sourceId,
    date,
    title,
    amount,
    ...payload,
  };
}

/**
 * Преобразует наступление ожидаемого дохода в событие календаря.
 */
export function expectedIncomeOccurrenceToCalendarEvent(occurrence) {
  return createCalendarEvent({
    type: CALENDAR_EVENT_TYPES.EXPECTED_INCOME,
    sourceId: occurrence.expectedIncomeId,
    date: occurrence.occurrenceDate,
    title: occurrence.expectedIncome.name,
    amount: occurrence.expectedIncome.amount,
    payload: {
      occurrence,
      status: occurrence.status,
      isCurrent: occurrence.isCurrent,
    },
  });
}

export function plannedExpenseOccurrenceToCalendarEvent(occurrence) {
  return createCalendarEvent({
    type: CALENDAR_EVENT_TYPES.PLANNED_EXPENSE,
    sourceId: occurrence.plannedExpenseId,
    date: occurrence.occurrenceDate,
    title: occurrence.plannedExpense.name,
    amount: occurrence.plannedExpense.amount,
    payload: {
      occurrence,
      status: occurrence.status,
      isCurrent: occurrence.isCurrent,
    },
  });
}

/**
 * Группирует события календаря по ISO-дате.
 */
export function groupCalendarEventsByDate(events) {
  const map = new Map();

  events.forEach((event) => {
    if (!map.has(event.date)) {
      map.set(event.date, []);
    }

    map.get(event.date).push(event);
  });

  return map;
}

/**
 * Подписи дней недели (понедельник — первый день).
 */
export function getCalendarWeekdayLabels() {
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
}

function formatIsoDateLocal(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Строит сетку календарного месяца (month — 0..11).
 */
export function buildCalendarMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;

  if (startOffset < 0) {
    startOffset = 6;
  }

  const daysInMonth = lastDay.getDate();
  const cells = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    cells.push({
      date: null,
      dayNumber: prevMonthLastDay - index,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: formatIsoDateLocal(year, month, day),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  let nextMonthDay = 1;

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      dayNumber: nextMonthDay,
      isCurrentMonth: false,
    });
    nextMonthDay += 1;
  }

  return cells;
}

/**
 * Названия месяцев для заголовка календаря.
 */
export function getCalendarMonthLabel(year, month) {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  return formatter.format(new Date(year, month, 1));
}
