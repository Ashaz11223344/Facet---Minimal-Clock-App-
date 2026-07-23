# FACET — Technical & Project Context (`context.md`)

## 1. Executive Overview
**Facet** is a single-page, zero-dependency, ultra-minimalist web application and standalone Windows desktop application designed to display an elegant digital art clock. It supports **10 Analog** and **10 Digital** visual variations across 3 sub-variants (60 total theme configurations), featuring Glassmorphic, Claymorphic, Neumorphic, and Brutalist design systems.

---

## 2. Core Architecture & Tech Stack
- **Frontend Stack**: Pure Vanilla HTML5, CSS3 Custom Properties, Modern ES6 JavaScript modules. Zero external framework dependencies.
- **Typography**: Google Fonts integration (`Nunito`, `Space Mono`, `Inter`).
- **PWA & Offline Support**: Web App Manifest (`manifest.json`) and Service Worker (`sw.js`).
- **Desktop Executable**: Electron v28 process wrapper (`main.js` + `package.json`) bundled via `@electron/packager` into `dist/FacetClock-win32-x64/FacetClock.exe`.

---

## 3. Directory Layout & Module Responsibilities

```
d:\Facet - Clock Website\
├── index.html               # Main DOM structure, Google Fonts, toolbar, modal, and mesh containers
├── styles.css               # Design System CSS variables, 4 Morphisms, liquid glass toolbar, CRT scanlines
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker caching static assets (facet-clock-v7)
├── package.json             # NPM dependencies & Electron build scripts
├── main.js                  # Electron desktop application main process
├── context/
│   ├── context.md           # Project architecture & context documentation (this file)
│   └── design.md            # Exhaustive Design System manual
├── js/
│   ├── themes.js            # Theme Catalog Registry (60 variation & palette objects)
│   ├── renderers.js         # SVG Analog clock face & DOM Digital clock renderers
│   ├── clock.js             # High-precision 60fps / 1s render engine & state manager
│   └── controls.js          # Toolbar UI, custom dropdowns, Fullscreen API, Hide UI & shortcut handlers
└── dist/
    └── FacetClock-win32-x64/
        └── FacetClock.exe   # Standalone Windows Desktop Application executable
```

---

## 4. User Interaction & Shortcuts
- **Click / Tap Clock Stage**: Toggle Mode (Analog ↔ Digital).
- **Arrow Left / Right (or Horizontal Touch Swipe)**: Cycle Variation (1–10).
- **Arrow Up / Down (or Vertical Touch Swipe)**: Cycle Sub-variant / Palette.
- **Double Click or `F` Key**: Toggle Native HTML5 Fullscreen.
- **`R` Key**: Reset state to default (Glassmorphism Analog — Clear Glass).
- **`Esc` Key**: Restore UI controls, unhide toolbar, close modal/dropdowns.
- **`?` Key**: Toggle keyboard shortcut legend modal.

---

## 5. State Persistence
Clock state is serialized to `localStorage` under key `facet_state`:
```json
{
  "mode": "analog",
  "variationIndex": 6,
  "subVariantIndex": 0
}
```
State mutators preserve `variationIndex` and `subVariantIndex` across mode toggles to avoid resetting active themes.
