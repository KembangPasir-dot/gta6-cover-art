// VICE COVER - Shot Runner for Automated Screenshots with Multi-Photo & Poster Furniture Support

import { drawCover } from './cover.js';

export async function handleShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot !== 'cover') return false;

  document.body.classList.add('shot-cover-mode');

  const photoKey = params.get('photo') || 'crew';
  const photosParam = params.get('photos');
  const caption = params.get('caption') || 'VICE ROYALE';
  const subtitle = params.get('subtitle') || 'kings of the coast';
  const sizePreset = params.get('size') || 'square';
  const layout = params.get('layout') || '1';
  const grade = params.get('grade') || 'golden-hour';
  const slanted = params.get('slanted') === 'true';

  let width = 1080;
  let height = 1080;
  if (sizePreset === 'portrait') {
    width = 1024;
    height = 1280;
  } else if (sizePreset === 'wide') {
    width = 1280;
    height = 720;
  }

  const imgMap = {
    crew: 'samples/crew.jpg',
    heroine: 'samples/heroine.jpg',
    boss: 'samples/boss.jpg',
    rider: 'samples/rider.jpg',
    pier: 'samples/pier.jpg',
    boulevard: 'samples/boulevard.jpg',
    sunset: 'samples/sunset.jpg',
    neon: 'samples/neon.jpg'
  };

  let photoKeys = [photoKey];
  if (photosParam) {
    photoKeys = photosParam.split(',').map(k => k.trim());
  }

  const panels = [];
  for (let i = 0; i < 4; i++) {
    const key = photoKeys[i % photoKeys.length] || photoKey;
    const imgPath = imgMap[key] || imgMap.crew;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      img.src = imgPath;
    });

    panels.push({
      img: img.complete ? img : null,
      panX: 0,
      panY: 0,
      zoom: 1.15
    });
  }

  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return false;

  await drawCover(canvas, {
    width,
    height,
    layout,
    panels,
    title: caption,
    subtitle: subtitle,
    titleColor: '#ffffff',
    titleSize: Math.round(width * 0.095),
    showOutline: true,
    grade,
    gradeIntensity: 1.0,
    gutter: Math.round(width * 0.012),
    slanted,
    showStars: true,
    showSeal: true,
    showBilling: true,
    showBarcode: true,
    showTagline: true,
    showCastTags: true,
    showVol: true
  });

  window.__shotReady = true;
  return true;
}
