/**
 * Модуль раздела «Мои средства» (раздел 14 ТЗ).
 * Учёт денежных активов независимо от доходов и расходов.
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification } from './notifications.js';
import {
  ACCOUNT_PURPOSES,
  ACCOUNT_TYPES,
  buildAccountFromPayload,
  calculateAssetsTotalsByPurpose,
  calculateAssetsTotalsByType,
  calculateTotalFunds,
  getAccountPurposeLabel,
  getAccountTypeLabel,
  validateAccountPayload,
} from './state.js';

const WORKSPACE_ID = 'assets-workspace';

const ACCOUNT_TYPE_OPTIONS = [
  { value: ACCOUNT_TYPES.BANK_ACCOUNT, label: 'Банковский счёт' },
  { value: ACCOUNT_TYPES.CARD, label: 'Банковская карта' },
  { value: ACCOUNT_TYPES.DEPOSIT, label: 'Вклад' },
  { value: ACCOUNT_TYPES.CASH, label: 'Наличные' },
  { value: ACCOUNT_TYPES.CUSTOM, label: 'Пользовательский счёт' },
];

const ACCOUNT_PURPOSE_OPTIONS = [
  { value: ACCOUNT_PURPOSES.CURRENT, label: 'Текущие средства' },
  { value: ACCOUNT_PURPOSES.RESERVE, label: 'Финансовые запасы' },
];

let workspace = null;
let stateUpdateListenerAttached = false;
let showDisabled = true;

function getWorkspace() {
  return document.getElementById(WORKSPACE_ID) ?? getSectionRegion('assets');
}

/**
 * Инициализирует раздел «Мои средства».
 */
export function initAssets() {
  workspace = getWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');
  attachStateUpdateListener();
  ensureLayout();

  if (isStateInitialized()) {
    renderAssetsSection();
  }
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      renderAssetsSection();
    }
  });

  stateUpdateListenerAttached = true;
}

function ensureLayout() {
  if (!workspace || workspace.querySelector('.assets')) {
    return;
  }

  workspace.append(createLayout());
  bindControls();
}

function createLayout() {
  const container = document.createElement('div');
  container.className = 'assets';

  container.innerHTML = `
    <div class="assets__summary" data-assets-summary role="region" aria-label="Сводка по средствам"></div>
    <div class="assets__toolbar">
      <button type="button" class="btn btn--primary" data-action="add-account">
        Добавить средство
      </button>
      <label class="assets__show-disabled">
        <input type="checkbox" id="assets-show-disabled" checked>
        Показывать отключённые
      </label>
    </div>
    <div class="assets__list" data-assets-list role="region" aria-label="Список средств"></div>
  `;

  return container;
}

function bindControls() {
  workspace.querySelector('#assets-show-disabled')?.addEventListener('change', (event) => {
    showDisabled = Boolean(event.target.checked);
    renderAssetsList();
  });
}

function handleAssetsClick(event) {
  const addButton = event.target.closest('[data-action="add-account"]');

  if (addButton) {
    initAssets();
    openAddAccountModal();
    event.preventDefault();
    return;
  }

  const editButton = event.target.closest('[data-action="edit-account"]');

  if (editButton?.dataset.accountId) {
    initAssets();
    openEditAccountModal(editButton.dataset.accountId);
    event.preventDefault();
    return;
  }

  const toggleButton = event.target.closest('[data-action="toggle-account"]');

  if (toggleButton?.dataset.accountId) {
    initAssets();
    handleToggleAccount(toggleButton.dataset.accountId);
    event.preventDefault();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-account"]');

  if (deleteButton?.dataset.accountId) {
    initAssets();
    handleDeleteAccount(deleteButton.dataset.accountId);
    event.preventDefault();
  }
}

document.addEventListener('click', handleAssetsClick);

function renderAssetsSection() {
  workspace = getWorkspace();
  ensureLayout();
  renderAssetsSummary();
  renderAssetsList();
}

function renderAssetsSummary() {
  const summaryRegion = workspace?.querySelector('[data-assets-summary]');

  if (!summaryRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const totalsByPurpose = calculateAssetsTotalsByPurpose(state);
  const totalsByType = calculateAssetsTotalsByType(state);
  const currentFunds = totalsByPurpose[ACCOUNT_PURPOSES.CURRENT] ?? 0;
  const reserveFunds = totalsByPurpose[ACCOUNT_PURPOSES.RESERVE] ?? 0;
  const totalFunds = totalsByPurpose.total ?? calculateTotalFunds(state);
  const activeCount = state.myAssets.accounts.filter((account) => !account.isHidden).length;

  const typeRows = ACCOUNT_TYPE_OPTIONS
    .map(({ value, label }) => ({ value, label, amount: totalsByType[value] ?? 0 }))
    .filter(({ amount }) => amount !== 0)
    .map(({ label, amount }) => `
      <li class="assets-summary__type-item">
        <span class="assets-summary__type-label">${escapeHtml(label)}</span>
        <span class="assets-summary__type-amount">${formatAmount(amount)}</span>
      </li>
    `)
    .join('');

  summaryRegion.innerHTML = `
    <article class="assets-summary">
      <div class="assets-summary__metrics" role="group" aria-label="Итоги по назначению средств">
        <div class="assets-summary__metric">
          <p class="assets-summary__label">Текущие средства</p>
          <p class="assets-summary__value assets-summary__value--secondary">${formatAmount(currentFunds)}</p>
        </div>
        <div class="assets-summary__metric">
          <p class="assets-summary__label">Финансовые запасы</p>
          <p class="assets-summary__value assets-summary__value--secondary">${formatAmount(reserveFunds)}</p>
        </div>
        <div class="assets-summary__metric assets-summary__metric--total">
          <p class="assets-summary__label">Общие средства</p>
          <p class="assets-summary__value">${formatAmount(totalFunds)}</p>
          <p class="assets-summary__meta">Активных средств: ${activeCount}</p>
        </div>
      </div>
      ${typeRows ? `
        <ul class="assets-summary__types" aria-label="Суммы по типам средств">
          ${typeRows}
        </ul>
      ` : ''}
    </article>
  `;
}

function getVisibleAccounts() {
  const accounts = [...(getAppState().myAssets?.accounts ?? [])];

  accounts.sort((first, second) => String(first.name ?? '').localeCompare(String(second.name ?? ''), 'ru'));

  if (!showDisabled) {
    return accounts.filter((account) => !account.isHidden);
  }

  return accounts;
}

function renderAssetsList() {
  workspace = getWorkspace();
  ensureLayout();

  const listRegion = workspace?.querySelector('[data-assets-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const accounts = getVisibleAccounts();

  listRegion.replaceChildren();

  if (accounts.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'assets__empty';
    emptyState.textContent = showDisabled
      ? 'Средства пока не добавлены. Нажмите «Добавить средство», чтобы учесть банковский счёт, карту, вклад или наличные.'
      : 'Нет активных средств. Включите отображение отключённых или добавьте новое средство.';
    listRegion.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'assets-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Название</th>
        <th scope="col">Тип</th>
        <th scope="col">Назначение</th>
        <th scope="col">Сумма</th>
        <th scope="col">Статус</th>
        <th scope="col">Комментарий</th>
        <th scope="col">Действия</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  accounts.forEach((account) => {
    tbody.append(createAccountRow(account));
  });

  listRegion.append(table);
}

function createAccountRow(account) {
  const row = document.createElement('tr');
  row.className = 'assets-table__row';

  if (account.isHidden) {
    row.classList.add('assets-table__row--disabled');
  }

  const statusLabel = account.isHidden ? 'Отключено' : 'Активно';
  const toggleLabel = account.isHidden ? 'Включить' : 'Отключить';
  const comment = String(account.comment ?? '').trim();

  row.innerHTML = `
    <td class="assets-table__name">${escapeHtml(account.name)}</td>
    <td>${escapeHtml(getAccountTypeLabel(account.accountType))}</td>
    <td>${escapeHtml(getAccountPurposeLabel(account.purpose))}</td>
    <td class="assets-table__amount">${formatAmount(account.balance)}</td>
    <td>
      <span class="assets-table__status ${account.isHidden ? 'assets-table__status--disabled' : 'assets-table__status--active'}">
        ${statusLabel}
      </span>
    </td>
    <td class="assets-table__comment">${comment ? escapeHtml(comment) : '—'}</td>
    <td class="assets-table__actions">
      <button type="button" class="btn btn--secondary" data-action="edit-account" data-account-id="${escapeHtml(account.id)}">
        Изменить
      </button>
      <button type="button" class="btn btn--secondary" data-action="toggle-account" data-account-id="${escapeHtml(account.id)}">
        ${toggleLabel}
      </button>
      <button type="button" class="btn btn--secondary" data-action="delete-account" data-account-id="${escapeHtml(account.id)}">
        Удалить
      </button>
    </td>
  `;

  return row;
}

function openAddAccountModal() {
  const form = createAccountForm();
  const dialog = openModal({
    title: 'Добавить средство',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="name"]')?.focus();
  return dialog;
}

function openEditAccountModal(accountId) {
  const account = getAppState().myAssets.accounts.find((item) => item.id === accountId);

  if (!account) {
    showNotification({
      type: 'info',
      message: 'Средство не найдено.',
    });
    return null;
  }

  const form = createAccountForm(account);
  const dialog = openModal({
    title: 'Изменить средство',
    content: form,
  });

  if (!dialog) {
    return null;
  }

  form.querySelector('[name="name"]')?.focus();
  return dialog;
}

function createAccountForm(account = null) {
  const isEdit = Boolean(account);
  const form = document.createElement('form');
  form.className = 'assets-form';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="account-name">Название</label>
      <input class="form-field__input" type="text" id="account-name" name="name" maxlength="120" required autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="account-type">Тип</label>
      <select class="form-field__input" id="account-type" name="accountType" required>
        <option value="">Выберите тип</option>
        ${ACCOUNT_TYPE_OPTIONS.map(({ value, label }) => `
          <option value="${escapeHtml(value)}">${escapeHtml(label)}</option>
        `).join('')}
      </select>
      <p class="form-field__error" data-error-for="accountType" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="account-purpose">Назначение средства</label>
      <select class="form-field__input" id="account-purpose" name="purpose" required>
        ${ACCOUNT_PURPOSE_OPTIONS.map(({ value, label }) => `
          <option value="${escapeHtml(value)}">${escapeHtml(label)}</option>
        `).join('')}
      </select>
      <p class="form-field__error" data-error-for="purpose" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="account-balance">Текущая сумма</label>
      <input class="form-field__input" type="number" id="account-balance" name="balance" step="0.01" inputmode="decimal" required>
      <p class="form-field__error" data-error-for="balance" hidden></p>
    </div>
    <div class="form-field">
      <label class="form-field__label" for="account-comment">Комментарий</label>
      <textarea class="form-field__input form-field__textarea" id="account-comment" name="comment" rows="3" maxlength="500"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-account">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Изменить' : 'Добавить'}</button>
    </div>
  `;

  if (account) {
    form.querySelector('#account-name').value = account.name;
    form.querySelector('#account-type').value = account.accountType ?? '';
    form.querySelector('#account-purpose').value = account.purpose ?? ACCOUNT_PURPOSES.CURRENT;
    form.querySelector('#account-balance').value = String(account.balance);
    form.querySelector('#account-comment').value = account.comment ?? '';
    form.dataset.accountId = account.id;
  } else {
    form.querySelector('#account-purpose').value = ACCOUNT_PURPOSES.CURRENT;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleAccountFormSubmit(form);
  });

  form.querySelector('[data-action="cancel-account"]').addEventListener('click', () => {
    closeModal();
  });

  return form;
}

function handleAccountFormSubmit(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    accountType: formData.get('accountType'),
    purpose: formData.get('purpose'),
    balance: formData.get('balance'),
    comment: formData.get('comment'),
  };
  const accountId = form.dataset.accountId ?? null;
  const errors = validateAccountPayload(payload);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  if (accountId) {
    updateAppState((state) => {
      const index = state.myAssets.accounts.findIndex((item) => item.id === accountId);

      if (index === -1) {
        return state;
      }

      state.myAssets.accounts[index] = buildAccountFromPayload(
        payload,
        state.myAssets.accounts[index],
      );

      return state;
    });

    closeModal();
    showNotification({
      type: 'info',
      message: 'Средство изменено.',
    });
    return;
  }

  const account = buildAccountFromPayload(payload);

  updateAppState((state) => {
    state.myAssets.accounts.push(account);
    return state;
  });

  closeModal();
  showNotification({
    type: 'info',
    message: 'Средство добавлено.',
  });
}

function handleToggleAccount(accountId) {
  const account = getAppState().myAssets.accounts.find((item) => item.id === accountId);

  if (!account) {
    showNotification({
      type: 'info',
      message: 'Средство не найдено.',
    });
    return;
  }

  const nextHidden = !account.isHidden;

  updateAppState((state) => {
    const index = state.myAssets.accounts.findIndex((item) => item.id === accountId);

    if (index === -1) {
      return state;
    }

    state.myAssets.accounts[index] = {
      ...state.myAssets.accounts[index],
      isHidden: nextHidden,
      updatedAt: new Date().toISOString(),
    };

    return state;
  });

  showNotification({
    type: 'info',
    message: nextHidden ? 'Средство отключено.' : 'Средство включено.',
  });
}

function handleDeleteAccount(accountId) {
  const account = getAppState().myAssets.accounts.find((item) => item.id === accountId);

  if (!account) {
    showNotification({
      type: 'info',
      message: 'Средство не найдено.',
    });
    return;
  }

  const confirmed = window.confirm(`Удалить средство «${account.name}»? Ранее сохранённые снимки капитала не будут изменены.`);

  if (!confirmed) {
    return;
  }

  updateAppState((state) => {
    state.myAssets.accounts = state.myAssets.accounts.filter((item) => item.id !== accountId);
    return state;
  });

  showNotification({
    type: 'info',
    message: 'Средство удалено.',
  });
}

function clearFormErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((element) => {
    element.textContent = '';
    element.hidden = true;
  });

  form.querySelectorAll('.form-field__input--error').forEach((element) => {
    element.classList.remove('form-field__input--error');
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

    inputElement?.classList.add('form-field__input--error');
  });
}

function formatAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return '—';
  }

  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₽`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
