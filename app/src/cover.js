// VICE COVER - Main Cover Rendering Engine

import { applyGrade, addFilmGrain } from './grade.js';

export async function drawCover(canvas, state) {
  const {
    width = 1080,
    height = 1080,
    layout = '1', // '1', '2', '3', '4'
    panels = [], // array of { img, panX, panY, zoom }
    title = 'VICE CITY STORIES',
    subtitle = 'SUNSET HEIST',
    titleColor = '#ffffff',
    titleSize = 92,
    showOutline = true,
    grade = 'sunset',
    gradeIntensity = 1.0,
    gutter = 12
  } = state;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Background base
  ctx.fillStyle = '#090214';
  ctx.fillRect(0, 0, width, height);

  // Compute panel geometries based on layout
  const boxes = getPanelBoxes(layout, width, height, gutter);

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    const panelData = panels[i] || panels[0] || {};
    const img = panelData.img;

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();

    // Fill background of box
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(box.x, box.y, box.w, box.h);

    if (img && img.complete) {
      // Draw image with pan & zoom
      const zoom = panelData.zoom || 1.0;
      const panX = panelData.panX || 0;
      const panY = panelData.panY || 0;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = box.w / box.h;

      let drawW, drawH;
      if (imgAspect > boxAspect) {
        drawH = box.h * zoom;
        drawW = drawH * imgAspect;
      } else {
        drawW = box.w * zoom;
        drawH = drawW / imgAspect;
      }

      const drawX = box.x + (box.w - drawW) / 2 + panX;
      const drawY = box.y + (box.h - drawH) / 2 + panY;

      // Temporary offscreen canvas for grading this panel
      const offCanvas = document.createElement('canvas');
      offCanvas.width = box.w;
      offCanvas.height = box.h;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

      // Draw onto offscreen centered/scaled
      offCtx.drawImage(img, drawX - box.x, drawY - box.y, drawW, drawH);

      // Apply grade & grain
      applyGrade(offCtx, box.w, box.h, grade, gradeIntensity);
      if (gradeIntensity > 0.5) {
        addFilmGrain(offCtx, box.w, box.h, 0.06);
      }

      ctx.drawImage(offCanvas, box.x, box.y);
    } else {
      // Placeholder gradient art
      const grad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
      grad.addColorStop(0, '#db2777');
      grad.addColorStop(0.5, '#7c3aed');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }

    ctx.restore();

    // Accent rotation / border styling for secondary panels
    if (i > 0 && boxes.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = gutter;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  }

  // Outer border / gutter frame
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gutter * 0.75;
  ctx.strokeRect(gutter / 2, gutter / 2, width - gutter, height - gutter);
  ctx.restore();

  // Draw Lettering & Typography (GTA 6 Poster Style)
  drawLettering(ctx, width, height, title, subtitle, titleColor, titleSize, showOutline);
}

function getPanelBoxes(layout, width, height, gutter) {
  const w = width;
  const h = height;
  const g = gutter;

  if (layout === '1') {
    return [{ x: g, y: g, w: w - 2*g, h: h - 2*g }];
  } else if (layout === '2') {
    const halfW = (w - 3*g) / 2;
    return [
      { x: g, y: g, w: halfW, h: h - 2*g },
      { x: 2*g + halfW, y: g, w: halfW, h: h - 2*g }
    ];
  } else if (layout === '3') {
    const leftW = (w - 3*g) * 0.55;
    const rightW = (w - 3*g) * 0.45;
    const halfH = (h - 3*g) / 2;
    return [
      { x: g, y: g, w: leftW, h: h - 2*g },
      { x: 2*g + leftW, y: g, w: rightW, h: halfH },
      { x: 2*g + leftW, y: 2*g + halfH, w: rightW, h: halfH }
    ];
  } else {
    const halfW = (w - 3*g) / 2;
    const halfH = (h - 3*g) / 2;
    return [
      { x: g, y: g, w: halfW, h: halfH },
      { x: 2*g + halfW, y: g, w: halfW, h: halfH },
      { x: g, y: 2*g + halfH, w: halfW, h: halfH },
      { x: 2*g + halfW, y: 2*g + halfH, w: halfW, h: halfH }
    ];
  }
}

function drawLettering(ctx, width, height, title, subtitle, titleColor, titleSize, showOutline) {
  ctx.save();

  if (subtitle) {
    ctx.save();
    ctx.translate(width * 0.08, height * 0.12);
    ctx.rotate(-0.06);

    ctx.font = `900 ${Math.max(16, titleSize * 0.32)}px "Archivo Black", sans-serif`;
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(subtitle.toUpperCase(), 0, 0);
    ctx.restore();
  }

  if (title) {
    ctx.save();
    ctx.translate(width * 0.08, height * 0.88);

    const fontSize = titleSize || 96;
    ctx.font = `900 ${fontSize}px "Anton", sans-serif`;
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#000000';
    ctx.fillText(title.toUpperCase(), 6, 6);

    if (showOutline) {
      ctx.lineWidth = fontSize * 0.12;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(title.toUpperCase(), 0, 0);
    }

    ctx.fillStyle = titleColor || '#ffffff';
    ctx.fillText(title.toUpperCase(), 0, 0);

    ctx.restore();
  }

  ctx.restore();
}
