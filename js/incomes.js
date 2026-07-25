/**
 * Модуль раздела «Доходы».
 * Отображение списка, добавление, изменение, удаление и копирование записей.
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js?v=20260725-12';
import { offerCreateTemplateFromIncome } from './template-prompt.js';
import {
  INCOME_TYPES,
  TEMPLATE_TYPES,
  validateIncomePayload,
  buildIncomeFromPayload,
  formatIsoDate,
  hasRelatedTemplate,
} from './state.js';

const INCOME_TYPE_OPTIONS = [
  { value: INCOME_TYPES.PERMANENT, label: 'Постоянный' },
  { value: INCOME_TYPES.ONE_TIME, label: 'Разовый' },
  { value: INCOME_TYPES.DEPOSIT_CAPITALIZATION, label: 'Капитализация вклада' },
];

const INCOME_TYPE_LABELS = Object.fromEntries(
  INCOME_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

const INCOMES_WORKSPACE_ID = 'incomes-workspace';

let workspace = null;
let stateUpdateListenerAttached = false;

/**
 * Возвращает контейнер раздела «Доходы».
 */
function getIncomesWorkspace() {
  return document.getElementById(INCOMES_WORKSPACE_ID) ?? getSectionRegion('incomes');
}

/**
 * Инициализирует раздел «Доходы».
 */
export function initIncomes() {
  workspace = getIncomesWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');

  if (!workspace.querySelector('.incomes-shell')) {
    workspace.replaceChildren(createIncomesShell());
  }

  if (isStateInitialized()) {
    renderIncomesList();
  }

  attachStateUpdateListener();
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      renderIncomesList();
    }
  });

  stateUpdateListenerAttached = true;
}

function createIncomesShell() {
  const shell = document.createElement('div');
  shell.className = 'incomes-shell';

  shell.innerHTML = `
    <div class="incomes-tabs" role="tablist" aria-label="Виды доходов">
      <button
        type="button"
        class="incomes-tabs__button incomes-tabs__button--active"
        role="tab"
        id="incomes-tab-actual"
        aria-selected="true"
        aria-controls="incomes-panel-actual"
        data-incomes-tab="actual"
      >
        Фактические
      </button>
      <button
        type="button"
        class="incomes-tabs__button"
        role="tab"
        id="incomes-tab-expected"
        aria-selected="false"
        aria-controls="incomes-panel-expected"
        data-incomes-tab="expected"
      >
        Ожидаемые
      </button>
    </div>
    <div
      class="incomes-panel"
      id="incomes-panel-actual"
      data-incomes-panel="actual"
      role="tabpanel"
      aria-labelledby="incomes-tab-actual"
    ></div>
    <div
      class="incomes-panel"
      id="incomes-panel-expected"
      data-incomes-panel="expected"
      role="tabpanel"
      aria-labelledby="incomes-tab-expected"
      hidden
    ></div>
  `;

  shell.querySelector('[data-incomes-panel="actual"]').append(createIncomesLayout());

  return shell;
}

/**
 * Обработчик действий списка доходов.
 */
function handleIncomesClick(event) {
  const addButton = event.target.closest('[data-action="add-income"]');

  if (addButton) {
    initIncomes();
    openAddIncomeModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-income"]');

  if (editButton?.dataset.incomeId) {
    initIncomes();
    openEditIncomeModal(editButton.dataset.incomeId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-income"]');

  if (deleteButton?.dataset.incomeId) {
    initIncomes();
    handleDeleteIncome(deleteButton.dataset.incomeId);
    event.preventDefault();
  }
}

document.addEventListener('click', handleIncomesClick);

function createIncomesLayout() {
  const container = document.createElement('div');
  container.className = 'incomes';

  container.innerHTML = `
    <div class="incomes__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-income">
        Добавить доход
      </button>
    </div>
    <div class="incomes__list" data-incomes-list role="region" aria-label="Список доходов"></div>
  `;

  return container;
}

function findIncome(incomeId) {
  return getAppState().currentBudget.incomes.find((item) => item.id === incomeId) ?? null;
}

function renderIncomesList() {
  if (!workspace) {
    workspace = getIncomesWorkspace();
  }

  const listRegion = workspace?.querySelector('[data-incomes-list]');

  if (!listRegion) {
    return;
  }

  if (!isStateInitialized()) {
    return;
  }

  const incomes = getAppState().currentBudget.incomes;
  const sortedIncomes = [...incomes].sort(compareIncomesByDate);

  listRegion.replaceChildren();

  if (sortedIncomes.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'incomes__empty';
    emptyState.textContent = 'Доходы пока не добавлены. Нажмите «Добавить доход», чтобы создать первую запись.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'incomes-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Дата</th>
        <th scope="col">Сумма</th>
        <th scope="col">Категория</th>
        <th scope="col">Источник</th>
        <th scope="col">Комментарий</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  sortedIncomes.forEach((income) => {
    tbody.append(createIncomeRow(income));
  });

  table.append(tbody);
  listRegion.append(table);
}

function createIncomeRow(income) {
  const row = document.createElement('tr');
  row.dataset.incomeId = income.id;

  row.innerHTML = `
    <td>${formatDisplayDate(income.date)}</td>
    <td class="incomes-table__amount">${formatAmount(income.amount)}</td>
    <td>${escapeHtml(getIncomeTypeLabel(income.incomeType))}</td>
    <td>${escapeHtml(income.name || '—')}</td>
    <td>${escapeHtml(income.comment || '—')}</td>
    <td class="incomes-table__actions">
      <button type="button" class="btn btn--secondary" data-action="edit-income" data-income-id="${escapeHtml(income.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-income" data-income-id="${escapeHtml(income.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

export function openAddIncomeModal(initialValues = {}) {
  const form = createIncomeForm(initialValues);

  const dialog = openModal({
    title: 'Добавить доход',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="date"]')?.focus();
  return dialog;
}

function openEditIncomeModal(incomeId) {
  const income = findIncome(incomeId);

  if (!income) {
    showNotification({
      type: 'info',
      message: 'Доход не найден.',
    });
    return null;
  }

  const form = createIncomeForm({
    date: income.date,
    amount: income.amount,
    category: income.incomeType,
    source: income.name,
    comment: income.comment,
  }, income);

  const dialog = openModal({
    title: 'Изменить доход',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="date"]')?.focus();
  return dialog;
}

function createIncomeForm(initialValues = {}, income = null) {
  const isEdit = Boolean(income?.id);
  const form = document.createElement('form');
  form.className = 'incomes-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="income-date">Дата</label>
      <input class="form-field__input" type="date" id="income-date" name="date" required>
      <p class="form-field__error" data-error-for="date" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="income-amount">Сумма</label>
      <input class="form-field__input" type="number" id="income-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="income-category">Категория</label>
      <select class="form-field__input" id="income-category" name="category" required>
        <option value="">Выберите категорию</option>
        ${INCOME_TYPE_OPTIONS.map(
          ({ value, label }) => `<option value="${value}">${label}</option>`,
        ).join('')}
      </select>
      <p class="form-field__error" data-error-for="category" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="income-source">Источник</label>
      <input class="form-field__input" type="text" id="income-source" name="source" maxlength="120" autocomplete="off">
      <p class="form-field__error" data-error-for="source" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="income-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="income-comment" name="comment" rows="3" maxlength="500"></textarea>
      <p class="form-field__error" data-error-for="comment" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-income">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (isEdit) {
    form.dataset.incomeId = income.id;
  }

  form.querySelector('[name="date"]').value = initialValues.date ?? formatIsoDate(new Date());

  if (initialValues.amount != null && initialValues.amount !== '') {
    form.querySelector('[name="amount"]').value = String(initialValues.amount);
  }

  if (initialValues.category) {
    form.querySelector('[name="category"]').value = initialValues.category;
  }

  if (initialValues.source) {
    form.querySelector('[name="source"]').value = initialValues.source;
  }

  if (initialValues.comment) {
    form.querySelector('[name="comment"]').value = initialValues.comment;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleIncomeFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-income"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function handleIncomeFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    date: String(formData.get('date') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    source: String(formData.get('source') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim(),
  };
  const incomeId = form.dataset.incomeId ?? null;
  const errors = validateIncomePayload(payload);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  if (incomeId) {
    const existing = findIncome(incomeId);

    if (!existing) {
      showNotification({
        type: 'info',
        message: 'Доход не найден.',
      });
      return;
    }

    updateAppState((state) => {
      const index = state.currentBudget.incomes.findIndex((item) => item.id === incomeId);

      if (index === -1) {
        return state;
      }

      state.currentBudget.incomes[index] = buildIncomeFromPayload(
        payload,
        state.currentBudget.incomes[index],
      );

      return state;
    });

    closeModal();
    showNotification({
      type: 'info',
      message: 'Доход изменён.',
    });
    return;
  }

  const income = buildIncomeFromPayload(payload);

  updateAppState((state) => {
    state.currentBudget.incomes.push(income);
    return state;
  });

  closeModal();
  showNotification({
    type: 'info',
    message: 'Доход добавлен.',
  });
  offerCreateTemplateFromIncome(income);
}

function handleDeleteIncome(incomeId) {
  const income = findIncome(incomeId);

  if (!income) {
    showNotification({
      type: 'info',
      message: 'Доход не найден.',
    });
    return;
  }

  const label = income.name ? `«${income.name}»` : formatAmount(income.amount);
  const confirmed = window.confirm(`Удалить доход ${label}?`);

  if (!confirmed) {
    return;
  }

  const canRestoreViaTemplate = hasRelatedTemplate(
    getAppState().templates,
    TEMPLATE_TYPES.ACTUAL_INCOME,
    [income.name],
  );

  updateAppState((state) => {
    state.currentBudget.incomes = state.currentBudget.incomes.filter((item) => item.id !== incomeId);
    return state;
  });

  showNotification({
    type: 'info',
    message: canRestoreViaTemplate
      ? 'Доход удалён. Запись можно восстановить через раздел «Шаблоны».'
      : 'Доход удалён.',
  });
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

  const firstInvalidInput = form.querySelector('[aria-invalid="true"]');
  firstInvalidInput?.focus();
}

function compareIncomesByDate(first, second) {
  return String(second.date).localeCompare(String(first.date));
}

function getIncomeTypeLabel(incomeType) {
  return INCOME_TYPE_LABELS[incomeType] ?? '—';
}

function formatDisplayDate(dateString) {
  const date = parseInputDate(dateString);

  if (!date) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

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

function parseInputDate(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
