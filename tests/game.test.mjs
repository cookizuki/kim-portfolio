import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, movePaddle, step } from '../src/scripts/game-engine.js';

test('paddle is constrained and moves the waiting ball', () => {
  const s = createGame(); movePaddle(s, -100); assert.equal(s.paddle, 65); assert.equal(s.ball.x, 65);
  movePaddle(s, 1000); assert.equal(s.paddle, 835);
});
test('pause freezes physics', () => {
  const s = createGame(), before = structuredClone(s.ball); step(s, .01); assert.deepEqual(s.ball, before);
});
test('ball bounces upward from the paddle', () => {
  const s = createGame(); s.playing = true; s.ball = { x: 450, y: 503, vx: 0, vy: 260 };
  step(s, .01); assert.ok(s.ball.vy < 0); assert.equal(s.lives, 3);
});
test('brick collision removes exactly one brick and updates score', () => {
  const s = createGame(); s.playing = true;
  const brick = s.bricks[0]; s.ball = { x: brick.x + 8, y: brick.y - 9, vx: 0, vy: 260 };
  assert.equal(step(s, .01), 'brick'); assert.equal(s.cleared, 1); assert.equal(s.bricks.filter(b => !b.alive).length, 1); assert.ok(s.ball.vy < 0);
});
test('three missed balls end the game without negative lives', () => {
  const s = createGame();
  for (let i = 0; i < 3; i++) { s.playing = true; s.ball.y = 570; assert.equal(step(s, .01), i < 2 ? 'life' : 'lose'); }
  step(s, .01); assert.equal(s.lives, 0); assert.equal(s.ended, true); assert.equal(s.playing, false);
});
test('clearing the final brick wins and stops physics', () => {
  const s = createGame(); s.playing = true; s.bricks.forEach((b, i) => { b.alive = i === 0; }); s.cleared = s.bricks.length - 1;
  const brick = s.bricks[0]; s.ball = { x: brick.x + 8, y: brick.y - 9, vx: 0, vy: 260 };
  assert.equal(step(s, .01), 'win'); assert.equal(s.ended, true); assert.equal(s.playing, false);
});
