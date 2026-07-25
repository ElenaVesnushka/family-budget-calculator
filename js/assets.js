/**
 * Модуль раздела «Мои средства» (раздел 14 ТЗ).
 * Учёт денежных активов независимо от доходов и расходов.
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification, syncNotificationsByPrefix } from './notifications.js?v=20260725-12';
import {
  ACCOUNT_PURPOSES,
  ACCOUNT_TYPES,
  buildAccountFromPayload,
  buildAssetsSnapshotFromState,
  calculateAssetsTotalsByPurpose,
  calculateAssetsTotalsByType,
  calculateSnapshotAmountChange,
  calculateTotalFunds,
  findAssetsSnapshotByDate,
  formatIsoDate,
  getAccountPurposeLabel,
  getAccountTypeLabel,
  getPreviousAssetsSnapshot,
  getSortedAssetsSnapshots,
  isAssetsSnapshotReminderDue,
  validateAccountPayload,
} from './state.js';

const SNAPSHOT_REMINDER_PREFIX = 'reminder-assets-snapshot';
const SNAPSHOT_REMINDER_ID = 'reminder-assets-snapshot-due';

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
      <button type="button" class="btn btn--secondary" data-action="create-snapshot">
        Сделать снимок
      </button>
      <label class="assets__show-disabled">
        <input type="checkbox" id="assets-show-disabled" checked>
        Показывать отключённые
      </label>
    </div>
    <div class="assets__list" data-assets-list role="region" aria-label="Список средств"></div>
    <section class="assets-snapshots" data-assets-snapshots aria-labelledby="assets-snapshots-title">
      <h3 class="assets-snapshots__title" id="assets-snapshots-title">История ежемесячных снимков</h3>
      <p class="assets-snapshots__hint">Снимки фиксируют состояние средств на выбранную дату и не изменяются при дальнейших правках.</p>
      <div class="assets-snapshots__list" data-assets-snapshots-list></div>
    </section>
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
    return;
  }

  const snapshotButton = event.target.closest('[data-action="create-snapshot"]');

  if (snapshotButton) {
    initAssets();
    openCreateSnapshotModal();
    event.preventDefault();
  }
}

document.addEventListener('click', handleAssetsClick);

function renderAssetsSection() {
  workspace = getWorkspace();
  ensureLayout();
  renderAssetsSummary();
  renderAssetsList();
  renderSnapshotsHistory();
}

/**
 * Reminder о ежемесячном снимке средств в общей панели уведомлений.
 */
export function syncAssetsSnapshotReminders() {
  if (!isStateInitialized()) {
    return;
  }

  const items = isAssetsSnapshotReminderDue(getAppState())
    ? [{
      id: SNAPSHOT_REMINDER_ID,
      type: 'reminder',
      message: 'Пора зафиксировать ежемесячный снимок средств. Создайте снимок в разделе «Мои средства».',
    }]
    : [];

  syncNotificationsByPrefix(SNAPSHOT_REMINDER_PREFIX, items);
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
  const latestSnapshot = getSortedAssetsSnapshots(state)[0] ?? null;
  const totalChange = latestSnapshot
    ? calculateSnapshotAmountChange(totalFunds, latestSnapshot.totalAmount)
    : { absolute: null, percent: null };

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
          ${latestSnapshot ? `
            <p class="assets-summary__meta">
              К последнему снимку (${formatDisplayDate(latestSnapshot.date)}): ${formatChange(totalChange)}
            </p>
          ` : ''}
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
        <th scope="col">К снимку</th>
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
  const latestSnapshot = getSortedAssetsSnapshots(getAppState())[0] ?? null;
  const previousBalance = latestSnapshot?.accountBalances?.find((item) => item.accountId === account.id)?.balance;
  const change = calculateSnapshotAmountChange(account.balance, previousBalance);

  row.innerHTML = `
    <td class="assets-table__name">${escapeHtml(account.name)}</td>
    <td>${escapeHtml(getAccountTypeLabel(account.accountType))}</td>
    <td>${escapeHtml(getAccountPurposeLabel(account.purpose))}</td>
    <td class="assets-table__amount">${formatAmount(account.balance)}</td>
    <td class="assets-table__change">${latestSnapshot ? formatChange(change) : '—'}</td>
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

function openCreateSnapshotModal() {
  const form = document.createElement('form');
  form.className = 'assets-form';
  form.noValidate = true;
  form.innerHTML = `
    <p class="assets-form__intro">Снимок сохранит текущие остатки активных средств. Текущие суммы при этом не изменятся.</p>
    <div class="form-field">
      <label class="form-field__label" for="snapshot-date">Дата снимка</label>
      <input class="form-field__input" type="date" id="snapshot-date" name="date" required value="${formatIsoDate(new Date())}">
      <p class="form-field__error" data-error-for="date" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-snapshot">Отмена</button>
      <button type="submit" class="btn btn--primary">Сохранить снимок</button>
    </div>
  `;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleCreateSnapshotSubmit(form);
  });

  form.querySelector('[data-action="cancel-snapshot"]').addEventListener('click', () => {
    closeModal();
  });

  openModal({
    title: 'Ежемесячный снимок средств',
    content: form,
  });
}

function handleCreateSnapshotSubmit(form) {
  clearFormErrors(form);

  const date = String(new FormData(form).get('date') ?? '').trim();

  if (!date) {
    showFormErrors(form, { date: 'Укажите дату снимка.' });
    return;
  }

  const existing = findAssetsSnapshotByDate(getAppState(), date);

  if (existing) {
    openReplaceSnapshotConfirm(date);
    return;
  }

  persistAssetsSnapshot(date, { replaced: false });
}

function openReplaceSnapshotConfirm(date) {
  const content = document.createElement('div');
  content.className = 'assets-snapshot-confirm';
  content.innerHTML = `
    <p class="assets-snapshot-confirm__message">Снимок на выбранную дату уже существует.</p>
    <p class="assets-snapshot-confirm__message">Новый снимок заменит предыдущий.</p>
    <p class="assets-snapshot-confirm__message">Продолжить?</p>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-replace-snapshot">Отмена</button>
      <button type="button" class="btn btn--primary" data-action="confirm-replace-snapshot">Заменить снимок</button>
    </div>
  `;

  content.querySelector('[data-action="cancel-replace-snapshot"]').addEventListener('click', () => {
    closeModal();
  });

  content.querySelector('[data-action="confirm-replace-snapshot"]').addEventListener('click', () => {
    persistAssetsSnapshot(date, { replaced: true });
  });

  openModal({
    title: 'Подтверждение',
    content,
  });
}

function persistAssetsSnapshot(date, { replaced = false } = {}) {
  updateAppState((draft) => {
    const snapshot = buildAssetsSnapshotFromState(draft, date);
    draft.myAssets.snapshots = (draft.myAssets.snapshots ?? []).filter((item) => item.date !== date);
    draft.myAssets.snapshots.push(snapshot);
    return draft;
  });

  closeModal();
  showNotification({
    type: 'info',
    message: replaced ? 'Снимок средств заменён.' : 'Снимок средств сохранён.',
  });
}

function renderSnapshotsHistory() {
  const listRegion = workspace?.querySelector('[data-assets-snapshots-list]');

  if (!listRegion || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const snapshots = getSortedAssetsSnapshots(state);

  listRegion.replaceChildren();

  if (snapshots.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'assets__empty';
    empty.textContent = 'Снимков пока нет. Нажмите «Сделать снимок», чтобы зафиксировать состояние средств.';
    listRegion.append(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'assets-snapshots__items';

  snapshots.forEach((snapshot) => {
    const previous = getPreviousAssetsSnapshot(state, snapshot);
    const totalChange = calculateSnapshotAmountChange(snapshot.totalAmount, previous?.totalAmount);
    const item = document.createElement('li');
    item.className = 'assets-snapshots__item';

    const accountsMarkup = (snapshot.accountBalances ?? []).map((account) => {
      const previousBalance = previous?.accountBalances?.find((entry) => entry.accountId === account.accountId)?.balance;
      const change = calculateSnapshotAmountChange(account.balance, previousBalance);

      return `
        <li class="assets-snapshots__account">
          <span class="assets-snapshots__account-name">${escapeHtml(account.name || 'Средство')}</span>
          <span class="assets-snapshots__account-purpose">${escapeHtml(getAccountPurposeLabel(account.purpose))}</span>
          <span class="assets-snapshots__account-amount">${formatAmount(account.balance)}</span>
          <span class="assets-snapshots__account-change">${previous ? formatChange(change) : '—'}</span>
        </li>
      `;
    }).join('');

    item.innerHTML = `
      <header class="assets-snapshots__item-header">
        <h4 class="assets-snapshots__item-title">${formatDisplayDate(snapshot.date)}</h4>
        <p class="assets-snapshots__item-total">${formatAmount(snapshot.totalAmount)}</p>
      </header>
      <p class="assets-snapshots__item-meta">
        Текущие: ${formatAmount(snapshot.currentFunds)} · Запасы: ${formatAmount(snapshot.reserveFunds)}
        ${previous ? ` · К предыдущему: ${formatChange(totalChange)}` : ''}
      </p>
      ${accountsMarkup ? `
        <ul class="assets-snapshots__accounts">
          ${accountsMarkup}
        </ul>
      ` : '<p class="assets-snapshots__item-meta">Активных средств на дату снимка не было.</p>'}
    `;

    list.append(item);
  });

  listRegion.append(list);
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

function formatChange(change) {
  if (!change || change.absolute == null || !Number.isFinite(change.absolute)) {
    return '—';
  }

  const sign = change.absolute > 0 ? '+' : '';
  const absoluteText = `${sign}${formatAmount(change.absolute)}`;

  if (change.percent == null || !Number.isFinite(change.percent)) {
    return absoluteText;
  }

  const percentSign = change.percent > 0 ? '+' : '';
  return `${absoluteText} (${percentSign}${change.percent}%)`;
}

function formatDisplayDate(dateString) {
  if (!dateString) {
    return '—';
  }

  const [year, month, day] = String(dateString).split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}.${month}.${year}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
