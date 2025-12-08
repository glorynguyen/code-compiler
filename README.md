# 🚀 Code Combiner

A sleek Electron app that combines and bundles your TypeScript/JavaScript files into a single optimized output — perfect for feeding code into AI/LLM tools like ChatGPT, Claude, or Gemini.

![Code Combiner Screenshot](https://img.shields.io/badge/Platform-macOS-blue?style=flat-square) ![Electron](https://img.shields.io/badge/Electron-28.0-47848F?style=flat-square&logo=electron) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- **📂 Smart Import Resolution** — Automatically follows and resolves `import` statements (relative, absolute, and `src/` paths)
- **🌳 Tree Shaking** — Powered by [esbuild](https://esbuild.github.io/) to eliminate unused code
- **🗜️ Minification** — Optional minify to squeeze out maximum compression
- **💰 Token Savings Calculator** — See how many tokens and dollars you're saving (based on GPT-4 pricing)
- **📊 Dependency Graph Visualization** — Interactive tree view showing how your files are connected via imports
- **📁 Folder Selection** — Process all JS/TS files in a folder with file-by-file selection
- **📋 Clipboard Support** — Copy directly to clipboard for instant pasting into AI chats
- **💾 File Export** — Save combined code to a file for sharing or archiving
- **🎨 Beautiful UI** — Modern gradient design with smooth animations

## 🖥️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Yarn](https://yarnpkg.com/) (v4+)

### Setup

```bash
# Clone the repository
git clone git@github.com:glorynguyen/code-compiler.git
cd code-compiler

# Install dependencies
yarn install

# Run the app
yarn start
```

## 🎯 Usage

1. **Select Entry File** — Choose your main `.ts`, `.tsx`, `.js`, or `.jsx` file
2. **Choose Output Mode**:
   - 💾 **Save to File** — Export to a text file
   - 📋 **Copy to Clipboard** — Instant copy for pasting
3. **Optional Settings**:
   - ⚡ **Bundle Mode** — Enable esbuild bundling with tree-shaking
   - 🗜️ **Minify Output** — Compress the output further
4. **Click Process** — Done! See your token savings instantly

## 📁 Folder Mode

Process multiple files at once with granular control:

1. Select **Folder** in the input type toggle
2. Click **Browse** and select a folder
3. A **file picker** appears showing all `.ts/.tsx/.js/.jsx` files found
4. **Check/uncheck** individual files to include/exclude
5. Use **Select All** / **Deselect All** for quick selection
6. Process only the files you need!

### Smart Deduplication

When processing multiple files in folder mode, the app automatically:

- **Follows imports** — Resolves and includes all dependencies from selected files
- **Deduplicates shared modules** — If multiple files import the same dependency, it's included only once
- **Shows accurate stats** — Displays the actual count of deduplicated files processed

> **Note:** Folder mode skips `node_modules`, `dist`, `.git`, and other build directories automatically.

## � Dependency Graph

Visualize how your files are connected! After selecting an entry file, click **"Show Dependency Graph"** to open an interactive modal showing:

| Element | Description |
|---------|-------------|
| 🚀 **Entry File** | Your main entry point (highlighted in purple) |
| 📄 **Dependencies** | Files imported by your code |
| 🔄 **Circular** | Circular import detected (yellow warning) |
| ❌ **Missing** | File not found (red error) |

**Stats displayed:**
- **Total Files** — Number of files in the dependency tree
- **Max Depth** — Deepest level of nested imports
- **Direct Dependencies** — Files directly imported by entry file

Click on any node with children to **collapse/expand** that branch.

## �💡 Token Savings

When using Bundle mode, the app calculates:

| Metric | Description |
|--------|-------------|
| **Original Tokens** | Estimated tokens before compression (~4 chars/token) |
| **Compressed Tokens** | Tokens after bundling & tree-shaking |
| **Tokens Saved** | Difference = cost savings |
| **$ Saved** | Based on GPT-4 input pricing (~$0.03/1K tokens) |

## 🏗️ Building for Production

```bash
# Build macOS app (DMG + ZIP)
yarn build
```

The built app will be in the `dist/` folder.

## 📁 Project Structure

```
code-compiler/
├── main.js          # Electron main process + CodeCombiner logic
├── index.html       # UI with embedded styles and scripts
├── package.json     # Dependencies and build config
└── dist/            # Built application output
```

## 🛠️ Tech Stack

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop app
- **[esbuild](https://esbuild.github.io/)** — Ultra-fast bundler with tree-shaking
- **Vanilla JS/CSS** — No frameworks, just clean code

## 📝 License

MIT © [Vincent Nguyen](https://github.com/glorynguyen)

---

<p align="center">
  <strong>Made with 💜 for developers who love AI tools</strong>
</p>
