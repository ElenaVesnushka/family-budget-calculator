/**
 * Модуль «Ожидаемые доходы» (раздел 11 ТЗ).
 * Вкладка внутри раздела «Доходы».
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification, syncNotificationsByPrefix } from './notifications.js?v=20260725-11';
import {
  INCOME_TYPES,
  RECURRENCE_FREQUENCIES,
  EXPECTED_INCOME_RECURRENCE_ONCE,
  TEMPLATE_TYPES,
  getRecurrenceLabel,
  validateExpectedIncomePayload,
  buildExpectedIncomeFromPayload,
  buildRecurrenceFromPayload,
  validateIncomePayload,
  applyExpectedIncomeConfirmation,
  findIncomeByExpectedOccurrence,
  calculateNextOccurrenceDate,
  isExpectedIncomeDue,
  isExpectedIncomeRecurring,
  collectExpectedIncomeOccurrences,
  formatIsoDate,
  hasRelatedTemplate,
} from './state.js';
import {
  buildCalendarMonthGrid,
  expectedIncomeOccurrenceToCalendarEvent,
  getCalendarMonthLabel,
  getCalendarWeekdayLabels,
  groupCalendarEventsByDate,
} from './calendar-events.js';

const INCOMES_WORKSPACE_ID = 'incomes-workspace';
const EXPECTED_REMINDER_PREFIX = 'reminder-expected-';

const INCOME_TYPE_OPTIONS = [
  { value: INCOME_TYPES.PERMANENT, label: 'Постоянный' },
  { value: INCOME_TYPES.ONE_TIME, label: 'Разовый' },
  { value: INCOME_TYPES.DEPOSIT_CAPITALIZATION, label: 'Капитализация вклада' },
];

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

function getIncomesWorkspace() {
  return document.getElementById(INCOMES_WORKSPACE_ID) ?? getSectionRegion('incomes');
}

function getExpectedPanel() {
  return workspace?.querySelector('[data-incomes-panel="expected"]');
}

/**
 * Инициализирует вкладку «Ожидаемые доходы».
 */
export function initExpectedIncomes() {
  workspace = getIncomesWorkspace();

  if (!workspace) {
    return;
  }

  attachTabsListener();
  attachStateUpdateListener();
  ensureExpectedLayout();

  if (isStateInitialized()) {
    renderExpectedIncomes();
    renderLocalDueReminders();
  }
}

function ensureExpectedLayout() {
  const panel = getExpectedPanel();

  if (!panel || panel.querySelector('.expected-incomes')) {
    return;
  }

  panel.append(createExpectedIncomesLayout());
}

function attachTabsListener() {
  if (tabsListenerAttached) {
    return;
  }

  document.addEventListener('click', handleIncomesTabClick);
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

  renderExpectedIncomes();
  renderLocalDueReminders();
}

function handleIncomesTabClick(event) {
  const tabButton = event.target.closest('[data-incomes-tab]');

  if (!tabButton || !tabButton.closest('.incomes-shell')) {
    return;
  }

  switchIncomesTab(tabButton.dataset.incomesTab);
  event.preventDefault();
}

export function switchIncomesTab(tabName) {
  workspace = getIncomesWorkspace();

  if (!workspace) {
    return;
  }

  const shell = workspace.querySelector('.incomes-shell');

  if (!shell) {
    return;
  }

  shell.querySelectorAll('[data-incomes-tab]').forEach((button) => {
    const isActive = button.dataset.incomesTab === tabName;
    button.classList.toggle('incomes-tabs__button--active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  shell.querySelectorAll('[data-incomes-panel]').forEach((panel) => {
    const isActive = panel.dataset.incomesPanel === tabName;
    panel.hidden = !isActive;
  });

  if (tabName === 'expected') {
    initExpectedIncomes();
  }
}

function handleExpectedIncomesClick(event) {
  const addButton = event.target.closest('[data-action="add-expected-income"]');

  if (addButton) {
    initExpectedIncomes();
    switchIncomesTab('expected');
    openAddExpectedIncomeModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-expected-income"]');

  if (editButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    openEditExpectedIncomeModal(editButton.dataset.expectedIncomeId);
    event.preventDefault();
    return;
  }

  const viewButton = event.target.closest('[data-expected-view]');

  if (viewButton?.closest('.expected-incomes')) {
    initExpectedIncomes();
    switchExpectedIncomesView(viewButton.dataset.expectedView);
    event.preventDefault();
    return;
  }

  const calendarNavButton = event.target.closest('[data-calendar-nav]');

  if (calendarNavButton?.closest('.expected-incomes__calendar')) {
    initExpectedIncomes();
    shiftCalendarMonth(Number(calendarNavButton.dataset.calendarNav));
    event.preventDefault();
    return;
  }

  const toggleButton = event.target.closest('[data-action="toggle-expected-income"]');

  if (toggleButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    handleToggleExpectedIncome(toggleButton.dataset.expectedIncomeId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-expected-income"]');

  if (deleteButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    handleDeleteExpectedIncome(deleteButton.dataset.expectedIncomeId);
    event.preventDefault();
    return;
  }

  const confirmButton = event.target.closest('[data-action="confirm-expected-income"]');

  if (confirmButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    openConfirmExpectedIncomeModal(confirmButton.dataset.expectedIncomeId);
    event.preventDefault();
    return;
  }

  const postponeButton = event.target.closest('[data-action="postpone-expected-income"]');

  if (postponeButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    openPostponeExpectedIncomeModal(postponeButton.dataset.expectedIncomeId);
    event.preventDefault();
    return;
  }

  const skipButton = event.target.closest('[data-action="skip-expected-income"]');

  if (skipButton?.dataset.expectedIncomeId) {
    initExpectedIncomes();
    handleSkipExpectedIncome(skipButton.dataset.expectedIncomeId);
    event.preventDefault();
  }
}

document.addEventListener('click', handleExpectedIncomesClick);

function switchExpectedIncomesView(nextView) {
  if (!Object.values(VIEW_MODES).includes(nextView)) {
    return;
  }

  viewMode = nextView;

  const container = getExpectedPanel()?.querySelector('.expected-incomes');

  if (!container) {
    return;
  }

  container.querySelectorAll('[data-expected-view]').forEach((button) => {
    const isActive = button.dataset.expectedView === viewMode;
    button.classList.toggle('expected-incomes__view-button--active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  container.querySelector('[data-expected-incomes-list]').hidden = viewMode !== VIEW_MODES.LIST;
  container.querySelector('[data-expected-incomes-calendar]').hidden = viewMode !== VIEW_MODES.CALENDAR;

  renderExpectedIncomes();
}

function shiftCalendarMonth(delta) {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + delta, 1);
  renderExpectedIncomesCalendar();
}

function renderExpectedIncomes() {
  if (viewMode === VIEW_MODES.CALENDAR) {
    renderExpectedIncomesCalendar();
    return;
  }

  renderExpectedIncomesList();
}

function createExpectedIncomesLayout() {
  const container = document.createElement('div');
  container.className = 'expected-incomes';

  container.innerHTML = `
    <div class="expected-incomes__reminders" data-expected-reminders hidden aria-live="polite"></div>
    <div class="expected-incomes__toolbar">
      <div class="expected-incomes__view-toggle" role="tablist" aria-label="Режим просмотра ожидаемых доходов">
        <button type="button" class="expected-incomes__view-button expected-incomes__view-button--active" data-expected-view="list" role="tab" aria-selected="true">
          Список
        </button>
        <button type="button" class="expected-incomes__view-button" data-expected-view="calendar" role="tab" aria-selected="false">
          Календарь
        </button>
      </div>
      <button type="button" class="btn btn--primary" data-action="add-expected-income">
        Добавить ожидаемый доход
      </button>
    </div>
    <div class="expected-incomes__list" data-expected-incomes-list role="region" aria-label="Список ожидаемых доходов"></div>
    <div class="expected-incomes__calendar" data-expected-incomes-calendar role="region" aria-label="Календарь ожидаемых доходов" hidden></div>
  `;

  return container;
}

function renderLocalDueReminders() {
  const remindersRegion = getExpectedPanel()?.querySelector('[data-expected-reminders]');

  if (!remindersRegion || !isStateInitialized()) {
    return;
  }

  const dueItems = (getAppState().currentBudget.expectedIncomes ?? []).filter((item) => (
    isExpectedIncomeDue(item)
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
    notice.className = 'expected-incomes__reminder';
    notice.textContent = `Ожидалось поступление «${item.name}». Проверьте сумму и подтвердите получение.`;
    remindersRegion.append(notice);
  });
}

/**
 * Reminder в общей панели об ожидаемых доходах, требующих подтверждения.
 */
export function syncExpectedIncomeReminders() {
  if (!isStateInitialized()) {
    return;
  }

  const dueItems = (getAppState().currentBudget?.expectedIncomes ?? []).filter((item) => (
    isExpectedIncomeDue(item)
  ));

  syncNotificationsByPrefix(
    EXPECTED_REMINDER_PREFIX,
    dueItems.map((item) => ({
      id: `${EXPECTED_REMINDER_PREFIX}${item.id}`,
      type: 'reminder',
      message: `Ожидалось поступление «${item.name}». Проверьте сумму и подтвердите получение.`,
    })),
  );
}

function renderExpectedIncomesList() {
  workspace = getIncomesWorkspace();
  ensureExpectedLayout();

  const listRegion = getExpectedPanel()?.querySelector('[data-expected-incomes-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const occurrences = collectExpectedIncomeOccurrences(getAppState().currentBudget.expectedIncomes ?? []);

  listRegion.replaceChildren();

  if (occurrences.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'expected-incomes__empty';
    emptyState.textContent = 'Будущие ожидаемые поступления не запланированы. Нажмите «Добавить ожидаемый доход», чтобы запланировать поступление.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'expected-incomes-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Дата</th>
        <th scope="col">Название</th>
        <th scope="col">Сумма</th>
        <th scope="col">Периодичность</th>
        <th scope="col">Статус</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  occurrences.forEach((occurrence) => {
    tbody.append(createExpectedIncomeOccurrenceRow(occurrence));
  });

  table.append(tbody);
  listRegion.append(table);
}

function renderExpectedIncomesCalendar() {
  workspace = getIncomesWorkspace();
  ensureExpectedLayout();

  const calendarRegion = getExpectedPanel()?.querySelector('[data-expected-incomes-calendar]');

  if (!calendarRegion || !isStateInitialized()) {
    return;
  }

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const occurrences = collectExpectedIncomeOccurrences(getAppState().currentBudget.expectedIncomes ?? []);
  const events = occurrences.map(expectedIncomeOccurrenceToCalendarEvent);
  const eventsByDate = groupCalendarEventsByDate(events);
  const todayIso = formatIsoDate(new Date());

  calendarRegion.replaceChildren();

  const header = document.createElement('div');
  header.className = 'expected-incomes-calendar__header';
  header.innerHTML = `
    <button type="button" class="btn btn--secondary expected-incomes-calendar__nav" data-calendar-nav="-1" aria-label="Предыдущий месяц">←</button>
    <h3 class="expected-incomes-calendar__title">${escapeHtml(getCalendarMonthLabel(year, month))}</h3>
    <button type="button" class="btn btn--secondary expected-incomes-calendar__nav" data-calendar-nav="1" aria-label="Следующий месяц">→</button>
  `;
  calendarRegion.append(header);

  const weekdayRow = document.createElement('div');
  weekdayRow.className = 'expected-incomes-calendar__weekdays';
  getCalendarWeekdayLabels().forEach((label) => {
    const cell = document.createElement('div');
    cell.className = 'expected-incomes-calendar__weekday';
    cell.textContent = label;
    weekdayRow.append(cell);
  });
  calendarRegion.append(weekdayRow);

  const grid = document.createElement('div');
  grid.className = 'expected-incomes-calendar__grid';

  buildCalendarMonthGrid(year, month).forEach((cell) => {
    const dayCell = document.createElement('div');
    dayCell.className = 'expected-incomes-calendar__day';

    if (!cell.isCurrentMonth) {
      dayCell.classList.add('expected-incomes-calendar__day--outside');
    }

    if (cell.date === todayIso) {
      dayCell.classList.add('expected-incomes-calendar__day--today');
    }

    const dayLabel = document.createElement('div');
    dayLabel.className = 'expected-incomes-calendar__day-number';
    dayLabel.textContent = String(cell.dayNumber);
    dayCell.append(dayLabel);

    if (cell.date && eventsByDate.has(cell.date)) {
      const eventsList = document.createElement('ul');
      eventsList.className = 'expected-incomes-calendar__events';

      eventsByDate.get(cell.date).forEach((event) => {
        const item = document.createElement('li');
        item.className = 'expected-incomes-calendar__event';

        if (event.status === 'Ожидает подтверждения') {
          item.classList.add('expected-incomes-calendar__event--due');
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
    emptyState.className = 'expected-incomes__empty expected-incomes-calendar__empty';
    emptyState.textContent = 'В выбранном периоде нет запланированных поступлений.';
    calendarRegion.append(emptyState);
  }
}

function createExpectedIncomeOccurrenceRow(occurrence) {
  const { expectedIncome, occurrenceDate, status, isCurrent } = occurrence;
  const row = document.createElement('tr');
  let statusClass = '';

  if (status === 'Ожидает подтверждения') {
    statusClass = 'expected-incomes-table__row--due';
  } else if (status === 'Отключён' || status === 'Завершён') {
    statusClass = 'expected-incomes-table__row--disabled';
  }

  row.className = `expected-incomes-table__row ${statusClass}`.trim();
  row.dataset.expectedIncomeId = expectedIncome.id;
  row.dataset.occurrenceDate = occurrenceDate;

  const showActions = isCurrent;
  const isDue = status === 'Ожидает подтверждения';

  const dueActions = showActions && isDue
    ? `
      <button type="button" class="btn btn--primary" data-action="confirm-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        Подтвердить получение
      </button>
      <button type="button" class="btn btn--secondary" data-action="postpone-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        Перенести дату
      </button>
      <button type="button" class="btn btn--secondary" data-action="skip-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        Пропустить
      </button>
    `
    : '';

  const manageActions = showActions
    ? `
      <button type="button" class="btn btn--secondary" data-action="edit-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="toggle-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        ${expectedIncome.isEnabled ? 'Отключить' : 'Включить'}
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-expected-income" data-expected-income-id="${escapeHtml(expectedIncome.id)}">
        Удалить
      </button>
    `
    : '';

  row.innerHTML = `
    <td>${formatDisplayDate(occurrenceDate)}</td>
    <td class="expected-incomes-table__name">${escapeHtml(expectedIncome.name)}</td>
    <td class="expected-incomes-table__amount">${formatAmount(expectedIncome.amount)}</td>
    <td>${escapeHtml(getRecurrenceLabel(expectedIncome.recurrence))}</td>
    <td>${escapeHtml(status)}</td>
    <td class="expected-incomes-table__actions">
      ${dueActions}
      ${manageActions}
    </td>
  `;

  return row;
}

export function openAddExpectedIncomeModal(initialValues = null) {
  const form = createExpectedIncomeForm(initialValues);
  return openModal({ title: 'Добавить ожидаемый доход', content: form });
}

function openEditExpectedIncomeModal(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    return null;
  }

  const form = createExpectedIncomeForm(expectedIncome);
  return openModal({ title: 'Изменить ожидаемый доход', content: form });
}

function createExpectedIncomeForm(expectedIncome = null) {
  const isEdit = Boolean(expectedIncome?.id);
  const form = document.createElement('form');
  form.className = 'expected-incomes-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="expected-income-type">Вид дохода</label>
      <select class="form-field__input" id="expected-income-type" name="incomeType" required>
        ${renderIncomeTypeOptions(expectedIncome?.incomeType)}
      </select>
      <p class="form-field__error" data-error-for="incomeType" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expected-name">Название</label>
      <input class="form-field__input" type="text" id="expected-name" name="name" maxlength="120" required autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expected-amount">Предполагаемая сумма</label>
      <input class="form-field__input" type="number" id="expected-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expected-date">Дата поступления</label>
      <input class="form-field__input" type="date" id="expected-date" name="nextOccurrenceDate" required>
      <p class="form-field__error" data-error-for="nextOccurrenceDate" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expected-frequency">Периодичность</label>
      <select class="form-field__input" id="expected-frequency" name="frequency" required>
        ${renderRecurrenceOptions(expectedIncome?.recurrence?.frequency)}
      </select>
      <p class="form-field__error" data-error-for="frequency" hidden></p>
    </div>
    <div class="form-field" data-interval-days-field hidden>
      <label class="form-field__label" for="expected-interval-days">Каждые N дней</label>
      <input class="form-field__input" type="number" id="expected-interval-days" name="intervalDays" min="1" step="1" inputmode="numeric">
      <p class="form-field__error" data-error-for="intervalDays" hidden></p>
    </div>
    <div class="form-field" data-interval-months-field hidden>
      <label class="form-field__label" for="expected-interval-months">Каждые N месяцев</label>
      <input class="form-field__input" type="number" id="expected-interval-months" name="intervalMonths" min="1" step="1" inputmode="numeric">
      <p class="form-field__error" data-error-for="intervalMonths" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expected-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="expected-comment" name="comment" rows="3" maxlength="500"></textarea>
      <p class="form-field__error" data-error-for="comment" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-expected-income">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (expectedIncome) {
    if (isEdit) {
      form.dataset.expectedIncomeId = expectedIncome.id;
    }

    form.querySelector('#expected-income-type').value = expectedIncome.incomeType ?? '';
    form.querySelector('#expected-name').value = expectedIncome.name ?? '';
    form.querySelector('#expected-amount').value = expectedIncome.amount != null ? String(expectedIncome.amount) : '';
    form.querySelector('#expected-date').value = expectedIncome.nextOccurrenceDate ?? formatIsoDate(new Date());
    form.querySelector('#expected-interval-days').value = expectedIncome.recurrence?.intervalDays ?? '';
    form.querySelector('#expected-interval-months').value = expectedIncome.recurrence?.intervalMonths ?? '';
    form.querySelector('#expected-comment').value = expectedIncome.comment ?? '';

    if (expectedIncome.recurrence?.frequency) {
      form.querySelector('#expected-frequency').value = expectedIncome.recurrence.frequency;
    }
  } else {
    form.querySelector('#expected-date').value = formatIsoDate(new Date());
  }

  form.querySelector('#expected-frequency').addEventListener('change', () => {
    updateRecurrenceFieldsVisibility(form);
  });

  updateRecurrenceFieldsVisibility(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleExpectedIncomeFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-expected-income"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function updateRecurrenceFieldsVisibility(form) {
  const frequency = form.querySelector('#expected-frequency').value;
  const daysField = form.querySelector('[data-interval-days-field]');
  const monthsField = form.querySelector('[data-interval-months-field]');
  const daysInput = form.querySelector('#expected-interval-days');
  const monthsInput = form.querySelector('#expected-interval-months');
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

function handleExpectedIncomeFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    incomeType: String(formData.get('incomeType') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    nextOccurrenceDate: String(formData.get('nextOccurrenceDate') ?? '').trim(),
    frequency: String(formData.get('frequency') ?? '').trim(),
    intervalDays: String(formData.get('intervalDays') ?? '').trim(),
    intervalMonths: String(formData.get('intervalMonths') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim(),
  };

  const errors = validateExpectedIncomePayload(payload);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const expectedIncomeId = form.dataset.expectedIncomeId ?? null;
  const now = new Date().toISOString();

  if (expectedIncomeId) {
    updateAppState((draft) => {
      const index = draft.currentBudget.expectedIncomes.findIndex((item) => item.id === expectedIncomeId);

      if (index === -1) {
        return draft;
      }

      const current = draft.currentBudget.expectedIncomes[index];
      const recurrence = buildRecurrenceFromPayload(payload);

      draft.currentBudget.expectedIncomes[index] = {
        ...current,
        incomeType: payload.incomeType,
        name: payload.name,
        amount: Number(payload.amount),
        nextOccurrenceDate: payload.nextOccurrenceDate,
        comment: payload.comment,
        recurrence,
        updatedAt: now,
      };

      return draft;
    });

    closeModal();
    showNotification({ type: 'info', message: 'Ожидаемый доход изменён.' });
    return;
  }

  const expectedIncome = buildExpectedIncomeFromPayload(payload, now);

  updateAppState((draft) => {
    draft.currentBudget.expectedIncomes.push(expectedIncome);
    return draft;
  });

  closeModal();
  showNotification({ type: 'info', message: 'Ожидаемый доход добавлен.' });
}

function openConfirmExpectedIncomeModal(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    return null;
  }

  const form = document.createElement('form');
  form.className = 'expected-incomes-form';
  form.noValidate = true;
  form.dataset.expectedIncomeId = expectedIncomeId;

  form.innerHTML = `
    <p class="expected-incomes-form__hint">
      Подтвердите получение «${escapeHtml(expectedIncome.name)}». После подтверждения будет создана обычная доходная операция.
    </p>
    <div class="form-field">
      <label class="form-field__label" for="confirm-expected-amount">Сумма</label>
      <input class="form-field__input" type="number" id="confirm-expected-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="confirm-expected-date">Дата фактического поступления</label>
      <input class="form-field__input" type="date" id="confirm-expected-date" name="date" required>
      <p class="form-field__error" data-error-for="date" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-expected-income">Отмена</button>
      <button type="submit" class="btn btn--primary" data-action="submit-confirm-expected">Подтвердить получение</button>
    </div>
  `;

  form.querySelector('#confirm-expected-amount').value = String(expectedIncome.amount);
  form.querySelector('#confirm-expected-date').value = expectedIncome.nextOccurrenceDate;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleConfirmExpectedIncomeSubmit(form);
  });

  form.querySelector('[data-action="cancel-expected-income"]').addEventListener('click', () => {
    closeModal();
  });

  return openModal({ title: 'Подтвердить получение', content: form });
}

function handleConfirmExpectedIncomeSubmit(form) {
  if (confirmingIds.has(form.dataset.expectedIncomeId)) {
    return;
  }

  clearFormErrors(form);

  const expectedIncomeId = form.dataset.expectedIncomeId;
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    showNotification({ type: 'info', message: 'Ожидаемый доход не найден.' });
    closeModal();
    return;
  }

  const occurrenceDate = expectedIncome.nextOccurrenceDate;
  const alreadyConfirmed = findIncomeByExpectedOccurrence(
    getAppState(),
    expectedIncomeId,
    occurrenceDate,
  );

  if (alreadyConfirmed) {
    showNotification({
      type: 'info',
      message: 'Это поступление уже подтверждено. Повторная операция не создана.',
    });
    closeModal();
    return;
  }

  const submitButton = form.querySelector('[data-action="submit-confirm-expected"]');
  submitButton.disabled = true;
  confirmingIds.add(expectedIncomeId);

  const formData = new FormData(form);
  const amount = String(formData.get('amount') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const payload = {
    category: expectedIncome.incomeType,
    source: expectedIncome.name,
    date,
    amount,
    comment: expectedIncome.comment ?? '',
  };

  const errors = validateIncomePayload(payload);

  if (Object.keys(errors).length > 0) {
    submitButton.disabled = false;
    confirmingIds.delete(expectedIncomeId);
    showFormErrors(form, errors);
    return;
  }

  let result = { status: 'not-found' };

  updateAppState((draft) => {
    result = applyExpectedIncomeConfirmation(draft, expectedIncomeId, {
      amount,
      date,
    });
    return draft;
  });

  confirmingIds.delete(expectedIncomeId);
  closeModal();

  if (result.status === 'created') {
    showNotification({
      type: 'info',
      message: 'Доход подтверждён и добавлен в фактические операции.',
    });
    return;
  }

  if (result.status === 'already-confirmed') {
    showNotification({
      type: 'info',
      message: 'Это поступление уже подтверждено. Повторная операция не создана.',
    });
    return;
  }

  showNotification({
    type: 'info',
    message: 'Не удалось подтвердить ожидаемый доход.',
  });
}

function openPostponeExpectedIncomeModal(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    return null;
  }

  const form = document.createElement('form');
  form.className = 'expected-incomes-form';
  form.noValidate = true;
  form.dataset.expectedIncomeId = expectedIncomeId;

  form.innerHTML = `
    <p class="expected-incomes-form__hint">
      Перенесите ожидаемое поступление «${escapeHtml(expectedIncome.name)}» на другую дату. Доход останется в статусе ожидания.
    </p>
    <div class="form-field">
      <label class="form-field__label" for="postpone-expected-date">Новая дата поступления</label>
      <input class="form-field__input" type="date" id="postpone-expected-date" name="nextOccurrenceDate" required>
      <p class="form-field__error" data-error-for="nextOccurrenceDate" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-expected-income">Отмена</button>
      <button type="submit" class="btn btn--primary">Перенести</button>
    </div>
  `;

  form.querySelector('#postpone-expected-date').value = expectedIncome.nextOccurrenceDate;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlePostponeExpectedIncomeSubmit(form);
  });

  form.querySelector('[data-action="cancel-expected-income"]').addEventListener('click', () => {
    closeModal();
  });

  return openModal({ title: 'Перенести ожидаемый доход', content: form });
}

function handlePostponeExpectedIncomeSubmit(form) {
  clearFormErrors(form);

  const expectedIncomeId = form.dataset.expectedIncomeId;
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
    const index = draft.currentBudget.expectedIncomes.findIndex((item) => item.id === expectedIncomeId);

    if (index !== -1) {
      draft.currentBudget.expectedIncomes[index] = {
        ...draft.currentBudget.expectedIncomes[index],
        nextOccurrenceDate,
        updatedAt: now,
      };
    }

    return draft;
  });

  closeModal();
}

function handleSkipExpectedIncome(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    return;
  }

  const confirmed = window.confirm(`Пропустить ожидаемое поступление «${expectedIncome.name}»? Доходная операция не будет создана.`);

  if (!confirmed) {
    return;
  }

  const now = new Date().toISOString();
  const isRecurring = isExpectedIncomeRecurring(expectedIncome.recurrence);

  updateAppState((draft) => {
    const index = draft.currentBudget.expectedIncomes.findIndex((item) => item.id === expectedIncomeId);

    if (index === -1) {
      return draft;
    }

    if (isRecurring) {
      draft.currentBudget.expectedIncomes[index] = {
        ...draft.currentBudget.expectedIncomes[index],
        nextOccurrenceDate: calculateNextOccurrenceDate(
          expectedIncome.nextOccurrenceDate,
          expectedIncome.recurrence,
        ),
        updatedAt: now,
      };
    } else {
      draft.currentBudget.expectedIncomes[index] = {
        ...draft.currentBudget.expectedIncomes[index],
        isEnabled: false,
        updatedAt: now,
      };
    }

    return draft;
  });
}

function handleToggleExpectedIncome(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    showNotification({ type: 'info', message: 'Ожидаемый доход не найден.' });
    return;
  }

  const nextEnabled = !expectedIncome.isEnabled;
  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.currentBudget.expectedIncomes.findIndex((item) => item.id === expectedIncomeId);

    if (index !== -1) {
      draft.currentBudget.expectedIncomes[index] = {
        ...draft.currentBudget.expectedIncomes[index],
        isEnabled: nextEnabled,
        updatedAt: now,
      };
    }

    return draft;
  });

  showNotification({
    type: 'info',
    message: nextEnabled ? 'Ожидаемый доход включён.' : 'Ожидаемый доход отключён.',
  });
}

function handleDeleteExpectedIncome(expectedIncomeId) {
  const expectedIncome = findExpectedIncome(expectedIncomeId);

  if (!expectedIncome) {
    showNotification({ type: 'info', message: 'Ожидаемый доход не найден.' });
    return;
  }

  const confirmed = window.confirm(`Удалить ожидаемый доход «${expectedIncome.name}»?`);

  if (!confirmed) {
    return;
  }

  const canRestoreViaTemplate = hasRelatedTemplate(
    getAppState().templates,
    TEMPLATE_TYPES.EXPECTED_INCOME,
    [expectedIncome.name],
  );

  updateAppState((draft) => {
    draft.currentBudget.expectedIncomes = draft.currentBudget.expectedIncomes.filter(
      (item) => item.id !== expectedIncomeId,
    );
    return draft;
  });

  showNotification({
    type: 'info',
    message: canRestoreViaTemplate
      ? 'Ожидаемый доход удалён. Запись можно восстановить через раздел «Шаблоны».'
      : 'Ожидаемый доход удалён.',
  });
}

function findExpectedIncome(expectedIncomeId) {
  return getAppState().currentBudget.expectedIncomes?.find((item) => item.id === expectedIncomeId) ?? null;
}

function renderIncomeTypeOptions(selectedValue = '') {
  const options = ['<option value="">Выберите вид дохода</option>'];

  INCOME_TYPE_OPTIONS.forEach(({ value, label }) => {
    const selected = value === selectedValue ? ' selected' : '';
    options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`);
  });

  return options.join('');
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
