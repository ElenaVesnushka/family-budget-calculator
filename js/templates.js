/**
 * Модуль раздела «Шаблоны» (раздел 12 ТЗ).
 */

import { getSectionRegion, showSection } from './ui.js';
import { getAppState, updateAppState, isStateInitialized, updateSessionState } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js';
import {
  TEMPLATE_TYPES,
  INCOME_TYPES,
  RECURRENCE_FREQUENCIES,
  EXPECTED_INCOME_RECURRENCE_ONCE,
  getExpenseCategories,
  getAvailableExpenseArticles,
  getReferenceName,
  getRecurrenceLabel,
  getTemplateTypeLabel,
  validateTemplatePayload,
  buildTemplateFromPayload,
  buildRecurrenceFromPayload,
  formatIsoDate,
} from './state.js';
import { openAddIncomeModal } from './incomes.js';
import { openAddExpenseModal } from './expenses.js';
import { openAddExpectedIncomeModal, switchIncomesTab } from './expected-incomes.js';
import { openAddPlannedExpenseModal, switchExpensesTab } from './planned-expenses.js';

const WORKSPACE_ID = 'templates-workspace';

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

const TEMPLATE_TYPE_OPTIONS = [
  { value: TEMPLATE_TYPES.ACTUAL_INCOME, label: 'Фактический доход' },
  { value: TEMPLATE_TYPES.ACTUAL_EXPENSE, label: 'Фактический расход' },
  { value: TEMPLATE_TYPES.EXPECTED_INCOME, label: 'Ожидаемый доход' },
  { value: TEMPLATE_TYPES.PLANNED_EXPENSE, label: 'Плановый расход' },
];

const SORT_MODES = {
  NAME_ASC: 'name-asc',
  CREATED_DESC: 'created-desc',
};

let workspace = null;
let stateUpdateListenerAttached = false;
let searchQuery = '';
let typeFilter = '';
let sortMode = SORT_MODES.NAME_ASC;
let showDisabled = true;

function getWorkspace() {
  return document.getElementById(WORKSPACE_ID) ?? getSectionRegion('templates');
}

/**
 * Инициализирует раздел «Шаблоны».
 */
export function initTemplates() {
  workspace = getWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');
  attachStateUpdateListener();
  ensureLayout();

  if (isStateInitialized()) {
    renderTemplatesList();
  }
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      renderTemplatesList();
    }
  });

  stateUpdateListenerAttached = true;
}

function ensureLayout() {
  if (!workspace || workspace.querySelector('.templates')) {
    return;
  }

  workspace.append(createLayout());
  bindControls();
}

function createLayout() {
  const container = document.createElement('div');
  container.className = 'templates';

  container.innerHTML = `
    <div class="templates__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-template">
        Добавить шаблон
      </button>
    </div>
    <div class="templates__controls">
      <div class="form-field templates__search">
        <label class="form-field__label" for="templates-search">Поиск</label>
        <input class="form-field__input" type="search" id="templates-search" placeholder="Поиск по названию" autocomplete="off">
      </div>
      <div class="form-field">
        <label class="form-field__label" for="templates-type-filter">Тип</label>
        <select class="form-field__input" id="templates-type-filter">
          <option value="">Все типы</option>
          ${TEMPLATE_TYPE_OPTIONS.map(({ value, label }) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="templates-sort">Сортировка</label>
        <select class="form-field__input" id="templates-sort">
          <option value="${SORT_MODES.NAME_ASC}">По названию</option>
          <option value="${SORT_MODES.CREATED_DESC}">По дате создания</option>
        </select>
      </div>
      <label class="templates__show-disabled">
        <input type="checkbox" id="templates-show-disabled" checked>
        Показывать отключённые
      </label>
    </div>
    <div class="templates__list" data-templates-list role="region" aria-label="Список шаблонов"></div>
  `;

  return container;
}

function bindControls() {
  workspace.querySelector('#templates-search')?.addEventListener('input', (event) => {
    searchQuery = String(event.target.value ?? '').trim().toLowerCase();
    renderTemplatesList();
  });

  workspace.querySelector('#templates-type-filter')?.addEventListener('change', (event) => {
    typeFilter = String(event.target.value ?? '').trim();
    renderTemplatesList();
  });

  workspace.querySelector('#templates-sort')?.addEventListener('change', (event) => {
    sortMode = String(event.target.value ?? SORT_MODES.NAME_ASC);
    renderTemplatesList();
  });

  workspace.querySelector('#templates-show-disabled')?.addEventListener('change', (event) => {
    showDisabled = Boolean(event.target.checked);
    renderTemplatesList();
  });
}

function handleTemplatesClick(event) {
  const addButton = event.target.closest('[data-action="add-template"]');

  if (addButton) {
    initTemplates();
    openCreateTemplateModal();
    event.preventDefault();
    return;
  }

  const useButton = event.target.closest('[data-action="use-template"]');

  if (useButton?.dataset.templateId) {
    initTemplates();
    applyTemplate(useButton.dataset.templateId);
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-template"]');

  if (editButton?.dataset.templateId) {
    initTemplates();
    openEditTemplateModal(editButton.dataset.templateId);
    event.preventDefault();
    return;
  }

  const toggleButton = event.target.closest('[data-action="toggle-template"]');

  if (toggleButton?.dataset.templateId) {
    initTemplates();
    handleToggleTemplate(toggleButton.dataset.templateId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-template"]');

  if (deleteButton?.dataset.templateId) {
    initTemplates();
    handleDeleteTemplate(deleteButton.dataset.templateId);
    event.preventDefault();
  }
}

document.addEventListener('click', handleTemplatesClick);

function getFilteredTemplates() {
  let items = [...(getAppState().templates ?? [])];

  if (!showDisabled) {
    items = items.filter((item) => item.isEnabled);
  }

  if (typeFilter) {
    items = items.filter((item) => item.templateType === typeFilter);
  }

  if (searchQuery) {
    items = items.filter((item) => String(item.name ?? '').toLowerCase().includes(searchQuery));
  }

  if (sortMode === SORT_MODES.CREATED_DESC) {
    items.sort((first, second) => String(second.createdAt ?? '').localeCompare(String(first.createdAt ?? '')));
  } else {
    items.sort((first, second) => String(first.name ?? '').localeCompare(String(second.name ?? ''), 'ru'));
  }

  return items;
}

function renderTemplatesList() {
  workspace = getWorkspace();
  ensureLayout();

  const listRegion = workspace?.querySelector('[data-templates-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const templates = getFilteredTemplates();
  listRegion.replaceChildren();

  if (templates.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'templates__empty';
    emptyState.textContent = 'Шаблоны не найдены. Нажмите «Добавить шаблон», чтобы создать заготовку для операции.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'templates-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Название</th>
        <th scope="col">Тип</th>
        <th scope="col">Статус</th>
        <th scope="col">Создан</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  templates.forEach((template) => {
    tbody.append(createTemplateRow(template));
  });

  table.append(tbody);
  listRegion.append(table);
}

function createTemplateRow(template) {
  const row = document.createElement('tr');
  row.className = `templates-table__row ${template.isEnabled ? '' : 'templates-table__row--disabled'}`.trim();
  row.dataset.templateId = template.id;

  const statusText = template.isEnabled ? 'Активен' : 'Отключён';
  const useButton = template.isEnabled
    ? `<button type="button" class="btn btn--primary" data-action="use-template" data-template-id="${escapeHtml(template.id)}">Использовать</button>`
    : '';

  row.innerHTML = `
    <td class="templates-table__name">${escapeHtml(template.name)}</td>
    <td>${escapeHtml(getTemplateTypeLabel(template.templateType))}</td>
    <td>${escapeHtml(statusText)}</td>
    <td>${formatDisplayDateTime(template.createdAt)}</td>
    <td class="templates-table__actions">
      ${useButton}
      <button type="button" class="btn btn--secondary" data-action="edit-template" data-template-id="${escapeHtml(template.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="toggle-template" data-template-id="${escapeHtml(template.id)}">
        ${template.isEnabled ? 'Отключить' : 'Включить'}
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-template" data-template-id="${escapeHtml(template.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

export function openCreateTemplateModal(draft = null) {
  const form = createTemplateForm(draft);
  return openModal({ title: 'Добавить шаблон', content: form });
}

function openEditTemplateModal(templateId) {
  const template = findTemplate(templateId);

  if (!template) {
    showNotification({ type: 'info', message: 'Шаблон не найден.' });
    return null;
  }

  const form = createTemplateForm(template);
  return openModal({ title: 'Изменить шаблон', content: form });
}

function createTemplateForm(template = null) {
  const isEdit = Boolean(template?.id);
  const state = getAppState();
  const categories = getExpenseCategories(state);
  const articles = getAvailableExpenseArticles(state);
  const form = document.createElement('form');
  form.className = 'templates-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="template-name">Название шаблона</label>
      <input class="form-field__input" type="text" id="template-name" name="name" maxlength="120" required autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="template-type">Тип операции</label>
      <select class="form-field__input" id="template-type" name="templateType" required ${isEdit ? 'disabled' : ''}>
        <option value="">Выберите тип</option>
        ${TEMPLATE_TYPE_OPTIONS.map(({ value, label }) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('')}
      </select>
      <p class="form-field__error" data-error-for="templateType" hidden></p>
    </div>
    <div class="templates-form__type-fields" data-template-type-fields hidden></div>
    <div class="form-field">
      <label class="form-field__label" for="template-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="template-comment" name="comment" rows="3" maxlength="500"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-template">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (isEdit) {
    form.dataset.templateId = template.id;
  }

  form.querySelector('#template-name').value = template?.name ?? '';
  form.querySelector('#template-comment').value = template?.comment ?? '';

  if (template?.templateType) {
    form.querySelector('#template-type').value = template.templateType;
  }

  form.querySelector('#template-type').addEventListener('change', () => {
    renderTemplateTypeFields(form, categories, articles);
  });

  renderTemplateTypeFields(form, categories, articles, template);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleTemplateFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-template"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function renderTemplateTypeFields(form, categories, articles, template = null) {
  const container = form.querySelector('[data-template-type-fields]');
  const templateType = form.querySelector('#template-type').value;

  if (!templateType) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;

  if (templateType === TEMPLATE_TYPES.ACTUAL_INCOME) {
    container.innerHTML = `
      <div class="form-field">
        <label class="form-field__label" for="template-income-type">Вид дохода</label>
        <select class="form-field__input" id="template-income-type" name="incomeType" required>
          ${renderIncomeTypeOptions(template?.income?.incomeType)}
        </select>
        <p class="form-field__error" data-error-for="incomeType" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-income-amount">Сумма</label>
        <input class="form-field__input" type="number" id="template-income-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
        <p class="form-field__error" data-error-for="amount" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-income-source">Источник</label>
        <input class="form-field__input" type="text" id="template-income-source" name="source" maxlength="120" autocomplete="off">
      </div>
    `;
    if (template?.income) {
      container.querySelector('#template-income-amount').value = String(template.income.amount ?? '');
      container.querySelector('#template-income-source').value = template.income.source ?? '';
    }
    return;
  }

  if (templateType === TEMPLATE_TYPES.ACTUAL_EXPENSE) {
    container.innerHTML = `
      <div class="form-field">
        <label class="form-field__label" for="template-expense-category">Категория</label>
        <select class="form-field__input" id="template-expense-category" name="categoryId" required>
          ${renderSelectOptions(categories, 'Выберите категорию', template?.expense?.categoryId)}
        </select>
        <p class="form-field__error" data-error-for="categoryId" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expense-article">Статья</label>
        <select class="form-field__input" id="template-expense-article" name="articleId" required>
          ${renderSelectOptions(articles, 'Выберите статью', template?.expense?.articleId)}
        </select>
        <p class="form-field__error" data-error-for="articleId" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expense-amount">Сумма</label>
        <input class="form-field__input" type="number" id="template-expense-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
        <p class="form-field__error" data-error-for="amount" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expense-name">Название операции</label>
        <input class="form-field__input" type="text" id="template-expense-name" name="operationName" maxlength="120" autocomplete="off">
      </div>
    `;
    if (template?.expense) {
      container.querySelector('#template-expense-amount').value = String(template.expense.amount ?? '');
      container.querySelector('#template-expense-name').value = template.expense.name ?? '';
    }
    return;
  }

  if (templateType === TEMPLATE_TYPES.EXPECTED_INCOME) {
    container.innerHTML = `
      <div class="form-field">
        <label class="form-field__label" for="template-expected-income-type">Вид дохода</label>
        <select class="form-field__input" id="template-expected-income-type" name="incomeType" required>
          ${renderIncomeTypeOptions(template?.expectedIncome?.incomeType)}
        </select>
        <p class="form-field__error" data-error-for="incomeType" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expected-name">Название операции</label>
        <input class="form-field__input" type="text" id="template-expected-name" name="operationName" maxlength="120" required autocomplete="off">
        <p class="form-field__error" data-error-for="operationName" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expected-amount">Сумма</label>
        <input class="form-field__input" type="number" id="template-expected-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
        <p class="form-field__error" data-error-for="amount" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expected-date">Дата поступления</label>
        <input class="form-field__input" type="date" id="template-expected-date" name="nextOccurrenceDate" required>
        <p class="form-field__error" data-error-for="nextOccurrenceDate" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-expected-frequency">Периодичность</label>
        <select class="form-field__input" id="template-expected-frequency" name="frequency" required>
          ${renderRecurrenceOptions(template?.expectedIncome?.recurrence?.frequency)}
        </select>
        <p class="form-field__error" data-error-for="frequency" hidden></p>
      </div>
      <div class="form-field" data-interval-days-field hidden>
        <label class="form-field__label" for="template-expected-interval-days">Каждые N дней</label>
        <input class="form-field__input" type="number" id="template-expected-interval-days" name="intervalDays" min="1" step="1" inputmode="numeric">
        <p class="form-field__error" data-error-for="intervalDays" hidden></p>
      </div>
      <div class="form-field" data-interval-months-field hidden>
        <label class="form-field__label" for="template-expected-interval-months">Каждые N месяцев</label>
        <input class="form-field__input" type="number" id="template-expected-interval-months" name="intervalMonths" min="1" step="1" inputmode="numeric">
        <p class="form-field__error" data-error-for="intervalMonths" hidden></p>
      </div>
    `;
    if (template?.expectedIncome) {
      container.querySelector('#template-expected-name').value = template.expectedIncome.name ?? '';
      container.querySelector('#template-expected-amount').value = String(template.expectedIncome.amount ?? '');
      container.querySelector('#template-expected-date').value = template.expectedIncome.nextOccurrenceDate ?? formatIsoDate(new Date());
      container.querySelector('#template-expected-interval-days').value = template.expectedIncome.recurrence?.intervalDays ?? '';
      container.querySelector('#template-expected-interval-months').value = template.expectedIncome.recurrence?.intervalMonths ?? '';
    } else {
      container.querySelector('#template-expected-date').value = formatIsoDate(new Date());
    }
    bindRecurrenceFields(form);
    return;
  }

  if (templateType === TEMPLATE_TYPES.PLANNED_EXPENSE) {
    container.innerHTML = `
      <div class="form-field">
        <label class="form-field__label" for="template-planned-name">Название операции</label>
        <input class="form-field__input" type="text" id="template-planned-name" name="operationName" maxlength="120" required autocomplete="off">
        <p class="form-field__error" data-error-for="operationName" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-planned-category">Категория</label>
        <select class="form-field__input" id="template-planned-category" name="categoryId" required>
          ${renderSelectOptions(categories, 'Выберите категорию', template?.plannedExpense?.categoryId)}
        </select>
        <p class="form-field__error" data-error-for="categoryId" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-planned-article">Статья</label>
        <select class="form-field__input" id="template-planned-article" name="articleId" required>
          ${renderSelectOptions(articles, 'Выберите статью', template?.plannedExpense?.articleId)}
        </select>
        <p class="form-field__error" data-error-for="articleId" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-planned-amount">Сумма</label>
        <input class="form-field__input" type="number" id="template-planned-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
        <p class="form-field__error" data-error-for="amount" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-planned-date">Дата планового расхода</label>
        <input class="form-field__input" type="date" id="template-planned-date" name="firstDate" required>
        <p class="form-field__error" data-error-for="firstDate" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="template-planned-frequency">Периодичность</label>
        <select class="form-field__input" id="template-planned-frequency" name="frequency" required>
          ${renderRecurrenceOptions(template?.plannedExpense?.recurrence?.frequency)}
        </select>
        <p class="form-field__error" data-error-for="frequency" hidden></p>
      </div>
      <div class="form-field" data-interval-days-field hidden>
        <label class="form-field__label" for="template-planned-interval-days">Каждые N дней</label>
        <input class="form-field__input" type="number" id="template-planned-interval-days" name="intervalDays" min="1" step="1" inputmode="numeric">
        <p class="form-field__error" data-error-for="intervalDays" hidden></p>
      </div>
      <div class="form-field" data-interval-months-field hidden>
        <label class="form-field__label" for="template-planned-interval-months">Каждые N месяцев</label>
        <input class="form-field__input" type="number" id="template-planned-interval-months" name="intervalMonths" min="1" step="1" inputmode="numeric">
        <p class="form-field__error" data-error-for="intervalMonths" hidden></p>
      </div>
    `;
    if (template?.plannedExpense) {
      container.querySelector('#template-planned-name').value = template.plannedExpense.name ?? '';
      container.querySelector('#template-planned-amount').value = String(template.plannedExpense.amount ?? '');
      container.querySelector('#template-planned-date').value = template.plannedExpense.firstDate ?? formatIsoDate(new Date());
      container.querySelector('#template-planned-interval-days').value = template.plannedExpense.recurrence?.intervalDays ?? '';
      container.querySelector('#template-planned-interval-months').value = template.plannedExpense.recurrence?.intervalMonths ?? '';
    } else {
      container.querySelector('#template-planned-date').value = formatIsoDate(new Date());
    }
    bindRecurrenceFields(form);
  }
}

function bindRecurrenceFields(form) {
  const frequencySelect = form.querySelector('[name="frequency"]');

  if (!frequencySelect) {
    return;
  }

  frequencySelect.addEventListener('change', () => {
    updateRecurrenceFieldsVisibility(form);
  });

  updateRecurrenceFieldsVisibility(form);
}

function updateRecurrenceFieldsVisibility(form) {
  const frequency = form.querySelector('[name="frequency"]')?.value ?? '';
  const daysField = form.querySelector('[data-interval-days-field]');
  const monthsField = form.querySelector('[data-interval-months-field]');
  const daysInput = form.querySelector('[name="intervalDays"]');
  const monthsInput = form.querySelector('[name="intervalMonths"]');
  const showDays = frequency === RECURRENCE_FREQUENCIES.INTERVAL
    || frequency === RECURRENCE_FREQUENCIES.CUSTOM;
  const showMonths = frequency === RECURRENCE_FREQUENCIES.INTERVAL_MONTHS
    || frequency === RECURRENCE_FREQUENCIES.CUSTOM;

  if (!daysField || !monthsField) {
    return;
  }

  daysField.hidden = !showDays;
  monthsField.hidden = !showMonths;

  if (showDays) {
    daysInput?.setAttribute('required', 'required');
  } else {
    daysInput?.removeAttribute('required');
    if (daysInput) daysInput.value = '';
  }

  if (showMonths) {
    monthsInput?.setAttribute('required', 'required');
  } else {
    monthsInput?.removeAttribute('required');
    if (monthsInput) monthsInput.value = '';
  }

  if (frequency === RECURRENCE_FREQUENCIES.CUSTOM) {
    daysInput?.removeAttribute('required');
    monthsInput?.removeAttribute('required');
  }
}

function collectTemplateFormPayload(form) {
  const formData = new FormData(form);
  const templateType = String(form.querySelector('#template-type')?.value ?? formData.get('templateType') ?? '').trim();

  return {
    templateType,
    name: String(formData.get('name') ?? '').trim(),
    comment: String(formData.get('comment') ?? '').trim(),
    incomeType: String(formData.get('incomeType') ?? '').trim(),
    amount: String(formData.get('amount') ?? '').trim(),
    source: String(formData.get('source') ?? '').trim(),
    categoryId: String(formData.get('categoryId') ?? '').trim(),
    articleId: String(formData.get('articleId') ?? '').trim(),
    operationName: String(formData.get('operationName') ?? '').trim(),
    nextOccurrenceDate: String(formData.get('nextOccurrenceDate') ?? '').trim(),
    firstDate: String(formData.get('firstDate') ?? '').trim(),
    frequency: String(formData.get('frequency') ?? '').trim(),
    intervalDays: String(formData.get('intervalDays') ?? '').trim(),
    intervalMonths: String(formData.get('intervalMonths') ?? '').trim(),
  };
}

function handleTemplateFormSubmit(form) {
  clearFormErrors(form);

  const payload = collectTemplateFormPayload(form);
  const errors = validateTemplatePayload(payload, getAppState());

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const templateId = form.dataset.templateId ?? null;
  const now = new Date().toISOString();

  if (templateId) {
    updateAppState((draft) => {
      const index = draft.templates.findIndex((item) => item.id === templateId);

      if (index === -1) {
        return draft;
      }

      const current = draft.templates[index];
      const updated = buildTemplateFromPayload(payload, now);

      draft.templates[index] = {
        ...updated,
        id: current.id,
        templateType: current.templateType,
        isEnabled: current.isEnabled,
        createdAt: current.createdAt,
        lastUsedAt: current.lastUsedAt,
        updatedAt: now,
      };

      return draft;
    });

    closeModal();
    showNotification({ type: 'info', message: 'Шаблон изменён.' });
    return;
  }

  const template = buildTemplateFromPayload(payload, now);

  updateAppState((draft) => {
    draft.templates.push(template);
    return draft;
  });

  closeModal();
  showNotification({ type: 'info', message: 'Шаблон добавлен.' });
}

function applyTemplate(templateId) {
  const template = findTemplate(templateId);

  if (!template) {
    showNotification({ type: 'info', message: 'Шаблон не найден.' });
    return;
  }

  if (!template.isEnabled) {
    showNotification({ type: 'info', message: 'Шаблон отключён.' });
    return;
  }

  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.templates.findIndex((item) => item.id === templateId);

    if (index !== -1) {
      draft.templates[index] = {
        ...draft.templates[index],
        lastUsedAt: now,
        updatedAt: now,
      };
    }

    return draft;
  });

  switch (template.templateType) {
    case TEMPLATE_TYPES.ACTUAL_INCOME:
      showSection('incomes');
      updateSessionState({ activeSection: 'incomes' });
      switchIncomesTab('actual');
      openAddIncomeModal({
        date: formatIsoDate(new Date()),
        amount: template.income?.amount,
        category: template.income?.incomeType,
        source: template.income?.source,
        comment: template.comment,
      });
      break;
    case TEMPLATE_TYPES.ACTUAL_EXPENSE:
      showSection('expenses');
      updateSessionState({ activeSection: 'expenses' });
      switchExpensesTab('actual');
      openAddExpenseModal({
        date: formatIsoDate(new Date()),
        amount: template.expense?.amount,
        categoryId: template.expense?.categoryId,
        articleId: template.expense?.articleId,
        name: template.expense?.name,
        comment: template.comment,
      });
      break;
    case TEMPLATE_TYPES.EXPECTED_INCOME:
      showSection('incomes');
      updateSessionState({ activeSection: 'incomes' });
      switchIncomesTab('expected');
      openAddExpectedIncomeModal({
        incomeType: template.expectedIncome?.incomeType,
        name: template.expectedIncome?.name,
        amount: template.expectedIncome?.amount,
        nextOccurrenceDate: template.expectedIncome?.nextOccurrenceDate,
        recurrence: template.expectedIncome?.recurrence,
        comment: template.comment,
      });
      break;
    case TEMPLATE_TYPES.PLANNED_EXPENSE:
      showSection('expenses');
      updateSessionState({ activeSection: 'expenses' });
      switchExpensesTab('planned');
      openAddPlannedExpenseModal({
        name: template.plannedExpense?.name,
        categoryId: template.plannedExpense?.categoryId,
        articleId: template.plannedExpense?.articleId,
        amount: template.plannedExpense?.amount,
        firstDate: template.plannedExpense?.firstDate,
        recurrence: template.plannedExpense?.recurrence,
        comment: template.comment,
      });
      break;
    default:
      showNotification({ type: 'info', message: 'Неизвестный тип шаблона.' });
  }
}

function handleToggleTemplate(templateId) {
  const template = findTemplate(templateId);

  if (!template) {
    showNotification({ type: 'info', message: 'Шаблон не найден.' });
    return;
  }

  const nextEnabled = !template.isEnabled;
  const now = new Date().toISOString();

  updateAppState((draft) => {
    const index = draft.templates.findIndex((item) => item.id === templateId);

    if (index !== -1) {
      draft.templates[index] = {
        ...draft.templates[index],
        isEnabled: nextEnabled,
        updatedAt: now,
      };
    }

    return draft;
  });

  showNotification({
    type: 'info',
    message: nextEnabled ? 'Шаблон включён.' : 'Шаблон отключён.',
  });
}

function handleDeleteTemplate(templateId) {
  const template = findTemplate(templateId);

  if (!template) {
    showNotification({ type: 'info', message: 'Шаблон не найден.' });
    return;
  }

  const confirmed = window.confirm(`Удалить шаблон «${template.name}»?`);

  if (!confirmed) {
    return;
  }

  updateAppState((draft) => {
    draft.templates = draft.templates.filter((item) => item.id !== templateId);
    return draft;
  });

  showNotification({ type: 'info', message: 'Шаблон удалён.' });
}

function findTemplate(templateId) {
  return getAppState().templates?.find((item) => item.id === templateId) ?? null;
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

function formatDisplayDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
