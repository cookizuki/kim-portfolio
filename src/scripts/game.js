import { createGame, movePaddle, step, WIDTH, HEIGHT, PADDLE_Y, PADDLE_WIDTH, BALL_RADIUS } from './game-engine.js';
const section = document.querySelector('#ke-playground');
if (section) {
  const canvas = section.querySelector('canvas'), ctx = canvas.getContext('2d');
  const play = section.querySelector('.kg-start'), reset = section.querySelector('.kg-reset');
  const slider = section.querySelector('input'), status = section.querySelector('.kg-status'), score = section.querySelector('.kg-score');
  let game = createGame(), raf = 0, last = 0, accumulator = 0;
  function draw() {
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = getComputedStyle(section).getPropertyValue('--ink').trim();
    for (const b of game.bricks) if (b.alive) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.beginPath(); ctx.roundRect(game.paddle - PADDLE_WIDTH / 2, PADDLE_Y, PADDLE_WIDTH, 12, 6); ctx.fill();
    ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
  }
  function updateScore() { score.textContent = `${game.cleared} BRICKS · ${game.lives} ${game.lives === 1 ? 'LIFE' : 'LIVES'}`; }
  function pause(message) {
    game.playing = false; cancelAnimationFrame(raf); raf = 0;
    canvas.dataset.playing = 'false'; play.textContent = game.ended ? 'Play again' : 'Resume';
    if (message) status.textContent = message;
  }
  function fresh() {
    pause(); game = createGame(); slider.value = game.paddle; play.textContent = 'Play game';
    status.textContent = 'Ready when you are. Clear HELLO WORLD.'; updateScore(); draw();
  }
  function tick(now) {
    if (!game.playing) return;
    accumulator += Math.min((now - last) / 1000, .04); last = now;
    while (accumulator >= 1 / 240 && game.playing) {
      const event = step(game, 1 / 240); accumulator -= 1 / 240;
      if (event) updateScore();
      if (event === 'win') pause('All pixels cleared. Nicely played!');
      if (event === 'lose') pause('Game over. Play again to rebuild the pixels.');
      if (event === 'life') pause(`Ball lost. ${game.lives} lives left — press Resume.`);
    }
    draw(); if (game.playing) raf = requestAnimationFrame(tick);
  }
  function toggle() {
    if (game.playing) { pause('Paused.'); return; }
    if (game.ended) fresh();
    game.playing = true; canvas.dataset.playing = 'true'; play.textContent = 'Pause';
    status.textContent = 'Game on. Keep the ball in play.';
    last = performance.now(); accumulator = 0; raf = requestAnimationFrame(tick);
  }
  function move(value) { movePaddle(game, value); slider.value = game.paddle; draw(); }
  function point(e) { const rect = canvas.getBoundingClientRect(); move((e.clientX - rect.left) / rect.width * WIDTH); }
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || canvas.hasPointerCapture(e.pointerId)) point(e); });
  canvas.addEventListener('pointerdown', e => { if (game.playing) { canvas.setPointerCapture(e.pointerId); point(e); } });
  slider.addEventListener('input', () => move(Number(slider.value)));
  section.addEventListener('keydown', e => {
    if (e.target === slider) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(game.paddle + (e.key === 'ArrowLeft' ? -35 : 35)); }
  });
  play.addEventListener('click', toggle); reset.addEventListener('click', fresh);
  new IntersectionObserver(entries => { if (!entries[0].isIntersecting && game.playing) pause('Paused while you explore the portfolio.'); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.playing) pause('Paused.'); });
  new ResizeObserver(() => {
    const width = canvas.getBoundingClientRect().width;
    if (!width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(width * HEIGHT / WIDTH * dpr); draw();
  }).observe(canvas);
  section.querySelector('.kg-controls').hidden = false;
  document.addEventListener('portfolio:theme', draw);
  fresh();
}
