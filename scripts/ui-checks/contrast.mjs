import fs from 'node:fs';
import path from 'node:path';

// Parse app/globals.css
const globalsPath = path.resolve('app/globals.css');
const globalsContent = fs.readFileSync(globalsPath, 'utf8');

// Parse node_modules/tailwindcss/theme.css
const themePath = path.resolve('node_modules/tailwindcss/theme.css');
const themeContent = fs.readFileSync(themePath, 'utf8');

// OKLCH -> linear sRGB -> sRGB hex conversion
function oklchToHex(lStr, cStr, hStr) {
  let l = parseFloat(lStr);
  if (lStr.includes('%')) l = l / 100;
  const c = parseFloat(cStr);
  const h = parseFloat(hStr);

  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  function toHex(val) {
    const clamped = Math.max(0, Math.min(1, val));
    const srgb = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(srgb * 255).toString(16).padStart(2, '0');
  }

  return `#${toHex(rLin)}${toHex(gLin)}${toHex(bLin)}`.toUpperCase();
}

// Map tailwind theme colors
const tailwindColors = new Map();
const themeRegex = /--color-([a-z0-9-]+):\s*oklch\(([^)]+)\);/g;
let tMatch;
while ((tMatch = themeRegex.exec(themeContent)) !== null) {
  const name = tMatch[1];
  const parts = tMatch[2].trim().split(/\s+/);
  if (parts.length >= 3) {
    const hex = oklchToHex(parts[0], parts[1], parts[2]);
    tailwindColors.set(`--color-${name}`, hex);
  }
}

// Parse block variables (:root or .dark)
function parseBlockVars(blockStr) {
  const vars = new Map();
  const rawSources = new Map();
  const lineRegex = /--([a-z0-9-]+):\s*([^;]+);/g;
  let m;
  while ((m = lineRegex.exec(blockStr)) !== null) {
    const name = `--${m[1]}`;
    const rawVal = m[2].trim();
    rawSources.set(name, rawVal);
    if (rawVal.startsWith('#')) {
      vars.set(name, rawVal.toUpperCase());
    } else if (rawVal.startsWith('rgba(')) {
      vars.set(name, rawVal);
    } else if (rawVal.startsWith('var(')) {
      const target = rawVal.match(/var\((--[a-z0-9-]+)\)/)?.[1];
      if (target && tailwindColors.has(target)) {
        vars.set(name, tailwindColors.get(target));
      } else {
        vars.set(name, rawVal);
      }
    } else {
      vars.set(name, rawVal);
    }
  }
  return { vars, rawSources };
}

const rootBlock = globalsContent.match(/:root\s*\{([^}]+)\}/)?.[1] || '';
const darkBlock = globalsContent.match(/\.dark\s*\{([^}]+)\}/)?.[1] || '';

const lightTheme = parseBlockVars(rootBlock);
const darkTheme = parseBlockVars(darkBlock);

// Relative luminance
function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

let hasFailure = false;

function checkPair(groupName, label, themeName, token1, hex1, src1, token2, hex2, src2, minRatio, isGated = true) {
  const ratio = getContrastRatio(hex1, hex2);
  const pass = ratio >= minRatio;
  if (!pass && isGated) {
    hasFailure = true;
  }
  const status = pass ? 'PASS' : (isGated ? 'FAIL' : 'INFO');
  const gateText = isGated ? `>= ${minRatio}:1` : 'exempt';
  console.log(
    `[${status}] [${groupName}] (${themeName}) ${label}\n` +
    `  Token 1: ${token1} = ${hex1} (src: "${src1}")\n` +
    `  Token 2: ${token2} = ${hex2} (src: "${src2}")\n` +
    `  Ratio: ${ratio.toFixed(2)}:1 (gate: ${gateText})\n`
  );
}

console.log('=== WCAG AA Contrast Evaluation (Dynamic Token Parser) ===\n');

// 1. Group A: Text Pairs (>= 4.5:1)
console.log('--- Group (a): Text Pairs (Threshold: >= 4.5:1) ---');
for (const [themeName, theme] of [['Light', lightTheme], ['Dark', darkTheme]]) {
  const p = theme.vars.get('--paper');
  const c = theme.vars.get('--card');
  const ink = theme.vars.get('--ink');
  const muted = theme.vars.get('--muted');
  const accent = theme.vars.get('--accent');
  const onAccent = theme.vars.get('--on-accent');
  const rowHover = theme.vars.get('--row-hover');

  checkPair('Text', 'Ink on Paper', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--paper', p, theme.rawSources.get('--paper'), 4.5);
  checkPair('Text', 'Ink on Card', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 4.5);
  checkPair('Text', 'Ink on Row-Hover', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--row-hover', rowHover, theme.rawSources.get('--row-hover'), 4.5);
  checkPair('Text', 'Muted on Paper', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--paper', p, theme.rawSources.get('--paper'), 4.5);
  checkPair('Text', 'Muted on Card', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--card', c, theme.rawSources.get('--card'), 4.5);
  checkPair('Text', 'Muted on Row-Hover', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--row-hover', rowHover, theme.rawSources.get('--row-hover'), 4.5);
  checkPair('Text', 'Paper on Ink (Primary Button)', themeName, '--paper', p, theme.rawSources.get('--paper'), '--ink', ink, theme.rawSources.get('--ink'), 4.5);
  checkPair('Text', 'On-Accent on Accent (for text and icons)', themeName, '--on-accent', onAccent, theme.rawSources.get('--on-accent'), '--accent', accent, theme.rawSources.get('--accent'), 4.5);

  // Placeholder and Muted Icons
  checkPair('Text', 'Placeholder Text (Muted on Card)', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--card', c, theme.rawSources.get('--card'), 4.5);
  checkPair('Text', 'Muted Icon / Chevron on Card', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--card', c, theme.rawSources.get('--card'), 4.5);

  // Destructive Red Text on Card (Planned in LogoutButton: text-red-700 light / text-red-400 dark)
  const redToken = themeName === 'Light' ? '--color-red-700' : '--color-red-400';
  const redHex = tailwindColors.get(redToken);
  checkPair('Text', `Destructive Text (${redToken} on Card)`, themeName, redToken, redHex, `node_modules:${redToken}`, '--card', c, theme.rawSources.get('--card'), 4.5);

  // Status Chips Text
  checkPair('Chip Text', 'Draft (Ink on Card)', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 4.5);
  checkPair('Chip Text', 'Interview (Paper on Ink)', themeName, '--paper', p, theme.rawSources.get('--paper'), '--ink', ink, theme.rawSources.get('--ink'), 4.5);
  checkPair('Chip Text', 'Withdrawn / Ghosted (Muted on Card)', themeName, '--muted', muted, theme.rawSources.get('--muted'), '--card', c, theme.rawSources.get('--card'), 4.5);

  const offerBgToken = themeName === 'Light' ? '--color-green-700' : '--color-green-800';
  const offerBg = tailwindColors.get(offerBgToken);
  checkPair('Chip Text', `Offer (#FFFFFF on ${offerBgToken})`, themeName, '#FFFFFF', '#FFFFFF', 'white', offerBgToken, offerBg, `node_modules:${offerBgToken}`, 4.5);

  const rejBgToken = themeName === 'Light' ? '--color-red-700' : '--color-red-800';
  const rejBg = tailwindColors.get(rejBgToken);
  checkPair('Chip Text', `Rejected (#FFFFFF on ${rejBgToken})`, themeName, '#FFFFFF', '#FFFFFF', 'white', rejBgToken, rejBg, `node_modules:${rejBgToken}`, 4.5);

  const delConfirmBgToken = themeName === 'Light' ? '--color-red-700' : '--color-red-800';
  const delConfirmBg = tailwindColors.get(delConfirmBgToken);
  checkPair('Text', `Delete Confirm (#FFFFFF on ${delConfirmBgToken})`, themeName, '#FFFFFF', '#FFFFFF', 'white', delConfirmBgToken, delConfirmBg, `node_modules:${delConfirmBgToken}`, 4.5);

  // Alert Text on Tinted Surface
  const alertSuccessBg = blendHex(ink, c, 0.10);
  checkPair(
    'Alert Text',
    'Success Alert Text (--ink on blend(--ink/10%, --card))',
    themeName,
    '--ink',
    ink,
    theme.rawSources.get('--ink'),
    'blend(--ink/10%, card)',
    alertSuccessBg,
    `blended surface over ${theme.rawSources.get('--card')}`,
    4.5
  );

  checkPair(
    'Text',
    'Muted on blend(--ink/10%, --card) (selected model card, selected dropzone)',
    themeName,
    '--muted',
    muted,
    theme.rawSources.get('--muted'),
    'blend(--ink/10%, card)',
    alertSuccessBg,
    `blended surface over ${theme.rawSources.get('--card')}`,
    4.5
  );

  const alertRedToken = themeName === 'Light' ? '--color-red-700' : '--color-red-950';
  const alertRedOpacity = themeName === 'Light' ? 0.10 : 0.20;
  const alertRedHex = tailwindColors.get(alertRedToken);
  const alertRedBg = blendHex(alertRedHex, c, alertRedOpacity);
  checkPair(
    'Alert Text',
    `Error Alert Text (--ink on ${alertRedToken} ${Math.round(alertRedOpacity * 100)}% over Card)`,
    themeName,
    '--ink',
    ink,
    theme.rawSources.get('--ink'),
    `blend(${alertRedToken}/${Math.round(alertRedOpacity * 100)}%, card)`,
    alertRedBg,
    `blended surface over ${theme.rawSources.get('--card')}`,
    4.5
  );
}

// 2. Group B: Functional UI Borders (>= 3.0:1)
console.log('--- Group (b): Functional UI Borders (Threshold: >= 3.0:1) ---');
for (const [themeName, theme] of [['Light', lightTheme], ['Dark', darkTheme]]) {
  const p = theme.vars.get('--paper');
  const c = theme.vars.get('--card');
  const ink = theme.vars.get('--ink');
  const fb = theme.vars.get('--field-border');

  checkPair('Border', 'Field Border vs Paper', themeName, '--field-border', fb, theme.rawSources.get('--field-border'), '--paper', p, theme.rawSources.get('--paper'), 3.0);
  checkPair('Border', 'Field Border vs Card', themeName, '--field-border', fb, theme.rawSources.get('--field-border'), '--card', c, theme.rawSources.get('--card'), 3.0);
  checkPair('Border', 'Focus Ring Ink vs Paper', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--paper', p, theme.rawSources.get('--paper'), 3.0);
  checkPair('Border', 'Focus Ring Ink vs Card', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 3.0);
  checkPair('Border', 'Chip Focus Outline (Ink on Card)', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 3.0);

  // Chip Outlines
  checkPair('Border', 'Draft Chip Outline vs Card', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 3.0);
  checkPair('Border', 'Interview Chip Outline vs Card', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 3.0);

  const offerBorderToken = themeName === 'Light' ? '--color-green-700' : '--color-green-600';
  const offerBorder = tailwindColors.get(offerBorderToken);
  checkPair('Border', `Offer Chip Outline vs Card (${offerBorderToken})`, themeName, offerBorderToken, offerBorder, `node_modules:${offerBorderToken}`, '--card', c, theme.rawSources.get('--card'), 3.0);

  const rejBorderToken = themeName === 'Light' ? '--color-red-700' : '--color-red-500';
  const rejBorder = tailwindColors.get(rejBorderToken);
  checkPair('Border', `Rejected Chip Outline vs Card (${rejBorderToken})`, themeName, rejBorderToken, rejBorder, `node_modules:${rejBorderToken}`, '--card', c, theme.rawSources.get('--card'), 3.0);
}

// 3. Group C: Decorative Dividers (Exempt from 3:1)
console.log('--- Group (c): Decorative Hairlines (Exempt from 3.0:1 gate) ---');
for (const [themeName, theme] of [['Light', lightTheme], ['Dark', darkTheme]]) {
  const p = theme.vars.get('--paper');
  const c = theme.vars.get('--card');
  const ink = theme.vars.get('--ink');
  const h = theme.vars.get('--hairline');
  const hs = theme.vars.get('--hairline-subtle');

  checkPair('Decorative', 'Hairline vs Paper', themeName, '--hairline', h, theme.rawSources.get('--hairline'), '--paper', p, theme.rawSources.get('--paper'), 3.0, false);
  checkPair('Decorative', 'Hairline vs Card', themeName, '--hairline', h, theme.rawSources.get('--hairline'), '--card', c, theme.rawSources.get('--card'), 3.0, false);
  checkPair('Decorative', 'Hairline Subtle vs Paper', themeName, '--hairline-subtle', hs, theme.rawSources.get('--hairline-subtle'), '--paper', p, theme.rawSources.get('--paper'), 3.0, false);

  checkPair('Decorative', 'Alert Success Border vs Card (--ink)', themeName, '--ink', ink, theme.rawSources.get('--ink'), '--card', c, theme.rawSources.get('--card'), 3.0, false);

  const alertRedBorderToken = themeName === 'Light' ? '--color-red-700' : '--color-red-500';
  const alertRedBorder = tailwindColors.get(alertRedBorderToken);
  checkPair('Decorative', `Alert Error Border vs Card (${alertRedBorderToken})`, themeName, alertRedBorderToken, alertRedBorder, `node_modules:${alertRedBorderToken}`, '--card', c, theme.rawSources.get('--card'), 3.0, false);
}

// Helper: blend fg over bg with proportion p (0..1) in sRGB
function blendHex(fgHex, bgHex, p) {
  const fg = fgHex.replace('#', '');
  const bg = bgHex.replace('#', '');
  const r1 = parseInt(fg.slice(0, 2), 16);
  const g1 = parseInt(fg.slice(2, 4), 16);
  const b1 = parseInt(fg.slice(4, 6), 16);
  const r2 = parseInt(bg.slice(0, 2), 16);
  const g2 = parseInt(bg.slice(2, 4), 16);
  const b2 = parseInt(bg.slice(4, 6), 16);

  const r = Math.round(r1 * p + r2 * (1 - p));
  const g = Math.round(g1 * p + g2 * (1 - p));
  const b = Math.round(b1 * p + b2 * (1 - p));

  const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 4. Group D: Heatmap tiles (graphical objects)
console.log('--- Group (d): Heatmap tiles (graphical objects) ---');
for (const [themeName, theme] of [['Light', lightTheme], ['Dark', darkTheme]]) {
  const c = theme.vars.get('--card');
  const ink = theme.vars.get('--ink');
  const cSrc = theme.rawSources.get('--card');
  const inkSrc = theme.rawSources.get('--ink');

  const levels = [
    { level: 0, p: 0.08, name: 'Level 0 (8% ink on card)', isGated: false },
    { level: 1, p: 0.25, name: 'Level 1 (25% ink on card)', isGated: false },
    { level: 2, p: 0.45, name: 'Level 2 (45% ink on card)', isGated: false },
    { level: 3, p: 0.70, name: 'Level 3 (70% ink on card)', isGated: false },
    { level: 4, p: 1.00, name: 'Level 4 (solid ink on card)', isGated: true },
  ];

  for (const lvl of levels) {
    const blended = blendHex(ink, c, lvl.p);
    const tokenName = lvl.level === 4 ? '--ink' : `heat-level-${lvl.level} (${Math.round(lvl.p * 100)}%)`;
    const tokenSrc = lvl.level === 4 ? inkSrc : `color-mix ${Math.round(lvl.p * 100)}% ink over card`;
    checkPair(
      'Heatmap tiles',
      lvl.name,
      themeName,
      tokenName,
      blended,
      tokenSrc,
      '--card',
      c,
      cSrc,
      3.0,
      lvl.isGated
    );
  }

  // Today-ring (--ink) vs card (INFO)
  checkPair(
    'Heatmap tiles',
    'Today Ring (--ink on card)',
    themeName,
    '--ink',
    ink,
    inkSrc,
    '--card',
    c,
    cSrc,
    3.0,
    false
  );
}

if (hasFailure) {
  console.error('\nFAIL: One or more gated contrast pairs did not meet WCAG AA requirements.\n');
  process.exit(1);
} else {
  console.log('\nSUCCESS: All gated text (>= 4.5:1) and functional border (>= 3.0:1) contrast checks passed.\n');
  process.exit(0);
}
