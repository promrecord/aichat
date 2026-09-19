import { HistoricalCharacter } from '../types';

/**
 * Creates a high-fidelity artistic historical costume portrait using HTML5 Canvas.
 * Seamlessly blends the uploaded face with the historical figure's iconic costume,
 * background atmosphere, royal embroidery, imperial seal stamp, and museum framing.
 */
export async function renderArtisticCostume(
  faceDataUrl: string,
  character: HistoricalCharacter,
  _additionalPrompt?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context could not be created.'));
      return;
    }

    const faceImg = new Image();
    faceImg.crossOrigin = 'anonymous';

    faceImg.onload = () => {
      try {
        drawPortraitComposition(ctx, faceImg, character);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    faceImg.onerror = () => {
      reject(new Error('Failed to load face image for costume rendering.'));
    };

    faceImg.src = faceDataUrl;
  });
}

function drawPortraitComposition(
  ctx: CanvasRenderingContext2D,
  faceImg: HTMLImageElement,
  character: HistoricalCharacter
) {
  const width = 900;
  const height = 900;

  // 1. Draw Character-Specific Background
  drawHistoricalBackground(ctx, character, width, height);

  // 2. Draw Face with Vignette and Harmonized Lighting
  drawHarmonizedFace(ctx, faceImg, width, height);

  // 3. Draw Historical Costume Overlays (Robes, armor, collar, accessories)
  drawHistoricalCostumeOverlays(ctx, character, width, height);

  // 4. Draw Atmospheric Lighting & Vignette
  drawAtmosphericLighting(ctx, width, height);

  // 5. Draw Royal Seal Stamp & Plaque
  drawRoyalSealAndPlaque(ctx, character, width, height);

  // 6. Draw Museum Gold Frame Border
  drawMuseumBorder(ctx, width, height);
}

function drawHistoricalBackground(
  ctx: CanvasRenderingContext2D,
  character: HistoricalCharacter,
  width: number,
  height: number
) {
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.38,
    80,
    width / 2,
    height / 2,
    width * 0.75
  );

  if (character.id === 'sejong') {
    // Royal Palace Crimson & Deep Indigo (Irworobongdo mood)
    bgGrad.addColorStop(0, '#5c1619');
    bgGrad.addColorStop(0.5, '#2e0a0d');
    bgGrad.addColorStop(1, '#110406');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle sun and moon circles behind
    ctx.save();
    ctx.fillStyle = 'rgba(234, 88, 12, 0.15)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.2, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.2, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (character.id === 'gwanggaeto') {
    // Vast Manchurian Night & Celestial Blue
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starry sparkles
    ctx.save();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % width;
      const sy = (i * 71) % (height * 0.45);
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (character.id === 'einstein') {
    // Vintage Academic Study & Dark Walnut
    bgGrad.addColorStop(0, '#292524');
    bgGrad.addColorStop(0.5, '#1c1917');
    bgGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Chalkboard formula watermark
    ctx.save();
    ctx.font = 'italic 28px serif';
    ctx.fillStyle = 'rgba(245, 245, 244, 0.08)';
    ctx.fillText('E = mc²', width * 0.1, height * 0.22);
    ctx.fillText('R_μν - 1/2 g_μν R = 8πG T_μν', width * 0.45, height * 0.18);
    ctx.fillText('G = 6.674 × 10⁻¹¹', width * 0.15, height * 0.32);
    ctx.restore();
  } else if (character.id === 'yisunsin') {
    // Deep Ocean Hansando Mist
    bgGrad.addColorStop(0, '#164e63');
    bgGrad.addColorStop(0.5, '#083344');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.font = 'italic 24px serif';
    ctx.fillStyle = 'rgba(103, 232, 249, 0.08)';
    ctx.fillText('必生則死 必死則生', width * 0.12, height * 0.25);
    ctx.restore();
  } else {
    // Cleopatra: Egyptian Lapis & Pure Gold
    bgGrad.addColorStop(0, '#78350f');
    bgGrad.addColorStop(0.5, '#451a03');
    bgGrad.addColorStop(1, '#0f0500');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawHarmonizedFace(
  ctx: CanvasRenderingContext2D,
  faceImg: HTMLImageElement,
  width: number,
  height: number
) {
  // Target face placement
  const targetFaceWidth = 460;
  const targetFaceHeight = 460;
  const targetX = (width - targetFaceWidth) / 2;
  const targetY = height * 0.14;

  ctx.save();

  // Create an oval feathered clipping mask so the face blends naturally into costume
  ctx.beginPath();
  const centerX = width / 2;
  const centerY = targetY + targetFaceHeight * 0.48;
  const radiusX = targetFaceWidth * 0.42;
  const radiusY = targetFaceHeight * 0.52;
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.clip();

  // Calculate aspect ratio crop of user face
  const imgAspect = faceImg.width / faceImg.height;
  let sWidth = faceImg.width;
  let sHeight = faceImg.height;
  let sx = 0;
  let sy = 0;

  if (imgAspect > 1) {
    sWidth = faceImg.height;
    sx = (faceImg.width - faceImg.height) / 2;
  } else {
    sHeight = faceImg.width;
    sy = (faceImg.height - faceImg.width) * 0.18; // focus slightly higher towards eyes
  }

  ctx.drawImage(faceImg, sx, sy, sWidth, sHeight, targetX, targetY, targetFaceWidth, targetFaceHeight);

  // Warm Oil-Painting Color Filter on face
  const warmWash = ctx.createLinearGradient(0, targetY, 0, targetY + targetFaceHeight);
  warmWash.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
  warmWash.addColorStop(0.6, 'rgba(217, 119, 6, 0.06)');
  warmWash.addColorStop(1, 'rgba(120, 53, 15, 0.25)');
  ctx.fillStyle = warmWash;
  ctx.fillRect(targetX, targetY, targetFaceWidth, targetFaceHeight);

  ctx.restore();

  // Draw soft feathered vignette along the face border
  ctx.save();
  const borderVignette = ctx.createRadialGradient(
    centerX,
    centerY,
    radiusX * 0.65,
    centerX,
    centerY,
    radiusX * 1.12
  );
  borderVignette.addColorStop(0, 'rgba(0,0,0,0)');
  borderVignette.addColorStop(0.7, 'rgba(15, 10, 8, 0.4)');
  borderVignette.addColorStop(1, 'rgba(10, 6, 4, 0.95)');
  ctx.fillStyle = borderVignette;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * 1.15, radiusY * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHistoricalCostumeOverlays(
  ctx: CanvasRenderingContext2D,
  character: HistoricalCharacter,
  width: number,
  height: number
) {
  const cx = width / 2;

  ctx.save();

  if (character.id === 'sejong') {
    // 1. King's Crimson Gonryongpo Robe (대례복 곤룡포)
    const robeGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    robeGrad.addColorStop(0, '#991b1b');
    robeGrad.addColorStop(0.4, '#7f1d1d');
    robeGrad.addColorStop(1, '#450a0a');

    ctx.fillStyle = robeGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 160, height * 0.44);
    // Left shoulder drape
    ctx.bezierCurveTo(cx - 280, height * 0.48, cx - 400, height * 0.62, 0, height * 0.72);
    ctx.lineTo(0, height);
    ctx.lineTo(width, height);
    // Right shoulder drape
    ctx.lineTo(width, height * 0.72);
    ctx.bezierCurveTo(cx + 400, height * 0.62, cx + 280, height * 0.48, cx + 160, height * 0.44);
    // Neckline collar
    ctx.bezierCurveTo(cx + 120, height * 0.54, cx - 120, height * 0.54, cx - 160, height * 0.44);
    ctx.closePath();
    ctx.fill();

    // White dongjeong (깃) inner collar
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx - 130, height * 0.45);
    ctx.quadraticCurveTo(cx, height * 0.56, cx + 130, height * 0.45);
    ctx.stroke();

    // Gold trim on robe collar
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 145, height * 0.47);
    ctx.quadraticCurveTo(cx, height * 0.58, cx + 145, height * 0.47);
    ctx.stroke();

    // Imperial Golden 5-Clawed Dragon Roundel (오조룡보 五爪龍補) on chest
    drawGoldenDragonEmblem(ctx, cx, height * 0.74, 110);

    // Ikseongwan (익선관) royal winged crown on head
    drawIkseongwanCrown(ctx, cx, height * 0.15);

  } else if (character.id === 'gwanggaeto') {
    // 2. Goguryeo Iron Lamellar Armor & Taewang Helmet
    const armorGrad = ctx.createLinearGradient(0, height * 0.44, 0, height);
    armorGrad.addColorStop(0, '#334155');
    armorGrad.addColorStop(0.5, '#1e293b');
    armorGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 170, height * 0.44);
    ctx.bezierCurveTo(cx - 300, height * 0.5, cx - 420, height * 0.65, 0, height * 0.75);
    ctx.lineTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.75);
    ctx.bezierCurveTo(cx + 420, height * 0.65, cx + 300, height * 0.5, cx + 170, height * 0.44);
    ctx.bezierCurveTo(cx + 120, height * 0.54, cx - 120, height * 0.54, cx - 170, height * 0.44);
    ctx.closePath();
    ctx.fill();

    // Iron lamellar scales pattern
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, height * 0.7, 95, 0, Math.PI * 2);
    ctx.stroke();

    // Red royal cloak on shoulders
    ctx.fillStyle = 'rgba(185, 28, 28, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.quadraticCurveTo(cx - 240, height * 0.52, cx - 160, height * 0.48);
    ctx.lineTo(cx - 140, height * 0.55);
    ctx.quadraticCurveTo(cx - 250, height * 0.65, 0, height * 0.95);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width, height * 0.75);
    ctx.quadraticCurveTo(cx + 240, height * 0.52, cx + 160, height * 0.48);
    ctx.lineTo(cx + 140, height * 0.55);
    ctx.quadraticCurveTo(cx + 250, height * 0.65, width, height * 0.95);
    ctx.closePath();
    ctx.fill();

    // Goguryeo Sun Eagle Emblem
    drawSunEagleEmblem(ctx, cx, height * 0.7, 85);

    // Taewang Helmet Horns / Plumage
    drawGoguryeoHelmet(ctx, cx, height * 0.14);

  } else if (character.id === 'einstein') {
    // 3. Vintage Princeton Tweed Jacket & Wool Sweater
    ctx.fillStyle = '#44403c'; // Dark tweed jacket
    ctx.beginPath();
    ctx.moveTo(cx - 160, height * 0.46);
    ctx.bezierCurveTo(cx - 300, height * 0.52, cx - 420, height * 0.68, 0, height * 0.78);
    ctx.lineTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.78);
    ctx.bezierCurveTo(cx + 420, height * 0.68, cx + 300, height * 0.52, cx + 160, height * 0.46);
    ctx.closePath();
    ctx.fill();

    // Inner grey knit sweater
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.moveTo(cx - 90, height * 0.5);
    ctx.lineTo(cx + 90, height * 0.5);
    ctx.lineTo(cx + 70, height * 0.85);
    ctx.lineTo(cx - 70, height * 0.85);
    ctx.closePath();
    ctx.fill();

    // Classic white open collar shirt
    ctx.fillStyle = '#f5f5f4';
    ctx.beginPath();
    ctx.moveTo(cx - 40, height * 0.51);
    ctx.lineTo(cx, height * 0.6);
    ctx.lineTo(cx + 40, height * 0.51);
    ctx.lineTo(cx + 25, height * 0.56);
    ctx.lineTo(cx - 25, height * 0.56);
    ctx.closePath();
    ctx.fill();

    // Tweed lapels
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(cx - 120, height * 0.46);
    ctx.lineTo(cx - 50, height * 0.72);
    ctx.lineTo(cx - 80, height);
    ctx.moveTo(cx + 120, height * 0.46);
    ctx.lineTo(cx + 50, height * 0.72);
    ctx.lineTo(cx + 80, height);
    ctx.stroke();

  } else if (character.id === 'yisunsin') {
    // 4. Admiral Dujeong-gap armor
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(cx - 165, height * 0.44);
    ctx.bezierCurveTo(cx - 290, height * 0.5, cx - 410, height * 0.65, 0, height * 0.76);
    ctx.lineTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.76);
    ctx.bezierCurveTo(cx + 410, height * 0.65, cx + 290, height * 0.5, cx + 165, height * 0.44);
    ctx.bezierCurveTo(cx + 120, height * 0.54, cx - 120, height * 0.54, cx - 165, height * 0.44);
    ctx.closePath();
    ctx.fill();

    // Brass studs (두정 鍮釘)
    ctx.fillStyle = '#fbbf24';
    for (let r = 0; r < 5; r++) {
      for (let c = -4; c <= 4; c++) {
        const bx = cx + c * 35;
        const by = height * 0.62 + r * 42;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  } else {
    // 5. Cleopatra Egyptian Royal Collar & Lapis Lazuli Wesekh
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(cx - 150, height * 0.45);
    ctx.bezierCurveTo(cx - 280, height * 0.5, cx - 400, height * 0.65, 0, height * 0.76);
    ctx.lineTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.76);
    ctx.bezierCurveTo(cx + 400, height * 0.65, cx + 280, height * 0.5, cx + 150, height * 0.45);
    ctx.closePath();
    ctx.fill();

    // Lapis lazuli & turquoise concentric rings
    const rings = ['#1e40af', '#0284c7', '#d97706', '#1e40af'];
    rings.forEach((color, idx) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, height * 0.42, 140 + idx * 24, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
    });
  }

  ctx.restore();
}

function drawGoldenDragonEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();
  // Outer gold circle with glow
  const goldGrad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.6, '#eab308');
  goldGrad.addColorStop(1, '#a16207');

  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Dragon silhouette & clouds
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 26px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('龍', x, y);

  ctx.restore();
}

function drawSunEagleEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Samjok-o (Three-legged crow / Sun bird) symbol
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('太王', x, y);
  ctx.restore();
}

function drawIkseongwanCrown(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number
) {
  ctx.save();
  ctx.fillStyle = '#171717';
  // Central dome
  ctx.beginPath();
  ctx.ellipse(cx, topY + 45, 100, 50, 0, Math.PI, 0);
  ctx.fill();

  // Upright wing fins (익 翼) of Ikseongwan
  ctx.fillStyle = '#262626';
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 3;

  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 65, topY + 15);
  ctx.quadraticCurveTo(cx - 120, topY - 60, cx - 75, topY - 75);
  ctx.quadraticCurveTo(cx - 40, topY - 30, cx - 45, topY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 65, topY + 15);
  ctx.quadraticCurveTo(cx + 120, topY - 60, cx + 75, topY - 75);
  ctx.quadraticCurveTo(cx + 40, topY - 30, cx + 45, topY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawGoguryeoHelmet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number
) {
  ctx.save();
  // Bronze helmet peak
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(cx, topY + 40, 110, 45, 0, Math.PI, 0);
  ctx.fill();

  // Golden apex fin
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.moveTo(cx, topY - 45);
  ctx.lineTo(cx - 20, topY + 10);
  ctx.lineTo(cx + 20, topY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAtmosphericLighting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  // Cinematic vignette around overall frame
  const edgeGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    width * 0.35,
    width / 2,
    height * 0.45,
    width * 0.72
  );
  edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
  edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawRoyalSealAndPlaque(
  ctx: CanvasRenderingContext2D,
  character: HistoricalCharacter,
  width: number,
  height: number
) {
  ctx.save();

  // 1. Traditional Red Seal Stamp (옥새 / 낙관 印) in bottom right
  const sealSize = 88;
  const sealX = width - sealSize - 40;
  const sealY = height - sealSize - 45;

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(sealX, sealY, sealSize, sealSize);

  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 3;
  ctx.strokeRect(sealX + 4, sealY + 4, sealSize - 8, sealSize - 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (character.id === 'sejong') {
    ctx.fillText('世宗', sealX + sealSize / 2, sealY + 28);
    ctx.fillText('大王', sealX + sealSize / 2, sealY + 58);
  } else if (character.id === 'gwanggaeto') {
    ctx.fillText('廣開', sealX + sealSize / 2, sealY + 28);
    ctx.fillText('土境', sealX + sealSize / 2, sealY + 58);
  } else if (character.id === 'einstein') {
    ctx.fillText('REL', sealX + sealSize / 2, sealY + 28);
    ctx.fillText('ATIV', sealX + sealSize / 2, sealY + 58);
  } else if (character.id === 'yisunsin') {
    ctx.fillText('忠武', sealX + sealSize / 2, sealY + 28);
    ctx.fillText('公印', sealX + sealSize / 2, sealY + 58);
  } else {
    ctx.fillText('CLEO', sealX + sealSize / 2, sealY + 28);
    ctx.fillText('PATRA', sealX + sealSize / 2, sealY + 58);
  }

  // 2. Museum Golden Character Plaque at bottom left
  const plaqueWidth = 340;
  const plaqueHeight = 64;
  const plaqueX = 40;
  const plaqueY = height - plaqueHeight - 45;

  ctx.fillStyle = 'rgba(12, 10, 9, 0.88)';
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(plaqueX, plaqueY, plaqueWidth, plaqueHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Text inside plaque
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px serif';
  ctx.textAlign = 'left';
  ctx.fillText(character.koreanName, plaqueX + 16, plaqueY + 28);

  ctx.fillStyle = '#a8a29e';
  ctx.font = '12px sans-serif';
  ctx.fillText(`${character.costumeName} · AI Master Portrait`, plaqueX + 16, plaqueY + 50);

  ctx.restore();
}

function drawMuseumBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  // Outer antique gold frame
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, width - 14, height - 14);

  // Inner thin gold fillet
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.restore();
}
