/**
 * Модуль раздела «Расходы».
 * Категории и статьи берутся из справочников состояния приложения (раздел 8 ТЗ).
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js';
import {
  generateId,
  createExpenseShape,
  getExpenseCategories,
  getAvailableExpenseArticles,
  getReferenceName,
} from './state.js';

const EXPENSES_WORKSPACE_ID = 'expenses-workspace';

let workspace = null;

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

  if (!workspace.querySelector('.expenses')) {
    workspace.replaceChildren(createExpensesLayout());
  }

  if (isStateInitialized()) {
    renderExpensesList();
  }
}

function handleAddExpenseClick(event) {
  const addButton = event.target.closest('[data-action="add-expense"]');

  if (!addButton) {
    return;
  }

  initExpenses();

  const dialog = openAddExpenseModal();

  if (!dialog) {
    return;
  }

  event.preventDefault();
}

document.addEventListener('click', handleAddExpenseClick);

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
  `;

  return row;
}

function openAddExpenseModal() {
  const form = createExpenseForm();

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

function renderSelectOptions(items, placeholder) {
  const options = [`<option value="">${placeholder}</option>`];

  items.forEach(({ id, name }) => {
    options.push(`<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`);
  });

  return options.join('');
}

function createExpenseForm() {
  const { categories, articles } = getExpenseReferences();
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
        ${renderSelectOptions(articles, 'Выберите статью')}
      </select>
      <p class="form-field__error" data-error-for="articleId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="expense-category">Категория</label>
      <select class="form-field__input" id="expense-category" name="categoryId" required>
        ${renderSelectOptions(categories, 'Выберите категорию')}
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
      <button type="submit" class="btn btn--primary">Сохранить</button>
    </div>
  `;

  form.querySelector('[name="date"]').value = formatInputDate(new Date());

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

  const errors = validateExpenseForm(payload);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const now = new Date().toISOString();
  const expense = {
    ...createExpenseShape(),
    id: generateId('expense'),
    categoryId: payload.categoryId,
    articleId: payload.articleId,
    name: payload.name,
    date: payload.date,
    amount: Number(payload.amount),
    comment: payload.comment,
    createdAt: now,
    updatedAt: now,
  };

  updateAppState((state) => {
    state.currentBudget.expenses.push(expense);
    return state;
  });

  closeModal();
  renderExpensesList();
  showNotification({
    type: 'info',
    message: 'Расход сохранён.',
  });
}

function validateExpenseForm({ categoryId, articleId, date, amount }) {
  const errors = {};
  const { categories, articles } = getExpenseReferences();
  const categoryIds = new Set(categories.map((item) => item.id));
  const articleIds = new Set(articles.map((item) => item.id));

  if (!categoryId) {
    errors.categoryId = 'Выберите категорию.';
  } else if (!categoryIds.has(categoryId)) {
    errors.categoryId = 'Выберите категорию из списка.';
  }

  if (!articleId) {
    errors.articleId = 'Выберите статью.';
  } else if (!articleIds.has(articleId)) {
    errors.articleId = 'Выберите статью из списка.';
  }

  if (!date) {
    errors.date = 'Укажите дату.';
  } else if (!isDateWithinAllowedRange(date)) {
    errors.date = 'Дата должна быть не ранее 30 дней назад и не позднее 60 дней вперёд.';
  }

  const parsedAmount = Number(amount);

  if (!amount) {
    errors.amount = 'Укажите сумму.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма должна быть больше нуля.';
  }

  return errors;
}

function isDateWithinAllowedRange(dateString) {
  const date = parseInputDate(dateString);

  if (!date) {
    return false;
  }

  const today = startOfDay(new Date());
  const minDate = addDays(today, -30);
  const maxDate = addDays(today, 60);
  const target = startOfDay(date);

  return target >= minDate && target <= maxDate;
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

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
