/**
 * Каркас и отображение раздела «Главный экран» (Dashboard).
 */

import { getAppState, isStateInitialized } from './state-service.js';
import {
  calculateCurrentPeriodExpensesTotal,
  calculateCurrentPeriodIncomesTotal,
  calculateFinancialReserveSnapshot,
  determineFinancialMoodGroup,
  pickFinancialMoodPhrase,
} from './state.js';

const DASHBOARD_WORKSPACE_ID = 'dashboard-workspace';

let stateUpdateListenerAttached = false;
let lastMoodGroup = null;
let lastMoodPhrase = null;

/**
 * Возвращает контейнер главного экрана.
 */
export function getDashboardWorkspace() {
  return document.getElementById(DASHBOARD_WORKSPACE_ID);
}

/**
 * Подключает главный экран и отображает актуальные данные.
 */
export function initDashboard() {
  const region = getDashboardWorkspace();

  if (!region) {
    return;
  }

  region.classList.add('app-section__workspace--active');
  attachStateUpdateListener();

  if (isStateInitialized()) {
    renderDashboard();
  }
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (isStateInitialized()) {
      renderDashboard();
    }
  });

  stateUpdateListenerAttached = true;
}

function renderDashboard() {
  const region = getDashboardWorkspace();

  if (!region) {
    return;
  }

  renderMood(region);
  renderCard(region, 'my-reserve', renderMyReserveContent);
  renderCard(region, 'incomes', renderIncomesContent);
  renderCard(region, 'expenses', renderExpensesContent);
  renderCard(region, 'cushion', renderCushionContent);
}

function renderMood(region) {
  const moodRegion = region.querySelector('[data-dashboard-mood]');

  if (!moodRegion) {
    return;
  }

  const state = getAppState();
  const group = determineFinancialMoodGroup(state);

  if (group !== lastMoodGroup) {
    lastMoodGroup = group;
    lastMoodPhrase = pickFinancialMoodPhrase(state);
  }

  moodRegion.className = `dashboard-mood dashboard-mood--${group}`;
  moodRegion.innerHTML = `
    <p class="dashboard-mood__label">Финансовое настроение</p>
    <p class="dashboard-mood__text">${lastMoodPhrase ? escapeHtml(lastMoodPhrase) : '—'}</p>
  `;
}

function renderMyReserveContent() {
  const snapshot = calculateFinancialReserveSnapshot(getAppState());
  const reserveClass = snapshot.myReserve < 0
    ? 'dashboard-metric--negative'
    : 'dashboard-metric--positive';

  return `
    <div class="dashboard-metric ${reserveClass}">
      <p class="dashboard-metric__value">${formatAmount(snapshot.myReserve)}</p>
      <p class="dashboard-metric__hint">
        ${snapshot.cushion.enabled
    ? `Доступно: ${formatAmount(snapshot.availableFunds)} · Подушка: ${formatAmount(snapshot.targetAmount)}`
    : 'Подушка отключена'}
      </p>
    </div>
  `;
}

function renderIncomesContent() {
  const total = calculateCurrentPeriodIncomesTotal(getAppState());

  return `
    <div class="dashboard-metric dashboard-metric--income">
      <p class="dashboard-metric__value">${formatAmount(total)}</p>
      <p class="dashboard-metric__hint">Текущий финансовый период</p>
    </div>
  `;
}

function renderExpensesContent() {
  const total = calculateCurrentPeriodExpensesTotal(getAppState());

  return `
    <div class="dashboard-metric dashboard-metric--expense">
      <p class="dashboard-metric__value">${formatAmount(total)}</p>
      <p class="dashboard-metric__hint">Текущий финансовый период</p>
    </div>
  `;
}

function renderCushionContent() {
  const snapshot = calculateFinancialReserveSnapshot(getAppState());

  if (!snapshot.cushion.enabled) {
    return `
      <div class="dashboard-metric">
        <p class="dashboard-metric__value">Отключена</p>
        <p class="dashboard-metric__hint">Настройте финансовую подушку в соответствующем разделе</p>
      </div>
    `;
  }

  return `
    <div class="dashboard-metric">
      <p class="dashboard-metric__value">${formatAmount(snapshot.targetAmount)}</p>
      <p class="dashboard-metric__hint">Целевая сумма · ${Math.round(snapshot.achievementPercent)}% достигнуто</p>
      <div class="dashboard-progress">
        <div class="dashboard-progress__bar">
          <span class="dashboard-progress__fill" style="width: ${Math.min(100, snapshot.achievementPercent)}%"></span>
        </div>
      </div>
      <p class="dashboard-metric__sub">
        ${snapshot.remainderToGoal > 0
    ? `Остаток до цели: ${formatAmount(snapshot.remainderToGoal)}`
    : `Мой запас: ${formatAmount(snapshot.myReserve)}`}
      </p>
    </div>
  `;
}

function renderCard(region, cardId, contentRenderer) {
  const body = region.querySelector(`[data-card-content="${cardId}"]`);

  if (!body) {
    return;
  }

  body.replaceChildren();
  body.insertAdjacentHTML('beforeend', contentRenderer());
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
