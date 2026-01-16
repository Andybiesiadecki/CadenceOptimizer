const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  console.log('🎨 Generating STRDR app icons...');

  try {
    // Main App Icon (1024x1024)
    await sharp('assets/icon-source.svg')
      .resize(1024, 1024)
      .png()
      .toFile('assets/icon.png');
    console.log('✅ Generated icon.png (1024x1024)');

    // Android Adaptive Icon (512x512)
    await sharp('assets/adaptive-icon-source.svg')
      .resize(512, 512)
      .png()
      .toFile('assets/adaptive-icon.png');
    console.log('✅ Generated adaptive-icon.png (512x512)');

    // Splash Screen (1242x2436)
    await sharp('assets/splash-source.svg')
      .resize(1242, 2436)
      .png()
      .toFile('assets/splash.png');
    console.log('✅ Generated splash.png (1242x2436)');

    // Favicon (32x32)
    await sharp('assets/favicon-source.svg')
      .resize(32, 32)
      .png()
      .toFile('assets/favicon.png');
    console.log('✅ Generated favicon.png (32x32)');

    // Additional web icons
    await sharp('assets/icon-source.svg')
      .resize(192, 192)
      .png()
      .toFile('assets/icon-192.png');
    console.log('✅ Generated icon-192.png (192x192)');

    await sharp('assets/icon-source.svg')
      .resize(512, 512)
      .png()
      .toFile('assets/icon-512.png');
    console.log('✅ Generated icon-512.png (512x512)');

    console.log('🚀 All STRDR icons generated successfully!');
    console.log('📱 Ready for iOS, Android, and Web deployment');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();