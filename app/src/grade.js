// VICE COVER - Photo Grading & Canvas Effects (Golden Hour Default, Gradient Map, Halftone, Grain, Vignette)
// Stage 7 keeps golden-hour as the default for the editor and cover shots.

export function applyGrade(ctx, width, height, preset = 'golden-hour', intensity = 1.0) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Presets mapping: [shadowRGB, midRGB, highlightRGB]
  const presets = {
    'golden-hour': {
      shadow: [45, 18, 30],     // warm rich shadow
      mid: [220, 120, 45],      // warm amber / gold
      high: [255, 210, 120]     // bright golden sunlight
    },
    sunset: {
      shadow: [15, 5, 35],     // deep indigo night
      mid: [219, 39, 119],      // hot pink / magenta
      high: [249, 115, 22]      // warm orange / gold
    },
    neon: {
      shadow: [10, 15, 30],     // dark blue night
      mid: [147, 51, 234],      // electric purple
      high: [6, 182, 212]       // neon cyan
    },
    noir: {
      shadow: [15, 15, 15],     // deep black
      mid: [100, 100, 100],     // neutral gray
      high: [240, 240, 240]     // bright white
    },
    pastel: {
      shadow: [75, 45, 95],     // soft plum
      mid: [236, 72, 153],      // pink
      high: [251, 191, 36]      // warm yellow
    }
  };

  const p = presets[preset] || presets['golden-hour'];

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Contrast & Saturation boost
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;
    lum = ((lum - 128) * 1.3) + 128;
    lum = Math.max(0, Math.min(255, lum));

    let t = lum / 255;

    let outR, outG, outB;
    if (t < 0.5) {
      let f = t * 2;
      outR = p.shadow[0] * (1 - f) + p.mid[0] * f;
      outG = p.shadow[1] * (1 - f) + p.mid[1] * f;
      outB = p.shadow[2] * (1 - f) + p.mid[2] * f;
    } else {
      let f = (t - 0.5) * 2;
      outR = p.mid[0] * (1 - f) + p.high[0] * f;
      outG = p.mid[1] * (1 - f) + p.high[1] * f;
      outB = p.mid[2] * (1 - f) + p.high[2] * f;
    }

    // Blend with original based on intensity
    data[i]     = Math.min(255, Math.max(0, r * (1 - intensity) + outR * intensity));
    data[i + 1] = Math.min(255, Math.max(0, g * (1 - intensity) + outG * intensity));
    data[i + 2] = Math.min(255, Math.max(0, b * (1 - intensity) + outB * intensity));
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply Vignette & Warm Glow
  if (intensity > 0) {
    addVignette(ctx, width, height, intensity);
  }
}

export function addVignette(ctx, width, height, intensity = 1.0) {
  ctx.save();
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  grad.addColorStop(0, 'rgba(255,180,50,0.05)');
  grad.addColorStop(0.7, `rgba(45, 15, 30, ${0.4 * intensity})`);
  grad.addColorStop(1, `rgba(20, 5, 15, ${0.85 * intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function addFilmGrain(ctx, width, height, amount = 0.08) {
  ctx.save();
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.3) {
      const noise = (Math.random() - 0.5) * 50 * amount;
      data[i]     = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.restore();
}
