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

      const source = original.slice(bodyStart, found);
      items.push({
        file,
        line: lineOf(masked, start),
        display,
        source,
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

function hasUnescapedUnderscore(str) {
  // Find any underscore not preceded by backslash
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '_' && !isEscaped(str, i)) {
      return true;
    }
  }
  return false;
}

function hasRawCurlyBraceEscape(str) {
  // Find literal \{ or \} (a backslash followed by { or })
  for (let i = 0; i < str.length - 1; i++) {
    if (str[i] === '\\' && (str[i + 1] === '{' || str[i + 1] === '}') && !isEscaped(str, i)) {
      return true;
    }
  }
  return false;
}

function hasRawPipe(str) {
  // Find raw pipe character
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '|' && !isEscaped(str, i)) {
      return true;
    }
  }
  return false;
}

function main() {
  const markdownFiles = walk(repoRoot).sort();
  const errors = [];
  const texItems = [];

  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const normalized = text.replace(/\r\n/g, '\n');
    const masked = maskCode(normalized);

    const items = extractTex(file, normalized, masked, errors);
    texItems.push(...items);
  }

  // Set up MathJax
  const nodeModulesDir = ensureMathJax();
  const { adaptor, html } = createMathJaxDocument(nodeModulesDir);

  const parsedErrors = [];

  for (const item of texItems) {
    const source = item.source.trim();
    if (!source) continue;

    const fileBasename = path.basename(item.file);

    // Kramdown Simulation Checks (only for inline math $ ... $ which is susceptible to markdown parsing)
    if (!item.display) {
      if (hasUnescapedUnderscore(source)) {
        parsedErrors.push({
          file: item.file,
          line: item.line,
          type: 'kramdown-conflict',
          message: 'Unescaped underscore "_" found inside inline math. This can cause subscript collisions and italics corruption in Jekyll.',
          source: source
        });
      }
      if (hasRawCurlyBraceEscape(source)) {
        parsedErrors.push({
          file: item.file,
          line: item.line,
          type: 'kramdown-conflict',
          message: 'Raw braces escape "\\{" or "\\}" found inside inline math. Jekyll will strip the backslash, breaking KaTeX/MathJax delimiters (e.g. \\left\\{). Use \\lbrace or \\rbrace instead.',
          source: source
        });
      }
      if (hasRawPipe(source)) {
        parsedErrors.push({
          file: item.file,
          line: item.line,
          type: 'kramdown-conflict',
          message: 'Raw pipe "|" found inside inline math. This can clash with markdown tables. Use \\vert or \\Vert instead.',
          source: source
        });
      }
    }

    // MathJax Validation
    try {
      // Simulate Kramdown parsing for the MathJax compiler to test how it will build in the browser!
      let simulatedSource = source;
      if (!item.display) {
        // Strip backslashes from \{ and \}
        simulatedSource = simulatedSource.replace(/\\{/g, '{').replace(/\\}/g, '}');
        // If there are multiple underscores, simulate italics stripping
        if ((simulatedSource.match(/(?<!\\)_/g) || []).length >= 2) {
          // Simulate simple italics stripping (removing the pairs of underscores)
          let underCount = 0;
          simulatedSource = simulatedSource.replace(/(?<!\\)_/g, () => {
            underCount++;
            return ''; // Kramdown consumes the underscores for <em>
          });
        }
      }

      const node = html.convert(simulatedSource, { display: item.display });
      const text = adaptor.textContent(node);
      if (/Undefined control sequence|Missing|Extra|Runaway|TeX error|Math input error/i.test(text)) {
        parsedErrors.push({
          file: item.file,
          line: item.line,
          type: 'latex-syntax',
          message: `Browser MathJax compile error: ${text.replace(/\s+/g, ' ').trim()}`,
          source: source
        });
      }
    } catch (error) {
      parsedErrors.push({
        file: item.file,
        line: item.line,
        type: 'latex-syntax',
        message: `MathJax crash: ${error.message}`,
        source: source
      });
    }
  }

  // Format reports
  const allIssues = [...errors, ...parsedErrors];
  
  // Save a JSON report
  fs.writeFileSync(
    path.join(repoRoot, 'latex_scan_report.json'),
    JSON.stringify(allIssues, null, 2),
    'utf-8'
  );

  console.log(`Scan completed! Found ${allIssues.length} total potential issues.`);
}

main();
