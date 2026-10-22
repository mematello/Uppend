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
let rawCss = '';
for (const file of cssFiles) {
  const stat = fs.statSync(file);
  if (stat.mtimeMs > newestCssTime) newestCssTime = stat.mtimeMs;
  rawCss += fs.readFileSync(file, 'utf8') + '\n';
}

if (newestCssTime < newestSourceTime) {
  console.error('ERROR: Compiled .next CSS is older than newest source file. Please run "npm run build" first.');
  process.exit(1);
}

// Unescape compiled CSS selectors to match arbitrary values and variants cleanly
const unescapedCss = rawCss.replace(/\\(.)/g, '$1');

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

// Match selector in compiled CSS (accounts for Tailwind arbitrary values, variants, and custom utilities)
function isClassInCss(className) {
  // 1. Try matching against unescaped CSS (matches Tailwind arbitrary values, variants, etc.)
  const escaped = escapeRegex(className);
  const pattern = new RegExp(`\\.${escaped}(?=[\\s,.:>~+*#\\[\\](){}|\\^$="'` + '`' + `]|$)`);
  if (pattern.test(unescapedCss)) return true;

  // 2. Also check standard CSS-escaped selector in rawCss
  const cssEscaped = className
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.')
    .replace(/%/g, '\\%')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
  const rawPattern = new RegExp(`\\.${escapeRegex(cssEscaped)}(?=[\\s,.:>~+*#\\[\\](){}|\\^$="'` + '`' + `]|$)`);
  return rawPattern.test(rawCss);
}

const verifiedClasses = new Set();
const deadClasses = [];
const unresolvedDynamic = [];

function checkToken(token, filePath, lineNo) {
  if (!token || token.includes('${') || token.startsWith(':') || token === 'true' || token === 'false') {
    return;
  }
  if (verifiedClasses.has(token)) return;

  if (isClassInCss(token)) {
    verifiedClasses.add(token);
  } else {
    deadClasses.push({ file: filePath, line: lineNo, className: token });
  }
}

for (const filePath of args) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check lookup tables (e.g. const STATUS_COLORS: Record<string, string> = { ... })
  const lookupTableRegex = /(?:const|let|var)\s+([A-Z0-9_]+)(?:\s*:\s*[^=]+)?\s*=\s*\{([\s\S]*?)\};/g;
  let ltm;
  while ((ltm = lookupTableRegex.exec(content)) !== null) {
    const tableBody = ltm[2];
    const stringRegex = /:\s*['"]([^'"]+)['"]/g;
    let sm;
    while ((sm = stringRegex.exec(tableBody)) !== null) {
      const lineNo = content.slice(0, ltm.index + sm.index).split('\n').length;
      for (const token of sm[1].split(/\s+/).filter(Boolean)) {
        checkToken(token, filePath, lineNo);
      }
    }
  }

  // 2. Check className and class attributes
  const classAttrRegex = /(?:className|class)=(?:\{`([\s\S]*?)`(?:\s*\.\s*trim\(\))?\s*\}|"([^"]+)"|'([^']+)'|\{([^}]+)\})/g;
  let match;
  while ((match = classAttrRegex.exec(content)) !== null) {
    const lineNo = content.slice(0, match.index).split('\n').length;

    if (match[1]) {
      // Template literal with potential ${...}
      // 2a. Static tokens outside ${...}
      const staticParts = match[1].replace(/\$\{[\s\S]*?\}/g, ' ');
      for (const token of staticParts.split(/\s+/).filter(Boolean)) {
        checkToken(token, filePath, lineNo);
      }

      // 2b. Dynamic expressions inside ${...}
      const exprRegex = /\$\{([\s\S]*?)\}/g;
      let em;
      while ((em = exprRegex.exec(match[1])) !== null) {
        const expr = em[1].trim();
        const exprLine = content.slice(0, match.index + em.index).split('\n').length;

        // Extract branch string literals (after ?, :, &&, ||)
        const branchStringRegex = /(?:\?|:|\&\&|\|\|)\s*['"]([^'"]*)['"]/g;
        const branchTokens = [];
        let bsm;
        while ((bsm = branchStringRegex.exec(expr)) !== null) {
          if (bsm[1]) {
            branchTokens.push(...bsm[1].split(/\s+/).filter(Boolean));
          }
        }

        if (branchTokens.length > 0) {
          for (const token of branchTokens) {
            checkToken(token, filePath, exprLine);
          }
        } else {
          // Unresolved dynamic expression (e.g. variable lookup STATUS_COLORS[app.status])
          unresolvedDynamic.push({
            file: filePath,
            line: exprLine,
            expression: expr.replace(/\s+/g, ' ')
          });
        }
      }
    } else if (match[2] || match[3]) {
      // Plain static string
      const rawString = match[2] || match[3];
      for (const token of rawString.split(/\s+/).filter(Boolean)) {
        checkToken(token, filePath, lineNo);
      }
    } else if (match[4]) {
      // Expression inside { ... }
      const expr = match[4].trim();
      const quotedMatch = /^['"]([\s\S]*)['"]$/.exec(expr);
      if (quotedMatch) {
        for (const token of quotedMatch[1].split(/\s+/).filter(Boolean)) {
          checkToken(token, filePath, lineNo);
        }
      } else {
        const branchStringRegex = /(?:\?|:|\&\&|\|\|)\s*['"]([^'"]*)['"]/g;
        const branchTokens = [];
        let bsm;
        while ((bsm = branchStringRegex.exec(expr)) !== null) {
          if (bsm[1]) {
            branchTokens.push(...bsm[1].split(/\s+/).filter(Boolean));
          }
        }

        if (branchTokens.length > 0) {
          for (const token of branchTokens) {
            checkToken(token, filePath, lineNo);
          }
        } else {
          // Bare identifier or unresolved expression (e.g. mergedClassName, resolvedWrapper, x.trim())
          unresolvedDynamic.push({
            file: filePath,
            line: lineNo,
            expression: expr.replace(/\s+/g, ' ')
          });
        }
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
  console.log(`  [UNRESOLVED] ${item.file}:${item.line}: ${item.expression}`);
}

const unexpectedDead = deadClasses.filter(item => !KNOWN_PRE_EXISTING_DEAD.has(item.className));
const preExistingDead = deadClasses.filter(item => KNOWN_PRE_EXISTING_DEAD.has(item.className));

console.log(`\nKnown pre-existing dead classes (excluded from gate): ${preExistingDead.length}`);
for (const item of preExistingDead) {
  console.log(`  [KNOWN PRE-EXISTING] ${item.file}:${item.line}: ${item.className}`);
}

console.log(`\nUnexpected dead classes: ${unexpectedDead.length}`);
for (const item of unexpectedDead) {
  console.log(`  [DEAD CLASS] ${item.file}:${item.line}: ${item.className}`);
}

if (unexpectedDead.length > 0) {
  console.error(`\nFAIL: ${unexpectedDead.length} unexpected dead class(es) found in scanned files.\n`);
  process.exit(1);
} else {
  console.log(`\nSUCCESS: 0 unexpected dead classes found.\n`);
  process.exit(0);
}
