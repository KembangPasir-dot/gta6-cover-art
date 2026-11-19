// VICE COVER - Shot Runner for Automated Screenshots

import { drawCover } from './cover.js';

export async function handleShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot !== 'cover') return false;

  document.body.classList.add('shot-cover-mode');

  const photoKey = params.get('photo') || 'pier';
  const caption = params.get('caption') || 'VICE CITY';
  const sizePreset = params.get('size') || 'square';
  const layout = params.get('layout') || '1';
  const grade = params.get('grade') || 'sunset';

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
    pier: 'samples/pier.jpg',
    boulevard: 'samples/boulevard.jpg',
    sunset: 'samples/sunset.jpg',
    neon: 'samples/neon.jpg'
  };

  const imgPath = imgMap[photoKey] || imgMap.pier;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
    img.src = imgPath;
  });

  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return false;

  const panels = [
    { img, panX: 0, panY: 0, zoom: 1.1 },
    { img, panX: 0, panY: 0, zoom: 1.1 },
    { img, panX: 0, panY: 0, zoom: 1.1 },
    { img, panX: 0, panY: 0, zoom: 1.1 }
  ];

  await drawCover(canvas, {
    width,
    height,
    layout,
    panels,
    title: caption,
    subtitle: 'VICE CITY STORIES',
    titleColor: '#ffffff',
    titleSize: Math.round(width * 0.085),
    showOutline: true,
    grade,
    gradeIntensity: 1.0,
    gutter: Math.round(width * 0.012)
  });

  window.__shotReady = true;
  return true;
}
