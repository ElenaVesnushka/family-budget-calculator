/**
 * Каркас раздела «Главный экран» (Dashboard).
 * Только разметка и отображение — без расчётов и бизнес-логики.
 */

const DASHBOARD_WORKSPACE_ID = 'dashboard-workspace';

const DASHBOARD_CARDS = [
  { id: 'balance', title: 'Баланс' },
  { id: 'incomes', title: 'Доходы месяца', modifier: 'income' },
  { id: 'expenses', title: 'Расходы месяца', modifier: 'expense' },
  { id: 'plan-fact', title: 'План / Факт' },
  { id: 'cushion', title: 'Финансовая подушка' },
  { id: 'recent', title: 'Последние операции', layout: 'wide' },
];

/**
 * Возвращает контейнер главного экрана.
 */
export function getDashboardWorkspace() {
  return document.getElementById(DASHBOARD_WORKSPACE_ID);
}

/**
 * Подключает каркас главного экрана.
 * Если разметка уже есть в HTML — только активирует контейнер.
 */
export function initDashboard() {
  const region = getDashboardWorkspace();

  if (!region) {
    return;
  }

  region.classList.add('app-section__workspace--active');

  if (region.querySelector('.dashboard')) {
    return;
  }

  region.replaceChildren(createDashboardElement());
}

function createDashboardElement() {
  const dashboard = document.createElement('div');
  dashboard.className = 'dashboard';

  const grid = document.createElement('div');
  grid.className = 'dashboard__grid';

  DASHBOARD_CARDS.forEach((card) => {
    grid.append(createCardElement(card));
  });

  dashboard.append(grid);
  return dashboard;
}

function createCardElement({ id, title, modifier = '', layout = '' }) {
  const card = document.createElement('article');
  card.className = 'dashboard-card';
  card.dataset.card = id;

  if (modifier) {
    card.classList.add(`dashboard-card--${modifier}`);
  }

  if (layout === 'wide') {
    card.classList.add('dashboard-card--wide');
  }

  const header = document.createElement('header');
  header.className = 'dashboard-card__header';

  const heading = document.createElement('h3');
  heading.className = 'dashboard-card__title';
  heading.id = `dashboard-card-title-${id}`;
  heading.textContent = title;

  header.append(heading);

  const body = document.createElement('div');
  body.className = 'dashboard-card__body';
  body.dataset.cardContent = id;
  body.setAttribute('aria-labelledby', heading.id);

  const placeholder = document.createElement('div');
  placeholder.className = 'dashboard-card__placeholder';

  body.append(placeholder);
  card.append(header, body);

  return card;
}
