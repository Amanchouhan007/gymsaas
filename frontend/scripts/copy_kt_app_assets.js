const fs = require('fs');
const path = require('path');

const srcLogo = path.join(__dirname, '../src/assets/Logo/kt_logo.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

if (!fs.existsSync(srcLogo)) {
  console.error('Source logo not found:', srcLogo);
  process.exit(1);
}

const logoData = fs.readFileSync(srcLogo);

// 1. Update Splash images in drawable folders
const drawableFolders = [
  'drawable',
  'drawable-port-hdpi',
  'drawable-port-mdpi',
  'drawable-port-xhdpi',
  'drawable-port-xxhdpi',
  'drawable-port-xxxhdpi',
  'drawable-land-hdpi',
  'drawable-land-mdpi',
  'drawable-land-xhdpi',
  'drawable-land-xxhdpi',
  'drawable-land-xxxhdpi',
];

drawableFolders.forEach((folder) => {
  const folderPath = path.join(resDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const splashPath = path.join(folderPath, 'splash.png');
  fs.writeFileSync(splashPath, logoData);
  console.log('Updated splash:', splashPath);
});

// 2. Update Launcher icons in mipmap folders
const mipmapFolders = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

mipmapFolders.forEach((folder) => {
  const folderPath = path.join(resDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'].forEach((iconName) => {
    const iconPath = path.join(folderPath, iconName);
    fs.writeFileSync(iconPath, logoData);
    console.log('Updated icon:', iconPath);
  });
});

console.log('✅ KT Logo successfully applied to all Android Launcher Icons and Splash Screens!');
