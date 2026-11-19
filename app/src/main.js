// VICE COVER - Main Application Controller & UI Wiring

import { drawCover } from './cover.js';
import { handleShotMode } from './shots.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if automated shot mode (cover mode)
  const isCoverShot = await handleShotMode();
  if (isCoverShot) return;

  const params = new URLSearchParams(window.location.search);
  const photoKey = params.get('photo') || 'pier';
  const caption = params.get('caption') || 'VICE CITY HEIST';
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

  // App State
  const state = {
    width,
    height,
    sizePreset,
    layout,
    grade,
    gradeIntensity: 1.0,
    title: caption,
    subtitle: 'SUNSET BOULEVARD',
    titleColor: '#ffffff',
    titleSize: Math.round(width * 0.085),
    showOutline: true,
    activePanel: 0,
    panels: [
      { img: null, panX: 0, panY: 0, zoom: 1.0 },
      { img: null, panX: 0, panY: 0, zoom: 1.0 },
      { img: null, panX: 0, panY: 0, zoom: 1.0 },
      { img: null, panX: 0, panY: 0, zoom: 1.0 }
    ]
  };

  const imgMap = {
    pier: 'samples/pier.jpg',
    boulevard: 'samples/boulevard.jpg',
    sunset: 'samples/sunset.jpg',
    neon: 'samples/neon.jpg'
  };

  const imgPath = imgMap[photoKey] || imgMap.pier;
  const loadedImg = await loadSampleImageRaw(imgPath);
  if (loadedImg) {
    for (let i = 0; i < state.panels.length; i++) {
      state.panels[i].img = loadedImg;
    }
  }

  // DOM Elements
  const canvas = document.getElementById('preview-canvas');
  const titleInput = document.getElementById('input-title');
  const subtitleInput = document.getElementById('input-subtitle');
  const colorPicker = document.getElementById('input-color');
  const fontSizeSlider = document.getElementById('input-fontsize');
  const outlineToggle = document.getElementById('input-outline');
  const gradeSelect = document.getElementById('select-grade');
  const intensitySlider = document.getElementById('input-intensity');
  const zoomSlider = document.getElementById('input-zoom');
  const fileInput = document.getElementById('file-upload');
  const exportBtn = document.getElementById('btn-export');

  // Bind initial values
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  if (colorPicker) colorPicker.value = state.titleColor;
  if (fontSizeSlider) fontSizeSlider.value = state.titleSize;
  if (outlineToggle) outlineToggle.checked = state.showOutline;
  if (gradeSelect) gradeSelect.value = state.grade;
  if (intensitySlider) intensitySlider.value = state.gradeIntensity;

  // Active buttons for layout & size
  document.querySelectorAll('.layout-btn').forEach(btn => {
    if (btn.dataset.layout === state.layout) btn.classList.add('active');
    else btn.classList.remove('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.layout = btn.dataset.layout;
      render();
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    if (btn.dataset.size === state.sizePreset) btn.classList.add('active');
    else btn.classList.remove('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sizePreset = btn.dataset.size;
      if (state.sizePreset === 'square') {
        state.width = 1080; state.height = 1080;
      } else if (state.sizePreset === 'portrait') {
        state.width = 1024; state.height = 1280;
      } else if (state.sizePreset === 'wide') {
        state.width = 1280; state.height = 720;
      }
      render();
    });
  });

  // Sample photo chips
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const src = chip.dataset.src;
      const img = await loadSampleImageRaw(src);
      if (img) {
        for (let i = 0; i < state.panels.length; i++) {
          state.panels[i].img = img;
        }
      }
      render();
    });
  });

  // File upload handling
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          state.panels[state.activePanel].img = img;
          state.panels[state.activePanel].zoom = 1.0;
          state.panels[state.activePanel].panX = 0;
          state.panels[state.activePanel].panY = 0;
          render();
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Inputs wiring
  if (titleInput) {
    titleInput.addEventListener('input', (e) => { state.title = e.target.value; render(); });
  }
  if (subtitleInput) {
    subtitleInput.addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  }
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => { state.titleColor = e.target.value; render(); });
  }
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', (e) => { state.titleSize = parseInt(e.target.value); render(); });
  }
  if (outlineToggle) {
    outlineToggle.addEventListener('change', (e) => { state.showOutline = e.target.checked; render(); });
  }
  if (gradeSelect) {
    gradeSelect.addEventListener('change', (e) => { state.grade = e.target.value; render(); });
  }
  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => { state.gradeIntensity = parseFloat(e.target.value); render(); });
  }
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
      state.panels[state.activePanel].zoom = parseFloat(e.target.value);
      render();
    });
  }

  // Export PNG
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vice-cover-${state.sizePreset}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    });
  }

  async function loadSampleImageRaw(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function render() {
    await drawCover(canvas, state);
  }

  // Initial render
  await render();

  // If editor shot mode, signal ready
  if (params.get('shot') === 'editor') {
    window.__shotReady = true;
  }
});
