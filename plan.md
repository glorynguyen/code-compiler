# Code Combiner - Feature Roadmap

## 📋 Current Features (v1.1)
- ✅ Single file and folder processing
- ✅ Dependency resolution and deduplication
- ✅ Import path resolution (relative, src/, node_modules)
- ✅ Compression via esbuild with tree-shaking
- ✅ Token and cost estimation
- ✅ Clipboard and file output modes
- ✅ Basic dependency graph generation
- ✅ Multi-file selection from folder scan
- ✅ **Smart Ignore Patterns (glob support, .gitignore integration)**

---

## 🚀 Phase 1: Core Improvements (High Priority)

### 1.1 Output Format Options
**Effort:** Medium | **Impact:** High | **Priority:** P0

- [ ] Markdown format with fenced code blocks
  ```markdown
  ## File: src/utils.ts
  ```typescript
  // code here
  ```
  ```
- [ ] XML/JSON structured output for LLM parsing
- [ ] Custom delimiter configuration
- [ ] Toggle file headers on/off
- [ ] Line number prefix option
- [ ] Add file metadata (size, modified date, imports count)

**Implementation Notes:**
- Create format presets: "Plain", "Markdown", "XML", "JSON"
- Allow custom template string with variables

---

### 1.2 Enhanced Compression Modes
**Effort:** Medium | **Impact:** Medium | **Priority:** P1

- [ ] Smart comment preservation (`@preserve`, `@license`, JSDoc)
- [ ] Variable name preservation whitelist
- [x] Compression level selector (Minify toggle implemented)
  - [ ] None (full formatting)
  - [ ] Light (remove comments only)
  - [ ] Medium (minify whitespace)
  - [x] Aggressive (full minification)
- [ ] Optional source map generation
- [x] Dead code elimination toggle (Enabled by default via esbuild)

**Implementation Notes:**
- Extend esbuild options configuration
- Add custom regex patterns for comment preservation

---

### 1.3 Dependency Visualization
**Effort:** High | **Impact:** Medium | **Priority:** P1

- [x] Interactive dependency graph (Tree View implementation)
- [ ] Export graph as PNG/SVG
- [x] Circular dependency detection with warning badges
- [ ] Unused file detection (files with no incoming imports)
- [x] Import depth level visualization (via tree structure)
- [ ] Click to highlight file dependencies
- [ ] Filter graph by file type or depth

**Implementation Notes:**
- Create new window/panel for graph view
- Use graph layout algorithms (force-directed, hierarchical)

---

### 1.4 Multi-Project Support
**Effort:** Medium | **Impact:** High | **Priority:** P1

- [ ] Save project configurations as JSON profiles
- [ ] Recent projects list (last 10)
- [ ] Project-specific settings:
  - Ignore patterns
  - Compression level
  - Output format
  - Custom paths
- [ ] Quick switch between projects
- [ ] Batch processing queue for multiple projects

**Implementation Notes:**
- Store configs in `~/.codecombiner/projects/`
- Add project management UI panel

---

## 🔧 Phase 2: Advanced Features (Medium Priority)

### 2.1 Advanced Filtering
**Effort:** Medium | **Impact:** Medium | **Priority:** P2

- [ ] Filter by file size (min/max KB)
- [ ] Filter by date modified (last N days)
- [ ] Filter by import depth level
- [ ] "Entry point only" mode (only imported files)
- [ ] Exclude files with no exports
- [ ] Include only files matching regex pattern
- [ ] File type priority ordering

---

### 2.2 Code Statistics & Analysis
**Effort:** High | **Impact:** Medium | **Priority:** P2

- [ ] Lines of code breakdown:
  - Total lines
  - Code lines
  - Comment lines
  - Blank lines
- [ ] Cyclomatic complexity per file
- [ ] Duplicate code detection (using AST comparison)
- [ ] Dead code detection (unused exports)
- [ ] Language/framework detection
- [ ] Export statistics dashboard

**Implementation Notes:**
- Use `@typescript-eslint/parser` for AST analysis
- Integrate `jscpd` for duplication detection

---

### 2.3 Output Optimization
**Effort:** High | **Impact:** High | **Priority:** P2

- [ ] Smart chunking for token limits
  - Split at logical boundaries (modules)
  - Overlap chunks for context
- [ ] File prioritization algorithm
- [ ] Generate table of contents at output start
- [ ] AI-friendly metadata headers
- [ ] Token budget mode with auto-split
- [ ] Cost estimator for different LLM providers

**Implementation Notes:**
- Implement graph-based importance ranking
- Add token counting for Claude, GPT-4, etc.

---

### 2.4 Preview & Validation
**Effort:** Medium | **Impact:** Medium | **Priority:** P2

- [ ] Live preview panel with syntax highlighting
- [ ] Syntax validation for TypeScript/JavaScript
- [ ] Before/after diff viewer for compression
- [ ] Search within combined output
- [ ] File inclusion checklist preview
- [ ] Estimated processing time display

**Implementation Notes:**
- Use Monaco Editor for preview
- Implement incremental preview updates

---

### 2.5 Template System
**Effort:** Medium | **Impact:** Medium | **Priority:** P3

- [ ] Custom output templates with variables:
  - `{{PROJECT_NAME}}`
  - `{{DATE}}`
  - `{{FILE_COUNT}}`
  - `{{TOTAL_LINES}}`
- [ ] Include project README/docs
- [ ] Custom headers and footers
- [ ] AI prompt template presets:
  - "Code Review"
  - "Bug Analysis"
  - "Refactoring Suggestions"
  - "Documentation Generation"
- [ ] Template marketplace/sharing

---

## 🎨 Phase 3: Polish & Extended Features (Nice-to-Have)

### 3.1 Watch Mode
**Effort:** Medium | **Impact:** Low | **Priority:** P3

- [ ] Auto-rebuild on file changes
- [ ] Live preview with hot reload
- [ ] Debounced file system watching
- [ ] Change notification system

---

### 3.2 Export Formats
**Effort:** High | **Impact:** Low | **Priority:** P3

- [ ] PDF with syntax highlighting (using Puppeteer)
- [ ] HTML with collapsible sections
- [ ] Jupyter notebook format (`.ipynb`)
- [ ] ZIP archive with preserved structure
- [ ] GitHub Gist integration

---

### 3.3 Integration Features
**Effort:** High | **Impact:** Medium | **Priority:** P3

- [ ] CLI version for automation
- [ ] VS Code extension
- [ ] GitHub Actions workflow generator
- [ ] REST API endpoint for remote processing
- [ ] Webhook support for CI/CD

**Implementation Notes:**
- Extract core logic to shared library
- Create separate packages for CLI/VSCode

---

### 3.4 Collaboration Features
**Effort:** Medium | **Impact:** Low | **Priority:** P4

- [ ] Share configurations as shareable links
- [ ] Import/export preset files
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Team presets library
- [ ] Collaborative filtering sessions

---

### 3.5 AI-Specific Enhancements
**Effort:** High | **Impact:** High | **Priority:** P2

- [ ] Auto-detect context window for LLM providers:
  - Claude (200K tokens)
  - GPT-4 (128K tokens)
  - GPT-3.5 (16K tokens)
- [ ] Smart chunking strategies:
  - By module
  - By feature
  - By dependency graph
- [ ] Generate separate prompts per chunk
- [ ] Include file relationship metadata
- [ ] Auto-generate code summaries
- [ ] LLM-optimized formatting

**Implementation Notes:**
- Add LLM provider selector in UI
- Implement chunk overlap for context preservation

---

### 3.6 Security & Privacy
**Effort:** Medium | **Impact:** High | **Priority:** P1

- [ ] Secret scanning (API keys, passwords, tokens)
- [ ] Redact sensitive patterns via regex
- [ ] Anonymize file paths option
- [ ] Auto-exclude `.env` files
- [ ] Security report generation
- [ ] Integration with `git-secrets` or `trufflehog`

**Implementation Notes:**
- Use common secret patterns database
- Add manual review step before output

---

### 3.7 Performance Improvements
**Effort:** High | **Impact:** Medium | **Priority:** P2

- [ ] Parallel file processing with worker threads
- [ ] Caching system for unchanged files
- [ ] Incremental builds (only process changed files)
- [ ] Memory usage optimization for large projects (>1000 files)
- [ ] Streaming output for massive codebases
- [ ] Progress streaming to UI

**Implementation Notes:**
- Use Node.js worker threads
- Implement file hash-based caching

---

### 3.8 UI/UX Enhancements
**Effort:** Medium | **Impact:** Medium | **Priority:** P2

- [ ] Dark/light theme toggle
- [ ] Drag & drop for files/folders
- [ ] Progress bar with ETA
- [ ] Keyboard shortcuts:
  - `Ctrl+O` - Open file
  - `Ctrl+S` - Save output
  - `Ctrl+P` - Process
  - `Ctrl+K` - Copy to clipboard
- [ ] Multi-tab support for comparing outputs
- [ ] Split view (before/after)
- [ ] File tree visualization
- [ ] Settings panel with categories

**Implementation Notes:**
- Redesign UI with modern framework (React in renderer)
- Add accessibility features (ARIA labels, keyboard nav)

---

## 📊 Priority Matrix

| Feature | Effort | Impact | Priority | Phase |
|---------|--------|--------|----------|-------|
| Output Format Options | Medium | High | P0 | 1 |
| Enhanced Compression | Medium | Medium | P1 | 1 |
| Dependency Visualization | High | Medium | P1 | 1 |
| Multi-Project Support | Medium | High | P1 | 1 |
| Security & Privacy | Medium | High | P1 | 3 |
| AI-Specific Enhancements | High | High | P2 | 3 |
| Output Optimization | High | High | P2 | 2 |
| Advanced Filtering | Medium | Medium | P2 | 2 |
| Code Statistics | High | Medium | P2 | 2 |
| UI/UX Enhancements | Medium | Medium | P2 | 3 |
| Performance Improvements | High | Medium | P2 | 3 |

---

## 🔄 Implementation Phases

### Phase 1 (Q1 2025) - Foundation
Focus: Core improvements that users need most
- Output Format Options
- Enhanced Compression
- Dependency Visualization
- Multi-Project Support

### Phase 2 (Q2 2025) - Intelligence
Focus: Advanced analysis and optimization
- Advanced Filtering
- Code Statistics
- Output Optimization
- Preview & Validation

### Phase 3 (Q3 2025) - Scale & Polish
Focus: Performance, security, and user experience
- AI-Specific Enhancements
- Security & Privacy
- Performance Improvements
- UI/UX Enhancements

### Phase 4 (Q4 2025) - Ecosystem
Focus: Integrations and collaboration
- Watch Mode
- Export Formats
- Integration Features
- Collaboration Features

---

## 📝 Notes

### Technical Debt to Address
- [ ] Refactor `CodeCombiner` class into smaller modules
- [ ] Add comprehensive error handling
- [ ] Implement unit tests (Jest)
- [ ] Add integration tests for esbuild
- [ ] Document API for plugin system (future)
- [ ] Create architecture documentation

### Dependencies to Consider
- `d3` or `cytoscape` - Graph visualization
- `monaco-editor` - Code preview
- `puppeteer` - PDF export
- `@typescript-eslint/parser` - AST analysis
- `jscpd` - Duplicate detection
- `chokidar` - File watching

### Community Feedback
- [ ] Create GitHub repository
- [ ] Add issue templates
- [ ] Set up discussions for feature requests
- [ ] Create roadmap visualization (GitHub Projects)

---

**Last Updated:** December 2025  
**Version:** 1.1  
**Maintainer:** Vincent Nguyen