export function nextIndex(index, step, count) {
  return count > 0 ? ((index + step) % count + count) % count : 0;
}
export function swipeStep(dx, dy) {
  return Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx < 0 ? 1 : -1) : 0;
}
