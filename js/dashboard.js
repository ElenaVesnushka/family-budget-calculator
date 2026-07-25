/**
 * Каркас и отображение раздела «Главный экран» (Dashboard).
 */

import { getAppState, isStateInitialized } from './state-service.js';
import {
  buildFinancialObservations,
  calculateCurrentPeriodExpensesTotal,
  calculateCurrentPeriodIncomesTotal,
  calculateFinancialReserveSnapshot,
  calculatePeriodBalance,
  determineFinancialMoodState,
  getFinancialMoodStateLabel,
  getReferenceName,
  INCOME_TYPES,
  pickFinancialMoodPhrase,
} from './state.js';

const DASHBOARD_WORKSPACE_ID = 'dashboard-workspace';
const RECENT_OPERATIONS_LIMIT = 10;

const INCOME_TYPE_LABELS = {
  [INCOME_TYPES.PERMANENT]: 'Постоянный',
  [INCOME_TYPES.ONE_TIME]: 'Разовый',
  [INCOME_TYPES.DEPOSIT_CAPITALIZATION]: 'Капитализация вклада',
};

let stateUpdateListenerAttached = false;
let lastMoodState = null;
let lastMoodPhrase = null;
let lastMoodPhrasesKey = null;
let lastBudgetId = null;

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
    refreshDashboard();
  }
}

/**
 * Принудительно пересчитывает и перерисовывает Главный экран из текущего state.
 * Сбрасывает локальные кэши фраз, чтобы не показывать значения до очистки данных.
 */
export function refreshDashboard() {
  lastMoodState = null;
  lastMoodPhrase = null;
  lastMoodPhrasesKey = null;
  lastBudgetId = null;

  if (!isStateInitialized()) {
    return;
  }

  renderDashboard();
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

  if (!region || !isStateInitialized()) {
    return;
  }

  const state = getAppState();
  const budgetId = state.meta?.budgetId ?? null;

  if (budgetId !== lastBudgetId) {
    lastBudgetId = budgetId;
    lastMoodState = null;
    lastMoodPhrase = null;
    lastMoodPhrasesKey = null;
  }

  renderMood(region, state);
  renderCard(region, 'period-balance', () => renderPeriodBalanceContent(state));
  renderCard(region, 'my-assets', () => renderMyAssetsContent(state));
  renderCard(region, 'incomes', () => renderIncomesContent(state));
  renderCard(region, 'expenses', () => renderExpensesContent(state));
  renderCard(region, 'cushion', () => renderCushionContent(state));
  renderRecentOperations(region, state);
  renderFinancialObservations(region, state);
}

function renderMood(region, state = getAppState()) {
  const moodRegion = region.querySelector('[data-dashboard-mood]');

  if (!moodRegion) {
    return;
  }

  const moodState = determineFinancialMoodState(state);
  const moodPhrasesKey = JSON.stringify(state.settings?.moodPhrases ?? {});

  if (moodState !== lastMoodState || moodPhrasesKey !== lastMoodPhrasesKey) {
    lastMoodState = moodState;
    lastMoodPhrasesKey = moodPhrasesKey;
    lastMoodPhrase = pickFinancialMoodPhrase(state);
  }

  moodRegion.className = `dashboard-mood dashboard-mood--${moodState}`;
  moodRegion.innerHTML = `
    <p class="dashboard-mood__label">Финансовое настроение</p>
    <p class="dashboard-mood__state">${escapeHtml(getFinancialMoodStateLabel(moodState))}</p>
    <p class="dashboard-mood__text">${lastMoodPhrase ? escapeHtml(lastMoodPhrase) : '—'}</p>
  `;
}

function renderPeriodBalanceContent(state = getAppState()) {
  const balance = calculatePeriodBalance(state);
  const balanceClass = balance < 0
    ? 'dashboard-metric--negative'
    : 'dashboard-metric--positive';

  return `
    <div class="dashboard-metric ${balanceClass}">
      <p class="dashboard-metric__value">${formatAmount(balance)}</p>
      <p class="dashboard-metric__hint">Подтверждённые доходы минус подтверждённые расходы периода</p>
    </div>
  `;
}

function renderMyAssetsContent(state = getAppState()) {
  const snapshot = calculateFinancialReserveSnapshot(state);

  return `
    <div class="dashboard-metric">
      <p class="dashboard-metric__value">${formatAmount(snapshot.totalFunds)}</p>
      <p class="dashboard-metric__hint">Общая сумма денежных средств</p>
    </div>
  `;
}

function renderIncomesContent(state = getAppState()) {
  const total = calculateCurrentPeriodIncomesTotal(state);

  return `
    <div class="dashboard-metric dashboard-metric--income">
      <p class="dashboard-metric__value">${formatAmount(total)}</p>
      <p class="dashboard-metric__hint">Текущий финансовый период</p>
    </div>
  `;
}

function renderExpensesContent(state = getAppState()) {
  const total = calculateCurrentPeriodExpensesTotal(state);

  return `
    <div class="dashboard-metric dashboard-metric--expense">
      <p class="dashboard-metric__value">${formatAmount(total)}</p>
      <p class="dashboard-metric__hint">Текущий финансовый период</p>
    </div>
  `;
}

function renderCushionContent(state = getAppState()) {
  const snapshot = calculateFinancialReserveSnapshot(state);

  if (!snapshot.cushion.enabled) {
    return `
      <div class="dashboard-metric">
        <p class="dashboard-metric__value">Отключена</p>
        <p class="dashboard-metric__hint">Задайте минимальный безопасный уровень в разделе «Финансовая подушка»</p>
      </div>
    `;
  }

  return `
    <div class="dashboard-metric">
      <p class="dashboard-metric__value">${formatAmount(snapshot.targetAmount)}</p>
      <p class="dashboard-metric__hint">Минимальный безопасный уровень · баланс покрывает ${Math.round(snapshot.achievementPercent)}%</p>
      <div class="dashboard-progress">
        <div class="dashboard-progress__bar">
          <span class="dashboard-progress__fill" style="width: ${Math.min(100, snapshot.achievementPercent)}%"></span>
        </div>
      </div>
      <p class="dashboard-metric__sub">
        ${snapshot.periodBalance < 0
    ? `Баланс периода: ${formatAmount(snapshot.periodBalance)}`
    : snapshot.remainderToGoal > 0
      ? `До безопасного уровня: ${formatAmount(snapshot.remainderToGoal)}`
      : `Безопасный уровень соблюдён · баланс: ${formatAmount(snapshot.periodBalance)}`}
      </p>
    </div>
  `;
}

function collectRecentOperations(state, limit = RECENT_OPERATIONS_LIMIT) {
  const incomes = (state.currentBudget?.incomes ?? []).map((item) => ({
    id: item.id,
    kind: 'income',
    date: item.date,
    amount: item.amount,
    name: item.name,
    comment: item.comment,
    incomeType: item.incomeType,
    createdAt: item.createdAt,
  }));

  const expenses = (state.currentBudget?.expenses ?? []).map((item) => ({
    id: item.id,
    kind: 'expense',
    date: item.date,
    amount: item.amount,
    name: item.name,
    comment: item.comment,
    categoryId: item.categoryId,
    articleId: item.articleId,
    createdAt: item.createdAt,
  }));

  return [...incomes, ...expenses]
    .sort((first, second) => {
      const dateCompare = String(second.date ?? '').localeCompare(String(first.date ?? ''));

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return String(second.createdAt ?? '').localeCompare(String(first.createdAt ?? ''));
    })
    .slice(0, limit);
}

function renderFinancialObservations(region, state = getAppState()) {
  const block = region.querySelector('[data-dashboard-observations]');
  const list = region.querySelector('[data-dashboard-observations-list]');

  if (!block || !list) {
    return;
  }

  const observations = buildFinancialObservations(state);

  list.replaceChildren();

  if (!observations.length) {
    block.hidden = true;
    return;
  }

  observations.forEach((text) => {
    const item = document.createElement('li');
    item.className = 'dashboard-observations__item';
    item.textContent = text;
    list.append(item);
  });

  block.hidden = false;
}

function renderRecentOperations(region, state = getAppState()) {
  const body = region.querySelector('[data-card-content="recent"]');

  if (!body) {
    return;
  }

  const operations = collectRecentOperations(state);

  body.replaceChildren();

  if (operations.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'dashboard-recent__empty';
    emptyState.textContent = 'Операций пока нет. Добавьте доход или расход в соответствующих разделах.';
    body.append(emptyState);
    return;
  }

  const table = document.createElement('table');
  table.className = 'dashboard-recent-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Дата</th>
        <th scope="col">Тип</th>
        <th scope="col">Название</th>
        <th scope="col">Сумма</th>
        <th scope="col">Детали</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  const categories = state.references?.categories ?? [];
  const articles = state.references?.expenseArticles ?? [];

  operations.forEach((operation) => {
    tbody.append(createRecentOperationRow(operation, categories, articles));
  });

  table.append(tbody);
  body.append(table);
}

function createRecentOperationRow(operation, categories, articles) {
  const row = document.createElement('tr');
  row.className = `dashboard-recent-table__row dashboard-recent-table__row--${operation.kind}`;

  const isIncome = operation.kind === 'income';
  const typeLabel = isIncome ? 'Доход' : 'Расход';
  const amountClass = isIncome ? 'dashboard-recent-table__amount--income' : 'dashboard-recent-table__amount--expense';
  const details = isIncome
    ? getIncomeTypeLabel(operation.incomeType)
    : `${getReferenceName(categories, operation.categoryId)} · ${getReferenceName(articles, operation.articleId)}`;

  row.innerHTML = `
    <td>${formatDisplayDate(operation.date)}</td>
    <td><span class="dashboard-recent-table__type dashboard-recent-table__type--${operation.kind}">${typeLabel}</span></td>
    <td>${escapeHtml(operation.name || '—')}</td>
    <td class="dashboard-recent-table__amount ${amountClass}">${formatAmount(operation.amount)}</td>
    <td class="dashboard-recent-table__details">${escapeHtml(details)}</td>
  `;

  return row;
}

function getIncomeTypeLabel(incomeType) {
  return INCOME_TYPE_LABELS[incomeType] ?? '—';
}

function formatDisplayDate(dateString) {
  const parts = String(dateString ?? '').split('-');

  if (parts.length !== 3) {
    return '—';
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
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
