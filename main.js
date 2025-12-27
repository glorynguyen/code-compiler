const fs = require('fs');
const ignore = require('ignore');
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
const esbuild = require('esbuild');
const CHARS_PER_TOKEN = 4;
const COST_PER_1K_TOKENS = 0.03;

function collectFilesToProcess(isFolder, inputPath, selectedFiles, ignoreManager, projectRoot) {
  if (isFolder) {
    if (selectedFiles && selectedFiles.length > 0) {
      return selectedFiles;
    } else {
      return findFilesInDirectory(inputPath, CONFIG.SUPPORTED_EXTENSIONS, ignoreManager, projectRoot);
    }
  } else {
    return [inputPath];
  }
}

function getCombinedContent(filesToProcess, compress) {
  combiner.reset();
  for (const file of filesToProcess) {
    combiner.processFile(file, compress);
  }
  return combiner.getCombinedContent();
}

function minifyContent(content) {
  try {
    const result = esbuild.transformSync(content, {
      loader: 'js',
      minify: true,
      target: 'esnext',
    });
    return result.code;
  } catch (e) {
    console.warn('Minification failed, using unminified output:', e.message);
    return content;
  }
}

function buildWithEsbuild(filesToProcess, shouldMinify, projectRoot, externalDeps) {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  const hasTsConfig = fs.existsSync(tsconfigPath);
  const loaderConfig = CONFIG.getLoaderConfig();

  const result = esbuild.buildSync({
    entryPoints: filesToProcess,
    bundle: true,
    treeShaking: true,
    minify: shouldMinify,
    format: 'esm',
    target: 'esnext',
    platform: 'node',
    tsconfig: hasTsConfig ? tsconfigPath : undefined,
    write: false,
    external: externalDeps,
    loader: loaderConfig,
  });

  return result.outputFiles[0].text;
}

function calculateTokenStats(content) {
  const size = content.length;
  const tokens = Math.ceil(size / CHARS_PER_TOKEN);
  const cost = (tokens / 1000) * COST_PER_1K_TOKENS;

  return {
    size,
    tokens,
    cost: cost.toFixed(4),
    sizeKB: (size / 1024).toFixed(2)
  };
}

function parseProjectDependencies(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  const externalDeps = [];

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      externalDeps.push(
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {})
      );
    } catch (e) {
      console.warn('Could not parse package.json for externals:', e);
      throw e;
    }
  }

  return externalDeps;
}

function generateStats(processedFiles, content, originalContent = null) {
  const tokenStats = calculateTokenStats(content);
  const baseStats = {
    filesProcessed: processedFiles.size,
    outputSize: tokenStats.sizeKB,
    totalTokens: tokenStats.tokens,
    estimatedCost: tokenStats.cost,
    files: Array.from(processedFiles)
  };

  if (originalContent) {
    const originalTokenStats = calculateTokenStats(originalContent);
    baseStats.originalSize = originalTokenStats.sizeKB;
    baseStats.originalTokens = originalTokenStats.tokens;
    baseStats.tokensSaved = originalTokenStats.tokens - tokenStats.tokens;
    baseStats.costSaved = (originalTokenStats.cost - tokenStats.cost).toFixed(4);
  }

  return baseStats;
}

function handleOutput(content, outputMode, outputPath, stats) {
  if (outputMode === 'clipboard') {
    clipboard.writeText(content);
    return { success: true, mode: 'clipboard', ...stats };
  } else {
    if (!outputPath) throw new Error("Output path not specified");
    fs.writeFileSync(outputPath, content, 'utf-8');
    return { success: true, mode: 'file', ...stats };
  }
}

const CONFIG = {
  EXTENSION_META: {
    '.ts': { icon: 'TS', class: 'ts-icon', loader: 'ts' },
    '.tsx': { icon: 'TSX', class: 'ts-icon', loader: 'tsx' },
    '.js': { icon: 'JS', class: 'js-icon', loader: 'js' },
    '.jsx': { icon: 'JSX', class: 'jsx-icon', loader: 'jsx' },
    '.html': { icon: '🌐', class: 'html-icon', loader: 'text' },
    '.css': { icon: '🎨', class: 'css-icon', loader: 'css' },
    '.scss': { icon: '🎨', class: 'css-icon', loader: 'empty' },
  },
  get SUPPORTED_EXTENSIONS() {
    return Object.keys(this.EXTENSION_META);
  },
  getLoaderConfig() {
    const config = {};
    for (const [ext, meta] of Object.entries(this.EXTENSION_META)) {
      config[ext] = meta.loader;
    }
    return config;
  },
  getExtensionsDisplay() {
    return this.SUPPORTED_EXTENSIONS.map(ext => ext.replace('.', '')).join(', ');
  },
  getDialogExtensions() {
    return this.SUPPORTED_EXTENSIONS.map(ext => ext.replace('.', ''));
  }
};

class IgnorePatternManager {
  constructor() {
    this.ig = ignore();
    this.hasPatterns = false;
  }

  parseGitignore(gitignorePath) {
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n');
    const patterns = [];

    for (let line of lines) {
      line = line.trim();

      if (!line || line.startsWith('#')) continue;

      patterns.push(line);
    }

    return patterns;
  }

  loadGitignore(projectRoot) {
    const gitignorePath = path.join(projectRoot, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
      return;
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    this.ig.add(content);
    this.hasPatterns = true;
  }

  addPatterns(patterns) {
    if (Array.isArray(patterns) && patterns.length > 0) {
      this.ig.add(patterns);
      this.hasPatterns = true;
    }
  }

  addPreset(presetName) {
    const presets = {
      tests: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/__tests__/',
        '**/test/',
        '**/tests/',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
      ],
      configs: [
        '*.config.js',
        '*.config.ts',
        '.env*',
        '.eslintrc*',
        '.prettierrc*',
        'tsconfig.json',
        'webpack.config.*',
      ],
      buildArtifacts: [
        'dist/',
        'build/',
        'out/',
        '.next/',
        'coverage/',
        '*.log',
      ],
      dependencies: [
        'node_modules/',
        'vendor/',
        '.pnp.*',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
      ],
    };

    if (presets[presetName]) {
      this.addPatterns(presets[presetName]);
    }
  }

  shouldIgnore(filePath, projectRoot) {
    if (!this.hasPatterns) {
      return false;
    }

    // Convert to relative path with forward slashes
    const relativePath = path
      .relative(projectRoot, filePath)
      .split(path.sep)
      .join('/');

    // Check if ignored
    return this.ig.ignores(relativePath);
  }

  filterFiles(files, projectRoot) {
    return files.filter(file => !this.shouldIgnore(file, projectRoot));
  }

  clear() {
    this.ig = ignore();
    this.hasPatterns = false;
  }

  static getPresets() {
    return {
      tests: {
        name: 'Tests',
        patterns: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.test.js',
          '**/*.test.jsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
          '**/*.spec.js',
          '**/*.spec.jsx',
          '**/__tests__/**',
          '**/test/**',
          '**/tests/**'
        ]
      },
      configs: {
        name: 'Configs',
        patterns: [
          '*.config.js',
          '*.config.ts',
          '*.config.mjs',
          '.env*',
          '.eslintrc*',
          '.prettierrc*',
          'tsconfig.json',
          'jsconfig.json',
          'webpack.config.*',
          'vite.config.*',
          'rollup.config.*'
        ]
      },
      documentation: {
        name: 'Documentation',
        patterns: [
          '*.md',
          '*.mdx',
          'docs/**',
          'documentation/**',
          'README*',
          'CHANGELOG*',
          'LICENSE*'
        ]
      },
      buildArtifacts: {
        name: 'Build Artifacts',
        patterns: [
          'dist/**',
          'build/**',
          'out/**',
          '.next/**',
          'coverage/**',
          '*.log',
          '*.tsbuildinfo',
          '.cache/**'
        ]
      }
    };
  }
}

function findFilesInDirectory(dirPath, extensions = CONFIG.SUPPORTED_EXTENSIONS, ignoreManager = null, projectRoot = null) {
  const files = [];
  const MAX_FILES = 10000;
  const MAX_DEPTH = 20;

  function walkDir(currentPath, depth = 0) {
    if (depth > MAX_DEPTH || files.length > MAX_FILES) return;
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (ignoreManager && projectRoot && ignoreManager.shouldIgnore(fullPath, projectRoot)) {
          continue;
        }

        if (!['node_modules', 'dist', '.git', '.next', 'build', 'coverage'].includes(entry.name)) {
          walkDir(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        if (ignoreManager && projectRoot && ignoreManager.shouldIgnore(fullPath, projectRoot)) {
          continue;
        }

        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dirPath, 0);
  return files;
}

class CodeCombiner {
  constructor() {
    this.processedFiles = new Set();
    this.output = [];
    this.projectRoot = null;
    this.projectDependencies = new Set();
    this.ignoreManager = new IgnorePatternManager();
  }

  extractImports(content) {
    const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const pathParts = importPath.split('/');
      const rootPackage = importPath.startsWith('@') && pathParts.length > 1
        ? `${pathParts[0]}/${pathParts[1]}`
        : pathParts[0];

      const isDependency = this.projectDependencies.has(rootPackage);
      if (!isDependency) {
        imports.push(importPath);
      }
    }

    return imports;
  }

  resolveImportPath(basePath, importPath) {
    const extensions = CONFIG.SUPPORTED_EXTENSIONS;
    let fullPath;

    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      fullPath = path.resolve(path.dirname(basePath), importPath);
    } else if (importPath.startsWith('src/')) {
      if (!this.projectRoot) return null;
      fullPath = path.join(this.projectRoot, importPath);
    } else {
      return null;
    }

    if (!path.extname(fullPath)) {
      for (const ext of extensions) {
        const testPath = fullPath + ext;
        if (fs.existsSync(testPath)) return testPath;
      }

      for (const ext of extensions) {
        const indexPath = path.join(fullPath, `index${ext}`);
        if (fs.existsSync(indexPath)) return indexPath;
      }
    }

    return fs.existsSync(fullPath) ? fullPath : null;
  }

  detectRoot(entryFilePath) {
    let currentDir = path.dirname(entryFilePath);

    while (currentDir !== path.parse(currentDir).root) {
      const pkgPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies
          };
          Object.keys(allDeps).forEach(dep => this.projectDependencies.add(dep));
        } catch (e) {
          console.warn('Could not parse package.json for dependency detection');
          throw e;
        }
        return currentDir;
      }

      if (fs.existsSync(path.join(currentDir, 'tsconfig.json'))) {
        return currentDir;
      }

      if (fs.existsSync(path.join(currentDir, 'src')) &&
        fs.lstatSync(path.join(currentDir, 'src')).isDirectory()) {
        return currentDir;
      }

      currentDir = path.dirname(currentDir);
    }

    return path.dirname(entryFilePath);
  }

  minifyContent(content) {
    content = content.replace(/\/\*!(.*?)\*\//gs, '/*!$1*/');
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/[^\n]*$/gm, "");
    content = content.replace(/\s+/g, ' ');
    return content.trim();
  }

  processFile(filePath, compress = false) {
    const normalizedPath = path.resolve(filePath);

    if (!this.projectRoot) {
      this.projectRoot = this.detectRoot(normalizedPath);
      console.log(`Project Root detected at: ${this.projectRoot}`);
    }

    if (this.ignoreManager.shouldIgnore(normalizedPath, this.projectRoot)) {
      console.log(`Ignoring file: ${normalizedPath}`);
      return;
    }

    if (this.processedFiles.has(normalizedPath)) return;

    if (!fs.existsSync(normalizedPath)) {
      console.log(`Warning: File not found - ${normalizedPath}`);
      return;
    }

    this.processedFiles.add(normalizedPath);

    let content = fs.readFileSync(normalizedPath, 'utf-8');
    const imports = this.extractImports(content);

    for (const importPath of imports) {
      const resolvedPath = this.resolveImportPath(normalizedPath, importPath);
      if (resolvedPath) {
        this.processFile(resolvedPath, compress);
      }
    }

    if (compress) {
      content = this.minifyContent(content);
      this.output.push(`\n`);
      this.output.push(content);
    } else {
      this.output.push(`\n${'='.repeat(80)}`);
      this.output.push(`File: ${normalizedPath}`);
      this.output.push('='.repeat(80));
      this.output.push(content);
    }
  }

  getCombinedContent() {
    return this.output.join('\n');
  }

  getStats(content) {
    return {
      filesProcessed: this.processedFiles.size,
      outputSize: (content.length / 1024).toFixed(2),
      files: Array.from(this.processedFiles)
    };
  }

  reset() {
    this.processedFiles = new Set();
    this.output = [];
    this.projectRoot = null;
    this.projectDependencies = new Set();
  }

  buildDependencyGraph(filePath, visited = new Set()) {
    const normalizedPath = path.resolve(filePath);

    if (!this.projectRoot) {
      this.projectRoot = this.detectRoot(normalizedPath);
    }

    if (visited.has(normalizedPath)) {
      return {
        name: path.basename(normalizedPath),
        path: normalizedPath,
        circular: true,
        children: []
      };
    }

    if (!fs.existsSync(normalizedPath)) {
      return {
        name: path.basename(filePath),
        path: filePath,
        missing: true,
        children: []
      };
    }

    visited.add(normalizedPath);

    const content = fs.readFileSync(normalizedPath, 'utf-8');
    const imports = this.extractImports(content);
    const children = [];

    for (const importPath of imports) {
      const resolvedPath = this.resolveImportPath(normalizedPath, importPath);
      if (resolvedPath) {
        children.push(this.buildDependencyGraph(resolvedPath, visited));
      }
    }

    return {
      name: path.basename(normalizedPath),
      path: normalizedPath,
      children
    };
  }
}

let mainWindow;
const combiner = new CodeCombiner();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('select-input-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'TypeScript/JavaScript', extensions: CONFIG.getDialogExtensions() },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return (!result.canceled && result.filePaths.length > 0) ? result.filePaths[0] : null;
});

ipcMain.handle('select-input-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return (!result.canceled && result.filePaths.length > 0) ? result.filePaths[0] : null;
});

ipcMain.handle('select-output-file', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'combined-code.txt',
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return (!result.canceled && result.filePath) ? result.filePath : null;
});

ipcMain.handle('get-ignore-presets', async () => {
  return IgnorePatternManager.getPresets();
});

ipcMain.handle('load-gitignore', async (event, projectRoot) => {
  try {
    combiner.ignoreManager.loadGitignore(projectRoot);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-ignore-patterns', async (event, patterns) => {
  try {
    combiner.ignoreManager.clear();
    combiner.ignoreManager.addPatterns(patterns);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-ignore-patterns', async (event, patterns) => {
  try {
    combiner.ignoreManager.addPatterns(patterns);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-ignore-patterns', async () => {
  combiner.ignoreManager.clear();
  return { success: true };
});

ipcMain.handle('preview-ignored-files', async (event, folderPath, patterns) => {
  try {
    const tempIgnoreManager = new IgnorePatternManager();
    tempIgnoreManager.addPatterns(patterns);

    const allFiles = findFilesInDirectory(folderPath);
    const ignoredFiles = [];
    const includedFiles = [];

    for (const file of allFiles) {
      if (tempIgnoreManager.shouldIgnore(file, folderPath)) {
        ignoredFiles.push({
          path: file,
          relativePath: path.relative(folderPath, file)
        });
      } else {
        includedFiles.push({
          path: file,
          relativePath: path.relative(folderPath, file)
        });
      }
    }

    return {
      success: true,
      ignoredFiles,
      includedFiles,
      totalFiles: allFiles.length,
      ignoredCount: ignoredFiles.length,
      includedCount: includedFiles.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('analyze-dependencies', async (event, inputPath) => {
  try {
    combiner.reset();
    const graph = combiner.buildDependencyGraph(inputPath);
    return { success: true, graph };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    const projectRoot = folderPath;
    combiner.ignoreManager.clear();
    combiner.ignoreManager.loadGitignore(projectRoot);
    const files = findFilesInDirectory(folderPath, CONFIG.SUPPORTED_EXTENSIONS, combiner.ignoreManager, projectRoot);
    const relativeFiles = files.map(f => ({
      path: f,
      relativePath: path.relative(folderPath, f),
      name: path.basename(f)
    }));
    return { success: true, files: relativeFiles, hasGitignore: combiner.ignoreManager.hasPatterns };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('process-files', async (event, inputPath, outputPath, outputMode, shouldCompress, shouldMinify, isFolder, selectedFiles) => {
  try {
    const projectRoot = isFolder ? inputPath : path.dirname(inputPath);
    combiner.reset();
    combiner.ignoreManager.loadGitignore(projectRoot);

    const filesToProcess = collectFilesToProcess(
      isFolder,
      inputPath,
      selectedFiles,
      combiner.ignoreManager,
      projectRoot
    );

    if (filesToProcess.length === 0) {
      throw new Error('No files selected or found in the folder');
    }
    const detectedRoot = combiner.detectRoot(filesToProcess[0]);
    const externalDeps = parseProjectDependencies(detectedRoot);
    externalDeps.push('electron', 'fs', 'path');
    externalDeps.push('*.css', '*.scss', '*.sass', '*.less');
    externalDeps.push('*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg', '*.ico');
    externalDeps.push('*.woff', '*.woff2', '*.ttf', '*.eot');

    let finalContent = '';
    let stats = {};
    let originalContent = '';

    if (shouldCompress) {
      combiner.reset();
      for (const file of filesToProcess) {
        combiner.processFile(file, false);
      }
      originalContent = combiner.getCombinedContent();
      const processedFilesBackup = new Set(combiner.processedFiles);

      combiner.reset();
      if (isFolder) {
        finalContent = getCombinedContent(filesToProcess, true);
      } else {
        finalContent = buildWithEsbuild(filesToProcess, shouldMinify, detectedRoot, externalDeps);
      }
      if (shouldMinify) {
        finalContent = minifyContent(finalContent);
      }
      stats = generateStats(processedFilesBackup, finalContent, originalContent);
    } else {
      combiner.reset();
      for (const file of filesToProcess) {
        combiner.processFile(file, false);
      }
      finalContent = combiner.getCombinedContent();
      const tokenStats = calculateTokenStats(finalContent);

      stats = {
        filesProcessed: combiner.processedFiles.size,
        outputSize: tokenStats.sizeKB,
        totalTokens: tokenStats.tokens,
        estimatedCost: tokenStats.cost,
        files: Array.from(combiner.processedFiles).map(f =>
          isFolder ? path.relative(inputPath, f) : path.relative(path.dirname(inputPath), f)
        ),
        isOptimized: false
      };
    }

    return handleOutput(finalContent, outputMode, outputPath, stats);

  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-extension-metadata', async () => {
  return CONFIG.EXTENSION_META;
});

ipcMain.handle('get-supported-extensions', async () => {
  return {
    extensions: CONFIG.SUPPORTED_EXTENSIONS,
    display: CONFIG.getExtensionsDisplay()
  };
});