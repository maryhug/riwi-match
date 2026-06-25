const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src');

const replacements = {
  // Violet -> Primary
  'violet-500': 'primary',
  'violet-600': 'primary-dark',
  'violet-700': 'primary-dark',
  'violet-100': 'primary-light',
  'violet-50': 'primary-xlight',
  'violet-200': 'primary-light',
  'violet-300': 'primary-light',
  'violet-400': 'primary',
  '#967DF5': 'var(--color-primary)',
  '#7A6CE0': 'var(--color-primary-dark)',
  '#EEE9FF': 'var(--color-primary-light)',
  
  // Emerald -> Mint
  'emerald-500': 'mint',
  'emerald-600': 'mint',
  'emerald-700': 'mint',
  'emerald-100': 'mint-light',
  'emerald-50': 'mint-light',
  '#8ED9C4': 'var(--color-mint)',
  
  // Amber -> Accent
  'amber-500': 'accent',
  'amber-600': 'accent',
  'amber-700': 'accent',
  'amber-100': 'accent-light',
  'amber-50': 'accent-light',
  '#FFB863': 'var(--color-accent)',
  
  // Red -> Coral
  'red-500': 'coral',
  'red-600': 'coral-dark',
  'red-700': 'coral-dark',
  'red-100': 'coral-light',
  'red-50': 'coral-light',
  '#FF596D': 'var(--color-coral)',

  // Hex outliers in Badge
  '#0D9488': '#8ED9C4', // Dark teal -> Mint
  '#D97706': '#FFB863', // Dark amber -> Accent
  '#E11D48': '#FF596D', // Dark red -> Coral
  
  // Default values used improperly
  '#1E1B4B': 'var(--color-ink)',
  '#374151': 'var(--color-text)',
  '#9CA3AF': 'var(--color-text-muted)',
};

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Replace classes
      for (const [key, value] of Object.entries(replacements)) {
        // Regex to match prefix-color-variant, e.g., bg-violet-500, text-violet-600
        // and also just replace the exact strings
        const regex = new RegExp(key, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

walk(dir);
console.log('Done');
