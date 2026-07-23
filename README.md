# FACET — Minimal Clock Web Application

> **Distraction-free digital time art.** An ultra-minimalist web application featuring 60 curated theme variations across Glassmorphic, Claymorphic, Neumorphic, and Brutalist design systems.

---

## ✨ Features

- **60 Theme Configurations**: 10 Analog + 10 Digital variations across 3 sub-variants (Light, Dark, Sepia/CRT/Specialized).
- **Four Distinct Design Systems**:
  - **Glassmorphism**: Frosted glass discs (`backdrop-filter`), glowing semi-transparent hands, and chromatic rainbow borders.
  - **Claymorphism**: Volumetric 3D puffy discs, extruded `Nunito` typography, minute-bounce micro-interactions.
  - **Neumorphism**: Flush debossed soft UI with dual inner/outer light & shadow interplay.
  - **Brutalism**: High-contrast geometric frames, 4px-6px raw borders, `Space Mono` typography, 100ms chromatic glitch ticks.
- **Liquid Glass Floating Toolbar**: Custom Morphism dropdown menus that dynamically adapt to the active visual style and color palette.
- **Toast Notification & Hide UI Controls**: Hide all controls for zero distraction; restore instantly with `Esc`.
- **Progressive Web App (PWA)**: Full offline capability powered by Service Worker caching.

---

## ⌨️ Shortcuts & Navigation

| Control | Action |
| :--- | :--- |
| **Click / Tap** | Toggle Mode (Analog ↔ Digital) |
| **&larr; &rarr; / Swipe** | Cycle Style Variation (1–10) |
| **&uarr; &darr; / Swipe** | Cycle Sub-variant / Palette |
| **Double Click / F** | Toggle Fullscreen |
| **Hide UI Button** | Hide controls (shows toast instructions) |
| **Esc** | Restore hidden UI & close menus |
| **R** | Reset to Default Theme |
| **?** | Toggle Info Modal |

---

## 🛠️ Local Development

Simply serve the project root using any static web server:

```bash
npx serve .
```

Then open `http://localhost:3000` in your web browser.

---

## 📄 Documentation

- [Technical Context (`context/context.md`)](context/context.md)
- [Design System Specification (`context/design.md`)](context/design.md)
- [Product Requirements Document (`app-prd.md`)](app-prd.md)
