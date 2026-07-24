/**
 * Модуль «Плановые расходы» (раздел 10 ТЗ).
 * Вкладка внутри раздела «Расходы».
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification, hideNotification } from './notifications.js';
import {
  generateId,
  RECURRENCE_FREQUENCIES,
  getExpenseCategories,
  getAvailableExpenseArticles,
  getReferenceName,
  getRecurrenceLabel,
  validatePlannedExpensePayload,
  buildPlannedExpenseFromPayload,
  validateExpensePayload,
  buildExpenseFromPayload,
  calculateNextOccurrenceDate,
  isPlannedExpenseDue,
  formatIsoDate,
} from './state.js';

const EXPENSES_WORKSPACE_ID = 'expenses-workspace';
const REMINDER_ID_PREFIX = 'planned-expense-reminder-';

const RECURRENCE_OPTIONS = [
  { value: RECURRENCE_FREQUENCIES.DAILY, label: 'Ежедневно' },
  { value: RECURRENCE_FREQUENCIES.WEEKLY, label: 'Еженедельно' },
  { value: RECURRENCE_FREQUENCIES.MONTHLY, label: 'Ежемесячно' },
  { value: RECURRENCE_FREQUENCIES.INTERVAL, label: 'Каждые N дней' },
];

let workspace = null;
let stateUpdateListenerAttached = false;
let tabsListenerAttached = false;
const shownReminderIds = new Set();

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
    renderPlannedExpensesList();
    showDueReminders();
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

  renderPlannedExpensesList();
  showDueReminders();
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

  const copyButton = event.target.closest('[data-action="copy-planned-expense"]');

  if (copyButton?.dataset.plannedExpenseId) {
    initPlannedExpenses();
    handleCopyPlannedExpense(copyButton.dataset.plannedExpenseId);
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

function createPlannedExpensesLayout() {
  const container = document.createElement('div');
  container.className = 'planned-expenses';

  container.innerHTML = `
    <div class="planned-expenses__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-planned-expense">
        Добавить плановый расход
      </button>
    </div>
    <div class="planned-expenses__list" data-planned-expenses-list role="region" aria-label="Список плановых расходов"></div>
  `;

  return container;
}

function renderPlannedExpensesList() {
  workspace = getExpensesWorkspace();
  ensurePlannedLayout();

  const listRegion = getPlannedPanel()?.querySelector('[data-planned-expenses-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const plannedExpenses = state.currentBudget.plannedExpenses ?? [];
  const sorted = [...plannedExpenses].sort(comparePlannedExpensesByNextDate);
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);

  listRegion.replaceChildren();

  if (sorted.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'planned-expenses__empty';
    emptyState.textContent = 'Плановые расходы пока не добавлены. Нажмите «Добавить плановый расход», чтобы запланировать регулярный платёж.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'planned-expenses-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Название</th>
        <th scope="col">Следующая дата</th>
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

  sorted.forEach((plannedExpense) => {
    tbody.append(createPlannedExpenseRow(plannedExpense, categories, articles));
  });

  table.append(tbody);
  listRegion.append(table);
}

function createPlannedExpenseRow(plannedExpense, categories, articles) {
  const row = document.createElement('tr');
  const isDue = isPlannedExpenseDue(plannedExpense);
  const statusClass = !plannedExpense.isEnabled
    ? 'planned-expenses-table__row--disabled'
    : (isDue ? 'planned-expenses-table__row--due' : '');

  row.className = `planned-expenses-table__row ${statusClass}`.trim();
  row.dataset.plannedExpenseId = plannedExpense.id;

  const statusText = !plannedExpense.isEnabled
    ? 'Отключён'
    : (isDue ? 'Ожидает подтверждения' : 'Запланирован');

  const dueActions = isDue && plannedExpense.isEnabled
    ? `
      <button type="button" class="btn btn--primary" data-action="confirm-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Подтвердить
      </button>
      <button type="button" class="btn btn--secondary" data-action="postpone-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Перенести
      </button>
      <button type="button" class="btn btn--secondary" data-action="skip-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Пропустить
      </button>
    `
    : '';

  row.innerHTML = `
    <td class="planned-expenses-table__name">${escapeHtml(plannedExpense.name)}</td>
    <td>${formatDisplayDate(plannedExpense.nextOccurrenceDate)}</td>
    <td class="planned-expenses-table__amount">${formatAmount(plannedExpense.amount)}</td>
    <td>${escapeHtml(getReferenceName(categories, plannedExpense.categoryId))}</td>
    <td>${escapeHtml(getReferenceName(articles, plannedExpense.articleId))}</td>
    <td>${escapeHtml(getRecurrenceLabel(plannedExpense.recurrence))}</td>
    <td>${escapeHtml(statusText)}</td>
    <td class="planned-expenses-table__actions">
      ${dueActions}
      <button type="button" class="btn btn--secondary" data-action="edit-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="copy-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Копировать
      </button>
      <button type="button" class="btn btn--secondary" data-action="toggle-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        ${plannedExpense.isEnabled ? 'Отключить' : 'Включить'}
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-planned-expense" data-planned-expense-id="${escapeHtml(plannedExpense.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

function openAddPlannedExpenseModal() {
  const form = createPlannedExpenseForm();
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
  const isEdit = Boolean(plannedExpense);
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
        ${renderSelectOptions(categories, 'Выберите категорию')}
      </select>
      <p class="form-field__error" data-error-for="categoryId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-article">Статья</label>
      <select class="form-field__input" id="planned-article" name="articleId" required>
        ${renderSelectOptions(articles, 'Выберите статью')}
      </select>
      <p class="form-field__error" data-error-for="articleId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-amount">Предполагаемая сумма</label>
      <input class="form-field__input" type="number" id="planned-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-first-date">Дата первого выполнения</label>
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
    <div class="form-field" data-interval-field hidden>
      <label class="form-field__label" for="planned-interval-days">Каждые N дней</label>
      <input class="form-field__input" type="number" id="planned-interval-days" name="intervalDays" min="1" step="1" inputmode="numeric">
      <p class="form-field__error" data-error-for="intervalDays" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="planned-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="planned-comment" name="comment" rows="3" maxlength="500"></textarea>
      <p class="form-field__error" data-error-for="comment" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-planned-expense">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
    </div>
  `;

  if (plannedExpense) {
    form.dataset.plannedExpenseId = plannedExpense.id;
    form.querySelector('#planned-name').value = plannedExpense.name;
    form.querySelector('#planned-category').value = plannedExpense.categoryId;
    form.querySelector('#planned-article').value = plannedExpense.articleId;
    form.querySelector('#planned-amount').value = String(plannedExpense.amount);
    form.querySelector('#planned-first-date').value = plannedExpense.firstDate;
    form.querySelector('#planned-frequency').value = plannedExpense.recurrence?.frequency ?? '';
    form.querySelector('#planned-interval-days').value = plannedExpense.recurrence?.intervalDays ?? '';
    form.querySelector('#planned-comment').value = plannedExpense.comment ?? '';
  } else {
    form.querySelector('#planned-first-date').value = formatIsoDate(new Date());
  }

  form.querySelector('#planned-frequency').addEventListener('change', () => {
    updateIntervalFieldVisibility(form);
  });

  updateIntervalFieldVisibility(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlePlannedExpenseFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-planned-expense"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function updateIntervalFieldVisibility(form) {
  const frequency = form.querySelector('#planned-frequency').value;
  const intervalField = form.querySelector('[data-interval-field]');
  const intervalInput = form.querySelector('#planned-interval-days');
  const isInterval = frequency === RECURRENCE_FREQUENCIES.INTERVAL;

  intervalField.hidden = !isInterval;

  if (isInterval) {
    intervalInput.setAttribute('required', 'required');
  } else {
    intervalInput.removeAttribute('required');
    intervalInput.value = '';
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
      const recurrence = {
        frequency: payload.frequency,
        intervalDays: payload.frequency === RECURRENCE_FREQUENCIES.INTERVAL
          ? Number(payload.intervalDays)
          : null,
      };

      draft.currentBudget.plannedExpenses[index] = {
        ...current,
        name: payload.name,
        categoryId: payload.categoryId,
        articleId: payload.articleId,
        amount: Number(payload.amount),
        firstDate: payload.firstDate,
        comment: payload.comment,
        recurrence,
        updatedAt: now,
      };

      return draft;
    });

    closeModal();
    showNotification({ type: 'info', message: 'Плановый расход обновлён.' });
    return;
  }

  const plannedExpense = buildPlannedExpenseFromPayload(payload, now);

  updateAppState((draft) => {
    draft.currentBudget.plannedExpenses.push(plannedExpense);
    return draft;
  });

  closeModal();
  showNotification({ type: 'info', message: 'Плановый расход сохранён.' });
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
      <button type="submit" class="btn btn--primary">Подтвердить</button>
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

  return openModal({ title: 'Подтвердить плановый расход', content: form });
}

function handleConfirmPlannedExpenseSubmit(form) {
  clearFormErrors(form);

  const plannedExpenseId = form.dataset.plannedExpenseId;
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    closeModal();
    return;
  }

  const formData = new FormData(form);
  const payload = {
    categoryId: plannedExpense.categoryId,
    articleId: plannedExpense.articleId,
    name: plannedExpense.name,
    date: String(formData.get('date') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    comment: plannedExpense.comment ?? '',
  };

  const state = getAppState();
  const errors = validateExpensePayload(payload, state);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const expense = buildExpenseFromPayload(payload);
  const now = new Date().toISOString();
  const nextOccurrenceDate = calculateNextOccurrenceDate(
    plannedExpense.nextOccurrenceDate,
    plannedExpense.recurrence,
  );

  updateAppState((draft) => {
    draft.currentBudget.expenses.push(expense);

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

  hideNotification(`${REMINDER_ID_PREFIX}${plannedExpenseId}`);
  shownReminderIds.delete(plannedExpenseId);
  closeModal();
  showNotification({ type: 'info', message: 'Расход подтверждён и сохранён.' });
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

  return openModal({ title: 'Перенести плановый расход', content: form });
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

  hideNotification(`${REMINDER_ID_PREFIX}${plannedExpenseId}`);
  shownReminderIds.delete(plannedExpenseId);
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
  const nextOccurrenceDate = calculateNextOccurrenceDate(
    plannedExpense.nextOccurrenceDate,
    plannedExpense.recurrence,
  );

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

  hideNotification(`${REMINDER_ID_PREFIX}${plannedExpenseId}`);
  shownReminderIds.delete(plannedExpenseId);
  showNotification({ type: 'info', message: 'Плановый расход пропущен.' });
}

function handleCopyPlannedExpense(plannedExpenseId) {
  const plannedExpense = findPlannedExpense(plannedExpenseId);

  if (!plannedExpense) {
    showNotification({ type: 'info', message: 'Плановый расход не найден.' });
    return;
  }

  const now = new Date().toISOString();
  const copy = {
    ...structuredClone(plannedExpense),
    id: generateId('planned-expense'),
    name: `${plannedExpense.name} (копия)`,
    createdAt: now,
    updatedAt: now,
  };

  updateAppState((draft) => {
    draft.currentBudget.plannedExpenses.push(copy);
    return draft;
  });

  showNotification({ type: 'info', message: 'Копия планового расхода создана.' });
}

function handleTogglePlannedExpense(plannedExpenseId) {
  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.currentBudget.plannedExpenses.findIndex((item) => item.id === plannedExpenseId);

    if (index !== -1) {
      draft.currentBudget.plannedExpenses[index] = {
        ...draft.currentBudget.plannedExpenses[index],
        isEnabled: !draft.currentBudget.plannedExpenses[index].isEnabled,
        updatedAt: now,
      };
    }

    return draft;
  });

  showNotification({ type: 'info', message: 'Статус планового расхода изменён.' });
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

  updateAppState((draft) => {
    draft.currentBudget.plannedExpenses = draft.currentBudget.plannedExpenses.filter(
      (item) => item.id !== plannedExpenseId,
    );
    return draft;
  });

  hideNotification(`${REMINDER_ID_PREFIX}${plannedExpenseId}`);
  shownReminderIds.delete(plannedExpenseId);
  showNotification({ type: 'info', message: 'Плановый расход удалён.' });
}

function showDueReminders() {
  const state = getAppState();
  const dueItems = (state.currentBudget.plannedExpenses ?? []).filter((item) => isPlannedExpenseDue(item));

  dueItems.forEach((plannedExpense) => {
    const reminderId = `${REMINDER_ID_PREFIX}${plannedExpense.id}`;

    if (shownReminderIds.has(plannedExpense.id)) {
      return;
    }

    showNotification({
      id: reminderId,
      type: 'reminder',
      message: `Запланирован расход «${plannedExpense.name}». Подтвердите выполнение операции.`,
    });

    shownReminderIds.add(plannedExpense.id);
  });
}

function findPlannedExpense(plannedExpenseId) {
  const state = getAppState();
  return state.currentBudget.plannedExpenses?.find((item) => item.id === plannedExpenseId) ?? null;
}

function renderRecurrenceOptions(selectedValue = '') {
  const options = ['<option value="">Выберите периодичность</option>'];

  RECURRENCE_OPTIONS.forEach(({ value, label }) => {
    const selected = value === selectedValue ? ' selected' : '';
    options.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`);
  });

  return options.join('');
}

function renderSelectOptions(items, placeholder) {
  const options = [`<option value="">${placeholder}</option>`];

  items.forEach(({ id, name }) => {
    options.push(`<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`);
  });

  return options.join('');
}

function comparePlannedExpensesByNextDate(first, second) {
  return String(first.nextOccurrenceDate).localeCompare(String(second.nextOccurrenceDate));
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
