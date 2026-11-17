document.querySelectorAll('.text-wall').forEach(wall => {
  const isLeft = wall.classList.contains('text-wall--left');
  const canvas = wall.querySelector('canvas');
  const content = document.querySelector('.main');
  const context = canvas.getContext('2d');
  if (!context) return;

  const enabled = matchMedia('(prefers-reduced-motion:no-preference)');
  const titles = ['COOL STUFF', 'OFF THE MAP', 'SIDE QUEST'];
  const titleGlyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%+';
  const backgroundGlyphs = '.:+-=~* /';
  const accentColors = ['#66ffd4', '#ff80ce', '#ffd47a', '#91b9ff'];
  const cellWidth = 6;
  const rowHeight = 9;
  const radius = 42;
  let width = 0;
  let height = 0;
  let cells = [];
  let frame = 0;
  let previousTime = 0;
  let revisionTime = 0;
  let titleOffset = 0;
  let cycleHeight = 0;
  let pointer = null;
  let touchRippleUntil = 0;
  let visible = false;

  function randomGlyph(inTitle) {
    const glyphs = inTitle ? titleGlyphs : backgroundGlyphs;
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function updateGlyph(cell) {
    const accent = isLeft && Math.random() < 0.025;
    cell.letter = randomGlyph(cell.inTitle || accent);
    cell.color = accent
      ? accentColors[Math.floor(Math.random() * accentColors.length)]
      : cell.inTitle ? '#d7e7da' : '#cfcbc3';
    cell.alpha = accent || cell.inTitle ? 0.95 : isLeft ? 0.12 + Math.random() * 0.26 : 0.23;
  }

  function buildGrid() {
    cells = [];
    for (let y = Math.floor(rowHeight / 2); y < height; y += rowHeight) {
      for (let x = Math.floor(cellWidth / 2); x < width; x += cellWidth) {
        const cell = { x, y, inTitle: false, pushX: 0, pushY: 0 };
        updateGlyph(cell);
        cells.push(cell);
      }
    }

    if (isLeft) return;

    const mask = document.createElement('canvas');
    const titleLength = Math.floor(Math.min(height * 0.82, Math.max(246, Math.min(innerHeight * 0.56, 540))));
    mask.width = width;
    mask.height = titleLength;
    const ink = mask.getContext('2d');
    const contentEdge = content.getBoundingClientRect().right - canvas.getBoundingClientRect().left;
    const spacing = Math.max(titleLength + 80, height / titles.length);
    cycleHeight = spacing * titles.length;
    titleOffset %= cycleHeight;

    titles.forEach((title, index) => {
      ink.clearRect(0, 0, width, titleLength);
      ink.save();
      ink.font = '900 100px Arial, sans-serif';
      const size = Math.floor(100 * titleLength / ink.measureText(title).width);
      ink.font = `900 ${size}px Arial, sans-serif`;
      ink.textAlign = 'center';
      ink.textBaseline = 'middle';
      ink.translate((width + contentEdge) / 2, titleLength / 2);
      ink.rotate(Math.PI / 2);
      ink.fillText(title, 0, 0);
      ink.restore();

      const pixels = ink.getImageData(0, 0, width, titleLength).data;
      for (let y = Math.floor(rowHeight / 2); y < titleLength; y += rowHeight) {
        for (let x = Math.floor(cellWidth / 2); x < width; x += cellWidth) {
          if (pixels[(y * width + x) * 4 + 3] > 100) {
            const cell = { x, y: y + index * spacing + 48, inTitle: true, pushX: 0, pushY: 0 };
            updateGlyph(cell);
            cells.push(cell);
          }
        }
      }
    });
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const bounds = canvas.getBoundingClientRect();
    const top = bounds.top;
    const firstVisible = -top - radius;
    const lastVisible = innerHeight - top + radius;
    for (const cell of cells) {
      const { x, inTitle } = cell;
      const y = inTitle ? (cell.y + cycleHeight - titleOffset) % cycleHeight : cell.y;
      if (y < firstVisible || y > lastVisible) continue;
      let pushX = 0;
      let pushY = 0;
      if (pointer) {
        const dx = x + bounds.left - pointer.x;
        const dy = y + top - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < radius) {
          const angle = Math.atan2(dy, dx);
          const force = (1 - distance / radius) * radius;
          pushX = Math.cos(angle) * force;
          pushY = Math.sin(angle) * force;
        }
      }
      cell.pushX += (pushX - cell.pushX) * 0.22;
      cell.pushY += (pushY - cell.pushY) * 0.22;
      const displaced = Math.abs(cell.pushX) + Math.abs(cell.pushY) > 4;
      context.fillStyle = cell.color;
      context.globalAlpha = displaced ? Math.max(cell.alpha, 0.48) : cell.alpha;
      context.fillText(cell.letter, x + cell.pushX, y + cell.pushY);
    }
  }

  function animate(time) {
    if (touchRippleUntil && time >= touchRippleUntil) {
      pointer = null;
      touchRippleUntil = 0;
    }
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
    previousTime = time;
    if (!isLeft) titleOffset = (titleOffset + elapsed * 0.012) % cycleHeight;
    revisionTime += elapsed;
    if (revisionTime >= 90) {
      revisionTime = 0;
      for (const cell of cells) {
        if (Math.random() < 0.14) updateGlyph(cell);
      }
    }
    draw();
    frame = requestAnimationFrame(animate);
  }

  function updateAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (enabled.matches && visible && !document.hidden && cells.length) {
      frame = requestAnimationFrame(animate);
    }
  }

  function resize() {
    if (!enabled.matches) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 2, 4096 / height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.font = '9px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    buildGrid();
    draw();
    updateAnimation();
  }

  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    touchRippleUntil = 0;
    pointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') pointer = null;
  });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || !enabled.matches) return;
    const bounds = canvas.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right ||
        event.clientY < bounds.top || event.clientY >= bounds.bottom) return;
    pointer = { x: event.clientX, y: event.clientY };
    touchRippleUntil = performance.now() + 230;
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateAnimation();
  }).observe(canvas);
  enabled.addEventListener('change', () => {
    pointer = null;
    updateAnimation();
  });
  document.addEventListener('visibilitychange', updateAnimation);
  wall.hidden = false;
});
