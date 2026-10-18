export const WIDTH = 900, HEIGHT = 550, PADDLE_Y = 512, PADDLE_WIDTH = 130, BALL_RADIUS = 8;
const letters = {
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  W: ['10001','10001','10001','10001','10101','11011','10001'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
};
export function createGame() {
  const bricks = [];
  ['HELLO', 'WORLD'].forEach((word, line) => [...word].forEach((letter, k) => letters[letter].forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '1') bricks.push({ x: 160 + (k * 6 + x) * 20, y: 65 + line * 180 + y * 20, w: 16, h: 16, alive: true });
  }))));
  const state = { bricks, paddle: 450, ball: { x: 450, y: 501, vx: 165, vy: -260 }, cleared: 0, lives: 3, playing: false, ended: false, awaitingServe: true };
  return state;
}
export function movePaddle(s, value) {
  s.paddle = Math.max(65, Math.min(835, value));
  if (s.awaitingServe) s.ball.x = s.paddle;
}
export function step(s, dt) {
  if (!s.playing || s.ended) return null;
  s.awaitingServe = false;
  const b = s.ball, oldX = b.x, oldY = b.y, r = BALL_RADIUS;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); }
  if (b.x > WIDTH - r) { b.x = WIDTH - r; b.vx = -Math.abs(b.vx); }
  if (b.y < r) { b.y = r; b.vy = Math.abs(b.vy); }
  if (b.vy > 0 && oldY + r <= PADDLE_Y && b.y + r >= PADDLE_Y && b.x + r >= s.paddle - 65 && b.x - r <= s.paddle + 65) {
    b.y = PADDLE_Y - r;
    const angle = Math.max(-1, Math.min(1, (b.x - s.paddle) / 65)) * 1.05;
    const speed = Math.min(420, Math.hypot(b.vx, b.vy) + 3);
    b.vx = speed * Math.sin(angle); b.vy = -speed * Math.cos(angle);
  }
  let event = null;
  for (const brick of s.bricks) {
    if (!brick.alive) continue;
    const nx = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
    const ny = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));
    if ((b.x - nx) ** 2 + (b.y - ny) ** 2 > r ** 2) continue;
    brick.alive = false; s.cleared++;
    if (oldX + r <= brick.x || oldX - r >= brick.x + brick.w) b.vx *= -1;
    else b.vy *= -1;
    b.x = oldX; b.y = oldY; event = 'brick'; break;
  }
  if (s.cleared === s.bricks.length) { s.ended = true; s.playing = false; return 'win'; }
  if (b.y - r > HEIGHT) {
    s.lives--; s.playing = false;
    if (!s.lives) { s.ended = true; return 'lose'; }
    s.ball = { x: s.paddle, y: 501, vx: 165, vy: -260 }; s.awaitingServe = true;
    return 'life';
  }
  return event;
}
