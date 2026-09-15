// Utility to manage body scroll locking and modal-open class across multiple modals
let openModalsCount = 0;

export function lockBodyScroll() {
  openModalsCount++;
  if (openModalsCount === 1) {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }
  }
}

export function unlockBodyScroll() {
  openModalsCount = Math.max(0, openModalsCount - 1);
  if (openModalsCount === 0) {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  }
}
