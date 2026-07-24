/**
 * Модуль раздела «Финансовая подушка» и «Мой запас» (раздел 13 ТЗ).
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import { showNotification, hideNotification } from './notifications.js';
import {
  CUSHION_CALCULATION_METHODS,
  buildFinancialCushionFromPayload,
  calculateFinancialReserveSnapshot,
  calculateMyReserve,
  getCushionMethodLabel,
  validateFinancialCushionPayload,
} from './state.js';

const WORKSPACE_ID = 'cushion-workspace';

const CUSHION_METHOD_OPTIONS = [
  { value: CUSHION_CALCULATION_METHODS.FIXED, label: 'Фиксированная сумма' },
  { value: CUSHION_CALCULATION_METHODS.INCOME_PERCENT, label: 'Процент от доходов' },
  { value: CUSHION_CALCULATION_METHODS.ASSETS_PERCENT, label: 'Процент от общих средств' },
];

let workspace = null;
let stateUpdateListenerAttached = false;
let previousMyReserve = null;

function getWorkspace() {
  return document.getElementById(WORKSPACE_ID) ?? getSectionRegion('cushion');
}

/**
 * Инициализирует раздел «Финансовая подушка».
 */
export function initCushion() {
  workspace = getWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');
  attachStateUpdateListener();
  ensureLayout();

  if (isStateInitialized()) {
    renderCushionSection();
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
  if (isStateInitialized()) {
    syncReserveWarnings();
  }

  if (workspace && isStateInitialized()) {
    renderCushionSection();
  }
}

/**
 * Синхронизирует предупреждения по показателю «Мой запас» (раздел 13 и 17 ТЗ).
 */
export function syncReserveWarnings() {
  if (!isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const myReserve = calculateMyReserve(state);

  hideNotification('reserve-negative');
  hideNotification('reserve-decreasing');

  if (!state.financialCushion?.enabled) {
    previousMyReserve = myReserve;
    return;
  }

  if (myReserve < 0) {
    showNotification({
      id: 'reserve-negative',
      type: 'warning',
      message: 'Объём общих средств меньше установленной финансовой подушки. Возможно, стоит пересмотреть расходы или изменить размер финансовой подушки.',
    });
  } else if (
    previousMyReserve !== null
    && myReserve < previousMyReserve
    && previousMyReserve > 0
  ) {
    showNotification({
      id: 'reserve-decreasing',
      type: 'warning',
      message: 'Показатель «Мой запас» уменьшается. Проверьте запланированные расходы.',
    });
  }

  previousMyReserve = myReserve;
}

function ensureLayout() {
  if (!workspace || workspace.querySelector('.cushion')) {
    return;
  }

  workspace.append(createLayout());
}

function createLayout() {
  const container = document.createElement('div');
  container.className = 'cushion';

  container.innerHTML = `
    <div class="cushion__overview" data-cushion-overview role="region" aria-label="Показатели финансовой подушки и запаса"></div>
    <div class="cushion__settings" data-cushion-settings role="region" aria-label="Настройки финансовой подушки"></div>
  `;

  return container;
}

function renderCushionSection() {
  workspace = getWorkspace();
  ensureLayout();

  renderOverview();
  renderSettings();
}

function renderOverview() {
  const region = workspace?.querySelector('[data-cushion-overview]');

  if (!region || !isStateInitialized()) {
    return;
  }

  const snapshot = calculateFinancialReserveSnapshot(getAppState());
  const reserveClass = snapshot.myReserve < 0 ? 'cushion-metric--negative' : 'cushion-metric--positive';

  region.innerHTML = `
    <div class="cushion-overview">
      <article class="cushion-overview__card cushion-overview__card--primary">
        <p class="cushion-overview__label">Мой запас</p>
        <p class="cushion-overview__value ${reserveClass}">${formatAmount(snapshot.myReserve)}</p>
        <p class="cushion-overview__hint">
          ${snapshot.cushion.enabled
    ? 'Средства сверх минимального безопасного уровня'
    : 'Финансовая подушка отключена — «Мой запас» равен общим средствам'}
        </p>
      </article>
      <article class="cushion-overview__card">
        <p class="cushion-overview__label">Общие средства</p>
        <p class="cushion-overview__value">${formatAmount(snapshot.totalFunds)}</p>
        <p class="cushion-overview__hint">
          Текущие: ${formatAmount(snapshot.currentFunds)} · Запасы: ${formatAmount(snapshot.reserveFunds)}
        </p>
      </article>
      ${snapshot.cushion.enabled ? renderProgressBlock(snapshot) : `
        <article class="cushion-overview__card cushion-overview__card--muted">
          <p class="cushion-overview__label">Финансовая подушка</p>
          <p class="cushion-overview__value">Отключена</p>
          <p class="cushion-overview__hint">Включите подушку, чтобы задать минимальный безопасный уровень средств</p>
        </article>
      `}
    </div>
  `;
}

function renderProgressBlock(snapshot) {
  const methodHint = snapshot.cushion.calculationMethod === CUSHION_CALCULATION_METHODS.INCOME_PERCENT
    ? `<p class="cushion-overview__hint">Доходы текущего периода: ${formatAmount(snapshot.periodIncomesTotal)}</p>`
    : '';

  return `
    <article class="cushion-overview__card">
      <p class="cushion-overview__label">Финансовая подушка</p>
      <p class="cushion-overview__value">${formatAmount(snapshot.targetAmount)}</p>
      <p class="cushion-overview__hint">Минимальный безопасный уровень · ${escapeHtml(getCushionMethodLabel(snapshot.cushion.calculationMethod))}</p>
      ${methodHint}
      <div class="cushion-progress">
        <div class="cushion-progress__header">
          <span>Покрытие уровня: ${formatAmount(snapshot.currentCoverage)}</span>
          <span>${Math.round(snapshot.achievementPercent)}%</span>
        </div>
        <div
          class="cushion-progress__bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${Math.round(snapshot.achievementPercent)}"
          aria-label="Покрытие минимального безопасного уровня"
        >
          <span class="cushion-progress__fill" style="width: ${Math.min(100, snapshot.achievementPercent)}%"></span>
        </div>
        <p class="cushion-progress__remainder">
          ${snapshot.remainderToGoal > 0
    ? `До безопасного уровня не хватает: ${formatAmount(snapshot.remainderToGoal)}`
    : 'Минимальный безопасный уровень соблюдён'}
        </p>
      </div>
    </article>
  `;
}

function renderSettings() {
  const region = workspace?.querySelector('[data-cushion-settings]');

  if (!region || !isStateInitialized()) {
    return;
  }

  const cushion = getAppState().financialCushion;
  const formId = 'cushion-settings-form';

  region.innerHTML = `
    <section class="cushion-settings">
      <h3 class="cushion-settings__title">Настройки финансовой подушки</h3>
      <p class="cushion-settings__intro">Финансовая подушка — минимальный безопасный уровень средств. Она используется для оценки состояния, а не как сумма, которую просто вычитают из денег.</p>
      <form class="cushion-settings__form" id="${formId}" novalidate>
        <label class="cushion-settings__toggle">
          <input type="checkbox" name="enabled" ${cushion.enabled ? 'checked' : ''}>
          Использовать финансовую подушку
        </label>
        <div class="form-field">
          <label class="form-field__label" for="cushion-method">Способ расчёта</label>
          <select class="form-field__input" id="cushion-method" name="calculationMethod">
            ${CUSHION_METHOD_OPTIONS.map(({ value, label }) => `
              <option value="${escapeHtml(value)}" ${cushion.calculationMethod === value ? 'selected' : ''}>
                ${escapeHtml(label)}
              </option>
            `).join('')}
          </select>
          <p class="form-field__error" data-error-for="calculationMethod" hidden></p>
        </div>
        <div class="form-field" data-cushion-field="fixed">
          <label class="form-field__label" for="cushion-fixed">Фиксированная сумма</label>
          <input class="form-field__input" type="number" id="cushion-fixed" name="fixedAmount" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(String(cushion.fixedAmount))}">
          <p class="form-field__error" data-error-for="fixedAmount" hidden></p>
        </div>
        <div class="form-field" data-cushion-field="income-percent">
          <label class="form-field__label" for="cushion-income-percent">Процент от доходов текущего периода</label>
          <input class="form-field__input" type="number" id="cushion-income-percent" name="incomePercent" min="0" max="100" step="0.01" inputmode="decimal" value="${escapeHtml(String(cushion.incomePercent))}">
          <p class="form-field__error" data-error-for="incomePercent" hidden></p>
        </div>
        <div class="form-field" data-cushion-field="assets-percent">
          <label class="form-field__label" for="cushion-assets-percent">Процент от общих средств</label>
          <input class="form-field__input" type="number" id="cushion-assets-percent" name="assetsPercent" min="0" max="100" step="0.01" inputmode="decimal" value="${escapeHtml(String(cushion.assetsPercent))}">
          <p class="form-field__error" data-error-for="assetsPercent" hidden></p>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary">Сохранить настройки</button>
        </div>
      </form>
    </section>
  `;

  const form = region.querySelector(`#${formId}`);
  form?.addEventListener('submit', handleSettingsSubmit);
  form?.querySelector('[name="enabled"]')?.addEventListener('change', () => updateMethodFieldsVisibility(form));
  form?.querySelector('[name="calculationMethod"]')?.addEventListener('change', () => updateMethodFieldsVisibility(form));
  updateMethodFieldsVisibility(form);
}

function updateMethodFieldsVisibility(form) {
  if (!form) {
    return;
  }

  const enabled = form.querySelector('[name="enabled"]')?.checked ?? false;
  const method = form.querySelector('[name="calculationMethod"]')?.value ?? '';
  const fields = form.querySelectorAll('[data-cushion-field]');

  fields.forEach((field) => {
    field.hidden = true;
  });

  form.querySelectorAll('.form-field__input, select').forEach((input) => {
    if (input.name !== 'enabled') {
      input.disabled = !enabled;
    }
  });

  if (!enabled) {
    return;
  }

  if (method === CUSHION_CALCULATION_METHODS.FIXED) {
    form.querySelector('[data-cushion-field="fixed"]').hidden = false;
  }

  if (method === CUSHION_CALCULATION_METHODS.INCOME_PERCENT) {
    form.querySelector('[data-cushion-field="income-percent"]').hidden = false;
  }

  if (method === CUSHION_CALCULATION_METHODS.ASSETS_PERCENT) {
    form.querySelector('[data-cushion-field="assets-percent"]').hidden = false;
  }
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    enabled: formData.get('enabled') === 'on',
    calculationMethod: formData.get('calculationMethod'),
    fixedAmount: formData.get('fixedAmount'),
    incomePercent: formData.get('incomePercent'),
    assetsPercent: formData.get('assetsPercent'),
  };

  const errors = validateFinancialCushionPayload(payload);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  updateAppState((state) => {
    state.financialCushion = buildFinancialCushionFromPayload(payload, state.financialCushion);
    return state;
  });

  showNotification({
    type: 'info',
    message: 'Настройки финансовой подушки сохранены.',
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
