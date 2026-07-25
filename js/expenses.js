/**
 * Модуль раздела «Расходы».
 * Категории и статьи берутся из справочников состояния приложения (раздел 8 ТЗ).
 * Поддерживаются добавление, изменение, удаление и копирование операций.
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js?v=20260725-11';
import { offerCreateTemplateFromExpense } from './template-prompt.js';
import {
  getExpenseCategories,
  getAvailableExpenseArticles,
  getReferenceName,
  validateExpensePayload,
  buildExpenseFromPayload,
  formatIsoDate,
  TEMPLATE_TYPES,
  hasRelatedTemplate,
} from './state.js';

const EXPENSES_WORKSPACE_ID = 'expenses-workspace';

let workspace = null;
let stateUpdateListenerAttached = false;

function getExpensesWorkspace() {
  return document.getElementById(EXPENSES_WORKSPACE_ID) ?? getSectionRegion('expenses');
}

function getExpenseReferences() {
  const state = getAppState();

  return {
    categories: getExpenseCategories(state),
    articles: getAvailableExpenseArticles(state),
  };
}

/**
 * Инициализирует раздел «Расходы».
 */
export function initExpenses() {
  workspace = getExpensesWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');

  if (!workspace.querySelector('.expenses-shell')) {
    workspace.replaceChildren(createExpensesShell());
  }

  if (isStateInitialized()) {
    renderExpensesList();
  }

  attachStateUpdateListener();
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      renderExpensesList();
    }
  });

  stateUpdateListenerAttached = true;
}

function createExpensesShell() {
  const shell = document.createElement('div');
  shell.className = 'expenses-shell';

  shell.innerHTML = `
    <div class="expenses-tabs" role="tablist" aria-label="Виды расходов">
      <button
        type="button"
        class="expenses-tabs__button expenses-tabs__button--active"
        role="tab"
        id="expenses-tab-actual"
        aria-selected="true"
        aria-controls="expenses-panel-actual"
        data-expenses-tab="actual"
      >
        Фактические
      </button>
      <button
        type="button"
        class="expenses-tabs__button"
        role="tab"
        id="expenses-tab-planned"
        aria-selected="false"
        aria-controls="expenses-panel-planned"
        data-expenses-tab="planned"
      >
        Плановые
      </button>
    </div>
    <div
      class="expenses-panel"
      id="expenses-panel-actual"
      data-expenses-panel="actual"
      role="tabpanel"
      aria-labelledby="expenses-tab-actual"
    ></div>
    <div
      class="expenses-panel"
      id="expenses-panel-planned"
      data-expenses-panel="planned"
      role="tabpanel"
      aria-labelledby="expenses-tab-planned"
      hidden
    ></div>
  `;

  shell.querySelector('[data-expenses-panel="actual"]').append(createExpensesLayout());

  return shell;
}

function handleExpensesClick(event) {
  const addButton = event.target.closest('[data-action="add-expense"]');

  if (addButton) {
    initExpenses();
    openAddExpenseModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-expense"]');

  if (editButton?.dataset.expenseId) {
    initExpenses();
    openEditExpenseModal(editButton.dataset.expenseId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-expense"]');

  if (deleteButton?.dataset.expenseId) {
    initExpenses();
    handleDeleteExpense(deleteButton.dataset.expenseId);
    event.preventDefault();
  }
}

document.addEventListener('click', handleExpensesClick);

function createExpensesLayout() {
  const container = document.createElement('div');
  container.className = 'expenses';

  container.innerHTML = `
    <div class="expenses__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-expense">
        Добавить расход
      </button>
    </div>
    <div class="expenses__list" data-expenses-list role="region" aria-label="Список расходов"></div>
  `;

  return container;
}

function findExpense(expenseId) {
  return getAppState().currentBudget.expenses.find((item) => item.id === expenseId) ?? null;
}

function renderExpensesList() {
  if (!workspace) {
    workspace = getExpensesWorkspace();
  }

  const listRegion = workspace?.querySelector('[data-expenses-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const expenses = state.currentBudget.expenses;
  const sortedExpenses = [...expenses].sort(compareExpensesByDate);
  const { categories, articles } = getExpenseReferences();

  listRegion.replaceChildren();

  if (sortedExpenses.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'expenses__empty';
    emptyState.textContent = 'Расходы пока не добавлены. Нажмите «Добавить расход», чтобы создать первую запись.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'expenses-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Дата</th>
        <th scope="col">Сумма</th>
        <th scope="col">Категория</th>
        <th scope="col">Статья</th>
        <th scope="col">Название</th>
        <th scope="col">Комментарий</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  sortedExpenses.forEach((expense) => {
    tbody.append(createExpenseRow(expense, categories, articles));
  });

  table.append(tbody);
  listRegion.append(table);
}

function createExpenseRow(expense, categories, articles) {
  const row = document.createElement('tr');
  row.dataset.expenseId = expense.id;

  row.innerHTML = `
    <td>${formatDisplayDate(expense.date)}</td>
    <td class="expenses-table__amount">${formatAmount(expense.amount)}</td>
    <td>${escapeHtml(getReferenceName(categories, expense.categoryId))}</td>
    <td>${escapeHtml(getReferenceName(articles, expense.articleId))}</td>
    <td>${escapeHtml(expense.name || '—')}</td>
    <td>${escapeHtml(expense.comment || '—')}</td>
    <td class="expenses-table__actions">
      <button type="button" class="btn btn--secondary" data-action="edit-expense" data-expense-id="${escapeHtml(expense.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-expense" data-expense-id="${escapeHtml(expense.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

export function openAddExpenseModal(initialValues = {}) {
  const form = createExpenseForm(initialValues);

  const dialog = openModal({
    title: 'Добавить расход',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="categoryId"]')?.focus();
  return dialog;
}

function openEditExpenseModal(expenseId) {
  const expense = findExpense(expenseId);

  if (!expense) {
    showNotification({
      type: 'info',
      message: 'Расход не найден.',
    });
    return null;
  }

  const form = createExpenseForm({
    date: expense.date,
    amount: expense.amount,
    categoryId: expense.categoryId,
    articleId: expense.articleId,
    name: expense.name,
    comment: expense.comment,
  }, expense);

  const dialog = openModal({
    title: 'Изменить расход',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="categoryId"]')?.focus();
  return dialog;
}

function renderSelectOptions(items, placeholder, selectedValue = '') {
  const options = [`<option value="">${placeholder}</option>`];

  items.forEach(({ id, name }) => {
    const selected = id === selectedValue ? ' selected' : '';
    options.push(`<option value="${escapeHtml(id)}"${selected}>${escapeHtml(name)}</option>`);
  });

  return options.join('');
}

function createExpenseForm(initialValues = {}, expense = null) {
  const { categories, articles } = getExpenseReferences();
  const isEdit = Boolean(expense?.id);
  const form = document.createElement('form');
  form.className = 'expenses-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="expense-date">Дата</label>
      <input class="form-field__input" type="date" id="expense-date" name="date" required>
      <p class="form-field__error" data-error-for="date" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-amount">Сумма</label>
      <input class="form-field__input" type="number" id="expense-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-article">Статья</label>
      <select class="form-field__input" id="expense-article" name="articleId" required>
        ${renderSelectOptions(articles, 'Выберите статью', initialValues.articleId)}
      </select>
      <p class="form-field__error" data-error-for="articleId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-category">Категория</label>
      <select class="form-field__input" id="expense-category" name="categoryId" required>
        ${renderSelectOptions(categories, 'Выберите категорию', initialValues.categoryId)}
      </select>
      <p class="form-field__error" data-error-for="categoryId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-name">Название</label>
      <input class="form-field__input" type="text" id="expense-name" name="name" maxlength="120" autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="expense-comment" name="comment" rows="3" maxlength="500"></textarea>
      <p class="form-field__error" data-error-for="comment" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-expense">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (isEdit) {
    form.dataset.expenseId = expense.id;
  }

  form.querySelector('[name="date"]').value = initialValues.date ?? formatIsoDate(new Date());

  if (initialValues.amount != null && initialValues.amount !== '') {
    form.querySelector('[name="amount"]').value = String(initialValues.amount);
  }

  if (initialValues.name) {
    form.querySelector('[name="name"]').value = initialValues.name;
  }

  if (initialValues.comment) {
    form.querySelector('[name="comment"]').value = initialValues.comment;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleExpenseFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-expense"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function handleExpenseFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    categoryId: String(formData.get('categoryId') ?? '').trim(),
    articleId: String(formData.get('articleId') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    date: String(formData.get('date') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim(),
  };
  const expenseId = form.dataset.expenseId ?? null;
  const errors = validateExpensePayload(payload, getAppState());

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  if (expenseId) {
    const existing = findExpense(expenseId);

    if (!existing) {
      showNotification({
        type: 'info',
        message: 'Расход не найден.',
      });
      return;
    }

    updateAppState((state) => {
      const index = state.currentBudget.expenses.findIndex((item) => item.id === expenseId);

      if (index === -1) {
        return state;
      }

      state.currentBudget.expenses[index] = buildExpenseFromPayload(
        payload,
        state.currentBudget.expenses[index],
      );

      return state;
    });

    closeModal();
    showNotification({
      type: 'info',
      message: 'Расход изменён.',
    });
    return;
  }

  const expense = buildExpenseFromPayload(payload);

  updateAppState((state) => {
    state.currentBudget.expenses.push(expense);
    return state;
  });

  closeModal();
  showNotification({
    type: 'info',
    message: 'Расход добавлен.',
  });
  offerCreateTemplateFromExpense(expense);
}

function handleDeleteExpense(expenseId) {
  const expense = findExpense(expenseId);

  if (!expense) {
    showNotification({
      type: 'info',
      message: 'Расход не найден.',
    });
    return;
  }

  const label = expense.name ? `«${expense.name}»` : formatAmount(expense.amount);
  const confirmed = window.confirm(`Удалить расход ${label}?`);

  if (!confirmed) {
    return;
  }

  const canRestoreViaTemplate = hasRelatedTemplate(
    getAppState().templates,
    TEMPLATE_TYPES.ACTUAL_EXPENSE,
    [expense.name],
  );

  updateAppState((state) => {
    state.currentBudget.expenses = state.currentBudget.expenses.filter((item) => item.id !== expenseId);
    return state;
  });

  showNotification({
    type: 'info',
    message: canRestoreViaTemplate
      ? 'Расход удалён. Запись можно восстановить через раздел «Шаблоны».'
      : 'Расход удалён.',
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

  form.querySelector('[aria-invalid="true"]')?.focus();
}

function compareExpensesByDate(first, second) {
  return String(second.date).localeCompare(String(first.date));
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
