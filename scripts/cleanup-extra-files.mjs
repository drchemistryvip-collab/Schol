import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');

const IGNORE_WALK_DIRS = new Set([
  '.git',
  '.github',
  '.aistudio',
  'node_modules',
  'scripts'
]);

const KNOWN_EXTRA_FILES = new Set([
  'firebase.txt',
  'quize.html'
]);

const JUNK_FILE_PATTERNS = [
  /^\.DS_Store$/i,
  /^Thumbs\.db$/i,
  /^desktop\.ini$/i,
  /\.(log|tmp|temp|bak|orig|swp|swo)$/i,
  /~$/,
  /\s-\sCopy(\.[^.]+)?$/i,
  /\scopy(\s\d+)?(\.[^.]+)?$/i,
  /\s\(\d+\)(\.[^.]+)?$/i
];

const SOURCE_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.css',
  '.json',
  '.toml',
  '.md'
]);

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (IGNORE_WALK_DIRS.has(entry.name)) continue;
      walkFiles(fullPath, result);
    } else if (entry.isFile()) {
      result.push({ fullPath, relPath, name: entry.name });
    }
  }
  return result;
}

function removeFile(target) {
  if (DRY_RUN) {
    console.log(`[dry-run] Would delete extra file: ${target.relPath}`);
    return;
  }
  fs.unlinkSync(target.fullPath);
  console.log(`Deleted extra file: ${target.relPath}`);
}

function cleanupEmptyDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath);
  if (entries.length === 0) {
    if (!DRY_RUN) {
      fs.rmdirSync(dirPath);
      console.log(`Removed empty directory: ${path.relative(ROOT, dirPath).replace(/\\/g, '/')}`);
    }
  }
}

const allFiles = walkFiles(ROOT);

// Collect source text (excluding public/assets/aistudio itself) to detect unreferenced uploaded assets
const sourceCorpus = allFiles
  .filter(f => !f.relPath.startsWith('public/assets/aistudio/') && !f.relPath.startsWith('dist/'))
  .filter(f => SOURCE_EXTENSIONS.has(path.extname(f.name).toLowerCase()))
  .map(f => {
    try {
      return fs.readFileSync(f.fullPath, 'utf8');
    } catch {
      return '';
    }
  })
  .join('\n');

const deleted = [];

const INCLUDE_DIST = process.argv.includes('--include-dist') || process.env.GITHUB_ACTIONS === 'true';

for (const file of allFiles) {
  if (file.name === '.gitkeep') continue;

  // 1. Build/output directories mistakenly committed to GitHub
  if (/^(dist|build|coverage)\//.test(file.relPath)) {
    if (INCLUDE_DIST) {
      removeFile(file);
      deleted.push(file.relPath);
    }
    continue;
  }

  // 2. Known extra/scratch files
  if (KNOWN_EXTRA_FILES.has(file.relPath)) {
    removeFile(file);
    deleted.push(file.relPath);
    continue;
  }

  // 3. OS, temp, backup, log, or duplicate copy files
  if (JUNK_FILE_PATTERNS.some(rx => rx.test(file.name))) {
    removeFile(file);
    deleted.push(file.relPath);
    continue;
  }

  // 4. Unreferenced chat/aistudio media attachments in public/assets/aistudio/
  if (file.relPath.startsWith('public/assets/aistudio/')) {
    const isReferenced = sourceCorpus.includes(file.name) || sourceCorpus.includes(file.relPath);
    if (!isReferenced) {
      removeFile(file);
      deleted.push(file.relPath);
      continue;
    }
  }

  // 5. Stray empty 0-byte files (excluding protected dirs/files)
  try {
    const stat = fs.statSync(file.fullPath);
    if (stat.size === 0 && file.relPath !== 'community-uploads/.gitkeep') {
      removeFile(file);
      deleted.push(file.relPath);
    }
  } catch {}
}

cleanupEmptyDir(path.join(ROOT, 'public', 'assets', 'aistudio'));
cleanupEmptyDir(path.join(ROOT, 'public', 'assets'));

if (deleted.length === 0) {
  console.log('Repository is clean: no extra files found.');
} else {
  console.log(`Cleanup complete: ${deleted.length} extra file(s) ${DRY_RUN ? 'detected' : 'removed'}.`);
}
