/**
 * Система уведомлений интерфейса.
 * Отображает информационные сообщения без привязки к бизнес-логике.
 */

const NOTIFICATION_TYPES = ['info', 'reminder', 'warning'];
const COLLAPSED_STORAGE_KEY = 'budget-calculator:notifications-collapsed';

let container = null;
let panel = null;
let collapseButton = null;
let idCounter = 0;
const activeNotifications = new Map();

/**
 * @param {HTMLElement} notificationsContainer
 */
export function initNotifications(notificationsContainer) {
  container = notificationsContainer;
  panel = document.getElementById('notifications-panel');
  ensureCollapseControl();
  applyCollapsedState(readCollapsedState());
  updateCollapseControlVisibility();
}

/**
 * @param {{ message: string, type?: string, id?: string }} options
 * @returns {string|null} идентификатор уведомления
 */
export function showNotification({ message, type = 'info', id }) {
  if (!container || !message) {
    return null;
  }

  const notificationType = NOTIFICATION_TYPES.includes(type) ? type : 'info';
  const notificationId = id ?? `notification-${++idCounter}`;

  if (activeNotifications.has(notificationId)) {
    hideNotification(notificationId);
  }

  // Новое уведомление снова раскрывает панель.
  applyCollapsedState(false);
  writeCollapsedState(false);

  const element = document.createElement('article');
  element.className = `notification notification--${notificationType}`;
  element.dataset.notificationId = notificationId;
  element.setAttribute('role', 'status');

  const text = document.createElement('p');
  text.className = 'notification__message';
  text.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'notification__close';
  closeButton.setAttribute('aria-label', 'Закрыть уведомление');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => hideNotification(notificationId));

  element.append(text, closeButton);
  container.append(element);
  activeNotifications.set(notificationId, element);
  updateCollapseControlVisibility();

  return notificationId;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function hideNotification(id) {
  const element = activeNotifications.get(id);

  if (!element) {
    return false;
  }

  element.remove();
  activeNotifications.delete(id);
  updateCollapseControlVisibility();
  return true;
}

/**
 * Скрывает все активные уведомления одним действием.
 * @returns {number} количество скрытых уведомлений
 */
export function hideAllNotifications() {
  const ids = [...activeNotifications.keys()];

  ids.forEach((id) => {
    const element = activeNotifications.get(id);
    element?.remove();
    activeNotifications.delete(id);
  });

  applyCollapsedState(true);
  writeCollapsedState(true);
  updateCollapseControlVisibility();

  return ids.length;
}

function ensureCollapseControl() {
  if (!panel) {
    return;
  }

  const header = panel.querySelector('.notifications__header');

  if (!header) {
    return;
  }

  collapseButton = header.querySelector('[data-action="collapse-all-notifications"]');

  if (collapseButton) {
    return;
  }

  collapseButton = document.createElement('button');
  collapseButton.type = 'button';
  collapseButton.className = 'notifications__collapse';
  collapseButton.dataset.action = 'collapse-all-notifications';
  collapseButton.textContent = 'Свернуть все';
  collapseButton.addEventListener('click', () => {
    hideAllNotifications();
  });

  header.append(collapseButton);
}

function updateCollapseControlVisibility() {
  if (!collapseButton) {
    return;
  }

  const hasItems = activeNotifications.size > 0;
  collapseButton.hidden = !hasItems;
  collapseButton.disabled = !hasItems;
}

function applyCollapsedState(collapsed) {
  if (!panel) {
    return;
  }

  panel.classList.toggle('notifications--collapsed', Boolean(collapsed));
}

function readCollapsedState() {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsedState(collapsed) {
  try {
    if (collapsed) {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(COLLAPSED_STORAGE_KEY);
    }
  } catch {
    // localStorage может быть недоступен — состояние остаётся сессионным.
  }
}
