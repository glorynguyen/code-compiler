# 🚀 Code Combiner

**Code Combiner** is a lightweight Electron application designed to intelligently bundle your TypeScript and JavaScript source files into a single, optimized output. It is purpose-built for **sharing code with AI/LLM tools** like ChatGPT, Claude, and Gemini.

Instead of manually copying dozens of files, Code Combiner creates a clean, deduplicated, and readable code context with a single click.

![Platform](https://img.shields.io/badge/Platform-macOS-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28.0-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- **📂 Smart Import Resolution**  
  Automatically follows `import` statements (relative, absolute, and `src/` paths).
- **🌳 Tree Shaking**  
  Powered by [esbuild](https://esbuild.github.io/) to remove unused code and dead exports.
- **🗜️ Optional Minification**  
  Compress output further to minimize token usage without losing logic.
- **💰 Token Savings Calculator**  
  Estimates token counts and cost savings based on the GPT-4 pricing model.
- **📊 Dependency Graph**  
  An interactive visualization of your file relationships, depth, and potential issues.
- **📁 Folder Mode**  
  Process entire directories with granular file selection and "ignore" rules.
- **📋 Instant Export**  
  One-click "Copy to Clipboard" or "Save to File" functionality.

---

## 🖥️ Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) (v4+)

### Setup
```bash
# Clone the repository
git clone https://github.com/glorynguyen/code-combiner.git
cd code-combiner

# Install dependencies
yarn install

# Start the application in development mode
yarn start
```

---

## 🎯 Usage

### 1. Select Entry File
Choose a `.ts`, `.tsx`, `.js`, or `.jsx` file as your starting point. Code Combiner will crawl the import tree from this file.

### 2. Configure Settings
*   **⚡ Enable Bundle Mode:** Uses `esbuild` for tree-shaking and dependency resolution.
*   **🗜️ Enable Minification:** Strips whitespace and comments to save tokens.

### 3. Folder Mode
If you prefer not to use an entry point, select **Folder Mode**:
1. Choose a directory.
2. Toggle files on/off using the interactive file tree.
3. Common directories like `node_modules`, `dist`, and `.git` are excluded automatically.

### 4. Process & Export
Click **Process** to generate the output. You can then:
*   **💾 Save to File:** Export the bundle as a `.txt` or `.js` file.
*   **📋 Copy to Clipboard:** Instantly paste the result into your AI prompt.

---

## 📊 Dependency Graph Legend

Visualize your code structure before exporting to identify bloat or circular logic.

| Icon | Meaning | Description |
| :--- | :--- | :--- |
| 🚀 | **Entry** | The starting point of your bundle. |
| 📄 | **File** | A standard imported dependency. |
| 🔄 | **Circular** | A circular dependency was detected. |
| ❌ | **Missing** | A file was referenced but could not be resolved. |

---

## 💡 Token Savings
When **Bundle Mode** is enabled, the app calculates:

*   **Original Tokens:** Estimated tokens if you copied every file manually.
*   **Optimized Tokens:** Tokens after tree-shaking and bundling.
*   **Cost Saved ($):** Based on GPT-4 input pricing (~$0.03 / 1K tokens).

*Note: Token estimation assumes ~4 characters per token.*

---

## 🏗️ Build for Production

To package the application for macOS:

```bash
yarn build
```
The output (DMG and ZIP) will be located in the `dist/` folder.

---

## 📁 Project Structure

```text
code-combiner/
├── main.js        # Electron main process (Core Logic)
├── index.html     # UI (HTML + CSS + JS)
├── package.json   # Dependencies & build config
└── dist/          # Production builds
```

---

## 🛠️ Tech Stack

*   **Framework:** [Electron](https://www.electronjs.org/)
*   **Bundler:** [esbuild](https://esbuild.github.io/)
*   **UI:** Vanilla JavaScript & CSS (Modern & Dependency-free)

## 📝 License

MIT © [Vincent Nguyen](https://github.com/glorynguyen)

---
<p align="center"> <strong>Built for developers who use AI seriously.</strong> </p>