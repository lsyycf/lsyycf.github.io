#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const mathjaxVersion = '3.2.2';
const mathjaxPrefix = path.join(repoRoot, '.cache', 'mathjax');
const ignoredDirs = new Set([
  '.git',
  '.jekyll-cache',
  '.sass-cache',
  '_site',
  '.cache',
  'node_modules',
  'vendor',
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

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

function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function isEscaped(text, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) count += 1;
  return count % 2 === 1;
}

function maskCode(text) {
  const chars = [...text];
  let i = 0;
  let lineStart = true;
  let fence = null;

  while (i < chars.length) {
    if (lineStart) {
      const lineEnd = chars.indexOf('\n', i);
      const end = lineEnd === -1 ? chars.length : lineEnd;
      const line = chars.slice(i, end).join('');
      const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (match) {
        const marker = match[1][0];
        const size = match[1].length;
        const isClosing = fence && marker === fence.marker && size >= fence.size;
        for (let j = i; j < end; j += 1) chars[j] = ' ';
        if (isClosing) fence = null;
        else if (!fence) fence = { marker, size };
        i = end;
        lineStart = true;
        continue;
      }
    }

    if (fence && chars[i] !== '\n') {
      chars[i] = ' ';
    }

    if (!fence && chars[i] === '`' && !isEscaped(chars, i)) {
      let ticks = 1;
      while (chars[i + ticks] === '`') ticks += 1;
      let j = i + ticks;
      let closed = false;
      while (j < chars.length) {
        if (chars[j] === '`') {
          let closing = 1;
          while (chars[j + closing] === '`') closing += 1;
          if (closing === ticks) {
            for (let k = i; k < j + closing; k += 1) {
              if (chars[k] !== '\n') chars[k] = ' ';
            }
            i = j + closing;
            closed = true;
            break;
          }
          j += closing;
          continue;
        }
        if (chars[j] === '\n') break;
        j += 1;
      }
      if (closed) continue;
    }

    lineStart = chars[i] === '\n';
    i += 1;
  }

  return chars.join('');
}

function splitTableRow(line) {
  const cells = [''];
  let escaped = false;
  let tickCount = 0;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (escaped) {
      cells[cells.length - 1] += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      cells[cells.length - 1] += ch;
      escaped = true;
      continue;
    }
    if (ch === '`') {
      tickCount = tickCount ? 0 : 1;
      cells[cells.length - 1] += ch;
      continue;
    }
    if (ch === '|' && !tickCount) {
      cells.push('');
    } else {
      cells[cells.length - 1] += ch;
    }
  }

  if (cells[0].trim() === '') cells.shift();
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
  return cells;
}

function checkTables(file, masked, errors) {
  const lines = masked.split(/\r?\n/);
  let table = null;

  lines.forEach((line, index) => {
    if (!line.trimStart().startsWith('|')) {
      table = null;
      return;
    }
    const cells = splitTableRow(line);
    if (!table) table = { line: index + 1, width: cells.length };
    if (cells.length !== table.width) {
      errors.push({
        file,
        line: index + 1,
        type: 'markdown-table',
        message: `table row has ${cells.length} cells, expected ${table.width} from line ${table.line}`,
      });
    }
  });
}

function extractTex(file, original, masked, errors) {
  const items = [];
  let i = 0;

  while (i < masked.length) {
    if (masked[i] === '$' && !isEscaped(masked, i)) {
      const display = masked[i + 1] === '$';
      const start = i;
      const open = display ? '$$' : '$';
      i += display ? 2 : 1;
      const bodyStart = i;
      let found = -1;

      while (i < masked.length) {
        if (masked[i] === '$' && !isEscaped(masked, i)) {
          if (display && masked[i + 1] === '$') {
            found = i;
            break;
          }
          if (!display && masked[i + 1] !== '$') {
            found = i;
            break;
          }
        }
        if (!display && masked[i] === '\n') break;
        i += 1;
      }

      if (found === -1) {
        errors.push({
          file,
          line: lineOf(masked, start),
          type: 'tex-delimiter',
          message: `unclosed ${open} delimiter`,
        });
        i = bodyStart;
        continue;
      }

      items.push({
        file,
        line: lineOf(masked, start),
        display,
        source: original.slice(bodyStart, found),
      });
      i = found + (display ? 2 : 1);
      continue;
    }

    if (masked[i] === '\\' && (masked[i + 1] === '(' || masked[i + 1] === '[')) {
      const display = masked[i + 1] === '[';
      const start = i;
      const close = display ? '\\]' : '\\)';
      i += 2;
      const bodyStart = i;
      const found = masked.indexOf(close, i);
      if (found === -1) {
        errors.push({
          file,
          line: lineOf(masked, start),
          type: 'tex-delimiter',
          message: `unclosed ${display ? '\\[' : '\\('} delimiter`,
        });
        continue;
      }
      items.push({
        file,
        line: lineOf(masked, start),
        display,
        source: original.slice(bodyStart, found),
      });
      i = found + 2;
      continue;
    }

    i += 1;
  }

  return items;
}

function checkFrontMatter(file, text, errors) {
  const rel = toPosix(path.relative(repoRoot, file));
  if (!rel.startsWith('_posts/')) return;

  const name = path.basename(file);
  const nameMatch = name.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-.+\.md$/i);
  if (!nameMatch) {
    errors.push({
      file,
      line: 1,
      type: 'post-name',
      message: 'post filename must match YYYY-M-D-title.md',
    });
  }

  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) {
    errors.push({
      file,
      line: 1,
      type: 'front-matter',
      message: 'post is missing YAML front matter',
    });
    return;
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    errors.push({
      file,
      line: 1,
      type: 'front-matter',
      message: 'front matter is not closed',
    });
    return;
  }

  const yaml = normalized.slice(4, end);
  for (const key of ['layout', 'title', 'date', 'tags', 'comments', 'author']) {
    if (!new RegExp(`^${key}:`, 'm').test(yaml)) {
      errors.push({
        file,
        line: 1,
        type: 'front-matter',
        message: `front matter is missing "${key}"`,
      });
    }
  }

  if (nameMatch) {
    const expected = `${nameMatch[1]}-${nameMatch[2].padStart(2, '0')}-${nameMatch[3].padStart(2, '0')}`;
    const dateMatch = yaml.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    if (dateMatch && dateMatch[1] !== expected) {
      errors.push({
        file,
        line: 1,
        type: 'front-matter',
        message: `front matter date ${dateMatch[1]} does not match filename date ${expected}`,
      });
    }
  }
}

function ensureMathJax() {
  const candidates = [
    process.env.MATHJAX_NODE_MODULES,
    path.join(repoRoot, 'node_modules'),
    path.join(mathjaxPrefix, 'node_modules'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'mathjax-full', 'js', 'mathjax.js'))) {
      return dir;
    }
  }

  fs.mkdirSync(mathjaxPrefix, { recursive: true });
  const quotedPrefix = JSON.stringify(mathjaxPrefix);
  childProcess.execSync(
    `npm install --prefix ${quotedPrefix} mathjax-full@${mathjaxVersion} --no-audit --no-fund`,
    { cwd: repoRoot, stdio: 'inherit' },
  );
  return path.join(mathjaxPrefix, 'node_modules');
}

function createMathJaxDocument(nodeModulesDir) {
  const { mathjax } = require(path.join(nodeModulesDir, 'mathjax-full/js/mathjax.js'));
  const { TeX } = require(path.join(nodeModulesDir, 'mathjax-full/js/input/tex.js'));
  const { CHTML } = require(path.join(nodeModulesDir, 'mathjax-full/js/output/chtml.js'));
  const { liteAdaptor } = require(path.join(nodeModulesDir, 'mathjax-full/js/adaptors/liteAdaptor.js'));
  const { RegisterHTMLHandler } = require(path.join(nodeModulesDir, 'mathjax-full/js/handlers/html.js'));
  const { AllPackages } = require(path.join(nodeModulesDir, 'mathjax-full/js/input/tex/AllPackages.js'));

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const tex = new TeX({ packages: AllPackages });
  const chtml = new CHTML();
  return {
    adaptor,
    html: mathjax.document('', { InputJax: tex, OutputJax: chtml }),
  };
}

function checkTex(texItems, errors) {
  if (!texItems.length) return;
  const { adaptor, html } = createMathJaxDocument(ensureMathJax());

  for (const item of texItems) {
    const source = item.source.trim();
    if (!source) continue;
    try {
      const node = html.convert(source, { display: item.display });
      const text = adaptor.textContent(node);
      if (/Undefined control sequence|Missing|Extra|Runaway|TeX error|Math input error/i.test(text)) {
        errors.push({
          file: item.file,
          line: item.line,
          type: 'latex',
          message: text.replace(/\s+/g, ' ').trim(),
        });
      }
    } catch (error) {
      errors.push({
        file: item.file,
        line: item.line,
        type: 'latex',
        message: error.message,
      });
    }
  }
}

function formatError(error) {
  const rel = toPosix(path.relative(repoRoot, error.file));
  return `${rel}:${error.line}: [${error.type}] ${error.message}`;
}

function main() {
  const markdownFiles = walk(repoRoot).sort();
  const errors = [];
  const texItems = [];

  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const normalized = text.replace(/\r\n/g, '\n');
    const masked = maskCode(normalized);

    checkFrontMatter(file, normalized, errors);
    checkTables(file, masked, errors);
    texItems.push(...extractTex(file, normalized, masked, errors));
  }

  checkTex(texItems, errors);

  if (errors.length) {
    console.error(`Markdown/LaTeX check failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(formatError(error));
    process.exit(1);
  }

  console.log(`Markdown/LaTeX check passed: ${markdownFiles.length} file(s), ${texItems.length} TeX segment(s).`);
}

main();
