#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const ignoredDirs = new Set([
  '.git',
  '.jekyll-cache',
  '.sass-cache',
  '_site',
  '.cache',
  'node_modules',
  'vendor',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), files);
      }
      continue;
    }
    if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function isFence(line) {
  return /^ {0,3}(`{3,}|~{3,})/.test(line);
}

function fixInlineMath(line) {
  let out = '';
  let i = 0;

  while (i < line.length) {
    if (line[i] !== '$' || line[i + 1] === '$' || line[i - 1] === '$') {
      out += line[i];
      i += 1;
      continue;
    }

    const start = i;
    i += 1;
    let close = -1;
    while (i < line.length) {
      if (line[i] === '$' && line[i - 1] !== '\\' && line[i + 1] !== '$') {
        close = i;
        break;
      }
      i += 1;
    }

    if (close === -1) {
      out += line.slice(start);
      break;
    }

    const body = line.slice(start + 1, close);
    out += `$${body.trim()}$`;
    i = close + 1;
  }

  return out;
}

function fixInlineMathOutsideCode(line) {
  let out = '';
  let pending = '';
  let i = 0;

  while (i < line.length) {
    if (line[i] !== '`') {
      pending += line[i];
      i += 1;
      continue;
    }

    let ticks = 1;
    while (line[i + ticks] === '`') ticks += 1;
    const marker = '`'.repeat(ticks);
    const close = line.indexOf(marker, i + ticks);
    if (close === -1) {
      pending += line.slice(i);
      break;
    }

    out += fixInlineMath(pending);
    pending = '';
    out += line.slice(i, close + ticks);
    i = close + ticks;
  }

  return out + fixInlineMath(pending);
}

function ensureDisplayMathBlankLines(lines) {
  const out = [];
  let inFence = false;

  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    if (/^\s*\$\$\s*$/.test(line)) {
      if (out.length && out[out.length - 1].trim() !== '') {
        out.push('');
      }
      out.push(line.trim());
      continue;
    }

    if (out.length && /^\s*\$\$\s*$/.test(out[out.length - 1]) && line.trim() !== '') {
      out.push('');
    }
    out.push(line);
  }

  return out;
}

function ensureTableBlankLines(lines) {
  const out = [];
  let inFence = false;

  for (const line of lines) {
    if (isFence(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    const previous = out.length ? out[out.length - 1] : '';
    const tableLine = !inFence && /^\s*\|.*\|\s*$/.test(line);
    const previousTableLine = /^\s*\|.*\|\s*$/.test(previous);

    if (tableLine && previous.trim() !== '' && !previousTableLine) {
      out.push('');
    }
    out.push(line);
  }

  return out;
}

function fixMarkdown(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = /\r?\n$/.test(content);
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let inFence = false;

  const fixedLines = lines.map((line) => {
    if (isFence(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return fixInlineMathOutsideCode(line);
  });

  let fixed = ensureTableBlankLines(ensureDisplayMathBlankLines(fixedLines)).join(eol);
  if (trailingNewline && !fixed.endsWith(eol)) fixed += eol;
  return fixed;
}

function main() {
  let changed = 0;

  for (const file of walk(repoRoot).sort()) {
    const original = fs.readFileSync(file, 'utf8');
    const fixed = fixMarkdown(original);
    if (fixed !== original) {
      fs.writeFileSync(file, fixed, 'utf8');
      changed += 1;
      console.log(`fixed ${path.relative(repoRoot, file).split(path.sep).join('/')}`);
    }
  }

  console.log(`Done. Updated ${changed} file(s).`);
}

main();
