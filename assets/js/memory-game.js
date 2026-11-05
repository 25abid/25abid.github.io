/* Browser adaptation of the supplied CS50P Python game. No server required. */
(() => {
  'use strict';
  const form = document.querySelector('#game-settings');
  const difficulty = document.querySelector('#difficulty');
  const custom = document.querySelector('#custom-size');
  const board = document.querySelector('#memory-board');
  const status = document.querySelector('#game-status');
  const score = document.querySelector('#game-score');
  const error = document.querySelector('#game-error');
  let cards = [], first = null, locked = false, pairs = 0, turns = 0, timer;

  function updateScore() {
    score.textContent = `${pairs} / ${cards.length / 2} pairs · ${turns} turns`;
  }

  function setCard(index, state) {
    const card = cards[index];
    const button = board.children[index];
    card.state = state;
    button.classList.toggle('is-open', state === 'open');
    button.classList.toggle('is-matched', state === 'matched');
    button.textContent = state === 'hidden' ? '·' : card.letter.toUpperCase();
    button.setAttribute('aria-label', `Row ${card.row}, column ${card.col}: ${state === 'hidden' ? 'hidden' : card.letter.toUpperCase() + (state === 'matched' ? ', matched' : '')}`);
    // Keep matched cards focusable so keyboard focus never disappears.
    button.setAttribute('aria-disabled', String(state !== 'hidden'));
  }

  function reveal(index) {
    if (locked || cards[index].state !== 'hidden') return;
    setCard(index, 'open');
    if (first === null) {
      first = index;
      status.textContent = `${cards[index].letter.toUpperCase()} revealed. Choose another card.`;
      return;
    }
    const previous = first;
    first = null;
    turns++;
    if (cards[previous].letter === cards[index].letter) {
      setCard(previous, 'matched');
      setCard(index, 'matched');
      pairs++;
      status.textContent = pairs === cards.length / 2
        ? `Congratulations! You found all ${pairs} pairs in ${turns} turns. Play again with New game.`
        : 'You found a match. Choose two more cards.';
    } else {
      locked = true;
      status.textContent = 'No match. Remember these letters…';
      timer = window.setTimeout(() => {
        setCard(previous, 'hidden');
        setCard(index, 'hidden');
        locked = false;
        status.textContent = 'Try again. Choose two cards.';
      }, 2000);
    }
    updateScore();
  }

  function start(rows, cols) {
    window.clearTimeout(timer);
    first = null; locked = false; pairs = 0; turns = 0;
    // As in Python: randomly select letters with replacement, double, shuffle.
    const letters = Array.from({ length: rows * cols / 2 }, () =>
      'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
    letters.push(...letters);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    cards = letters.map((letter, index) => ({ letter, row: Math.floor(index / cols) + 1, col: index % cols + 1, state: 'hidden' }));
    board.replaceChildren();
    board.style.gridTemplateColumns = `repeat(${cols}, minmax(44px, 1fr))`;
    board.style.minWidth = `${cols * 44 + (cols - 1) * 9}px`;
    board.style.maxWidth = `${Math.min(620, cols * 100)}px`;
    cards.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-card';
      button.addEventListener('click', () => reveal(index));
      board.append(button);
      setCard(index, 'hidden');
    });
    status.textContent = 'Choose two cards to begin.';
    updateScore();
  }

  difficulty.addEventListener('change', () => {
    custom.hidden = difficulty.value !== 'custom';
    error.textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const [rows, cols] = difficulty.value === 'custom'
      ? [Number(document.querySelector('#rows').value), Number(document.querySelector('#cols').value)]
      : difficulty.value.split(',').map(Number);
    if (![rows, cols].every(n => Number.isInteger(n) && n >= 1 && n <= 10) || rows * cols % 2 !== 0) {
      error.textContent = 'Use 1–10 rows and columns, with an even number of cells (for example, 4 × 4).';
      return;
    }
    error.textContent = '';
    start(rows, cols);
    board.firstElementChild.focus();
  });
  start(4, 3);
})();
