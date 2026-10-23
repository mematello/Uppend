import { execSync } from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/ui-checks/token-delta.mjs <file1> [file2 ...]');
  process.exit(1);
}

function extractClassTokens(content) {
  const tokens = new Set();
  const regex = /className=(?:["']([^"']+)["']|\{`([^`]+)`\}|\{["']([^"']+)["']\})/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const raw = match[1] || match[2] || match[3] || '';
    const cleaned = raw.replace(/\$\{[^}]+\}/g, ' ');
    cleaned.trim().split(/\s+/).filter(Boolean).forEach(t => tokens.add(t));
  }
  return tokens;
}

function findRawColors(content) {
  const violations = [];
  // Exclude comments
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    // Check for #hex (3, 4, 6, 8 digits)
    const hexMatch = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexMatch) {
      hexMatch.forEach(h => violations.push({ line: idx + 1, match: h, type: 'hex' }));
    }
    // Check for rgba( or rgb( or hsl(
    const funcMatch = line.match(/\b(rgba?|hsla?)\([^)]+\)/g);
    if (funcMatch) {
      funcMatch.forEach(f => violations.push({ line: idx + 1, match: f, type: 'color-function' }));
    }
  });
  return violations;
}

console.log('=== Token Delta & Color Literal Audit ===\n');

let hasViolations = false;

for (const filePath of args) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  const currentContent = fs.readFileSync(filePath, 'utf8');
  let mainContent = '';
  try {
    mainContent = execSync(`git show main:${filePath.replace(/\\/g, '/')}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  } catch {
    // New file on branch
    mainContent = '';
  }

  const currentTokens = extractClassTokens(currentContent);
  const mainTokens = extractClassTokens(mainContent);

  const added = [...currentTokens].filter(t => !mainTokens.has(t)).sort();
  const removed = [...mainTokens].filter(t => !currentTokens.has(t)).sort();

  console.log(`File: ${filePath}`);
  console.log(`  Tokens Added (${added.length}): ${added.join(', ') || '(none)'}`);
  console.log(`  Tokens Removed (${removed.length}): ${removed.join(', ') || '(none)'}`);

  // Exclude CSS definition files like app/globals.css from raw hex literal check
  const isCssFile = filePath.endsWith('.css');
  if (!isCssFile) {
    const rawColors = findRawColors(currentContent, filePath);
    // Compare with main to only check added raw colors
    const mainRawColors = findRawColors(mainContent, filePath).map(v => v.match);
    const addedRawColors = rawColors.filter(v => !mainRawColors.includes(v.match));

    if (addedRawColors.length > 0) {
      hasViolations = true;
      console.error(`  [FAIL] Added raw color literal(s) in TSX/TS:`);
      addedRawColors.forEach(v => {
        console.error(`    Line ${v.line}: ${v.match} (${v.type})`);
      });
    } else {
      console.log(`  Raw color literals added: 0 (PASS)`);
    }
  } else {
    console.log(`  CSS file: exempt from raw color check (token definition file)`);
  }
  console.log('');
}

if (hasViolations) {
  console.error('FAIL: Added raw color literal(s) found in TSX/TS files.\n');
  process.exit(1);
} else {
  console.log('SUCCESS: Token delta clean; 0 unauthorized raw color literals added.\n');
  process.exit(0);
}
