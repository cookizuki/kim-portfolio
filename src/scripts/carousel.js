import {createImageViewer} from './image-viewer.js';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.screenshot-gallery').forEach(root => {
  const slides = [...root.querySelectorAll('.screenshot-slide')];
  const secondary = [...root.querySelectorAll('.screenshot-secondary')];
  const dialog = root.querySelector('dialog');
  const viewer = dialog && createImageViewer(dialog);
  let index = 0, viewIndex = 0, animation, opener, request = 0;
  function renderViewer(target = viewIndex) {
    viewIndex = (target + slides.length) % slides.length;
    const source = slides[viewIndex].querySelector('img') || slides[viewIndex].querySelector('.screenshot-placeholder');
    viewer.show(source, `${viewIndex + 1} / ${slides.length} ${slides[viewIndex].dataset.caption}`);
    viewer.preload(slides.map(slide => slide.querySelector('img')).filter(Boolean));
    dialog.querySelectorAll('[data-viewer-select]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.viewerSelect) === viewIndex)));
  }
  function select(target) {
    const token = ++request;
    if (target === index) return;
    const commit = () => {
      if (token !== request) return;
      animation?.cancel(); index = target;
      slides.forEach((slide, i) => {slide.hidden = i !== index;});
      secondary.forEach(button => {button.hidden = Number(button.dataset.openIndex) !== (index + 1) % slides.length;});
      root.querySelector('.screenshot-caption').textContent = `${index + 1} / ${slides.length} ${slides[index].dataset.caption}`;
      root.querySelectorAll('[data-image-select]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.imageSelect) === index)));
      if (!reduced.matches && !document.hidden) animation = slides[index].animate([{opacity:.65,transform:'translate(8px,-4px) scale(.98)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)'});
    };
    const image = slides[target].querySelector('img');
    const next = slides[(target + 1) % slides.length].querySelector('img');
    // Decode both displayed frames before changing either; latest selection wins.
    const pending = [image,next].filter(img => typeof img?.decode === 'function').map(img => {img.loading='eager';return img.decode();});
    if (!pending.length) commit();
    else Promise.all(pending).then(commit, () => {
      if (token === request) root.querySelector('.screenshot-caption').textContent = 'Image could not load. Current screenshot retained; choose another image to retry.';
    });
  }
  root.querySelectorAll('[data-image-select]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.imageSelect))));
  root.querySelectorAll('[data-open-index]').forEach(button => button.addEventListener('click', () => {
    request++; // Keep the opener visible while the modal owns navigation.
    opener = button; renderViewer(Number(button.dataset.openIndex)); dialog.showModal();
  }));
  if (dialog) {
    dialog.querySelector('.viewer-close').addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('[data-viewer-select]').forEach(button => button.addEventListener('click', () => renderViewer(Number(button.dataset.viewerSelect))));
    dialog.addEventListener('close', () => {viewer.cancel();opener?.focus({preventScroll:true});});
    dialog.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();renderViewer(viewIndex + (event.key === 'ArrowRight' ? 1 : -1));}
      if (event.key !== 'Tab') return;
      const buttons = [...dialog.querySelectorAll('button:not([hidden])')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    });
  }
  document.addEventListener('visibilitychange', () => {if(document.hidden)animation?.cancel();});
  reduced.addEventListener('change', () => {if(reduced.matches)animation?.cancel();});
});
