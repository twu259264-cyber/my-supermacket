const dialogTriggers = new WeakMap();
let activeLightboxItems = [];
let activeLightboxIndex = 0;

function getFocusable(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

function openDialog(dialog, trigger) {
  if (!dialog || typeof dialog.showModal !== 'function') return;
  dialogTriggers.set(dialog, trigger ?? document.activeElement);
  dialog.showModal();
  document.body.classList.add('dialog-open');
  getFocusable(dialog)[0]?.focus();
}

function updateBodyLock() {
  if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

export function closeActiveDialog() {
  closeDialog(document.querySelector('dialog[open]'));
}

export function initMobileNavigation() {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!button || !menu) return;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  };
  button.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    if (opening) getFocusable(menu)[0]?.focus();
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) closeMenu({ restoreFocus: true });
  });
}

function renderLightbox() {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog || activeLightboxItems.length === 0) return;
  const item = activeLightboxItems[activeLightboxIndex];
  const image = dialog.querySelector('[data-lightbox-image]');
  const title = dialog.querySelector('[data-lightbox-title]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const count = dialog.querySelector('[data-lightbox-count]');
  image.hidden = false;
  image.src = item.src;
  image.alt = item.alt ?? item.title ?? '';
  title.textContent = item.title ?? '查看图片';
  caption.textContent = item.caption ?? '';
  count.textContent = `${String(activeLightboxIndex + 1).padStart(2, '0')} / ${String(activeLightboxItems.length).padStart(2, '0')}`;
}

export function openMediaDialog(trigger, items, index = 0) {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog || !Array.isArray(items) || items.length === 0) return;
  activeLightboxItems = items;
  activeLightboxIndex = Math.min(Math.max(index, 0), items.length - 1);
  renderLightbox();
  openDialog(dialog, trigger);
}

function stepLightbox(direction) {
  if (activeLightboxItems.length < 2) return;
  activeLightboxIndex = (activeLightboxIndex + direction + activeLightboxItems.length) % activeLightboxItems.length;
  renderLightbox();
}

function itemsFromGroup(group) {
  return [...document.querySelectorAll(`[data-lightbox-item][data-lightbox-group="${CSS.escape(group)}"]`)].map((element) => ({
    src: element.dataset.lightboxSrc || element.getAttribute('href') || element.querySelector('img')?.currentSrc || element.querySelector('img')?.src,
    alt: element.dataset.lightboxAlt || element.querySelector('img')?.alt || '',
    title: element.dataset.lightboxTitle || element.getAttribute('aria-label') || '查看图片',
    caption: element.dataset.lightboxCaption || '',
  }));
}

export function initDialogs() {
  document.querySelectorAll('[data-dialog-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => openDialog(document.getElementById(trigger.dataset.dialogOpen), trigger));
  });
  document.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      updateBodyLock();
      const trigger = dialogTriggers.get(dialog);
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });
  document.querySelectorAll('[data-lightbox-item]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const group = trigger.dataset.lightboxGroup || 'default';
      const groupElements = [...document.querySelectorAll(`[data-lightbox-item][data-lightbox-group="${CSS.escape(group)}"]`)];
      openMediaDialog(trigger, itemsFromGroup(group), groupElements.indexOf(trigger));
    });
  });
  document.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => stepLightbox(-1));
  document.querySelector('[data-lightbox-next]')?.addEventListener('click', () => stepLightbox(1));
  document.addEventListener('keydown', (event) => {
    const lightbox = document.querySelector('[data-lightbox][open]');
    if (!lightbox) return;
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      const fallback = document.createElement('div');
      fallback.className = 'image-missing';
      fallback.setAttribute('role', 'status');
      fallback.textContent = '图片暂时无法显示，请通过电话或微信咨询查看原图。';
      image.replaceWith(fallback);
    }, { once: true });
  });
}

export function initWechatDialog() {
  const dialog = document.querySelector('[data-wechat-dialog]');
  if (!dialog) return;
  dialog.querySelector('img')?.setAttribute('decoding', 'async');
}

initMobileNavigation();
initDialogs();
initWechatDialog();
