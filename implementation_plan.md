# Documentation Update Plan

## Goal
Update `README.md` to accurately reflect the current implementation of the Code Combiner application, specifically regarding ignored directories, tree-shaking behavior, and asset handling.

## Proposed Changes

### README.md

#### [MODIFY] README.md

1.  **Update Ignored Directories**:
    -   Current: `node_modules`, `dist`, `.git`
    -   New: `node_modules`, `dist`, `.git`, `.next`, `build`, `coverage`

2.  **Clarify Tree Shaking**:
    -   Clarify that full Tree Shaking is specific to **Single Entry File** mode.
    -   Explain that **Folder Mode** performs file concatenation and minification but not cross-file tree shaking.

3.  **Add Asset Handling Note**:
    -   Add a note that non-code assets (CSS, images, fonts) are mocked/ignored during the bundling process to prevent errors.

## Verification Plan

### Manual Verification
-   Review the updated `README.md` content to ensure it reads clearly and accurately describes the features.
