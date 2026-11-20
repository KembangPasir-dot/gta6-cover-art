// VICE COVER - Main Application Controller & UI Wiring

import { drawCover } from './cover.js';
import { handleShotMode } from './shots.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isCoverShot = await handleShotMode();
  if (isCoverShot) return;

  const params = new URLSearchParams(window.location.search);
  const photoKey = params.get('photo') || 'crew';
  const caption = params.get('caption') || 'VICE ROYALE';
  const subtitle = params.get('subtitle') || 'kings of the coast';
  const sizePreset = params.get('size') || 'square';
  const layout = params.get('layout') || '1';
  const grade = params.get('grade') || 'golden-hour';

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
    subtitle: subtitle,
    titleColor: '#ffffff',
    titleSize: Math.round(width * 0.10),
    showOutline: true,
    slanted: false,
    activePanel: 0,
    showStars: true,
    showSeal: true,
    showBilling: true,
    showBarcode: true,
    showTagline: true,
    showCastTags: true,
    showVol: true,
    sealText: 'VICE COVER · ORIGINAL ART',
    taglineText: 'FIVE FRIENDS · ONE CITY · ONE LAST JOB',
    billingText: 'A VICE COVER PRODUCTION — STARRING YOU',
    panels: [
      { img: null, panX: 0, panY: 0, zoom: 1.1 },
      { img: null, panX: 0, panY: 0, zoom: 1.1 },
      { img: null, panX: 0, panY: 0, zoom: 1.1 },
      { img: null, panX: 0, panY: 0, zoom: 1.1 }
    ]
  };

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

  const loadedImg = await loadSampleImageRaw(imgMap[photoKey] || imgMap.crew);
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
  const slantedToggle = document.getElementById('input-slanted');
  const gradeSelect = document.getElementById('select-grade');
  const intensitySlider = document.getElementById('input-intensity');
  const zoomSlider = document.getElementById('input-zoom');
  const fileInput = document.getElementById('file-upload');
  const exportBtn = document.getElementById('btn-export');

  const starsToggle = document.getElementById('input-stars');
  const sealToggle = document.getElementById('input-seal');
  const billingToggle = document.getElementById('input-billing');
  const barcodeToggle = document.getElementById('input-barcode');
  const taglineToggle = document.getElementById('input-tagline');
  const castToggle = document.getElementById('input-cast');
  const volToggle = document.getElementById('input-vol');
  const taglineTextInput = document.getElementById('input-taglinetext');
  const sealTextInput = document.getElementById('input-sealtext');
  const billingTextInput = document.getElementById('input-billingtext');

  // Bind initial values
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  if (colorPicker) colorPicker.value = state.titleColor;
  if (fontSizeSlider) fontSizeSlider.value = state.titleSize;
  if (outlineToggle) outlineToggle.checked = state.showOutline;
  if (slantedToggle) slantedToggle.checked = state.slanted;
  if (gradeSelect) gradeSelect.value = state.grade;
  if (intensitySlider) intensitySlider.value = state.gradeIntensity;
  if (taglineTextInput) taglineTextInput.value = state.taglineText;
  if (sealTextInput) sealTextInput.value = state.sealText;
  if (billingTextInput) billingTextInput.value = state.billingText;

  // Active panel selection
  document.querySelectorAll('.panel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.panel-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activePanel = parseInt(btn.dataset.panel);
      if (zoomSlider) {
        zoomSlider.value = state.panels[state.activePanel].zoom;
      }
    });
  });

  // Layout buttons
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

  // Size buttons
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

  // Sample photo chips (applies to active panel)
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const src = chip.dataset.src;
      const img = await loadSampleImageRaw(src);
      if (img) {
        state.panels[state.activePanel].img = img;
      }
      render();
    });
  });

  // File upload handling for active panel
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
  if (titleInput) titleInput.addEventListener('input', (e) => { state.title = e.target.value; render(); });
  if (subtitleInput) subtitleInput.addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  if (colorPicker) colorPicker.addEventListener('input', (e) => { state.titleColor = e.target.value; render(); });
  if (fontSizeSlider) fontSizeSlider.addEventListener('input', (e) => { state.titleSize = parseInt(e.target.value); render(); });
  if (outlineToggle) outlineToggle.addEventListener('change', (e) => { state.showOutline = e.target.checked; render(); });
  if (slantedToggle) slantedToggle.addEventListener('change', (e) => { state.slanted = e.target.checked; render(); });
  if (gradeSelect) gradeSelect.addEventListener('change', (e) => { state.grade = e.target.value; render(); });
  if (intensitySlider) intensitySlider.addEventListener('input', (e) => { state.gradeIntensity = parseFloat(e.target.value); render(); });
  if (zoomSlider) zoomSlider.addEventListener('input', (e) => {
    state.panels[state.activePanel].zoom = parseFloat(e.target.value);
    render();
  });

  // Furniture toggles & inputs
  if (starsToggle) starsToggle.addEventListener('change', (e) => { state.showStars = e.target.checked; render(); });
  if (sealToggle) sealToggle.addEventListener('change', (e) => { state.showSeal = e.target.checked; render(); });
  if (billingToggle) billingToggle.addEventListener('change', (e) => { state.showBilling = e.target.checked; render(); });
  if (barcodeToggle) barcodeToggle.addEventListener('change', (e) => { state.showBarcode = e.target.checked; render(); });
  if (taglineToggle) taglineToggle.addEventListener('change', (e) => { state.showTagline = e.target.checked; render(); });
  if (castToggle) castToggle.addEventListener('change', (e) => { state.showCastTags = e.target.checked; render(); });
  if (volToggle) volToggle.addEventListener('change', (e) => { state.showVol = e.target.checked; render(); });
  if (taglineTextInput) taglineTextInput.addEventListener('input', (e) => { state.taglineText = e.target.value; render(); });
  if (sealTextInput) sealTextInput.addEventListener('input', (e) => { state.sealText = e.target.value; render(); });
  if (billingTextInput) billingTextInput.addEventListener('input', (e) => { state.billingText = e.target.value; render(); });

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

  await render();

  if (params.get('shot') === 'editor') {
    window.__shotReady = true;
  }
});
