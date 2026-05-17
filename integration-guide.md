# Integration Guide

How to adopt this UI redesign into the Claude to PDF extension source code.

## Architecture

The redesign is implemented as an **overlay script** (`pdf-panel.js`) that:

1. Hides the original extension UI (`#gpt-pdf-container { display: none }`)
2. Injects a trigger button into `[data-testid="chat-actions"]`
3. Renders a modal dialog with all export settings
4. On "Export", logs state to console (needs to be wired to actual export functions)

This overlay approach was chosen because the original extension's JS is bundled/minified, making direct component replacement impractical for a third-party contributor.

## For the Extension Author

The recommended integration path is to **rewrite the React components** in the source code to match this design, rather than shipping the overlay script. Specifically:

### 1. Replace the Toolbar Button

**Current**: Split button group (`._exportGroup_` + `._exportBtn_` + `._exportToggle_` + `._settingsBtn_`)

**Proposed**: Single ghost icon button (download icon) matching Claude's native button pattern:
```
class="_fill_10ocf_9 _ghost_10ocf_96"
```

### 2. Replace the Dropdown Panel with a Modal Dialog

**Current**: Fixed-position dropdown panel (`._dropDown_1143y_86`) anchored to the button

**Proposed**: Centered modal dialog with backdrop overlay, matching Claude's Share dialog pattern:
- Backdrop: `var(--cds-backdrop)` with `position: fixed; inset: 0`
- Dialog: `var(--cds-surface-popover)` background, `var(--cds-shadow-popover)` shadow, `border-radius: 16px`
- Wrapper: `class="cds-root text-primary" data-density="comfortable"`

### 3. Replace Custom Controls with CDS Components

| Current | Replace With |
|---------|-------------|
| Custom theme toggle (Light/Dark buttons with gradients) | CDS `SegmentedControl` with Anthropicons font icons |
| Custom switch (green gradient) | CDS `Switch` (`bg-switch-track` / `data-[checked]:bg-fill-accent`) |
| Radix Select dropdowns | CDS Combobox pattern (from Chat font selector) |
| Custom text inputs | CDS `TextInput` (`cds-input cds-reset h-control bg-fill-field`) |
| "Save Claude Messages Only" / "Select Messages" cards | `SegmentedControl` with "All Msg / Claude Only / Select" |
| Rating stars / support email / feature request | "About" ghost button with popover menu |

### 4. Key CDS Design Tokens

Ensure the panel wrapper has `class="cds-root" data-density="comfortable"` so these variables resolve:

```
--cds-h-control: 32px
--cds-switch-h: 24px
--cds-radius: 8px
--cds-text-body: 14px
--cds-gap-lg: 28px
--cds-pad-sm: 8px
--cds-pad-md: 12px
--cds-fill-accent: var(--cds-blue-450) = #2a78d6
--cds-surface-popover: var(--cds-gray-0) = #ffffff
--cds-shadow-popover: 0 8px 24px rgb(0 0 0 / .12), 0 2px 6px rgb(0 0 0 / .08)
```

### 5. Anthropicons Font Glyphs

The icons used in this redesign (all from the bundled Anthropicons Variable font):

| Glyph | Code | Usage |
|-------|------|-------|
| ☀️ sun | U+E0EE | Theme: Light |
| 🌙 moon | U+E0B0 | Theme: Dark |
| 🖥 system | U+E053 | Theme: Auto |
| ∨ chevron-down | U+E027 | Combobox trigger |
| ✓ check | U+E03B | Combobox selected item |
| ↕ expand | U+E02C | Expand all thinking |
| ✕ collapse | U+E028 | Collapse all thinking |

### 6. Wiring Export Functions

In `pdf-panel.js`, the Export button currently does `console.log(state)`. To connect it to the actual export logic, call the existing functions from the main bundle:

- **PDF export**: `_g()` / `QT()` (the functions behind "Save as PDF" / "Save Claude Messages Only")
- **Markdown export**: `D3()` 
- **JSON export**: `KT()`

These are internal to the minified bundle. In the source code, they correspond to the export handlers in the React components.

## State Mapping

| Panel State | Original Setting |
|-------------|-----------------|
| `range: "all"` | `exportMode: "all"` |
| `range: "claude"` | `exportMode: "only-gpt"` |
| `range: "select"` | `exportMode: "selected"` |
| `format: "pdf"` | triggers PDF export function |
| `format: "md"` | triggers Markdown export function |
| `format: "json"` | triggers JSON export function |
| `theme` | `settings.theme` |
| `thinking` | `settings.includeThinking` |
| `scale` | `settings.scale` |
| `pageSize` | `settings.format` (confusing name in original) |
| `filename` | `settings.filename` |
| `title` | `settings.title` |
