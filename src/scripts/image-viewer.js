// Keep the displayed frame until its replacement has decoded. Each viewer owns
// its request generation, so slow earlier requests cannot win a navigation race.
export function createImageViewer(dialog) {
  const content = dialog.querySelector('.viewer-image');
  const caption = dialog.querySelector('.viewer-caption');
  const cache = new Map();
  let generation = 0;
  function prepare(source) {
    if (!source) return null;
    const key = source.currentSrc || source.src;
    if (key && cache.has(key)) return cache.get(key);
    const image = source.cloneNode(true);
    image.loading = 'eager';
    const result = {image, ready: typeof image.decode !== 'function', promise: null};
    if (!result.ready) {
      result.promise = image.decode().then(() => {result.ready = true; return image;});
      // Prefetch rejection is handled, and a later selection may retry.
      result.promise.catch(() => {if (key) cache.delete(key);});
    }
    if (key) cache.set(key, result);
    return result;
  }
  return {
    show(source, label) {
      const request = ++generation;
      const entry = prepare(source);
      const commit = () => {
        if (request !== generation) return;
        content.replaceChildren(entry.image);
        caption.textContent = label;
      };
      if (entry.ready) commit();
      else {
        if (!content.childElementCount) caption.textContent = 'Loading image...';
        entry.promise.then(commit, () => {
          if (request === generation) caption.textContent = 'Image could not load. Use another image or try again.';
        });
      }
    },
    preload(sources) {sources.forEach(prepare);},
    cancel() {generation++;}
  };
}
