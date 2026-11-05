// Run with: node _checks/memory-game.cjs
// Exercise the actual browser controller with a small DOM and deterministic clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor() {
    this.children = []; this.events = {}; this.attributes = {}; this.style = {};
    this.classes = new Set(); this.value = ''; this.textContent = '';
    this.classList = { toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
  }
  addEventListener(name, fn) { this.events[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  get firstElementChild() { return this.children[0]; }
  focus() { this.focused = true; }
  click() { this.events.click(); }
}
const elements = Object.fromEntries(['game-settings', 'difficulty', 'custom-size', 'memory-board', 'game-status', 'game-score', 'game-error', 'rows', 'cols'].map(id => ['#' + id, new Element()]));
elements['#difficulty'].value = '4,3';
const timers = new Map(); let timerId = 0;
let seed = 2026;
const seededMath = Object.create(Math);
seededMath.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
vm.runInNewContext(fs.readFileSync('assets/js/memory-game.js', 'utf8'), {
  document: { querySelector: id => elements[id], createElement: () => new Element() },
  window: { setTimeout: (fn, ms) => { assert.equal(ms, 2000); timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id) },
  Math: seededMath, Number, Array, String
});
const board = elements['#memory-board'];
const status = elements['#game-status'];
const score = elements['#game-score'];
function submit(value, rows, cols) {
  elements['#difficulty'].value = value;
  elements['#rows'].value = rows;
  elements['#cols'].value = cols;
  elements['#game-settings'].events.submit({ preventDefault() {} });
}
function flush() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); }
assert.equal(board.children.length, 12);
board.children[0].click();
const firstLetter = board.children[0].textContent;
board.children[0].click();
assert.equal(score.textContent, '0 / 6 pairs · 0 turns', 'Repeated selection must not count as a turn');
board.children[1].click();
assert.match(score.textContent, /1 turns/);
if (timers.size) {
  board.children[2].click();
  assert.equal(board.children[2].textContent, '·', 'Third card blocked during mismatch');
  flush();
  assert.equal(board.children[0].textContent, '·');
} else {
  assert.equal(board.children[1].textContent, firstLetter);
}
for (const [difficulty, count] of [['5,4', 20], ['6,6', 36], ['4,3', 12]]) {
  submit(difficulty);
  assert.equal(board.children.length, count);
}
elements['#difficulty'].value = 'custom'; elements['#difficulty'].events.change();
assert.equal(elements['#custom-size'].hidden, false);
submit('custom', '3', '3');
assert.match(elements['#game-error'].textContent, /even number/);
assert.equal(board.children.length, 12, 'Invalid grid must leave current game intact');
submit('custom', '0', '4'); assert.match(elements['#game-error'].textContent, /1–10/);
submit('custom', '2', '2'); assert.equal(board.children.length, 4);
// Learn the four letters by revealing one pair at a time, as a player would.
const seen = new Map();
for (let i = 0; i < 4; i += 2) {
  board.children[i].click(); board.children[i + 1].click();
  seen.set(i, board.children[i].textContent); seen.set(i + 1, board.children[i + 1].textContent);
  flush();
}
for (let i = 0; i < 4; i++) {
  if (board.children[i].classes.has('is-matched')) continue;
  const j = [...seen].find(([index, letter]) => index !== i && letter === seen.get(i) && !board.children[index].classes.has('is-matched'))[0];
  board.children[i].click(); board.children[j].click();
}
assert.match(status.textContent, /Congratulations!/);
assert.match(score.textContent, /2 \/ 2 pairs/);
assert.ok(board.children.every(card => card.classes.has('is-matched')));
submit('custom', '10', '10'); assert.equal(board.children.length, 100);
// Restart with an outstanding mismatch: its old timeout must be cancelled.
for (let i = 0; i < 100 && !timers.size; i += 2) {
  board.children[i].click(); board.children[i + 1].click();
}
assert.ok(timers.size, 'Large shuffled board should produce a mismatch');
submit('4,3'); assert.equal(timers.size, 0);
flush(); assert.equal(board.children.length, 12);
assert.equal(score.textContent, '0 / 6 pairs · 0 turns');
assert.ok(board.firstElementChild.focused);
console.log('PASS: presets, custom validation, repeated selections, mismatch lock/delay, full win, and restart timer cleanup.');
