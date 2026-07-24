/**
 * Модуль раздела «Лимиты».
 * Планирование и контроль расходов по категориям и статьям (раздел 9 ТЗ).
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js';
import {
  generateId,
  createLimitShape,
  LIMIT_TYPES,
  getLimitCategories,
  getLimitArticles,
  calculateLimitProgress,
} from './state.js';

const LIMITS_WORKSPACE_ID = 'limits-workspace';

const LIMIT_TYPE_OPTIONS = [
  { value: LIMIT_TYPES.CATEGORY, label: 'Лимит по категории' },
  { value: LIMIT_TYPES.ARTICLE, label: 'Лимит по статье' },
];

let workspace = null;
let stateUpdateListenerAttached = false;

function getLimitsWorkspace() {
  return document.getElementById(LIMITS_WORKSPACE_ID) ?? getSectionRegion('limits');
}

/**
 * Инициализирует раздел «Лимиты».
 */
export function initLimits() {
  workspace = getLimitsWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');

  if (!workspace.querySelector('.limits')) {
    workspace.replaceChildren(createLimitsLayout());
  }

  attachStateUpdateListener();

  if (isStateInitialized()) {
    renderLimitsList();
  }
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

  renderLimitsList();
}

function handleLimitsClick(event) {
  const addButton = event.target.closest('[data-action="add-limit"]');

  if (addButton) {
    initLimits();
    openAddLimitModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-limit"]');

  if (editButton) {
    initLimits();
    const limitId = editButton.dataset.limitId;

    if (limitId) {
      openEditLimitModal(limitId);
    }

    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-limit"]');

  if (deleteButton) {
    initLimits();
    const limitId = deleteButton.dataset.limitId;

    if (limitId) {
      handleDeleteLimit(limitId);
    }

    event.preventDefault();
  }
}

document.addEventListener('click', handleLimitsClick);

function createLimitsLayout() {
  const container = document.createElement('div');
  container.className = 'limits';

  container.innerHTML = `
    <div class="limits__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-limit">
        Добавить лимит
      </button>
    </div>
    <div class="limits__list" data-limits-list role="region" aria-label="Список лимитов"></div>
  `;

  return container;
}

function renderLimitsList() {
  if (!workspace) {
    workspace = getLimitsWorkspace();
  }

  const listRegion = workspace?.querySelector('[data-limits-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const limits = state.currentBudget.limits ?? [];

  listRegion.replaceChildren();

  if (limits.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'limits__empty';
    emptyState.textContent = 'Лимиты пока не установлены. Нажмите «Добавить лимит», чтобы задать бюджет по категории или статье.';
    listRegion.append(emptyState);
    return;
  }

  const sortedLimits = [...limits].sort(compareLimitsByName);

  const table = document.createElement('table');
  table.className = 'limits-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Название</th>
        <th scope="col">Тип</th>
        <th scope="col">Лимит</th>
        <th scope="col">Фактические расходы</th>
        <th scope="col">Остаток / Перерасход</th>
        <th scope="col">Использование</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  sortedLimits.forEach((limit) => {
    tbody.append(createLimitRow(limit, state));
  });

  table.append(tbody);
  listRegion.append(table);
}

function createLimitRow(limit, state) {
  const progress = calculateLimitProgress(limit, state);
  const row = document.createElement('tr');
  row.className = `limits-table__row limits-table__row--${progress.status}`;
  row.dataset.limitId = limit.id;

  const balanceMarkup = progress.overspend > 0
    ? `<span class="limits-table__overspend">Перерасход: ${formatAmount(progress.overspend)}</span>`
    : `<span class="limits-table__remaining">Остаток: ${formatAmount(progress.remaining)}</span>`;

  row.innerHTML = `
    <td class="limits-table__name">${escapeHtml(progress.name)}</td>
    <td>${escapeHtml(progress.typeLabel)}</td>
    <td class="limits-table__amount">${formatAmount(progress.limitAmount)}</td>
    <td>${formatAmount(progress.actualSpent)}</td>
    <td>${balanceMarkup}</td>
    <td>
      <div class="limits-table__usage">
        <div
          class="limits-table__progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${Math.min(progress.usagePercent, 100)}"
          aria-label="Использование лимита ${escapeHtml(progress.name)}"
        >
          <span class="limits-table__progress-bar" style="width: ${Math.min(progress.usagePercent, 100)}%"></span>
        </div>
        <span class="limits-table__percent">${progress.usagePercent}%</span>
      </div>
    </td>
    <td class="limits-table__actions">
      <button type="button" class="btn btn--secondary" data-action="edit-limit" data-limit-id="${escapeHtml(limit.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-limit" data-limit-id="${escapeHtml(limit.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

function openAddLimitModal() {
  const form = createLimitForm();
  const dialog = openModal({
    title: 'Добавить лимит',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="limitType"]')?.focus();
  return dialog;
}

function openEditLimitModal(limitId) {
  const state = getAppState();
  const limit = state.currentBudget.limits.find((item) => item.id === limitId);

  if (!limit) {
    showNotification({
      type: 'info',
      message: 'Лимит не найден.',
    });
    return null;
  }

  const form = createLimitForm(limit);
  const dialog = openModal({
    title: 'Изменить лимит',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="amount"]')?.focus();
  return dialog;
}

function createLimitForm(limit = null) {
  const state = getAppState();
  const categories = getLimitCategories(state);
  const articles = getLimitArticles(state);
  const isEdit = Boolean(limit);
  const form = document.createElement('form');
  form.className = 'limits-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="limit-type">Тип лимита</label>
      <select class="form-field__input" id="limit-type" name="limitType" required ${isEdit ? 'disabled' : ''}>
        ${renderLimitTypeOptions(limit?.limitType)}
      </select>
      ${isEdit ? `<input type="hidden" name="limitType" value="${escapeHtml(limit.limitType)}">` : ''}
      <p class="form-field__error" data-error-for="limitType" hidden></p>
    </div>
    <div class="form-field" data-target-field="category" hidden>
      <label class="form-field__label" for="limit-category">Категория</label>
      <select class="form-field__input" id="limit-category" name="categoryTargetId" ${isEdit ? 'disabled' : ''}>
        ${renderSelectOptions(categories, 'Выберите категорию')}
      </select>
      ${isEdit && limit.limitType === LIMIT_TYPES.CATEGORY ? `<input type="hidden" name="categoryTargetId" value="${escapeHtml(limit.targetId)}">` : ''}
      <p class="form-field__error" data-error-for="categoryTargetId" hidden></p>
    </div>
    <div class="form-field" data-target-field="article" hidden>
      <label class="form-field__label" for="limit-article">Статья</label>
      <select class="form-field__input" id="limit-article" name="articleTargetId" ${isEdit ? 'disabled' : ''}>
        ${renderSelectOptions(articles, 'Выберите статью')}
      </select>
      ${isEdit && limit.limitType === LIMIT_TYPES.ARTICLE ? `<input type="hidden" name="articleTargetId" value="${escapeHtml(limit.targetId)}">` : ''}
      <p class="form-field__error" data-error-for="articleTargetId" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="limit-amount">Сумма лимита</label>
      <input class="form-field__input" type="number" id="limit-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="amount" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-limit">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (limit) {
    form.querySelector('#limit-amount').value = String(limit.amount);

    if (limit.limitType === LIMIT_TYPES.CATEGORY) {
      form.querySelector('#limit-category').value = limit.targetId;
    }

    if (limit.limitType === LIMIT_TYPES.ARTICLE) {
      form.querySelector('#limit-article').value = limit.targetId;
    }
  }

  if (isEdit) {
    form.dataset.limitId = limit.id;
    form.dataset.editMode = 'true';
  }

  const limitTypeField = form.querySelector('#limit-type');
  limitTypeField?.addEventListener('change', () => {
    updateTargetFieldsVisibility(form);
  });

  updateTargetFieldsVisibility(form, { preserveValues: isEdit });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleLimitFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-limit"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function updateTargetFieldsVisibility(form, { preserveValues = false } = {}) {
  const isEdit = form.dataset.editMode === 'true';
  const limitType = form.querySelector('[name="limitType"]:not([type="hidden"])')?.value
    ?? form.querySelector('[name="limitType"][type="hidden"]')?.value
    ?? '';

  const categoryField = form.querySelector('[data-target-field="category"]');
  const articleField = form.querySelector('[data-target-field="article"]');
  const categorySelect = form.querySelector('#limit-category');
  const articleSelect = form.querySelector('#limit-article');

  if (limitType === LIMIT_TYPES.CATEGORY) {
    categoryField.hidden = false;
    articleField.hidden = true;

    if (!isEdit) {
      categorySelect?.removeAttribute('disabled');
    }

    articleSelect?.setAttribute('disabled', 'disabled');
    articleSelect?.removeAttribute('required');

    if (!preserveValues) {
      articleSelect.value = '';
    }

    categorySelect?.setAttribute('required', 'required');
    return;
  }

  if (limitType === LIMIT_TYPES.ARTICLE) {
    categoryField.hidden = true;
    articleField.hidden = false;

    categorySelect?.setAttribute('disabled', 'disabled');
    categorySelect?.removeAttribute('required');

    if (!preserveValues) {
      categorySelect.value = '';
    }

    if (!isEdit) {
      articleSelect?.removeAttribute('disabled');
    }

    articleSelect?.setAttribute('required', 'required');
    return;
  }

  categoryField.hidden = true;
  articleField.hidden = true;
  categorySelect?.setAttribute('disabled', 'disabled');
  articleSelect?.setAttribute('disabled', 'disabled');
  categorySelect?.removeAttribute('required');
  articleSelect?.removeAttribute('required');
}

function handleLimitFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const limitType = String(formData.get('limitType') ?? '').trim();
  const targetId = limitType === LIMIT_TYPES.CATEGORY
    ? String(formData.get('categoryTargetId') ?? '').trim()
    : String(formData.get('articleTargetId') ?? '').trim();
  const amount = String(formData.get('amount') ?? '').trim();
  const limitId = form.dataset.limitId ?? null;

  const errors = validateLimitForm({ limitType, targetId, amount, limitId });

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  const now = new Date().toISOString();

  if (limitId) {
    updateAppState((state) => {
      const index = state.currentBudget.limits.findIndex((item) => item.id === limitId);

      if (index === -1) {
        return state;
      }

      state.currentBudget.limits[index] = {
        ...state.currentBudget.limits[index],
        amount: Number(amount),
        updatedAt: now,
      };

      return state;
    });

    closeModal();
    renderLimitsList();
    showNotification({
      type: 'info',
      message: 'Лимит изменён.',
    });
    return;
  }

  const limit = {
    ...createLimitShape(),
    id: generateId('limit'),
    limitType,
    targetId,
    amount: Number(amount),
    createdAt: now,
    updatedAt: now,
  };

  updateAppState((state) => {
    state.currentBudget.limits.push(limit);
    return state;
  });

  closeModal();
  renderLimitsList();
  showNotification({
    type: 'info',
    message: 'Лимит добавлен.',
  });
}

function validateLimitForm({ limitType, targetId, amount, limitId }) {
  const errors = {};
  const state = getAppState();
  const categories = getLimitCategories(state);
  const articles = getLimitArticles(state);
  const categoryIds = new Set(categories.map((item) => item.id));
  const articleIds = new Set(articles.map((item) => item.id));
  const limits = state.currentBudget.limits ?? [];

  if (!limitType || ![LIMIT_TYPES.CATEGORY, LIMIT_TYPES.ARTICLE].includes(limitType)) {
    errors.limitType = 'Выберите тип лимита.';
  }

  if (limitType === LIMIT_TYPES.CATEGORY) {
    if (!targetId) {
      errors.categoryTargetId = 'Выберите категорию.';
    } else if (!categoryIds.has(targetId)) {
      errors.categoryTargetId = 'Доступны только категории «Обязательные» и «Для души».';
    }
  }

  if (limitType === LIMIT_TYPES.ARTICLE) {
    if (!targetId) {
      errors.articleTargetId = 'Выберите статью из справочника.';
    } else if (!articleIds.has(targetId)) {
      errors.articleTargetId = 'Выберите статью из существующего справочника.';
    }
  }

  const parsedAmount = Number(amount);

  if (!amount) {
    errors.amount = 'Укажите сумму лимита.';
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Сумма лимита должна быть больше нуля.';
  }

  if (limitType && targetId && hasDuplicateLimit(limits, limitType, targetId, limitId)) {
    const duplicateMessage = limitType === LIMIT_TYPES.CATEGORY
      ? 'Лимит для этой категории уже установлен.'
      : 'Лимит для этой статьи уже установлен.';

    if (limitType === LIMIT_TYPES.CATEGORY) {
      errors.categoryTargetId = duplicateMessage;
    } else {
      errors.articleTargetId = duplicateMessage;
    }
  }

  return errors;
}

function hasDuplicateLimit(limits, limitType, targetId, excludeId = null) {
  return limits.some((limit) => (
    limit.id !== excludeId
    && limit.limitType === limitType
    && limit.targetId === targetId
  ));
}

function handleDeleteLimit(limitId) {
  const state = getAppState();
  const limit = state.currentBudget.limits.find((item) => item.id === limitId);

  if (!limit) {
    showNotification({
      type: 'info',
      message: 'Лимит не найден.',
    });
    return;
  }

  const progress = calculateLimitProgress(limit, state);
  const confirmed = window.confirm(`Удалить лимит «${progress.name}»?`);

  if (!confirmed) {
    return;
  }

  updateAppState((draft) => {
    draft.currentBudget.limits = draft.currentBudget.limits.filter((item) => item.id !== limitId);
    return draft;
  });

  renderLimitsList();
  showNotification({
    type: 'info',
    message: 'Лимит удалён.',
  });
}

function renderLimitTypeOptions(selectedValue = '') {
  const options = ['<option value="">Выберите тип</option>'];

  LIMIT_TYPE_OPTIONS.forEach(({ value, label }) => {
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

function compareLimitsByName(first, second) {
  const state = getAppState();
  const firstName = calculateLimitProgress(first, state).name;
  const secondName = calculateLimitProgress(second, state).name;

  return firstName.localeCompare(secondName, 'ru');
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
    const inputElement = form.querySelector(`[name="${fieldName}"]:not([type="hidden"])`);

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
