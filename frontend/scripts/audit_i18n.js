import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../src/locales');
const langFiles = ['en-GB.json', 'es.json', 'fr.json', 'ar.json'];

console.log("=========================================");
console.log("🌐 AUTOMATIC TRANSLATION AUDIT");
console.log("=========================================\n");

// 1. Verify JSON key parity across all languages
const loadedLocales = {};
langFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (fs.existsSync(filePath)) {
    loadedLocales[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    console.error(`❌ Missing locale file: ${file}`);
  }
});

const flattenKeys = (obj, prefix = '') => {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(flattenKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
};

const baseKeys = flattenKeys(loadedLocales['en-GB.json'] || {});
console.log(`✅ Base language (en-GB.json) total keys: ${baseKeys.length}`);

let missingKeyCount = 0;
langFiles.forEach(file => {
  if (file === 'en-GB.json') return;
  const currentKeys = new Set(flattenKeys(loadedLocales[file] || {}));
  const missingInCurrent = baseKeys.filter(k => !currentKeys.has(k));
  if (missingInCurrent.length > 0) {
    console.error(`❌ ${file} is missing ${missingInCurrent.length} keys:`, missingInCurrent);
    missingKeyCount += missingInCurrent.length;
  } else {
    console.log(`✅ ${file} has 100% key parity (${currentKeys.size} keys)`);
  }
});

if (missingKeyCount === 0) {
  console.log("\n🎉 Audit Passed: All 4 language files have 100% matching translation keys!");
} else {
  console.error(`\n⚠️ Audit Warnings: ${missingKeyCount} total missing keys detected.`);
}
