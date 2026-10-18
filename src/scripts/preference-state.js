export function readingProgress(scrollTop, scrollHeight, viewportHeight) {
  const range = scrollHeight - viewportHeight;
  return range <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / range));
}
export function resolveTheme(saved, systemDark) {
  return saved === 'dark' || saved === 'light' ? saved : systemDark ? 'dark' : 'light';
}
export function revealRadius(x, y, width, height) {
  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}
