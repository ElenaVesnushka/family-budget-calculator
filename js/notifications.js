/**
 * Система уведомлений интерфейса (раздел 17 ТЗ).
 * Информационные, напоминания и предупреждения — отдельно от
 * финансового настроения, наблюдений и аналитики.
 */

const NOTIFICATION_TYPES = ['info', 'reminder', 'warning'];

/** Порядок отображения: warning → reminder → info. */
const TYPE_PRIORITY = {
  warning: 0,
  reminder: 1,
  info: 2,
};

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
 * @param {{ message: string, type?: string, id?: string, expandPanel?: boolean }} options
 * @returns {string|null} идентификатор уведомления
 */
export function showNotification({ message, type = 'info', id, expandPanel }) {
  if (!container || !message) {
    return null;
  }

  const notificationType = NOTIFICATION_TYPES.includes(type) ? type : 'info';
  const notificationId = id ?? `notification-${++idCounter}`;
  const existing = activeNotifications.get(notificationId);
  const shouldExpand = expandPanel ?? !existing;

  if (existing) {
    const messageEl = existing.querySelector('.notification__message');
    const sameType = existing.dataset.notificationType === notificationType;
    const sameMessage = messageEl?.textContent === message;

    if (!sameType || !sameMessage) {
      existing.className = `notification notification--${notificationType}`;
      existing.dataset.notificationType = notificationType;
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  } else {
    const element = document.createElement('article');
    element.className = `notification notification--${notificationType}`;
    element.dataset.notificationId = notificationId;
    element.dataset.notificationType = notificationType;
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
  }

  if (shouldExpand) {
    applyCollapsedState(false);
    writeCollapsedState(false);
  }

  updateCollapseControlVisibility();
  sortNotificationsInDom();

  return notificationId;
}

/**
 * Синхронизирует группу условных уведомлений с общим префиксом id.
 * Отсутствующие в items записи с этим префиксом скрываются.
 *
 * @param {string} prefix
 * @param {Array<{ id: string, type: string, message: string }>} items
 */
export function syncNotificationsByPrefix(prefix, items) {
  if (!container || !prefix) {
    return;
  }

  const desiredIds = new Set(items.map((item) => item.id));

  [...activeNotifications.keys()].forEach((notificationId) => {
    if (notificationId.startsWith(prefix) && !desiredIds.has(notificationId)) {
      hideNotification(notificationId);
    }
  });

  items.forEach((item) => {
    if (!item?.id || !item?.message) {
      return;
    }

    showNotification({
      id: item.id,
      type: item.type,
      message: item.message,
      expandPanel: !activeNotifications.has(item.id),
    });
  });

  sortNotificationsInDom();
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

function sortNotificationsInDom() {
  if (!container) {
    return;
  }

  const entries = [...activeNotifications.entries()];

  entries.sort((first, second) => {
    const typeA = first[1].dataset.notificationType ?? 'info';
    const typeB = second[1].dataset.notificationType ?? 'info';
    const priorityDiff = (TYPE_PRIORITY[typeA] ?? 99) - (TYPE_PRIORITY[typeB] ?? 99);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return String(first[0]).localeCompare(String(second[0]), 'ru');
  });

  entries.forEach(([, element]) => {
    container.append(element);
  });
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
