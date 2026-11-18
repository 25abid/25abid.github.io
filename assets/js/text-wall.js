document.querySelectorAll('.text-wall').forEach(wall => {
  const isLeft = wall.classList.contains('text-wall--left');
  const canvas = wall.querySelector('canvas');
  const content = document.querySelector('.main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const context = canvas.getContext('2d');
  if (!context) return;

  const enabled = matchMedia('(prefers-reduced-motion:no-preference)');
  const compact = matchMedia('(max-width:760px)');
  const titles = ['COOL STUFF', 'OFF THE MAP', 'SIDE QUEST'];
  const titleGlyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%+';
  const backgroundGlyphs = '.:+-=~* /';
  const accentColors = ['#66ffd4', '#ff80ce', '#ffd47a', '#91b9ff'];
  const cellWidth = 6;
  const rowHeight = 9;
  let width = 0;
  let height = 0;
  let cells = [];
  let frame = 0;
  let previousTime = 0;
  let revisionTime = 0;
  let titleOffset = 0;
  let titleMasks = [];
  let titleSpacing = 0;
  let maskRows = 0;
  let columns = 0;
  let visible = false;
  let eye = null;
  let lastEye = null;
  const lockOn = 4650;
  const closeStart = lockOn + 6300;
  const burstStart = closeStart + 650;
  const eyeDuration = burstStart + 800;
  let eyeDelay = 9000 + Math.random() * 11000;

  function advanceEye(elapsed) {
    if (isLeft || compact.matches) return;
    if (eye) {
      eye.age += elapsed;
      if (eye.age >= eyeDuration) {
        eye = null;
        eyeDelay = 20000 + Math.random() * 26000;
      }
      return;
    }
    eyeDelay -= elapsed;
    if (eyeDelay > 0) return;

    const bounds = canvas.getBoundingClientRect();
    const start = Math.max(width * 0.25, content.getBoundingClientRect().right - bounds.left);
    const scale = Math.min(1.85, (width - start - 24) / 112);
    const left = start + 52 * scale;
    const right = width - 52 * scale - 12;
    const top = Math.max(height * 0.18, header.getBoundingClientRect().bottom - bounds.top + 64);
    const bottom = Math.min(height * 0.82, footer.getBoundingClientRect().top - bounds.top - 64,
      innerHeight - bounds.top - 64);
    if (scale >= 0.85 && right > left && bottom > top) {
      const x = left + Math.random() * (right - left);
      const y = top + Math.random() * (bottom - top);
      if (!lastEye || Math.hypot(x - lastEye.x, y - lastEye.y) > 32) {
        eye = { x, y, scale, age: 0 };
        lastEye = eye;
        return;
      }
    }
    eyeDelay = 4000 + Math.random() * 4000;
  }

  function drawEye() {
    const { x, y, age, scale } = eye;
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    const dilation = ease((age - lockOn) / 6000);
    const tremor = 2.5 * dilation * (1 - ease((age - closeStart) / 650));
    const shakeX = tremor * (Math.sin(age / 17) + 0.35 * Math.sin(age / 9));
    const shakeY = tremor * 0.65 * Math.sin(age / 23);
    context.save();
    context.translate(x + shakeX, y + shakeY);
    context.scale(scale, scale);
    context.font = '5px monospace';
    context.fillStyle = '#deddd3';
    if (age >= burstStart) {
      const progress = clamp((age - burstStart) / 800);
      for (let i = 0; i < 21; i++) {
        const angle = i * 2.4;
        const distance = progress * (12 + i % 5 * 3);
        context.globalAlpha = 0.65 * (1 - progress) ** 2;
        context.fillText('.:+*'[i % 4], (i - 10) * 3.4 + Math.cos(angle) * distance,
          Math.sin(angle) * distance);
      }
      context.restore();
      return;
    }

    const openness = ease((age - 400) / 850) * (1 - 0.32 * dilation) *
      (1 - ease((age - closeStart) / 650));
    const lookRight = ease((age - 1450) / 360);
    const lookLeft = ease((age - 2450) / 410);
    const lookDown = ease((age - 3450) / 380);
    const center = ease((age - 4210) / 440);
    const gazeX = 10 * lookRight - 21 * lookLeft + 15 * lookDown - 4 * center;
    const gazeY = -4 * lookRight + 3 * lookLeft + 7 * lookDown - 6 * center;
    const pupil = 3.5 + 8 * dilation;
    const fade = ease(age / 200);
    for (let dx = -44; dx <= 44; dx += 2.75) {
      const lid = 17 * openness * (1 - (dx / 45) ** 2);
      for (let dy = -18; dy <= 18; dy += 2) {
        const edge = Math.abs(dy) - lid;
        if (edge > 1) continue;
        const irisX = dx - gazeX;
        const irisY = dy - gazeY;
        const distance = Math.hypot(irisX, irisY);
        let glyph = '.';
        let alpha = 0.42;
        context.fillStyle = '#deddd3';
        if (edge >= -1) {
          glyph = dy === 0 ? '-' : dy < 0 ? '^' : '_';
          alpha = 0.84;
        } else if (distance < pupil) {
          const glint = Math.hypot(irisX + 2, irisY + 2) < 1.6 && dilation < 0.9;
          glyph = glint ? '+' : '#';
          if (!glint) context.fillStyle = '#141416';
          alpha = glint ? 0.85 * (1 - dilation) : 0.7 + dilation * 0.3;
        } else if (distance < 12) {
          glyph = distance > 9.5 ? 'o' : ':';
          alpha = 0.72;
        }
        context.globalAlpha = alpha * fade;
        context.fillText(glyph, dx, dy);
      }
    }
    context.restore();
  }

  function randomGlyph(useLetters) {
    const glyphs = useLetters ? titleGlyphs : backgroundGlyphs;
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function updateGlyph(cell) {
    const accentedField = isLeft || compact.matches;
    const accent = accentedField && Math.random() < 0.025;
    cell.letter = randomGlyph(accent || (!accentedField && Math.random() < 0.65));
    cell.color = accent
      ? accentColors[Math.floor(Math.random() * accentColors.length)]
      : '#cfcbc3';
    cell.alpha = accent ? 0.95 : accentedField ? 0.12 + Math.random() * 0.26 : 0.23;
  }

  function buildGrid(previousWidth, previousHeight) {
    const previousCells = cells;
    const previousColumns = Math.max(0, Math.ceil((previousWidth - Math.floor(cellWidth / 2)) / cellWidth));
    columns = Math.ceil((width - Math.floor(cellWidth / 2)) / cellWidth);
    titleMasks = [];
    cells = [];
    for (let y = Math.floor(rowHeight / 2); y < height; y += rowHeight) {
      for (let x = Math.floor(cellWidth / 2); x < width; x += cellWidth) {
        const previous = x < previousWidth && y < previousHeight &&
          previousCells[Math.floor(y / rowHeight) * previousColumns + Math.floor(x / cellWidth)];
        if (previous) {
          cells.push(previous);
          continue;
        }
        const cell = { x, y };
        updateGlyph(cell);
        cells.push(cell);
      }
    }

    if (isLeft || compact.matches) return;

    const mask = document.createElement('canvas');
    const titleLength = Math.floor(Math.min(height * 0.82, Math.max(246, Math.min(innerHeight * 0.56, 540))));
    mask.width = width;
    mask.height = titleLength;
    const ink = mask.getContext('2d');
    const contentEdge = content.getBoundingClientRect().right - canvas.getBoundingClientRect().left;
    maskRows = Math.ceil(titleLength / rowHeight);
    titleSpacing = Math.ceil(Math.max(titleLength + 80, height / titles.length) / rowHeight);
    titleOffset %= titleSpacing * titles.length;

    titleMasks = titles.map(title => {
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
      const highlights = new Uint8Array(columns * maskRows);
      for (let y = Math.floor(rowHeight / 2); y < titleLength; y += rowHeight) {
        for (let x = Math.floor(cellWidth / 2); x < width; x += cellWidth) {
          highlights[Math.floor(y / rowHeight) * columns + Math.floor(x / cellWidth)] =
            pixels[(y * width + x) * 4 + 3] > 100;
        }
      }
      return highlights;
    });
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const bounds = canvas.getBoundingClientRect();
    const top = bounds.top;
    const firstVisible = -top - rowHeight;
    const lastVisible = innerHeight - top + rowHeight;
    const cycleRows = titleSpacing * titleMasks.length;
    const shift = Math.floor(titleOffset) - 5;
    for (const cell of cells) {
      const { x, y } = cell;
      if (y < firstVisible || y > lastVisible) continue;
      let highlighted = false;
      if (cycleRows) {
        const row = (Math.floor(y / rowHeight) + shift + cycleRows) % cycleRows;
        const maskRow = row % titleSpacing;
        highlighted = maskRow < maskRows &&
          titleMasks[Math.floor(row / titleSpacing)][maskRow * columns + Math.floor(x / cellWidth)];
      }
      context.fillStyle = highlighted ? '#b9dfbf' : cell.color;
      context.globalAlpha = highlighted ? 0.95 : cell.alpha;
      if (eye && Math.abs(x - eye.x) < 50 * eye.scale && Math.abs(y - eye.y) < 22 * eye.scale) {
        const distance = Math.hypot((x - eye.x) / (50 * eye.scale), (y - eye.y) / (22 * eye.scale));
        const blend = Math.min(1, eye.age / 400, (eyeDuration - eye.age) / 800);
        context.globalAlpha *= 1 - 0.82 * blend * Math.max(0, 1 - distance ** 4);
      }
      context.fillText(cell.letter, x, y);
    }
    if (eye) drawEye();
  }

  function animate(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
    previousTime = time;
    advanceEye(elapsed);
    if (titleMasks.length) {
      titleOffset = (titleOffset + elapsed * 0.012 / rowHeight) % (titleSpacing * titleMasks.length);
    }
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
    const previousWidth = width;
    const previousHeight = height;
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
    if (compact.matches || (eye && (eye.x + 52 * eye.scale > width || eye.y + 64 > height))) {
      eye = null;
    }
    buildGrid(previousWidth, previousHeight);
    draw();
    updateAnimation();
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateAnimation();
  }).observe(canvas);
  enabled.addEventListener('change', () => {
    updateAnimation();
  });
  document.addEventListener('visibilitychange', updateAnimation);
  wall.hidden = false;
  resize();
});
