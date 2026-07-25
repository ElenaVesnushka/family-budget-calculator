/**
 * Раздел «Отчёты и аналитика» (раздел 15 ТЗ).
 * Строится только на подтверждённых операциях за выбранный период.
 */

import { getSectionRegion } from './ui.js';
import { getAppState, updateAppState, isStateInitialized } from './state-service.js';
import {
  REPORT_PERIODS,
  INCOME_TYPES,
  buildReportSummary,
  formatIsoDate,
} from './state.js';

const REPORTS_WORKSPACE_ID = 'reports-workspace';

const PERIOD_OPTIONS = [
  { value: REPORT_PERIODS.WEEK, label: 'Неделя' },
  { value: REPORT_PERIODS.MONTH, label: 'Месяц' },
  { value: REPORT_PERIODS.YEAR, label: 'Год' },
  { value: REPORT_PERIODS.CUSTOM, label: 'Произвольный период' },
];

const INCOME_TYPE_LABELS = {
  [INCOME_TYPES.PERMANENT]: 'Постоянный',
  [INCOME_TYPES.ONE_TIME]: 'Разовый',
  [INCOME_TYPES.DEPOSIT_CAPITALIZATION]: 'Капитализация вклада',
};

let workspace = null;
let stateUpdateListenerAttached = false;

function getReportsWorkspace() {
  return document.getElementById(REPORTS_WORKSPACE_ID) ?? getSectionRegion('reports');
}

/**
 * Инициализирует раздел «Отчёты и аналитика».
 */
export function initReports() {
  workspace = getReportsWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');

  if (!workspace.querySelector('.reports')) {
    workspace.replaceChildren(createReportsLayout());
    bindControls();
  }

  if (isStateInitialized()) {
    syncControlsFromState();
    renderReports();
  }

  attachStateUpdateListener();
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      syncControlsFromState();
      renderReports();
    }
  });

  stateUpdateListenerAttached = true;
}

function createReportsLayout() {
  const container = document.createElement('div');
  container.className = 'reports';

  container.innerHTML = `
    <div class="reports__toolbar">
      <div class="form-field reports__period-field">
        <label class="form-field__label" for="reports-period">Период</label>
        <select class="form-field__input" id="reports-period" name="periodType">
          ${PERIOD_OPTIONS.map(({ value, label }) => `
            <option value="${escapeHtml(value)}">${escapeHtml(label)}</option>
          `).join('')}
        </select>
      </div>
      <div class="reports__custom-period" data-reports-custom hidden>
        <div class="form-field">
          <label class="form-field__label" for="reports-period-start">Начало</label>
          <input class="form-field__input" type="date" id="reports-period-start" name="customStart">
        </div>
        <div class="form-field">
          <label class="form-field__label" for="reports-period-end">Окончание</label>
          <input class="form-field__input" type="date" id="reports-period-end" name="customEnd">
        </div>
      </div>
    </div>
    <p class="reports__range" data-reports-range></p>
    <div class="reports__metrics" data-reports-metrics role="region" aria-label="Основные показатели отчёта"></div>
    <div class="reports__panels">
      <section class="reports-panel" aria-labelledby="reports-incomes-title">
        <h3 class="reports-panel__title" id="reports-incomes-title">Доходы периода</h3>
        <div class="reports-panel__body" data-reports-incomes></div>
      </section>
      <section class="reports-panel" aria-labelledby="reports-expenses-title">
        <h3 class="reports-panel__title" id="reports-expenses-title">Расходы периода</h3>
        <div class="reports-panel__body" data-reports-expenses></div>
      </section>
      <section class="reports-panel" aria-labelledby="reports-limits-title">
        <h3 class="reports-panel__title" id="reports-limits-title">Лимиты</h3>
        <div class="reports-panel__body" data-reports-limits></div>
      </section>
      <section class="reports-panel reports-panel--observations" aria-labelledby="reports-observations-title">
        <h3 class="reports-panel__title" id="reports-observations-title">Финансовые наблюдения</h3>
        <p class="reports-panel__hint">Информационные выводы по данным. Не являются уведомлениями и не требуют действия.</p>
        <div class="reports-panel__body" data-reports-observations></div>
      </section>
    </div>
  `;

  return container;
}

function bindControls() {
  const periodSelect = workspace.querySelector('#reports-period');
  const startInput = workspace.querySelector('#reports-period-start');
  const endInput = workspace.querySelector('#reports-period-end');

  periodSelect?.addEventListener('change', () => {
    updateCustomPeriodVisibility();
    persistPreferencesAndRender();
  });

  startInput?.addEventListener('change', () => {
    persistPreferencesAndRender();
  });

  endInput?.addEventListener('change', () => {
    persistPreferencesAndRender();
  });
}

function syncControlsFromState() {
  const preferences = getAppState().reports?.preferences ?? {};
  const periodSelect = workspace?.querySelector('#reports-period');
  const startInput = workspace?.querySelector('#reports-period-start');
  const endInput = workspace?.querySelector('#reports-period-end');

  if (periodSelect) {
    periodSelect.value = preferences.defaultPeriod ?? REPORT_PERIODS.MONTH;
  }

  if (startInput) {
    startInput.value = preferences.customPeriod?.start ?? formatIsoDate(new Date());
  }

  if (endInput) {
    endInput.value = preferences.customPeriod?.end ?? formatIsoDate(new Date());
  }

  updateCustomPeriodVisibility();
}

function updateCustomPeriodVisibility() {
  const customBlock = workspace?.querySelector('[data-reports-custom]');
  const periodSelect = workspace?.querySelector('#reports-period');

  if (!customBlock || !periodSelect) {
    return;
  }

  customBlock.hidden = periodSelect.value !== REPORT_PERIODS.CUSTOM;
}

function persistPreferencesAndRender() {
  const periodSelect = workspace?.querySelector('#reports-period');
  const startInput = workspace?.querySelector('#reports-period-start');
  const endInput = workspace?.querySelector('#reports-period-end');
  const periodType = periodSelect?.value ?? REPORT_PERIODS.MONTH;

  updateAppState((state) => {
    state.reports = {
      preferences: {
        defaultPeriod: periodType,
        customPeriod: {
          start: startInput?.value || null,
          end: endInput?.value || null,
        },
      },
    };
    return state;
  });
}

function renderReports() {
  if (!workspace || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const summary = buildReportSummary(state);

  const rangeElement = workspace.querySelector('[data-reports-range]');
  if (rangeElement) {
    rangeElement.textContent = `${summary.periodLabel}: ${formatDisplayDate(summary.startDate)} — ${formatDisplayDate(summary.endDate)}`;
  }

  renderMetrics(summary);
  renderIncomesPanel(summary);
  renderExpensesPanel(summary);
  renderLimitsPanel(summary);
  renderObservations(summary);
}

function renderMetrics(summary) {
  const metricsRegion = workspace.querySelector('[data-reports-metrics]');

  if (!metricsRegion) {
    return;
  }

  const cushionValue = summary.cushion.enabled
    ? formatAmount(summary.cushionAmount)
    : 'Отключена';

  metricsRegion.innerHTML = `
    <article class="reports-metric">
      <p class="reports-metric__label">Доходы периода</p>
      <p class="reports-metric__value reports-metric__value--income">${formatAmount(summary.incomesTotal)}</p>
    </article>
    <article class="reports-metric">
      <p class="reports-metric__label">Расходы периода</p>
      <p class="reports-metric__value reports-metric__value--expense">${formatAmount(summary.expensesTotal)}</p>
    </article>
    <article class="reports-metric">
      <p class="reports-metric__label">Баланс периода</p>
      <p class="reports-metric__value">${formatAmount(summary.periodBalance)}</p>
      <p class="reports-metric__hint">Доходы − расходы подтверждённых операций</p>
    </article>
    <article class="reports-metric">
      <p class="reports-metric__label">Мои средства</p>
      <p class="reports-metric__value">${formatAmount(summary.totalFunds)}</p>
      <p class="reports-metric__hint">Текущие: ${formatAmount(summary.currentFunds)} · Запасы: ${formatAmount(summary.reserveFunds)}</p>
    </article>
    <article class="reports-metric">
      <p class="reports-metric__label">Финансовая подушка</p>
      <p class="reports-metric__value">${cushionValue}</p>
      <p class="reports-metric__hint">Порог безопасности, не вычитается из активов</p>
    </article>
  `;
}

function renderIncomesPanel(summary) {
  const region = workspace.querySelector('[data-reports-incomes]');

  if (!region) {
    return;
  }

  if (summary.incomesByType.length === 0) {
    region.innerHTML = '<p class="reports-empty">За выбранный период подтверждённых доходов нет.</p>';
    return;
  }

  region.innerHTML = `
    <p class="reports-panel__total">Итого: <strong>${formatAmount(summary.incomesTotal)}</strong></p>
    <ul class="reports-breakdown">
      ${summary.incomesByType.map((item) => `
        <li class="reports-breakdown__item">
          <span class="reports-breakdown__name">${escapeHtml(INCOME_TYPE_LABELS[item.id] ?? item.id)}</span>
          <span class="reports-breakdown__share">${item.sharePercent}%</span>
          <span class="reports-breakdown__amount">${formatAmount(item.amount)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderExpensesPanel(summary) {
  const region = workspace.querySelector('[data-reports-expenses]');

  if (!region) {
    return;
  }

  if (summary.expensesByCategory.length === 0) {
    region.innerHTML = '<p class="reports-empty">За выбранный период подтверждённых расходов нет.</p>';
    return;
  }

  region.innerHTML = `
    <p class="reports-panel__total">Итого: <strong>${formatAmount(summary.expensesTotal)}</strong></p>
    <h4 class="reports-panel__subtitle">По категориям</h4>
    <ul class="reports-breakdown">
      ${summary.expensesByCategory.map((item) => `
        <li class="reports-breakdown__item">
          <span class="reports-breakdown__name">${escapeHtml(item.name)}</span>
          <span class="reports-breakdown__share">${item.sharePercent}%</span>
          <span class="reports-breakdown__amount">${formatAmount(item.amount)}</span>
        </li>
      `).join('')}
    </ul>
    <h4 class="reports-panel__subtitle">По статьям</h4>
    <ul class="reports-breakdown">
      ${summary.expensesByArticle.map((item) => `
        <li class="reports-breakdown__item">
          <span class="reports-breakdown__name">${escapeHtml(item.name)}</span>
          <span class="reports-breakdown__share">${item.sharePercent}%</span>
          <span class="reports-breakdown__amount">${formatAmount(item.amount)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderLimitsPanel(summary) {
  const region = workspace.querySelector('[data-reports-limits]');

  if (!region) {
    return;
  }

  if (!summary.limits.length) {
    region.innerHTML = '<p class="reports-empty">Лимиты не установлены.</p>';
    return;
  }

  region.innerHTML = `
    <ul class="reports-limits">
      ${summary.limits.map((limit) => `
        <li class="reports-limits__item">
          <div class="reports-limits__head">
            <span class="reports-limits__name">${escapeHtml(limit.name)}</span>
            <span class="reports-limits__type">${escapeHtml(limit.typeLabel)}</span>
          </div>
          <div class="reports-limits__row">
            <span>Лимит: ${formatAmount(limit.limitAmount)}</span>
            <span>Факт: ${formatAmount(limit.actualSpent)}</span>
            <span>Остаток: ${formatAmount(limit.remaining)}</span>
            <span>${limit.usagePercent}%</span>
          </div>
          ${limit.overspend > 0
            ? `<p class="reports-limits__overspend">Перерасход: ${formatAmount(limit.overspend)}</p>`
            : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

function renderObservations(summary) {
  const panel = workspace.querySelector('.reports-panel--observations');
  const region = workspace.querySelector('[data-reports-observations]');

  if (!panel || !region) {
    return;
  }

  const observations = summary.observations ?? [];

  if (!observations.length) {
    panel.hidden = true;
    region.replaceChildren();
    return;
  }

  panel.hidden = false;
  region.innerHTML = `
    <ul class="reports-observations">
      ${observations.map((text) => `
        <li class="reports-observations__item">${escapeHtml(text)}</li>
      `).join('')}
    </ul>
  `;
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
  }).format(Number(amount) || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
