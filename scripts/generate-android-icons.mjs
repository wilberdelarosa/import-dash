/**
 * Script para generar íconos de Android
 * Ejecutar con: node scripts/generate-android-icons.mjs
 * 
 * Nota: Necesita tener una imagen logo.png en la carpeta public/
 */

import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ANDROID_RES_PATH = './android/app/src/main/res';

// Color primario de la app (indigo-500)
const PRIMARY_COLOR = { r: 99, g: 102, b: 241 };
const BACKGROUND_COLOR = { r: 15, g: 23, b: 42 }; // slate-900

// Tamaños de íconos de Android (mipmap)
const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Tamaños de íconos foreground (adaptive icons)
const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Función para crear un logo simple basado en texto "A" (Alito)
async function createLogoSVG(size) {
  const fontSize = Math.round(size * 0.55);
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0f172a"/>
      <text 
        x="50%" 
        y="55%" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="url(#grad)" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >A</text>
    </svg>
  `;
  return Buffer.from(svg);
}

// Función para crear un foreground circular
async function createForegroundSVG(size) {
  const innerSize = Math.round(size * 0.5);
  const offset = (size - innerSize) / 2;
  const fontSize = Math.round(innerSize * 0.55);
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <text 
        x="50%" 
        y="55%" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="url(#grad)" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >A</text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function generateIcons() {
  console.log('🎨 Generando íconos de Android para Alito...\n');

  try {
    // Generar íconos launcher (cuadrados con esquinas redondeadas)
    for (const [folder, size] of Object.entries(ICON_SIZES)) {
      const outputPath = path.join(ANDROID_RES_PATH, folder);
      
      // Asegurar que existe la carpeta
      if (!existsSync(outputPath)) {
        await mkdir(outputPath, { recursive: true });
      }

      // Crear logo SVG
      const logoSVG = await createLogoSVG(size);

      // Generar ic_launcher.png
      await sharp(logoSVG)
        .png()
        .toFile(path.join(outputPath, 'ic_launcher.png'));

      // Generar ic_launcher_round.png (circular)
      const roundSize = size;
      const roundSVG = `
        <svg width="${roundSize}" height="${roundSize}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
            </linearGradient>
            <clipPath id="circle">
              <circle cx="${roundSize/2}" cy="${roundSize/2}" r="${roundSize/2}"/>
            </clipPath>
          </defs>
          <circle cx="${roundSize/2}" cy="${roundSize/2}" r="${roundSize/2}" fill="#0f172a"/>
          <text 
            x="50%" 
            y="55%" 
            font-family="Arial, sans-serif" 
            font-size="${Math.round(roundSize * 0.5)}" 
            font-weight="bold" 
            fill="url(#grad)" 
            text-anchor="middle" 
            dominant-baseline="middle"
          >A</text>
        </svg>
      `;

      await sharp(Buffer.from(roundSVG))
        .png()
        .toFile(path.join(outputPath, 'ic_launcher_round.png'));

      console.log(`✅ ${folder}: ${size}x${size}px`);
    }

    // Generar íconos foreground para adaptive icons
    for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
      const outputPath = path.join(ANDROID_RES_PATH, folder);

      const foregroundSVG = await createForegroundSVG(size);

      await sharp(foregroundSVG)
        .png()
        .toFile(path.join(outputPath, 'ic_launcher_foreground.png'));

      console.log(`✅ ${folder} foreground: ${size}x${size}px`);
    }

    console.log('\n🎉 ¡Íconos generados exitosamente!');
    console.log('\nAhora ejecuta: npx cap sync android');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateIcons();
