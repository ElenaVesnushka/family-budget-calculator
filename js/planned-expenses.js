/**
 * Модуль «Плановые расходы» (раздел 10 ТЗ).
 * Вкладка внутри раздела «Расходы».
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification, syncNotificationsByPrefix } from './notifications.js?v=20260725-11';
import {
  RECURRENCE_FREQUENCIES,
  EXPECTED_INCOME_RECURRENCE_ONCE,
  TEMPLATE_TYPES,
  getExpenseCategories,
  getAvailableExpenseArticles,
  getReferenceName,
  getRecurrenceLabel,
  validatePlannedExpensePayload,
  buildPlannedExpenseFromPayload,
  buildRecurrenceFromPayload,
  validateExpensePayload,
  applyPlannedExpenseConfirmation,
  findExpenseByPlannedOccurrence,
  calculateNextOccurrenceDate,
  isPlannedExpenseDue,
  isPlannedExpenseRecurring,
  collectPlannedExpenseOccurrences,
  formatIsoDate,
  hasRelatedTemplate,
} from './state.js';
import {
  buildCalendarMonthGrid,
  getCalendarMonthLabel,
  getCalendarWeekdayLabels,
  groupCalendarEventsByDate,
  plannedExpenseOccurrenceToCalendarEvent,
} from './calendar-events.js';

const EXPENSES_WORKSPACE_ID = 'expenses-workspace';
const PLANNED_REMINDER_PREFIX = 'reminder-planned-';

const RECURRENCE_OPTIONS = [
  { value: RECURRENCE_FREQUENCIES.DAILY, label: 'Ежедневно' },
  { value: RECURRENCE_FREQUENCIES.WEEKLY, label: 'Еженедельно' },
  { value: RECURRENCE_FREQUENCIES.MONTHLY, label: 'Ежемесячно' },
  { value: RECURRENCE_FREQUENCIES.INTERVAL, label: 'Каждые N дней' },
  { value: RECURRENCE_FREQUENCIES.INTERVAL_MONTHS, label: 'Каждые N месяцев' },
  { value: RECURRENCE_FREQUENCIES.YEARLY, label: 'Ежегодно' },
  { value: RECURRENCE_FREQUENCIES.CUSTOM, label: 'Произвольный период' },
  { value: RECURRENCE_FREQUENCIES.UNLIMITED, label: 'Без ограничения' },
];

const VIEW_MODES = {
  LIST: 'list',
  CALENDAR: 'calendar',
};

let workspace = null;
let stateUpdateListenerAttached = false;
let tabsListenerAttached = false;
let viewMode = VIEW_MODES.LIST;
let calendarCursor = new Date();
const confirmingIds = new Set();

function getExpensesWorkspace() {
  return document.getElementById(EXPENSES_WORKSPACE_ID) ?? getSectionRegion('expenses');
}

function getPlannedPanel() {
  return workspace?.querySelector('[data-expenses-panel="planned"]');
}

/**
 * Инициализирует вкладку «Плановые расходы».
 */
export function initPlannedExpenses() {
  workspace = getExpensesWorkspace();

  if (!workspace) {
    return;
  }

  attachTabsListener();
  attachStateUpdateListener();
  ensurePlannedLayout();

  if (isStateInitialized()) {
    renderPlannedExpenses();
    renderLocalDueReminders();
  }
}

function ensurePlannedLayout() {
  const panel = getPlannedPanel();

  if (!panel || panel.querySelector('.planned-expenses')) {
    return;
  }

  panel.append(createPlannedExpensesLayout());
}

function attachTabsListener() {
  if (tabsListenerAttached) {
    return;
  }

  document.addEventListener('click', handleExpensesTabClick);
  tabsListenerAttached = true;
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', handleStateUpdated);
  stateUpdateListenerAttached = true;
}

function handleStateUpdated() {
  if (!workspace || !isStateInitialized()) {
    return;
  }

  renderPlannedExpenses();
  renderLocalDueReminders();
}

function handleExpensesTabClick(event) {
  const tabButton = event.target.closest('[data-expenses-tab]');

  if (!tabButton || !tabButton.closest('.expenses-shell')) {
    return;
  }

  switchExpensesTab(tabButton.dataset.expensesTab);
  event.preventDefault();
}

export function switchExpensesTab(tabName) {
  workspace = getExpensesWorkspace();

  if (!workspace) {
    return;
  }

  const shell = workspace.querySelector('.expenses-shell');

  if (!shell) {
    return;
  }

  shell.querySelectorAll('[data-expenses-tab]').forEach((button) => {
    const isActive = button.dataset.expensesTab === tabName;
    button.classList.toggle('expenses-tabs__button--active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  shell.querySelectorAll('[data-expenses-panel]').forEach((panel) => {
    const isActive = panel.dataset.expensesPanel === tabName;
    panel.hidden = !isActive;
  });

  if (tabName === 'planned') {
    initPlannedExpenses();
  }
}

function handlePlannedExpensesClick(event) {
  const addButton = event.target.closest('[data-action="add-planned-expense"]');

  if (addButton) {
    initPlannedExpenses();
    switchExpensesTab('planned');
    openAddPlannedExpenseModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-planned-expense"]');

  if (editButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    openEditPlannedExpenseModal(editButton.dataset.plannedExpenseId);
    event.preventDefault();
    return;
  }

  const viewButton = event.target.closest('[data-planned-view]');

  if (viewButton?.closest('.planned-expenses')) {
    initPlannedExpenses();
    switchPlannedExpensesView(viewButton.dataset.plannedView);
    event.preventDefault();
    return;
  }

  const calendarNavButton = event.target.closest('[data-planned-calendar-nav]');

  if (calendarNavButton?.closest('.planned-expenses__calendar')) {
    initPlannedExpenses();
    shiftCalendarMonth(Number(calendarNavButton.dataset.plannedCalendarNav));
    event.preventDefault();
    return;
  }

  const toggleButton = event.target.closest('[data-action="toggle-planned-expense"]');

  if (toggleButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    handleTogglePlannedExpense(toggleButton.dataset.plannedExpenseId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-planned-expense"]');

  if (deleteButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    handleDeletePlannedExpense(deleteButton.dataset.plannedExpenseId);
    event.preventDefault();
    return;
  }

  const confirmButton = event.target.closest('[data-action="confirm-planned-expense"]');

  if (confirmButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    openConfirmPlannedExpenseModal(confirmButton.dataset.plannedExpenseId);
    event.preventDefault();
    return;
  }

  const postponeButton = event.target.closest('[data-action="postpone-planned-expense"]');

  if (postponeButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    openPostponePlannedExpenseModal(postponeButton.dataset.plannedExpenseId);
    event.preventDefault();
    return;
  }

  const skipButton = event.target.closest('[data-action="skip-planned-expense"]');

  if (skipButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    handleSkipPlannedExpense(skipButton.dataset.plannedExpenseId);
    event.preventDefault();
  }
}

document.addEventListener('click', handlePlannedExpensesClick);

function switchPlannedExpensesView(nextView) {
  if (!Object.values(VIEW_MODES).includes(nextView)) {
    return;
  }

  viewMode = nextView;

  const container = getPlannedPanel()?.querySelector('.planned-expenses');

  if (!container) {
    return;
  }

  container.querySelectorAll('[data-planned-view]').forEach((button) => {
    const isActive = button.dataset.plannedView === viewMode;
    button.classList.toggle('planned-expenses__view-button--active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  container.querySelector('[data-planned-expenses-list]').hidden = viewMode !== VIEW_MODES.LIST;
  container.querySelector('[data-planned-expenses-calendar]').hidden = viewMode !== VIEW_MODES.CALENDAR;

  renderPlannedExpenses();
}

function shiftCalendarMonth(delta) {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + delta, 1);
  renderPlannedExpensesCalendar();
}

function renderPlannedExpenses() {
  if (viewMode === VIEW_MODES.CALENDAR) {
    renderPlannedExpensesCalendar();
    return;
  }

  renderPlannedExpensesList();
}

function createPlannedExpensesLayout() {
  const container = document.createElement('div');
  container.className = 'planned-expenses';

  container.innerHTML = `
    <div class="planned-expenses__reminders" data-planned-reminders hidden aria-live="polite"></div>
    <div class="planned-expenses__toolbar">
      <div class="planned-expenses__view-toggle" role="tablist" aria-label="Режим просмотра плановых расходов">
        <button type="button" class="planned-expenses__view-button planned-expenses__view-button--active" data-planned-view="list" role="tab" aria-selected="true">
          Список
        </button>
        <button type="button" class="planned-expenses__view-button" data-planned-view="calendar" role="tab" aria-selected="false">
          Календарь
        </button>
      </div>
      <button type="button" class="btn btn--primary" data-action="add-planned-expense">
        Добавить плановый расход
      </button>
    </div>
    <div class="planned-expenses__list" data-planned-expenses-list role="region" aria-label="Список плановых расходов"></div>
    <div class="planned-expenses__calendar" data-planned-expenses-calendar role="region" aria-label="Календарь плановых расходов" hidden></div>
  `;

  return container;
}

function renderLocalDueReminders() {
  const remindersRegion = getPlannedPanel()?.querySelector('[data-planned-reminders]');

  if (!remindersRegion || !isStateInitialized()) {
    return;
  }

  const dueItems = (getAppState().currentBudget.plannedExpenses ?? []).filter((item) => (
    isPlannedExpenseDue(item)
  ));

  if (dueItems.length === 0) {
    remindersRegion.hidden = true;
    remindersRegion.replaceChildren();
    return;
  }

  remindersRegion.hidden = false;
  remindersRegion.replaceChildren();

  dueItems.forEach((item) => {
    const notice = document.createElement('p');
    notice.className = 'planned-expenses__reminder';
    notice.textContent = `Запланирован расход «${item.name}». Подтвердите выполнение операции.`;
    remindersRegion.append(notice);
  });
}

/**
 * Reminder в общей панели о плановых расходах, требующих подтверждения.
 */
export function syncPlannedExpenseReminders() {
  if (!isStateInitialized()) {
    return;
  }

  const dueItems = (getAppState().currentBudget?.plannedExpenses ?? []).filter((item) => (
    isPlannedExpenseDue(item)
  ));

  syncNotificationsByPrefix(
    PLANNED_REMINDER_PREFIX,
    dueItems.map((item) => ({
      id: `${PLANNED_REMINDER_PREFIX}${item.id}`,
      type: 'reminder',
      message: `Запланирован расход «${item.name}». Подтвердите выполнение операции.`,
    })),
  );
}

function renderPlannedExpensesList() {
  workspace = getExpensesWorkspace();
  ensurePlannedLayout();

  const listRegion = getPlannedPanel()?.querySelector('[data-planned-expenses-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const occurrences = collectPlannedExpenseOccurrences(state.currentBudget.plannedExpenses ?? []);
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);

  listRegion.replaceChildren();

  if (occurrences.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'planned-expenses__empty';
    emptyState.textContent = 'Будущие плановые расходы не запланированы. Нажмите «Добавить плановый расход», чтобы запланировать платёж.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'planned-expenses-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Дата</th>
        <th scope="col">Название</th>
        <th scope="col">Сумма</th>
        <th scope="col">Категория</th>
        <th scope="col">Статья</th>
        <th scope="col">Периодичность</th>
        <th scope="col">Статус</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  occurrences.forEach((occurrence) => {
    tbody.append(createPlannedExpenseOccurrenceRow(occurrence, categories, articles));
  });

  table.append(tbody);
  listRegion.append(table);
}

function renderPlannedExpensesCalendar() {
  workspace = getExpensesWorkspace();
  ensurePlannedLayout();

  const calendarRegion = getPlannedPanel()?.querySelector('[data-planned-expenses-calendar]');

  if (!calendarRegion || !isStateInitialized()) {
    return;
  }

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const occurrences = collectPlannedExpenseOccurrences(getAppState().currentBudget.plannedExpenses ?? []);
  const events = occurrences.map(plannedExpenseOccurrenceToCalendarEvent);
  const eventsByDate = groupCalendarEventsByDate(events);
  const todayIso = formatIsoDate(new Date());

  calendarRegion.replaceChildren();

  const header = document.createElement('div');
  header.className = 'planned-expenses-calendar__header';
  header.innerHTML = `
    <button type="button" class="btn btn--secondary planned-expenses-calendar__nav" data-planned-calendar-nav="-1" aria-label="Предыдущий месяц">←</button>
    <h3 class="planned-expenses-calendar__title">${escapeHtml(getCalendarMonthLabel(year, month))}</h3>
    <button type="button" class="btn btn--secondary planned-expenses-calendar__nav" data-planned-calendar-nav="1" aria-label="Следующий месяц">→</button>
  `;
  calendarRegion.append(header);

  const weekdayRow = document.createElement('div');
  weekdayRow.className = 'planned-expenses-calendar__weekdays';
  getCalendarWeekdayLabels().forEach((label) => {
    const cell = document.createElement('div');
    cell.className = 'planned-expenses-calendar__weekday';
    cell.textContent = label;
    weekdayRow.append(cell);
  });
  calendarRegion.append(weekdayRow);

  const grid = document.createElement('div');
  grid.className = 'planned-expenses-calendar__grid';

  buildCalendarMonthGrid(year, month).forEach((cell) => {
    const dayCell = document.createElement('div');
    dayCell.className = 'planned-expenses-calendar__day';

    if (!cell.isCurrentMonth) {
      dayCell.classList.add('planned-expenses-calendar__day--outside');
    }

    if (cell.date === todayIso) {
      dayCell.classList.add('planned-expenses-calendar__day--today');
    }

    const dayLabel = document.createElement('div');
    dayLabel.className = 'planned-expenses-calendar__day-number';
    dayLabel.textContent = String(cell.dayNumber);
    dayCell.append(dayLabel);

    if (cell.date && eventsByDate.has(cell.date)) {
      const eventsList = document.createElement('ul');
      eventsList.className = 'planned-expenses-calendar__events';

      eventsByDate.get(cell.date).forEach((event) => {
        const item = document.createElement('li');
        item.className = 'planned-expenses-calendar__event';

        if (event.status === 'Ожидает подтверждения') {
          item.classList.add('planned-expenses-calendar__event--due');
        }

        item.title = `${event.title} — ${formatAmount(event.amount)}`;
        item.textContent = `${event.title} (${formatAmount(event.amount)})`;
        eventsList.append(item);
      });

      dayCell.append(eventsList);
    }

    grid.append(dayCell);
  });

  calendarRegion.append(grid);

  if (occurrences.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'planned-expenses__empty planned-expenses-calendar__empty';
    emptyState.textContent = 'В выбранном периоде нет запланированных расходов.';
    calendarRegion.append(emptyState);
  }
}

function createPlannedExpenseOccurrenceRow(occurrence, categories, articles) {
  const { plannedExpense, occurrenceDate, status, isCurrent } = occurrence;
  const row = document.createElement('tr');
  let statusClass = '';

  if (status === 'Ожидает подтверждения') {
    statusClass = 'planned-expenses-table__row--due';
  } else if (status === 'Отключён' || status === 'Завершён') {
    statusClass = 'planned-expenses-table__row--disabled';
  }

  row.className = `planned-expenses-table__row ${statusClass}`.trim();
  row.dataset.plannedExpenseId = plannedExpense.id;
  row.dataset.occurrenceDate = occurrenceDate;

  const showActions = isCurrent;
  const isDue = status === 'Ожидает подтверждения';

  const dueActions = showActions && isDue
    ? `
      <button type="button" class="btn btn--primary" data-action="confirm-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Подтвердить расход
      </button>
      <button type="button" class="btn btn--secondary" data-action="postpone-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Перенести дату
      </button>
      <button type="button" class="btn btn--secondary" data-action="skip-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Пропустить
      </button>
    `
    : '';

  const manageActions = showActions
    ? `
      <button type="button" class="btn btn--secondary" data-action="edit-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="toggle-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        ${plannedExpense.isEnabled ? 'Отключить' : 'Включить'}
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Удалить
      </button>
    `
    : '';

  row.innerHTML = `
    <td>${formatDisplayDate(occurrenceDate)}</td>
    <td class="planned-expenses-table__name">${escapeHtml(plannedExpense.name)}</td>
    <td class="planned-expenses-table__amount">${formatAmount(plannedExpense.amount)}</td>
    <td>${escapeHtml(getReferenceName(categories, plannedExpense.categoryId))}</td>
    <td>${escapeHtml(getReferenceName(articles, plannedExpense.articleId))}</td>
    <td>${escapeHtml(getRecurrenceLabel(plannedExpense.recurrence))}</td>
    <td>${escapeHtml(status)}</td>
    <td class="planned-expenses-table__actions">
      ${dueActions}
      ${manageActions}
    </td>
  `;

  return row;
}

export function openAddPlannedExpenseModal(initialValues = null) {
  const form = createPlannedExpenseForm(initialValues);
  return openModal({ title: 'Добавить плановый расход', content: form });
}

function openEditPlannedExpenseModal(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return null;
  }

  const form = createPlannedExpenseForm(plannedExpense);
  return openModal({ title: 'Изменить плановый расход', content: form });
}

function createPlannedExpenseForm(plannedExpense = null) {
  const state = getAppState();
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);
  const isEdit = Boolean(plannedExpense?.id);
  const form = document.createElement('form');
  form.className = 'planned-expenses-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="planned-name">Название</label>
      <input class="form-field__input" type="text" id="planned-name" name="name" maxlength="120" required autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-category">Категория</label>
      <select class="form-field__input" id="planned-category" name="categoryId" required>
        ${renderSelectOptions(categories, 'Выберите категорию', plannedExpense?.categoryId)}
      </select>
      <p class="form-field__error" data-error-for="categoryId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-article">Статья</label>
      <select class="form-field__input" id="planned-article" name="articleId" required>
        ${renderSelectOptions(articles, 'Выберите статью', plannedExpense?.articleId)}
      </select>
      <p class="form-field__error" data-error-for="articleId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-amount">Предполагаемая сумма</label>
      <input class="form-field__input" type="number" id="planned-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-first-date">Дата следующего выполнения</label>
      <input class="form-field__input" type="date" id="planned-first-date" name="firstDate" required>
      <p class="form-field__error" data-error-for="firstDate" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-frequency">Периодичность</label>
      <select class="form-field__input" id="planned-frequency" name="frequency" required>
        ${renderRecurrenceOptions(plannedExpense?.recurrence?.frequency)}
      </select>
      <p class="form-field__error" data-error-for="frequency" hidden></p>
    </div>
    <div class="form-field" data-interval-days-field hidden>
      <label class="form-field__label" for="planned-interval-days">Каждые N дней</label>
      <input class="form-field__input" type="number" id="planned-interval-days" name="intervalDays" min="1" step="1" inputmode="numeric">
      <p class="form-field__error" data-error-for="intervalDays" hidden></p>
    </div>
    <div class="form-field" data-interval-months-field hidden>
      <label class="form-field__label" for="planned-interval-months">Каждые N месяцев</label>
      <input class="form-field__input" type="number" id="planned-interval-months" name="intervalMonths" min="1" step="1" inputmode="numeric">
      <p class="form-field__error" data-error-for="intervalMonths" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="planned-comment" name="comment" rows="3" maxlength="500"></textarea>
      <p class="form-field__error" data-error-for="comment" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-planned-expense">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (plannedExpense) {
    if (isEdit) {
      form.dataset.plannedExpenseId = plannedExpense.id;
    }

    form.querySelector('#planned-name').value = plannedExpense.name ?? '';
    form.querySelector('#planned-category').value = plannedExpense.categoryId ?? '';
    form.querySelector('#planned-article').value = plannedExpense.articleId ?? '';
    form.querySelector('#planned-amount').value = plannedExpense.amount != null ? String(plannedExpense.amount) : '';
    form.querySelector('#planned-first-date').value = isEdit
      ? (plannedExpense.nextOccurrenceDate ?? plannedExpense.firstDate ?? formatIsoDate(new Date()))
      : (plannedExpense.firstDate ?? formatIsoDate(new Date()));
    form.querySelector('#planned-interval-days').value = plannedExpense.recurrence?.intervalDays ?? '';
    form.querySelector('#planned-interval-months').value = plannedExpense.recurrence?.intervalMonths ?? '';
    form.querySelector('#planned-comment').value = plannedExpense.comment ?? '';

    if (plannedExpense.recurrence?.frequency) {
      form.querySelector('#planned-frequency').value = plannedExpense.recurrence.frequency;
    }
  } else {
    form.querySelector('#planned-first-date').value = formatIsoDate(new Date());
  }

  form.querySelector('#planned-frequency').addEventListener('change', () => {
    updateRecurrenceFieldsVisibility(form);
  });

  updateRecurrenceFieldsVisibility(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlePlannedExpenseFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-planned-expense"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function updateRecurrenceFieldsVisibility(form) {
  const frequency = form.querySelector('#planned-frequency').value;
  const daysField = form.querySelector('[data-interval-days-field]');
  const monthsField = form.querySelector('[data-interval-months-field]');
  const daysInput = form.querySelector('#planned-interval-days');
  const monthsInput = form.querySelector('#planned-interval-months');
  const showDays = frequency === RECURRENCE_FREQUENCIES.INTERVAL
    || frequency === RECURRENCE_FREQUENCIES.CUSTOM;
  const showMonths = frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS
    || frequency === RECURRENCE_FREQUENCIES.CUSTOM;

  daysField.hidden = !showDays;
  monthsField.hidden = !showMonths;

  if (showDays) {
    daysInput.setAttribute('required', 'required');
  } else {
    daysInput.removeAttribute('required');
    daysInput.value = '';
  }

  if (showMonths) {
    monthsInput.setAttribute('required', 'required');
  } else {
    monthsInput.removeAttribute('required');
    monthsInput.value = '';
  }

  if (frequency === RECURRENCE_FREQUENCIES.CUSTOM) {
    daysInput.removeAttribute('required');
    monthsInput.removeAttribute('required');
  }
}

function handlePlannedExpenseFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    categoryId: String(formData.get('categoryId') ?? '').trim(),
    articleId: String(formData.get('articleId') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    firstDate: String(formData.get('firstDate') ?? '').trim(),
    frequency: String(formData.get('frequency') ?? '').trim(),
    intervalDays: String(formData.get('intervalDays') ?? '').trim(),
    intervalMonths: String(formData.get('intervalMonths') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim(),
  };

  const state = getAppState();
  const errors = validatePlannedExpensePayload(payload, state);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const plannedExpenseId = form.dataset.plannedExpenseId ?? null;
  const now = new Date().toISOString();

  if (plannedExpenseId) {
    updateAppState((draft) => {
      const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

      if (index === -1) {
        return draft;
      }

      const current = draft.currentBudget.plannedExpenses[index];
      const recurrence = buildRecurrenceFromPayload(payload);
      // Дата из формы — дата следующего выполнения (раздел 18 ТЗ).
      // Список, календарь и статус «Ожидает подтверждения» используют nextOccurrenceDate.
      const nextOccurrenceDate = payload.firstDate;

      draft.currentBudget.plannedExpenses[index] = {
        ...current,
        name: payload.name,
        categoryId: payload.categoryId,
        articleId: payload.articleId,
        amount: Number(payload.amount),
        firstDate: current.firstDate || nextOccurrenceDate,
        nextOccurrenceDate,
        comment: payload.comment,
        recurrence,
        updatedAt: now,
      };

      return draft;
    });

    closeModal();
    showNotification({ type: 'info', message: 'Плановый расход изменён.' });
    return;
  }

  const plannedExpense = buildPlannedExpenseFromPayload(payload, now);

  updateAppState((draft) => {
    draft.currentBudget.plannedExpenses.push(plannedExpense);
    return draft;
  });

  closeModal();
  showNotification({ type: 'info', message: 'Плановый расход добавлен.' });
}

function openConfirmPlannedExpenseModal(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return null;
  }

  const form = document.createElement('form');
  form.className = 'planned-expenses-form';
  form.noValidate = true;
  form.dataset.plannedExpenseId = plannedExpenseId;

  form.innerHTML = `
    <p class="planned-expenses-form__hint">
      Подтвердите выполнение расхода «${escapeHtml(plannedExpense.name)}». После подтверждения будет создана обычная расходная операция.
    </p>
    <div class="form-field">
      <label class="form-field__label" for="confirm-planned-amount">Сумма</label>
      <input class="form-field__input" type="number" id="confirm-planned-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="confirm-planned-date">Дата расхода</label>
      <input class="form-field__input" type="date" id="confirm-planned-date" name="date" required>
      <p class="form-field__error" data-error-for="date" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-planned-expense">Отмена</button>
      <button type="submit" class="btn btn--primary" data-action="submit-confirm-planned">Подтвердить расход</button>
    </div>
  `;

  form.querySelector('#confirm-planned-amount').value = String(plannedExpense.amount);
  form.querySelector('#confirm-planned-date').value = plannedExpense.nextOccurrenceDate;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleConfirmPlannedExpenseSubmit(form);
  });

  form.querySelector('[data-action="cancel-planned-expense"]').addEventListener('click', () => {
    closeModal();
  });

  return openModal({ title: 'Подтвердить расход', content: form });
}

function handleConfirmPlannedExpenseSubmit(form) {
  if (confirmingIds.has(form.dataset.plannedExpenseId)) {
    return;
  }

  clearFormErrors(form);

  const plannedExpenseId = form.dataset.plannedExpenseId;
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    closeModal();
    return;
  }

  const occurrenceDate = plannedExpense.nextOccurrenceDate;
  const alreadyConfirmed = findExpenseByPlannedOccurrence(
    getAppState(),
    plannedExpenseId,
    occurrenceDate,
  );

  if (alreadyConfirmed) {
    showNotification({
      type: 'info',
      message: 'Этот расход уже подтверждён. Повторная операция не создана.',
    });
    closeModal();
    return;
  }

  const submitButton = form.querySelector('[data-action="submit-confirm-planned"]');
  submitButton.disabled = true;
  confirmingIds.add(plannedExpenseId);

  const formData = new FormData(form);
  const amount = String(formData.get('amount') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const payload = {
    categoryId: plannedExpense.categoryId,
    articleId: plannedExpense.articleId,
    name: plannedExpense.name,
    date,
    amount,
    comment: plannedExpense.comment ?? '',
  };

  const state = getAppState();
  const errors = validateExpensePayload(payload, state);

  if (Object.keys(errors).length > 0) {
    submitButton.disabled = false;
    confirmingIds.delete(plannedExpenseId);
    showFormErrors(form, errors);
    return;
  }

  let result = { status: 'not-found' };

  updateAppState((draft) => {
    result = applyPlannedExpenseConfirmation(draft, plannedExpenseId, {
      amount,
      date,
    });
    return draft;
  });

  confirmingIds.delete(plannedExpenseId);
  closeModal();

  if (result.status === 'created') {
    showNotification({
      type: 'info',
      message: 'Расход подтверждён и добавлен в фактические операции.',
    });
    return;
  }

  if (result.status === 'already-confirmed') {
    showNotification({
      type: 'info',
      message: 'Этот расход уже подтверждён. Повторная операция не создана.',
    });
    return;
  }

  showNotification({
    type: 'info',
    message: 'Не удалось подтвердить плановый расход.',
  });
}

function openPostponePlannedExpenseModal(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return null;
  }

  const form = document.createElement('form');
  form.className = 'planned-expenses-form';
  form.noValidate = true;
  form.dataset.plannedExpenseId = plannedExpenseId;

  form.innerHTML = `
    <p class="planned-expenses-form__hint">
      Перенесите выполнение расхода «${escapeHtml(plannedExpense.name)}» на другую дату. Расход останется плановым и не будет учтён в бюджете.
    </p>
    <div class="form-field">
      <label class="form-field__label" for="postpone-planned-date">Новая дата</label>
      <input class="form-field__input" type="date" id="postpone-planned-date" name="nextOccurrenceDate" required>
      <p class="form-field__error" data-error-for="nextOccurrenceDate" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-planned-expense">Отмена</button>
      <button type="submit" class="btn btn--primary">Перенести</button>
    </div>
  `;

  form.querySelector('#postpone-planned-date').value = plannedExpense.nextOccurrenceDate;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlePostponePlannedExpenseSubmit(form);
  });

  form.querySelector('[data-action="cancel-planned-expense"]').addEventListener('click', () => {
    closeModal();
  });

  return openModal({ title: 'Перенести дату', content: form });
}

function handlePostponePlannedExpenseSubmit(form) {
  clearFormErrors(form);

  const plannedExpenseId = form.dataset.plannedExpenseId;
  const nextOccurrenceDate = String(new FormData(form).get('nextOccurrenceDate') ?? '').trim();
  const errors = {};

  if (!nextOccurrenceDate) {
    errors.nextOccurrenceDate = 'Укажите новую дату.';
  }

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

    if (index !== -1) {
      draft.currentBudget.plannedExpenses[index] = {
        ...draft.currentBudget.plannedExpenses[index],
        nextOccurrenceDate,
        updatedAt: now,
      };
    }

    return draft;
  });

  closeModal();
  showNotification({ type: 'info', message: 'Дата планового расхода перенесена.' });
}

function handleSkipPlannedExpense(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return;
  }

  const confirmed = window.confirm(`Пропустить расход «${plannedExpense.name}»? Операция не будет создана.`);

  if (!confirmed) {
    return;
  }

  const now = new Date().toISOString();
  const isRecurring = isPlannedExpenseRecurring(plannedExpense.recurrence);

  updateAppState((draft) => {
    const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

    if (index === -1) {
      return draft;
    }

    if (isRecurring) {
      draft.currentBudget.plannedExpenses[index] = {
        ...draft.currentBudget.plannedExpenses[index],
        nextOccurrenceDate: calculateNextOccurrenceDate(
          plannedExpense.nextOccurrenceDate,
          plannedExpense.recurrence,
        ),
        updatedAt: now,
      };
    } else {
      draft.currentBudget.plannedExpenses[index] = {
        ...draft.currentBudget.plannedExpenses[index],
        isEnabled: false,
        updatedAt: now,
      };
    }

    return draft;
  });

  showNotification({ type: 'info', message: 'Плановый расход пропущен.' });
}

function handleTogglePlannedExpense(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return;
  }

  const nextEnabled = !plannedExpense.isEnabled;
  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

    if (index !== -1) {
      draft.currentBudget.plannedExpenses[index] = {
        ...draft.currentBudget.plannedExpenses[index],
        isEnabled: nextEnabled,
        updatedAt: now,
      };
    }

    return draft;
  });

  showNotification({
    type: 'info',
    message: nextEnabled ? 'Плановый расход включён.' : 'Плановый расход отключён.',
  });
}

function handleDeletePlannedExpense(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return;
  }

  const confirmed = window.confirm(`Удалить плановый расход «${plannedExpense.name}»?`);

  if (!confirmed) {
    return;
  }

  const canRestoreViaTemplate = hasRelatedTemplate(
    getAppState().templates,
    TEMPLATE_TYPES.PLANNED_EXPENSE,
    [plannedExpense.name],
  );

  updateAppState((draft) => {
    draft.currentBudget.plannedExpenses = draft.currentBudget.plannedExpenses.filter(
      (item) => item.id !== plannedExpenseId,
    );
    return draft;
  });

  showNotification({
    type: 'info',
    message: canRestoreViaTemplate
      ? 'Плановый расход удалён. Запись можно восстановить через раздел «Шаблоны».'
      : 'Плановый расход удалён.',
  });
}

function findPlannedExpense(plannedExpenseId) {
  const state = getAppState();
  return state.currentBudget.plannedExpenses?.find((item) => item.id === plannedExpenseId) ?? null;
}

function renderRecurrenceOptions(selectedValue = '') {
  const options = ['<option value="">Выберите периодичность</option>'];
  const legacyOnceSelected = selectedValue === EXPECTED_INCOME_RECURRENCE_ONCE;

  if (legacyOnceSelected) {
    options.push(`<option value="${escapeHtml(EXPECTED_INCOME_RECURRENCE_ONCE)}" selected>Разово (устар.)</option>`);
  }

  RECURRENCE_OPTIONS.forEach(({ value, label }) => {
    const selected = value === selectedValue ? ' selected' : '';
    options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`);
  });

  return options.join('');
}

function renderSelectOptions(items, placeholder, selectedValue = '') {
  const options = [`<option value="">${placeholder}</option>`];

  items.forEach(({ id, name }) => {
    const selected = id === selectedValue ? ' selected' : '';
    options.push(`<option value="${escapeHtml(id)}"${selected}>${escapeHtml(name)}</option>`);
  });

  return options.join('');
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-field__error').forEach((element) => {
    element.hidden = true;
    element.textContent = '';
  });

  form.querySelectorAll('.form-field__input').forEach((element) => {
    element.removeAttribute('aria-invalid');
  });
}

function showFormErrors(form, errors) {
  Object.entries(errors).forEach(([fieldName, message]) => {
    const errorElement = form.querySelector(`[data-error-for="${fieldName}"]`);
    const inputElement = form.querySelector(`[name="${fieldName}"]`);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
    }
  });

  form.querySelector('[aria-invalid="true"]')?.focus();
}

function formatDisplayDate(dateString) {
  if (!dateString) {
    return '—';
  }

  const [year, month, day] = dateString.split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}.${month}.${year}`;
}

function formatAmount(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
