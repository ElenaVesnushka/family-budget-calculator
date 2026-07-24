/**
 * Предложение создать шаблон после сохранения операции (раздел 12 ТЗ).
 */

import { openModal, closeModal } from './modals.js';
import {
  buildTemplateFromIncome,
  buildTemplateFromExpense,
} from './state.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function openTemplatePrompt({ title, message, onCreate }) {
  const content = document.createElement('div');
  content.className = 'template-prompt';
  content.innerHTML = `
    <p class="template-prompt__message">${escapeHtml(message)}</p>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-template-prompt">Отмена</button>
      <button type="button" class="btn btn--primary" data-action="confirm-template-prompt">Создать</button>
    </div>
  `;

  content.querySelector('[data-action="cancel-template-prompt"]').addEventListener('click', () => {
    closeModal();
  });

  content.querySelector('[data-action="confirm-template-prompt"]').addEventListener('click', () => {
    closeModal();
    onCreate();
  });

  return openModal({ title, content });
}

/**
 * Предлагает создать шаблон после сохранения фактического дохода.
 */
export function offerCreateTemplateFromIncome(income) {
  if (!income) {
    return;
  }

  openTemplatePrompt({
    title: 'Создать шаблон',
    message: 'Создать шаблон для этой операции?',
    onCreate: async () => {
      const draft = buildTemplateFromIncome(income, income.name || 'Доход');
      const { id, createdAt, updatedAt, lastUsedAt, ...prefill } = draft;
      const { openCreateTemplateModal } = await import('./templates.js');
      openCreateTemplateModal(prefill);
    },
  });
}

/**
 * Предлагает создать шаблон после сохранения фактического расхода.
 */
export function offerCreateTemplateFromExpense(expense) {
  if (!expense) {
    return;
  }

  openTemplatePrompt({
    title: 'Создать шаблон',
    message: 'Создать шаблон для этой операции?',
    onCreate: async () => {
      const draft = buildTemplateFromExpense(expense, expense.name || 'Расход');
      const { id, createdAt, updatedAt, lastUsedAt, ...prefill } = draft;
      const { openCreateTemplateModal } = await import('./templates.js');
      openCreateTemplateModal(prefill);
    },
  });
}
