import { openMediaDialog } from './site.js';

function galleryItems(root) {
  return [...root.querySelectorAll('[data-gallery-thumb]')].map((button) => ({
    src: button.dataset.fullSrc || button.dataset.src,
    alt: button.dataset.alt || '',
    title: button.dataset.galleryLabel || '产品图片',
    caption: button.dataset.caption || '',
  }));
}

export function selectGalleryItem(root, index) {
  const buttons = [...root.querySelectorAll('[data-gallery-thumb]')];
  const button = buttons[index];
  const mainImage = root.querySelector('[data-gallery-main]');
  if (!button || !mainImage) return;

  mainImage.src = button.dataset.src;
  mainImage.srcset = button.dataset.srcset || '';
  mainImage.alt = button.dataset.alt || '';
  mainImage.width = Number(button.dataset.width || mainImage.width || 1);
  mainImage.height = Number(button.dataset.height || mainImage.height || 1);
  root.dataset.galleryIndex = String(index);
  buttons.forEach((candidate, candidateIndex) => {
    const selected = candidateIndex === index;
    candidate.classList.toggle('is-active', selected);
    candidate.setAttribute('aria-current', selected ? 'true' : 'false');
  });
  const label = root.querySelector('[data-gallery-current-label]');
  if (label) label.textContent = button.dataset.galleryLabel || '';
}

export function initProductGallery(root) {
  const buttons = [...root.querySelectorAll('[data-gallery-thumb]')];
  const mainButton = root.querySelector('[data-gallery-main-button]');
  buttons.forEach((button, index) => button.addEventListener('click', () => selectGalleryItem(root, index)));
  mainButton?.addEventListener('click', () => {
    openMediaDialog(mainButton, galleryItems(root), Number(root.dataset.galleryIndex || 0));
  });
  if (buttons.length > 0) selectGalleryItem(root, 0);
}

document.querySelectorAll('[data-product-gallery]').forEach(initProductGallery);
