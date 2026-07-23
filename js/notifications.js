/**
 * Система уведомлений интерфейса.
 * Отображает информационные сообщения без привязки к бизнес-логике.
 */

const NOTIFICATION_TYPES = ['info', 'reminder', 'warning'];

let container = null;
let idCounter = 0;
const activeNotifications = new Map();

/**
 * @param {HTMLElement} notificationsContainer
 */
export function initNotifications(notificationsContainer) {
  container = notificationsContainer;
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
  return true;
}
