import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/ui-checks/dead-class-scan.mjs <file1> [file2 ...]');
  process.exit(1);
}

// Find compiled .next CSS files
const nextChunksDir = path.resolve('.next/static/chunks');
if (!fs.existsSync(nextChunksDir)) {
  console.error('ERROR: .next/static/chunks directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const cssFiles = fs.readdirSync(nextChunksDir)
  .filter(f => f.endsWith('.css'))
  .map(f => path.join(nextChunksDir, f));

if (cssFiles.length === 0) {
  console.error('ERROR: No compiled CSS chunks found under .next/static/chunks. Please run "npm run build" first.');
  process.exit(1);
}

// Verify compiled CSS freshness vs newest target file
let newestSourceTime = 0;
for (const file of args) {
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    if (stat.mtimeMs > newestSourceTime) {
      newestSourceTime = stat.mtimeMs;
    }
  }
}

let newestCssTime = 0;
let combinedCss = '';
for (const file of cssFiles) {
  const stat = fs.statSync(file);
  if (stat.mtimeMs > newestCssTime) newestCssTime = stat.mtimeMs;
  combinedCss += fs.readFileSync(file, 'utf8') + '\n';
}

if (newestCssTime < newestSourceTime) {
  console.warn('WARNING: Compiled .next CSS is older than newest source file. For strictly accurate results, run "npm run build".');
}

// Known pre-existing dead classes outside dashboard
const KNOWN_PRE_EXISTING_DEAD = new Set([
  'animate-in',
  'fade-in',
  'zoom-in',
  'duration-300',
  'prose',
  'dark:prose-invert',
  'zoom-in-95',
  'duration-200'
]);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Match selector in compiled CSS (accounts for CSS escaping of colons, brackets, slashes, etc.)
function isClassInCss(className, css) {
  // Built-in CSS selectors escape special characters
  // e.g., sm:flex-row -> sm\:flex-row
  // min-h-[44px] -> min-h-\[44px\]
  // dark:bg-amber-900/20 -> dark\:bg-amber-900\/20
  const escaped = className
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.')
    .replace(/%/g, '\\%')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  // Look for .escapedClass in selector position
  const pattern = new RegExp(`\\.${escapeRegex(escaped)}(?=[\\s,.:>~+*#\\[\\](){}|\\^$="'` + '`' + `]|$)`);
  if (pattern.test(css)) return true;

  // Also check unescaped literal for custom utility classes
  const rawPattern = new RegExp(`\\.${escapeRegex(className)}(?=[\\s,.:>~+*#\\[\\](){}|\\^$="'` + '`' + `]|$)`);
  return rawPattern.test(css);
}

const verifiedClasses = new Set();
const deadClasses = [];
const unresolvedDynamic = [];

for (const filePath of args) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check template literal expressions that create dynamic tokens
  const dynamicTemplateMatches = content.match(/className=\{`([^`]+)`\}/g) || [];
  for (const block of dynamicTemplateMatches) {
    const exprMatches = block.match(/\$\{[^}]+\}/g) || [];
    for (const expr of exprMatches) {
      unresolvedDynamic.push({ file: filePath, expression: expr });
    }
  }

  // 2. Extract static class tokens
  // Match className="..." and className={'...'} and static parts of className={`...`}
  const classAttrRegex = /className=(?:["']([^"']+)["']|\{`([^`]+)`\}|\{["']([^"']+)["']\})/g;
  let match;
  while ((match = classAttrRegex.exec(content)) !== null) {
    const rawString = match[1] || match[2] || match[3] || '';
    // Strip ${...} from template string to get static tokens
    const cleanedString = rawString.replace(/\$\{[^}]+\}/g, ' ');
    const tokens = cleanedString.trim().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      if (!token || token.includes('${') || token.startsWith(':') || token === 'true' || token === 'false') {
        continue;
      }
      if (verifiedClasses.has(token)) continue;

      if (isClassInCss(token, combinedCss)) {
        verifiedClasses.add(token);
      } else {
        deadClasses.push({ file: filePath, className: token });
      }
    }
  }
}

// Report
console.log('=== Dead Class Verification Report ===\n');
console.log(`Files scanned: ${args.length}`);
console.log(`Verified CSS classes: ${verifiedClasses.size}`);
console.log(`Unresolved dynamic expressions: ${unresolvedDynamic.length}`);
for (const item of unresolvedDynamic) {
  console.log(`  [DYNAMIC] ${path.basename(item.file)} -> ${item.expression}`);
}

const unexpectedDead = deadClasses.filter(item => !KNOWN_PRE_EXISTING_DEAD.has(item.className));
const preExistingDead = deadClasses.filter(item => KNOWN_PRE_EXISTING_DEAD.has(item.className));

console.log(`\nKnown pre-existing dead classes (excluded from gate): ${preExistingDead.length}`);
for (const item of preExistingDead) {
  console.log(`  [KNOWN PRE-EXISTING] ${path.basename(item.file)}: ${item.className}`);
}

console.log(`\nUnexpected dead classes: ${unexpectedDead.length}`);
for (const item of unexpectedDead) {
  console.log(`  [DEAD CLASS] ${item.file}: ${item.className}`);
}

if (unexpectedDead.length > 0) {
  console.error(`\nFAIL: ${unexpectedDead.length} unexpected dead class(es) found in scanned files.\n`);
  process.exit(1);
} else {
  console.log('\nSUCCESS: 0 unexpected dead classes found.\n');
  process.exit(0);
}
