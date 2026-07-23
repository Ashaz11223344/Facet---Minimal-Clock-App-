# FACET — Design System Specification (`design.md`)

## 1. Design Philosophy
**Facet** is grounded in strict digital minimalism: zero interface clutter, generous negative space, crisp typography, and harmonious curated color palettes. The user interface floating elements (toolbar, dropdowns, shortcut triggers) feature a **Liquid Glass** aesthetic that seamlessly blends into any active background style.

---

## 2. The Four Morphisms

### 2.1 Glassmorphism (Analog A7 / Digital D7)
- **Visual Features**: Frosted glass panels rendered via `backdrop-filter: blur(16px - 28px) saturate(180%)`, semi-transparent glowing hands (`<feGaussianBlur>`), glowing dot hour markers.
- **Sub-Variants**:
  - `Clear Glass`: Light pastel background mesh with white translucent glass.
  - `Smoked Glass`: Dark slate background with deep frosted glass.
  - `Iridescent`: Glowing rainbow gradient animated stroke border (`iridescent-border`).
  - `Color Wash`: Multi-color animated mesh gradient background.

### 2.2 Claymorphism (Analog A8 / Digital D8)
- **Visual Features**: Volumetric 3D puffy discs & pills using multi-layered soft drop shadows (`14px 14px 28px ...`, `inset 3px 3px 6px ...`). Cushion-like smooth hand animations and extruded 3D text using Google Fonts **Nunito (900 Weight)**.
- **Sub-Variants**:
  - `Pastel Mint`: Soft mint green with terracotta hands.
  - `Warm Clay`: Terracotta and warm beige.
  - `Toy Dark`: Dark indigo background with soft colored pastel hands.
  - `Marshmallow`: Crisp white digits on soft pastel green.
  - `Mud Pie`: Dark chocolate with warm cream digits.
  - `Candy`: Bright rose digits on cream.

### 2.3 Neumorphism (Analog A9 / Digital D9)
- **Visual Features**: Extreme soft UI. Clock face and debossed digital text sit flush against the background using dual inset and outset shadows (`inset 10px 10px 20px ...`). No borders, no glow—depth is created purely by light and shadow interplay.
- **Sub-Variants**:
  - `Soft Light`: Crisp light gray / white deboss.
  - `Dark Neumorphism`: Deep dark slate deboss.
  - `Monochrome Blue`: Subtle slate blue deboss.
  - `Tinted Concrete`: Warm grey slate deboss.

### 2.4 Brutalism (Analog A10 / Digital D10)
- **Visual Features**: Raw, unpolished, high-contrast aesthetic. Geometric square dial frame rotated -1.5°, 4px–6px solid black/white borders, zero anti-aliasing feel, construction-beam rectangular hands, raw slashes `/`, Google Fonts **Space Mono**. Includes a 100ms chromatic glitch keyframe effect (`glitch-tick`) on second changes.
- **Sub-Variants**:
  - `Black on White`
  - `White on Black`
  - `Concrete`: Slate grey with highlighter orange accent.
  - `Black/Yellow`: Highlighter yellow background with stark black wireframes.
  - `Redacted`: Classified document style with black bars and red accents.

---

## 3. UI Component Specifications

### 3.1 Liquid Glass Toolbar & iOS Squircle Radii
- **Toolbar Surface**:
  ```css
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 36px;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 16px 36px rgba(0, 0, 0, 0.35);
  ```
- **Custom Select Dropdown**:
  - Replaces native OS `<select>` elements.
  - Floating menu (`.cs-options`) dynamically inherits `data-morphism` attributes (`glass`, `clay`, `neumorphism`, `brutalism`) and active CSS theme variables (`--bg`, `--fg`, `--accent`, `--card-bg`).

### 3.2 Toast Notification Banner
- Fades in at the bottom center of the screen displaying `ℹ UI hidden. Press Esc to restore controls`.
- Auto-dismisses smoothly after 3.5 seconds.
