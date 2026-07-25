/**
 * Раздел «Настройки» (раздел 16 ТЗ).
 */

import { getSectionRegion, applyTheme } from './ui.js';
import { getAppState, updateAppState, resetAppState, isStateInitialized } from './state-service.js';
import { openModal, closeModal } from './modals.js';
import { showNotification, hideAllNotifications } from './notifications.js?v=20260725-12';
import { refreshDashboard } from './dashboard.js?v=20260725-18';
import {
  THEMES,
  CUSHION_CALCULATION_METHODS,
  FINANCIAL_MOOD_PHRASE_GROUPS,
  getExpenseCategories,
  getAllExpenseArticles,
  isExpenseArticleInUse,
  validateExpenseArticlePayload,
  buildExpenseArticleFromPayload,
  getSystemMoodPhrases,
  getMoodPhraseGroupLabel,
  normalizeMoodPhrases,
  validateDayOfMonth,
  validateFinancialCushionPayload,
  buildFinancialCushionFromPayload,
  createDefaultUserSettingsState,
  getCushionMethodLabel,
} from './state.js';

const WORKSPACE_ID = 'settings-workspace';
const WIPE_CONFIRM_WORD = 'УДАЛИТЬ';

const THEME_OPTIONS = [
  { value: THEMES.LIGHT, label: 'Светлая' },
  { value: THEMES.DARK, label: 'Тёмная' },
  { value: THEMES.JAPANESE, label: 'Японская' },
];

const CUSHION_METHOD_OPTIONS = [
  { value: CUSHION_CALCULATION_METHODS.FIXED, label: 'Фиксированная сумма' },
  { value: CUSHION_CALCULATION_METHODS.INCOME_PERCENT, label: 'Процент от дохода' },
];

const PHRASE_GROUPS = [
  FINANCIAL_MOOD_PHRASE_GROUPS.POSITIVE,
  FINANCIAL_MOOD_PHRASE_GROUPS.NEUTRAL,
  FINANCIAL_MOOD_PHRASE_GROUPS.WARNING,
  FINANCIAL_MOOD_PHRASE_GROUPS.CRITICAL,
];

let workspace = null;
let stateUpdateListenerAttached = false;

function getWorkspace() {
  return document.getElementById(WORKSPACE_ID) ?? getSectionRegion('settings');
}

/**
 * Инициализирует раздел «Настройки».
 */
export function initSettings() {
  workspace = getWorkspace();

  if (!workspace) {
    return;
  }

  workspace.classList.add('app-section__workspace--active');

  if (!workspace.querySelector('.settings')) {
    workspace.replaceChildren(createSettingsLayout());
    bindSettingsEvents();
  }

  if (isStateInitialized()) {
    renderSettings();
  }

  attachStateUpdateListener();
}

function attachStateUpdateListener() {
  if (stateUpdateListenerAttached) {
    return;
  }

  document.addEventListener('appstate:updated', () => {
    if (workspace && isStateInitialized()) {
      renderSettings();
    }
  });

  stateUpdateListenerAttached = true;
}

function createSettingsLayout() {
  const container = document.createElement('div');
  container.className = 'settings';

  container.innerHTML = `
    <section class="settings-block" data-settings-general></section>
    <section class="settings-block" data-settings-cushion></section>
    <section class="settings-block" data-settings-categories></section>
    <section class="settings-block" data-settings-articles></section>
    <section class="settings-block" data-settings-phrases></section>
    <section class="settings-block" data-settings-reset></section>
    <section class="settings-block settings-block--danger" data-settings-wipe></section>
  `;

  return container;
}

function bindSettingsEvents() {
  workspace.addEventListener('click', handleSettingsClick);
  workspace.addEventListener('change', handleSettingsChange);
  workspace.addEventListener('submit', handleSettingsSubmit);
}

function handleSettingsClick(event) {
  const addArticle = event.target.closest('[data-action="add-article"]');
  if (addArticle) {
    openArticleModal();
    event.preventDefault();
    return;
  }

  const editArticle = event.target.closest('[data-action="edit-article"]');
  if (editArticle?.dataset.articleId) {
    openArticleModal(editArticle.dataset.articleId);
    event.preventDefault();
    return;
  }

  const deleteArticle = event.target.closest('[data-action="delete-article"]');
  if (deleteArticle?.dataset.articleId) {
    handleDeleteArticle(deleteArticle.dataset.articleId);
    event.preventDefault();
    return;
  }

  const addPhrase = event.target.closest('[data-action="add-phrase"]');
  if (addPhrase?.dataset.phraseGroup) {
    openPhraseModal(addPhrase.dataset.phraseGroup);
    event.preventDefault();
    return;
  }

  const editPhrase = event.target.closest('[data-action="edit-phrase"]');
  if (editPhrase?.dataset.phraseGroup != null && editPhrase.dataset.phraseIndex != null) {
    openPhraseModal(editPhrase.dataset.phraseGroup, Number(editPhrase.dataset.phraseIndex));
    event.preventDefault();
    return;
  }

  const deletePhrase = event.target.closest('[data-action="delete-phrase"]');
  if (deletePhrase?.dataset.phraseGroup != null && deletePhrase.dataset.phraseIndex != null) {
    handleDeletePhrase(deletePhrase.dataset.phraseGroup, Number(deletePhrase.dataset.phraseIndex));
    event.preventDefault();
    return;
  }

  const resetButton = event.target.closest('[data-action="reset-settings"]');
  if (resetButton) {
    handleResetSettings();
    event.preventDefault();
    return;
  }

  const wipeButton = event.target.closest('[data-action="wipe-all-data"]');
  if (wipeButton) {
    openWipeAllDataFirstConfirm();
    event.preventDefault();
  }
}

function handleSettingsChange(event) {
  const target = event.target;

  if (target.id === 'settings-theme') {
    persistGeneralSettings({ theme: target.value });
    applyTheme(target.value);
    showNotification({ type: 'info', message: 'Тема оформления изменена.' });
    return;
  }

  if (target.name === 'cushionEnabled' || target.name === 'cushionMethod') {
    updateCushionFieldsVisibility();
  }
}

function handleSettingsSubmit(event) {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();

  if (form.id === 'settings-general-form') {
    saveGeneralSettings(form);
    return;
  }

  if (form.id === 'settings-cushion-form') {
    saveCushionSettings(form);
  }
}

function renderSettings() {
  if (!workspace || !isStateInitialized()) {
    return;
  }

  renderGeneralSettings();
  renderCushionSettings();
  renderCategories();
  renderArticles();
  renderPhrases();
  renderResetBlock();
  renderWipeAllDataBlock();
}

function renderGeneralSettings() {
  const region = workspace.querySelector('[data-settings-general]');
  const settings = getAppState().settings;

  if (!region) {
    return;
  }

  region.innerHTML = `
    <h3 class="settings-block__title">Основные параметры</h3>
    <p class="settings-block__intro">Изменение параметров влияет на группировку расчётов и оформление, но не меняет сохранённые операции.</p>
    <form class="settings-form" id="settings-general-form" novalidate>
      <div class="form-field">
        <label class="form-field__label" for="settings-period-day">День начала финансового периода</label>
        <input class="form-field__input" type="number" id="settings-period-day" name="financialPeriodStartDay" min="1" max="31" step="1" required value="${settings.financialPeriodStartDay}">
        <p class="form-field__error" data-error-for="financialPeriodStartDay" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="settings-snapshot-day">День ежемесячного снимка денежных средств</label>
        <input class="form-field__input" type="number" id="settings-snapshot-day" name="monthlySnapshotDay" min="1" max="31" step="1" required value="${settings.monthlySnapshotDay}">
        <p class="form-field__error" data-error-for="monthlySnapshotDay" hidden></p>
      </div>
      <div class="form-field">
        <label class="form-field__label" for="settings-theme">Тема оформления</label>
        <select class="form-field__input" id="settings-theme" name="theme">
          ${THEME_OPTIONS.map(({ value, label }) => `
            <option value="${escapeHtml(value)}" ${settings.theme === value ? 'selected' : ''}>${escapeHtml(label)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn--primary">Применить</button>
      </div>
    </form>
  `;
}

function renderCushionSettings() {
  const region = workspace.querySelector('[data-settings-cushion]');
  const cushion = getAppState().financialCushion;

  if (!region) {
    return;
  }

  region.innerHTML = `
    <h3 class="settings-block__title">Финансовая подушка</h3>
    <p class="settings-block__intro">Подушка сравнивается с балансом периода и не вычитается из активов. Подробная сводка также доступна в разделе «Финансовая подушка».</p>
    <form class="settings-form" id="settings-cushion-form" novalidate>
      <label class="settings-toggle">
        <input type="checkbox" name="cushionEnabled" ${cushion.enabled ? 'checked' : ''}>
        Использовать финансовую подушку
      </label>
      <div class="form-field" data-cushion-fields>
        <label class="form-field__label" for="settings-cushion-method">Способ расчёта</label>
        <select class="form-field__input" id="settings-cushion-method" name="cushionMethod">
          ${CUSHION_METHOD_OPTIONS.map(({ value, label }) => `
            <option value="${escapeHtml(value)}" ${cushion.calculationMethod === value ? 'selected' : ''}>${escapeHtml(label)}</option>
          `).join('')}
        </select>
        <p class="form-field__error" data-error-for="calculationMethod" hidden></p>
      </div>
      <div class="form-field" data-cushion-fixed>
        <label class="form-field__label" for="settings-cushion-fixed">Фиксированная сумма</label>
        <input class="form-field__input" type="number" id="settings-cushion-fixed" name="fixedAmount" min="0" step="0.01" value="${cushion.fixedAmount}">
        <p class="form-field__error" data-error-for="fixedAmount" hidden></p>
      </div>
      <div class="form-field" data-cushion-percent>
        <label class="form-field__label" for="settings-cushion-percent">Процент от дохода</label>
        <input class="form-field__input" type="number" id="settings-cushion-percent" name="incomePercent" min="0" max="100" step="0.1" value="${cushion.incomePercent}">
        <p class="form-field__error" data-error-for="incomePercent" hidden></p>
      </div>
      <p class="settings-block__meta">Текущий способ: ${escapeHtml(getCushionMethodLabel(cushion.calculationMethod))}</p>
      <div class="form-actions">
        <button type="submit" class="btn btn--primary">Применить</button>
      </div>
    </form>
  `;

  updateCushionFieldsVisibility();
}

function updateCushionFieldsVisibility() {
  const form = workspace?.querySelector('#settings-cushion-form');

  if (!form) {
    return;
  }

  const enabled = form.querySelector('[name="cushionEnabled"]')?.checked;
  const method = form.querySelector('[name="cushionMethod"]')?.value;
  const fields = form.querySelector('[data-cushion-fields]');
  const fixed = form.querySelector('[data-cushion-fixed]');
  const percent = form.querySelector('[data-cushion-percent]');

  if (fields) {
    fields.hidden = !enabled;
  }

  if (fixed) {
    fixed.hidden = !enabled || method !== CUSHION_CALCULATION_METHODS.FIXED;
  }

  if (percent) {
    percent.hidden = !enabled || method !== CUSHION_CALCULATION_METHODS.INCOME_PERCENT;
  }
}

function renderCategories() {
  const region = workspace.querySelector('[data-settings-categories]');

  if (!region) {
    return;
  }

  const categories = getExpenseCategories(getAppState());

  region.innerHTML = `
    <h3 class="settings-block__title">Категории расходов</h3>
    <p class="settings-block__intro">В первой версии доступны системные категории. Статья выбирается независимо от категории: одна статья может использоваться с разными категориями.</p>
    <ul class="settings-list">
      ${categories.map((category) => `
        <li class="settings-list__item">
          <span class="settings-list__name">${escapeHtml(category.name)}</span>
          <span class="settings-list__badge">Системная</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderArticles() {
  const region = workspace.querySelector('[data-settings-articles]');

  if (!region) {
    return;
  }

  const state = getAppState();
  const articles = [...getAllExpenseArticles(state)].sort((a, b) => (
    String(a.name).localeCompare(String(b.name), 'ru')
  ));

  region.innerHTML = `
    <div class="settings-block__header">
      <div>
        <h3 class="settings-block__title">Статьи расходов</h3>
        <p class="settings-block__intro">Системные статьи можно переименовать, но нельзя удалить. Пользовательские статьи доступны при создании и изменении расходов.</p>
      </div>
      <button type="button" class="btn btn--primary" data-action="add-article">Добавить</button>
    </div>
    <ul class="settings-list">
      ${articles.map((article) => {
        const inUse = isExpenseArticleInUse(state, article.id);
        const renameButton = `
          <button type="button" class="btn btn--secondary" data-action="edit-article" data-article-id="${escapeHtml(article.id)}">Изменить</button>
        `;
        const deleteButton = article.isSystem
          ? ''
          : `
            <button type="button" class="btn btn--secondary" data-action="delete-article" data-article-id="${escapeHtml(article.id)}" ${inUse ? 'disabled title="Статья используется в операциях"' : ''}>Удалить</button>
          `;

        return `
          <li class="settings-list__item">
            <div class="settings-list__main">
              <span class="settings-list__name">${escapeHtml(article.name)}</span>
              ${article.isSystem ? '<span class="settings-list__badge">Системная</span>' : ''}
              ${article.isHidden ? '<span class="settings-list__badge">Скрыта</span>' : ''}
              ${inUse ? '<span class="settings-list__badge">Используется</span>' : ''}
            </div>
            <div class="settings-list__actions">
              ${renameButton}
              ${deleteButton}
            </div>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function renderPhrases() {
  const region = workspace.querySelector('[data-settings-phrases]');

  if (!region) {
    return;
  }

  const userPhrases = normalizeMoodPhrases(getAppState().settings.moodPhrases);
  const systemPhrases = getSystemMoodPhrases();

  region.innerHTML = `
    <h3 class="settings-block__title">Фразы финансового настроения</h3>
    <p class="settings-block__intro">Пользовательские фразы имеют приоритет при отображении настроения. Системные фразы нельзя удалить.</p>
    <div class="settings-phrases">
      ${PHRASE_GROUPS.map((group) => `
        <article class="settings-phrases__group">
          <div class="settings-block__header">
            <h4 class="settings-phrases__title">${escapeHtml(getMoodPhraseGroupLabel(group))}</h4>
            <button type="button" class="btn btn--secondary" data-action="add-phrase" data-phrase-group="${escapeHtml(group)}">Добавить</button>
          </div>
          <p class="settings-phrases__subtitle">Системные</p>
          <ul class="settings-list settings-list--compact">
            ${(systemPhrases[group] ?? []).map((phrase) => `
              <li class="settings-list__item">
                <span class="settings-list__name">${escapeHtml(phrase)}</span>
                <span class="settings-list__badge">Системная</span>
              </li>
            `).join('') || '<li class="settings-empty">Нет системных фраз.</li>'}
          </ul>
          <p class="settings-phrases__subtitle">Пользовательские</p>
          <ul class="settings-list settings-list--compact">
            ${(userPhrases[group] ?? []).map((phrase, index) => `
              <li class="settings-list__item">
                <span class="settings-list__name">${escapeHtml(phrase)}</span>
                <div class="settings-list__actions">
                  <button type="button" class="btn btn--secondary" data-action="edit-phrase" data-phrase-group="${escapeHtml(group)}" data-phrase-index="${index}">Изменить</button>
                  <button type="button" class="btn btn--secondary" data-action="delete-phrase" data-phrase-group="${escapeHtml(group)}" data-phrase-index="${index}">Удалить</button>
                </div>
              </li>
            `).join('') || '<li class="settings-empty">Пользовательских фраз пока нет.</li>'}
          </ul>
        </article>
      `).join('')}
    </div>
  `;
}

function renderResetBlock() {
  const region = workspace.querySelector('[data-settings-reset]');

  if (!region) {
    return;
  }

  region.innerHTML = `
    <h3 class="settings-block__title">Сброс настроек</h3>
    <p class="settings-block__intro">Восстанавливает параметры по умолчанию. Не удаляет операции, шаблоны, историю денежных средств и отчёты.</p>
    <button type="button" class="btn btn--secondary" data-action="reset-settings">Сбросить настройки</button>
  `;
}

function ensureWipeAllDataRegion() {
  let region = workspace.querySelector('[data-settings-wipe]');

  if (region) {
    return region;
  }

  const settingsRoot = workspace.querySelector('.settings');

  if (!settingsRoot) {
    return null;
  }

  region = document.createElement('section');
  region.className = 'settings-block settings-block--danger';
  region.setAttribute('data-settings-wipe', '');
  settingsRoot.append(region);

  return region;
}

function renderWipeAllDataBlock() {
  const region = ensureWipeAllDataRegion();

  if (!region) {
    return;
  }

  region.classList.add('settings-block--danger');
  region.innerHTML = `
    <h3 class="settings-block__title">🗑 Обнулить все данные</h3>
    <p class="settings-block__intro">Полностью удаляет все данные приложения и создаёт новое пустое состояние. Это действие нельзя отменить.</p>
    <button type="button" class="btn btn--danger" data-action="wipe-all-data">🗑 Обнулить все данные</button>
  `;
}

function openWipeAllDataFirstConfirm() {
  const content = document.createElement('div');
  content.className = 'settings-confirm settings-confirm--danger';
  content.innerHTML = `
    <p class="settings-confirm__message">Вы действительно хотите удалить все данные приложения?</p>
    <p class="settings-confirm__details">Будут удалены:</p>
    <ul class="settings-confirm__list">
      <li>доходы;</li>
      <li>расходы;</li>
      <li>денежные средства;</li>
      <li>лимиты;</li>
      <li>шаблоны;</li>
      <li>снимки денежных средств;</li>
      <li>пользовательские настройки;</li>
      <li>уведомления;</li>
      <li>история приложения.</li>
    </ul>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-wipe-all">Отмена</button>
      <button type="button" class="btn btn--danger" data-action="continue-wipe-all">Продолжить</button>
    </div>
  `;

  content.querySelector('[data-action="cancel-wipe-all"]').addEventListener('click', () => {
    closeModal();
  });

  content.querySelector('[data-action="continue-wipe-all"]').addEventListener('click', () => {
    openWipeAllDataSecondConfirm();
  });

  openModal({
    title: 'Обнуление данных',
    content,
  });
}

function openWipeAllDataSecondConfirm() {
  const content = document.createElement('div');
  content.className = 'settings-confirm settings-confirm--danger';
  content.innerHTML = `
    <p class="settings-confirm__message">Это действие невозможно отменить.</p>
    <p class="settings-confirm__details">Для подтверждения введите слово:</p>
    <p class="settings-confirm__keyword">${WIPE_CONFIRM_WORD}</p>
    <form class="settings-confirm__form" data-wipe-confirm-form novalidate>
      <div class="form-field">
        <label class="form-field__label" for="wipe-confirm-input">Подтверждение</label>
        <input
          class="form-field__input"
          type="text"
          id="wipe-confirm-input"
          name="confirmWord"
          autocomplete="off"
          spellcheck="false"
          required
        >
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn--secondary" data-action="cancel-wipe-all">Отмена</button>
        <button type="submit" class="btn btn--danger" data-action="confirm-wipe-all" disabled>
          🗑 Обнулить все данные
        </button>
      </div>
    </form>
  `;

  const form = content.querySelector('[data-wipe-confirm-form]');
  const input = content.querySelector('#wipe-confirm-input');
  const confirmButton = content.querySelector('[data-action="confirm-wipe-all"]');

  const syncConfirmButton = () => {
    confirmButton.disabled = String(input.value ?? '').trim() !== WIPE_CONFIRM_WORD;
  };

  input.addEventListener('input', syncConfirmButton);
  syncConfirmButton();

  content.querySelector('[data-action="cancel-wipe-all"]').addEventListener('click', () => {
    closeModal();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (String(input.value ?? '').trim() !== WIPE_CONFIRM_WORD) {
      syncConfirmButton();
      return;
    }

    executeWipeAllData();
  });

  openModal({
    title: 'Подтверждение удаления',
    content,
  });

  input.focus();
}

function executeWipeAllData() {
  closeModal();
  hideAllNotifications();

  const freshState = resetAppState();
  applyTheme(freshState.settings.theme);
  refreshDashboard();

  showNotification({
    type: 'info',
    message: 'Все данные приложения успешно удалены. Создано новое пустое состояние.',
  });
}

function saveGeneralSettings(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const financialPeriodStartDay = String(formData.get('financialPeriodStartDay') ?? '').trim();
  const monthlySnapshotDay = String(formData.get('monthlySnapshotDay') ?? '').trim();
  const theme = String(formData.get('theme') ?? THEMES.LIGHT).trim();

  const errors = {
    ...validateDayOfMonth(financialPeriodStartDay, 'financialPeriodStartDay'),
    ...validateDayOfMonth(monthlySnapshotDay, 'monthlySnapshotDay'),
  };

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  persistGeneralSettings({
    financialPeriodStartDay: Number(financialPeriodStartDay),
    monthlySnapshotDay: Number(monthlySnapshotDay),
    theme,
  });
  applyTheme(theme);
  showNotification({ type: 'info', message: 'Основные параметры изменены.' });
}

function persistGeneralSettings(patch) {
  updateAppState((state) => {
    state.settings = {
      ...state.settings,
      ...patch,
      moodPhrases: normalizeMoodPhrases(state.settings.moodPhrases),
    };
    return state;
  });
}

function saveCushionSettings(form) {
  clearFormErrors(form);

  const formData = new FormData(form);
  const payload = {
    enabled: formData.get('cushionEnabled') === 'on',
    calculationMethod: String(formData.get('cushionMethod') ?? '').trim(),
    fixedAmount: String(formData.get('fixedAmount') ?? '').trim(),
    incomePercent: String(formData.get('incomePercent') ?? '').trim(),
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

  showNotification({ type: 'info', message: 'Настройки финансовой подушки изменены.' });
}

function openArticleModal(articleId = null) {
  const state = getAppState();
  const article = articleId
    ? getAllExpenseArticles(state).find((item) => item.id === articleId)
    : null;

  if (articleId && !article) {
    showNotification({ type: 'info', message: 'Статья не найдена.' });
    return;
  }

  const form = document.createElement('form');
  form.className = 'settings-form';
  form.noValidate = true;

  if (article) {
    form.dataset.articleId = article.id;
    form.dataset.isSystem = article.isSystem ? 'true' : 'false';
  }

  form.innerHTML = `
    <div class="form-field">
      <label class="form-field__label" for="article-name">Название статьи</label>
      <input class="form-field__input" type="text" id="article-name" name="name" maxlength="80" required autocomplete="off">
      <p class="form-field__error" data-error-for="name" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-article">Отмена</button>
      <button type="submit" class="btn btn--primary">${article ? 'Применить' : 'Добавить'}</button>
    </div>
  `;

  form.querySelector('#article-name').value = article?.name ?? '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleArticleSubmit(form);
  });

  form.querySelector('[data-action="cancel-article"]').addEventListener('click', () => closeModal());

  openModal({
    title: article ? 'Изменить статью' : 'Добавить статью',
    content: form,
  });
}

function handleArticleSubmit(form) {
  clearFormErrors(form);

  const name = String(new FormData(form).get('name') ?? '').trim();
  const articleId = form.dataset.articleId ?? null;
  const isSystem = form.dataset.isSystem === 'true';
  const errors = validateExpenseArticlePayload({ name }, getAppState(), articleId);

  if (Object.keys(errors).length > 0) {
    showFormErrors(form, errors);
    return;
  }

  if (!articleId) {
    const article = buildExpenseArticleFromPayload({ name });

    updateAppState((state) => {
      state.references.expenseArticles.push(article);
      return state;
    });

    closeModal();
    showNotification({ type: 'info', message: 'Статья добавлена.' });
    return;
  }

  const current = getAllExpenseArticles(getAppState()).find((item) => item.id === articleId);

  if (!current) {
    showNotification({ type: 'info', message: 'Статья не найдена.' });
    return;
  }

  if (current.name === name) {
    closeModal();
    return;
  }

  if (isSystem || current.isSystem) {
    openSystemArticleRenameConfirm({
      articleId,
      name,
    });
    return;
  }

  applyArticleRename(articleId, name);
  closeModal();
  showNotification({ type: 'info', message: 'Статья изменена.' });
}

function openSystemArticleRenameConfirm({ articleId, name }) {
  const content = document.createElement('div');
  content.className = 'settings-confirm';

  content.innerHTML = `
    <p class="settings-confirm__message">Изменить название системной статьи?</p>
    <p class="settings-confirm__details">Новое название будет использоваться во всех местах приложения, где отображается эта статья.</p>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-system-rename">Отмена</button>
      <button type="button" class="btn btn--primary" data-action="confirm-system-rename">Применить</button>
    </div>
  `;

  content.querySelector('[data-action="cancel-system-rename"]').addEventListener('click', () => {
    closeModal();
  });

  content.querySelector('[data-action="confirm-system-rename"]').addEventListener('click', () => {
    applyArticleRename(articleId, name);
    closeModal();
    showNotification({ type: 'info', message: 'Название системной статьи изменено.' });
  });

  openModal({
    title: 'Подтверждение',
    content,
  });
}

function applyArticleRename(articleId, name) {
  updateAppState((state) => {
    const index = state.references.expenseArticles.findIndex((item) => item.id === articleId);

    if (index === -1) {
      return state;
    }

    state.references.expenseArticles[index] = {
      ...state.references.expenseArticles[index],
      name,
      updatedAt: new Date().toISOString(),
    };

    return state;
  });
}

function handleDeleteArticle(articleId) {
  const state = getAppState();
  const article = getAllExpenseArticles(state).find((item) => item.id === articleId);

  if (!article) {
    showNotification({ type: 'info', message: 'Статья не найдена.' });
    return;
  }

  if (article.isSystem) {
    showNotification({ type: 'info', message: 'Системную статью удалить нельзя.' });
    return;
  }

  if (isExpenseArticleInUse(state, articleId)) {
    showNotification({
      type: 'info',
      message: 'Нельзя удалить статью, которая используется в операциях или шаблонах.',
    });
    return;
  }

  const confirmed = window.confirm(`Удалить статью «${article.name}»?`);

  if (!confirmed) {
    return;
  }

  updateAppState((draft) => {
    draft.references.expenseArticles = draft.references.expenseArticles.filter((item) => item.id !== articleId);
    return draft;
  });

  showNotification({ type: 'info', message: 'Статья удалена.' });
}

function openPhraseModal(group, phraseIndex = null) {
  const phrases = normalizeMoodPhrases(getAppState().settings.moodPhrases)[group] ?? [];
  const isEdit = Number.isInteger(phraseIndex) && phraseIndex >= 0 && phraseIndex < phrases.length;

  const form = document.createElement('form');
  form.className = 'settings-form';
  form.noValidate = true;
  form.dataset.phraseGroup = group;

  if (isEdit) {
    form.dataset.phraseIndex = String(phraseIndex);
  }

  form.innerHTML = `
    <p class="settings-block__intro">Группа: ${escapeHtml(getMoodPhraseGroupLabel(group))}</p>
    <div class="form-field">
      <label class="form-field__label" for="phrase-text">Текст фразы</label>
      <textarea class="form-field__input form-field__textarea" id="phrase-text" name="text" rows="3" maxlength="240" required></textarea>
      <p class="form-field__error" data-error-for="text" hidden></p>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn--secondary" data-action="cancel-phrase">Отмена</button>
      <button type="submit" class="btn btn--primary">${isEdit ? 'Применить' : 'Добавить'}</button>
    </div>
  `;

  form.querySelector('#phrase-text').value = isEdit ? phrases[phraseIndex] : '';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handlePhraseSubmit(form);
  });

  form.querySelector('[data-action="cancel-phrase"]').addEventListener('click', () => closeModal());

  openModal({
    title: isEdit ? 'Изменить фразу' : 'Добавить фразу',
    content: form,
  });
}

function handlePhraseSubmit(form) {
  clearFormErrors(form);

  const text = String(new FormData(form).get('text') ?? '').trim();
  const group = form.dataset.phraseGroup;
  const phraseIndex = form.dataset.phraseIndex != null ? Number(form.dataset.phraseIndex) : null;

  if (!text) {
    showFormErrors(form, { text: 'Укажите текст фразы.' });
    return;
  }

  if (!PHRASE_GROUPS.includes(group)) {
    showNotification({ type: 'info', message: 'Неизвестная группа фраз.' });
    return;
  }

  updateAppState((state) => {
    const moodPhrases = normalizeMoodPhrases(state.settings.moodPhrases);
    const groupPhrases = [...(moodPhrases[group] ?? [])];

    if (Number.isInteger(phraseIndex) && phraseIndex >= 0 && phraseIndex < groupPhrases.length) {
      groupPhrases[phraseIndex] = text;
    } else {
      groupPhrases.push(text);
    }

    state.settings = {
      ...state.settings,
      moodPhrases: {
        ...moodPhrases,
        [group]: groupPhrases,
      },
    };

    return state;
  });

  closeModal();
  showNotification({
    type: 'info',
    message: Number.isInteger(phraseIndex) ? 'Фраза изменена.' : 'Фраза добавлена.',
  });
}

function handleDeletePhrase(group, phraseIndex) {
  const phrases = normalizeMoodPhrases(getAppState().settings.moodPhrases)[group] ?? [];
  const phrase = phrases[phraseIndex];

  if (!phrase) {
    showNotification({ type: 'info', message: 'Фраза не найдена.' });
    return;
  }

  const confirmed = window.confirm('Удалить пользовательскую фразу?');

  if (!confirmed) {
    return;
  }

  updateAppState((state) => {
    const moodPhrases = normalizeMoodPhrases(state.settings.moodPhrases);
    const groupPhrases = [...(moodPhrases[group] ?? [])];
    groupPhrases.splice(phraseIndex, 1);

    state.settings = {
      ...state.settings,
      moodPhrases: {
        ...moodPhrases,
        [group]: groupPhrases,
      },
    };

    return state;
  });

  showNotification({ type: 'info', message: 'Фраза удалена.' });
}

function handleResetSettings() {
  const confirmed = window.confirm(
    'Сбросить настройки по умолчанию? Операции, шаблоны и история денежных средств не будут удалены.',
  );

  if (!confirmed) {
    return;
  }

  const defaults = createDefaultUserSettingsState();

  updateAppState((state) => {
    state.settings = defaults.settings;
    state.financialCushion = defaults.financialCushion;
    return state;
  });

  applyTheme(defaults.settings.theme);
  showNotification({ type: 'info', message: 'Настройки сброшены.' });
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-field__error').forEach((element) => {
    element.hidden = true;
    element.textContent = '';
  });

  form.querySelectorAll('.form-field__input').forEach((element) => {
    element.removeAttribute('aria-invalid');
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

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
    }
  });

  form.querySelector('[aria-invalid="true"]')?.focus();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
