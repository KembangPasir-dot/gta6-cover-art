// VICE COVER - Main Cover Rendering Engine with Poster Furniture & Slanted Panels

import { applyGrade, addFilmGrain } from './grade.js';

export async function drawCover(canvas, state) {
  let hasYellowtail = false;
  try {
    const [, scriptFaces] = await Promise.all([
      document.fonts.load('900 16px "Anton"').catch(() => []),
      document.fonts.load('400 16px "Yellowtail"').catch(() => []),
      document.fonts.load('900 16px "Archivo Black"').catch(() => [])
    ]);
    hasYellowtail = scriptFaces.some(face => face.status === 'loaded');
    await document.fonts.ready;
  } catch {
    // Keep drawing with the fallback fonts.
  }

  const {
    width = 1080,
    height = 1080,
    layout = '1', // '1', '2', '3', '4'
    panels = [], // array of { img, panX, panY, zoom }
    title = 'VICE ROYALE',
    subtitle = 'kings of the coast',
    titleColor = '#ffffff',
    titleSize = 110,
    showOutline = true,
    grade = 'golden-hour',
    gradeIntensity = 1.0,
    gutter = 12,
    slanted = false,
    // Furniture toggles & texts
    showStars = true,
    showSeal = true,
    showBilling = true,
    showBarcode = true,
    showTagline = true,
    showCastTags = true,
    showVol = true,
    sealText = 'VICE COVER · ORIGINAL ART',
    billingText = 'A VICE COVER PRODUCTION — STARRING YOU',
    taglineText = 'FIVE FRIENDS · ONE CITY · ONE LAST JOB',
    volText = 'VOL. 1',
    castTags = ['THE INSIDER', 'THE DRIVER', 'THE BOSS', 'THE RIDER', 'THE CLOSER']
  } = state;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Background base
  ctx.fillStyle = '#090214';
  ctx.fillRect(0, 0, width, height);

  // Compute panel geometries based on layout
  const boxes = getPanelBoxes(layout, width, height, gutter);
  const stripY = height * 0.66;
  const stripH = height * 0.034;
  const furnitureTop = height * 0.905;
  const volX = width * 0.93;
  const volFont = fontSize => `900 ${fontSize}px "Anton", sans-serif`;
  const volLabel = showVol && volText ? volText.toUpperCase() : '';
  let volSize;
  let volLeft = width;
  if (volLabel) {
    ctx.save();
    ctx.textAlign = 'right';
    volSize = fitText(ctx, volLabel, volFont, Math.max(14, width * 0.022), width * 0.16);
    const ink = ctx.measureText(volLabel);
    volLeft = volX - Math.max(ink.width, ink.actualBoundingBoxLeft);
    ctx.restore();
  }

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    const panelData = panels[i] || panels[0] || {};
    const img = panelData.img;

    ctx.save();
    ctx.beginPath();
    if (slanted && i > 0) {
      // Parallelogram slant for accent panels
      const slantAmt = 24;
      ctx.moveTo(box.x + slantAmt, box.y);
      ctx.lineTo(box.x + box.w, box.y);
      ctx.lineTo(box.x + box.w - slantAmt, box.y + box.h);
      ctx.lineTo(box.x, box.y + box.h);
    } else {
      ctx.rect(box.x, box.y, box.w, box.h);
    }
    ctx.clip();

    // Fill background of box
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(box.x, box.y, box.w, box.h);

    if (img && img.complete) {
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

      const offCanvas = document.createElement('canvas');
      offCanvas.width = box.w;
      offCanvas.height = box.h;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

      offCtx.drawImage(img, drawX - box.x, drawY - box.y, drawW, drawH);

      applyGrade(offCtx, box.w, box.h, grade, gradeIntensity);
      if (gradeIntensity > 0.4) {
        addFilmGrain(offCtx, box.w, box.h, 0.05);
      }

      ctx.drawImage(offCanvas, box.x, box.y);
    } else {
      const grad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
      grad.addColorStop(0, '#db2777');
      grad.addColorStop(0.5, '#7c3aed');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }

    ctx.restore();

    // Accent borders
    if (i > 0 && boxes.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = gutter;
      if (slanted) {
        const slantAmt = 24;
        ctx.beginPath();
        ctx.moveTo(box.x + slantAmt, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w - slantAmt, box.y + box.h);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
      ctx.restore();
    }

    // Cast Callout Tag on panel
    if (showCastTags) {
      const tagText = (castTags && castTags[i]) || `THE GUEST ${i+1}`;
      ctx.save();
      const tagH = 24;
      const tagX = box.x + (slanted && i > 0 ? 26 : 16);
      const tagY = box.y + 44;
      const tagRight = Math.min(box.x + box.w - 26, box.y === gutter ? volLeft - 8 : width - 8);
      const tagFont = size => `bold ${size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitText(ctx, tagText, tagFont, Math.max(10, width * 0.016), tagRight - tagX - 16, 9, 9);
      const tagInk = ctx.measureText(tagText);
      const tagW = Math.max(tagInk.width, 2 * tagInk.actualBoundingBoxLeft, 2 * tagInk.actualBoundingBoxRight) + 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(tagX, tagY, tagW, tagH);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.strokeRect(tagX, tagY, tagW, tagH);

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);
      ctx.restore();
    }
  }

  // Outer border / gutter frame
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gutter * 0.75;
  ctx.strokeRect(gutter / 2, gutter / 2, width - gutter, height - gutter);
  ctx.restore();

  // --- POSTER FURNITURE ---

  // 1. Star Rating (top-left)
  if (showStars) {
    const radius = Math.max(6, width * 0.008);
    drawStars(ctx, Math.max(boxes[0].x + 16, 8 + radius), Math.max(boxes[0].y + 14, 8 + radius), radius);
  }

  // 2. VOL. label (top-right)
  if (volLabel) {
    ctx.save();
    ctx.font = volFont(volSize);
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'right';
    ctx.fillText(volLabel, volX, Math.max(height * 0.09, 8 + ctx.measureText(volLabel).actualBoundingBoxAscent));
    ctx.restore();
  }

  // 3. Tagline Strip
  if (showTagline && taglineText) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 2, 20, 0.85)';
    ctx.fillRect(0, stripY, width, stripH);

    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = taglineText.toUpperCase();
    const stripFont = size => `900 ${size}px "Archivo Black", sans-serif`;
    fitText(ctx, label, stripFont, Math.max(12, width * 0.018), width - 16, stripH / 2 - 2, stripH / 2 - 2);
    ctx.fillText(label, width / 2, stripY + stripH / 2);
    ctx.restore();
  }

  // 4. Big Title & Script Subtitle (centered horizontally across middle/lower area)
  drawLettering(ctx, width, height, title, subtitle, titleColor, titleSize, showOutline, hasYellowtail, stripY + stripH, furnitureTop);

  // 5. Round Seal / Stamp (bottom-right)
  if (showSeal) {
    // The requested radius can exceed half the row height. Keep the circle inside the row.
    const sealRadius = Math.min(0.045 * Math.min(width, height), 0.03 * height);
    const sealX = width * 0.915;
    const sealY = height * 0.935;
    drawSeal(ctx, sealX, sealY, sealRadius, sealText);
  }

  // 6. Barcode (bottom-right next to seal)
  if (showBarcode) {
    const bcW = width * 0.16;
    const bcH = height * 0.055;
    const bcX = width * 0.66;
    const bcY = furnitureTop;
    drawBarcode(ctx, bcX, bcY, bcW, bcH);
  }

  // 7. Billing Block (at the very bottom)
  if (showBilling && billingText) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = billingText.toUpperCase();
    const billingFont = size => `bold ${size}px sans-serif`;
    // Sit fully inside the outer white frame: the frame's bottom stroke spans
    // [height - 0.875*gutter, height - 0.125*gutter], so the baseline goes
    // just above it (white text over the white stroke would vanish). The
    // barcode/seal row above is x-separated from the centred billing, so no
    // vertical fit constraint against it — only the width cap and the canvas edge.
    const billingY = height - gutter - 4;
    fitText(ctx, label, billingFont, Math.max(9, width * 0.013), width * 0.60,
      Infinity, height - 8 - billingY);
    ctx.fillText(label, width / 2, billingY);
    ctx.restore();
  }
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

// Fit both the advance width and the visible ink, including overhanging script strokes.
function fitText(ctx, text, font, size, maxWidth, above = Infinity, below = Infinity) {
  const fits = candidate => {
    ctx.font = font(candidate);
    const ink = ctx.measureText(text);
    const width = Math.max(ink.width, ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight,
      ...(ctx.textAlign === 'center' ? [2 * ink.actualBoundingBoxLeft, 2 * ink.actualBoundingBoxRight] : []));
    return width <= maxWidth && ink.actualBoundingBoxAscent <= above && ink.actualBoundingBoxDescent <= below;
  };
  if (fits(size)) return size;
  let low = 0;
  let high = size;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }
  ctx.font = font(Math.max(0.01, low));
  return low;
}

function drawLettering(ctx, width, height, title, subtitle, titleColor, titleSize, showOutline, hasYellowtail, stripBottom, furnitureTop) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const titleY = height * 0.80;
  const subY = height * 0.865;
  const titleFont = size => `900 ${size}px "Anton", sans-serif`;
  let effectiveTitleSize = Math.min(titleSize || 110, 0.14 * height);
  let titleBottom = titleY;

  if (title) {
    const label = title.toUpperCase();
    const padding = Math.max(6, showOutline ? effectiveTitleSize * 0.06 : 0);
    effectiveTitleSize = fitText(ctx, label, titleFont, effectiveTitleSize,
      Math.min(width * 0.90, width - 2 * (8 + padding)),
      titleY - stripBottom - padding - 2, height * 0.82 - titleY - padding);
    titleBottom = titleY + ctx.measureText(label).actualBoundingBoxDescent
      + Math.max(6, showOutline ? effectiveTitleSize * 0.06 : 0);

    ctx.fillStyle = '#000000';
    ctx.fillText(label, width / 2 + 6, titleY + 6);

    if (showOutline) {
      ctx.lineWidth = effectiveTitleSize * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.strokeText(label, width / 2, titleY);
    }

    ctx.fillStyle = titleColor || '#ffffff';
    ctx.fillText(label, width / 2, titleY);
  }

  if (subtitle) {
    const scriptFont = size => hasYellowtail
      ? `400 ${size}px "Yellowtail", cursive`
      : `italic 900 ${size}px "Archivo Black", sans-serif`;
    fitText(ctx, subtitle, scriptFont, effectiveTitleSize * 0.42, width * 0.90,
      subY - titleBottom - 4, furnitureTop - subY - 4);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(subtitle, width / 2, subY);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(subtitle, width / 2, subY);
  }

  ctx.restore();
}

function drawStars(ctx, startX, startY, radius) {
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  for (let s = 0; s < 5; s++) {
    drawStar(ctx, startX + s * radius * 2.4, startY, 5, radius, radius / 2);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function drawSeal(ctx, cx, cy, radius, text) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#b45309';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fef08a';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const [first, second] = text.split('·', 2).map(line => line.trim());
  const sealFont = size => `bold ${size}px sans-serif`;
  const lines = second ? [first, second] : [first];
  lines.forEach((line, index) => {
    fitText(ctx, line, sealFont, radius * 0.30, (radius - 7) * 1.75);
    ctx.fillText(line, cx, cy + (index - (lines.length - 1) / 2) * radius * 0.36);
  });
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000000';
  let currX = x + 6;
  const barWidths = [3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2];
  let idx = 0;
  while (currX < x + w - 8) {
    const bw = barWidths[idx % barWidths.length];
    ctx.fillRect(currX, y + 4, bw, h - 12);
    currX += bw + 2;
    idx++;
  }
  ctx.font = '8px monospace';
  ctx.fillText('7 892014 902811', x + 6, y + h - 3);
  ctx.restore();
}
