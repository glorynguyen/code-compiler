const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
const esbuild = require('esbuild');

class CodeCombiner {
  constructor() {
    this.processedFiles = new Set();
    this.output = [];
    this.projectRoot = null;
    this.projectDependencies = new Set();
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
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
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
        }
        return currentDir;
      }

      if (fs.existsSync(path.join(currentDir, 'tsconfig.json'))) {
        return currentDir;
      }

      if (fs.existsSync(path.join(currentDir, 'src')) && fs.lstatSync(path.join(currentDir, 'src')).isDirectory()) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return path.dirname(entryFilePath);
  }

  minifyContent(content) {
    // 1. Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, "");
    // 2. Remove single-line comments
    content = content.replace(/\/\/[^\n]*$/gm, "");
    // 3. Replace multiple whitespace (spaces, tabs, newlines) with a single space
    content = content.replace(/\s+/g, ' ');
    return content.trim();
  }

  processFile(filePath, compress = false) {
    const normalizedPath = path.resolve(filePath);

    if (!this.projectRoot) {
      this.projectRoot = this.detectRoot(normalizedPath);
      console.log(`Project Root detected at: ${this.projectRoot}`);
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
      this.output.push(`\n/* File: ${path.basename(normalizedPath)} */`);
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
      return { name: path.basename(normalizedPath), path: normalizedPath, circular: true, children: [] };
    }

    if (!fs.existsSync(normalizedPath)) {
      return { name: path.basename(filePath), path: filePath, missing: true, children: [] };
    }

    visited.add(normalizedPath);
    const content = fs.readFileSync(normalizedPath, 'utf-8');
    const imports = this.extractImports(content);
    const children = [];

    for (const importPath of imports) {
      const resolvedPath = this.resolveImportPath(normalizedPath, importPath);
      if (resolvedPath) {
        children.push(this.buildDependencyGraph(resolvedPath, new Set(visited)));
      }
    }

    return {
      name: path.basename(normalizedPath),
      path: normalizedPath,
      children
    };
  }
}

// ... (Giữ nguyên logic tạo window) ...
let mainWindow;
const combiner = new CodeCombiner();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 900, // Tăng chiều cao một chút
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers
ipcMain.handle('select-input-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'TypeScript/JavaScript', extensions: ['ts', 'tsx', 'js', 'jsx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
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

// IPC Handler for Dependency Graph Analysis
ipcMain.handle('analyze-dependencies', async (event, inputPath) => {
  try {
    combiner.reset();
    const graph = combiner.buildDependencyGraph(inputPath);
    combiner.reset();
    return { success: true, graph };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 3. Cập nhật handler xử lý file
ipcMain.handle('process-files', async (event, inputPath, outputPath, outputMode, shouldCompress, shouldMinify) => {
  try {
    let finalContent = '';
    let stats = {};

    if (shouldCompress) {
      // --- MODE A: Tree-Shaking (esbuild) ---

      // 1. Detect Project Root
      // We use the helper from CodeCombiner, even though we aren't using the full class logic here
      const projectRoot = combiner.detectRoot(inputPath);

      // 2. Resolve Configuration Files
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const pkgPath = path.join(projectRoot, 'package.json');
      const hasTsConfig = fs.existsSync(tsconfigPath);

      // 3. Build External Array from package.json
      let externalDeps = [];
      if (fs.existsSync(pkgPath)) {
        try {
          const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
          const pkg = JSON.parse(pkgContent);
          externalDeps = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            // Add Electron specific built-ins just in case
            'electron',
            'fs',
            'path'
          ];
        } catch (e) {
          console.warn('Could not parse package.json for externals:', e);
        }
      }

      // 4. Get original size (before compression) for comparison
      combiner.reset();
      combiner.processFile(inputPath, false);
      const originalContent = combiner.getCombinedContent();
      const originalSize = originalContent.length;
      combiner.reset();

      // 5. Run esbuild
      const result = esbuild.buildSync({
        entryPoints: [inputPath],
        bundle: true,
        treeShaking: true,
        minify: shouldMinify,  // Use the checkbox value from UI
        format: 'esm',
        target: 'esnext',
        platform: 'node',
        // Pass the tsconfig so esbuild understands 'lib/...' or 'src/...' paths
        tsconfig: hasTsConfig ? tsconfigPath : undefined,
        write: false,
        // Pass the combined list of dependencies to exclude
        external: externalDeps,
      });

      finalContent = result.outputFiles[0].text;
      const compressedSize = finalContent.length;

      // Token estimation: ~4 characters per token (GPT estimation)
      const CHARS_PER_TOKEN = 4;
      const originalTokens = Math.ceil(originalSize / CHARS_PER_TOKEN);
      const compressedTokens = Math.ceil(compressedSize / CHARS_PER_TOKEN);
      const tokensSaved = originalTokens - compressedTokens;

      // Cost calculation: GPT-4 pricing ~$0.03 per 1K input tokens
      const COST_PER_1K_TOKENS = 0.03;
      const costSaved = (tokensSaved / 1000) * COST_PER_1K_TOKENS;

      stats = {
        filesProcessed: "Bundled & Tree-shaken via esbuild",
        outputSize: (compressedSize / 1024).toFixed(2),
        originalSize: (originalSize / 1024).toFixed(2),
        originalTokens,
        compressedTokens,
        tokensSaved,
        costSaved: costSaved.toFixed(4),
        files: ["Optimized Bundle"]
      };

    } else {
      // --- MODE B: Standard Concatenation (CodeCombiner) ---
      combiner.reset();
      combiner.processFile(inputPath, false);

      finalContent = combiner.getCombinedContent();
      stats = combiner.getStats(finalContent);
    }

    // Output Handling (Clipboard or File)
    if (outputMode === 'clipboard') {
      clipboard.writeText(finalContent);
      return { success: true, mode: 'clipboard', ...stats };
    } else {
      if (!outputPath) throw new Error("Chưa chọn đường dẫn lưu file");
      fs.writeFileSync(outputPath, finalContent, 'utf-8');
      return { success: true, mode: 'file', ...stats };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});