**App name = Facet**

**Product Requirements Document (PRD)****Project:** Minimal Clock Web App**Prepared for:** Antigravity Agent**Date:** July 24, 2026

1\. Executive Summary
---------------------

Build a single‑page web application that displays an elegant, minimal clock. The clock must support both **analog** and **digital** display modes, with a carefully curated set of visual variations. The entire experience is designed to be calm, distraction‑free, and visually striking while remaining extremely lightweight. The Antigravity Agent will own end‑to‑end development – from design tokens to deployment.

2\. Product Vision
------------------

A “leave‑open in a browser tab” clock that feels like a piece of thoughtful digital art. Users can toggle between analog and digital representations and cycle through minimal variations (color themes, hand styles, numeral treatments) with zero interface clutter.

3\. Target Audience & Use Cases
-------------------------------

*   **Focus workers** who want a full‑screen clock while working in deep focus mode.
    
*   **Design enthusiasts** who appreciate clean typography and subtle motion.
    
*   **Developers/tech enthusiasts** wanting a beautiful clock for a secondary monitor or smart display.
    
*   **Night‑owl readers** using it as a bedside clock with dark, eye‑friendly themes.
    

**Primary Use Cases:**

1.  User opens the URL → clock immediately shows current local time.
    
2.  User clicks/taps the clock face → toggles between analog and digital.
    
3.  User swipes left/right (or presses arrow keys) → cycles through visual variations.
    
4.  User double‑clicks → enters full‑screen mode (F11 fallback).
    
5.  The clock remembers the last chosen mode and variation across sessions.
    

4\. Design Principles (Minimalism)
----------------------------------

*   **No chrome, no menus, no settings panels.** Only the clock and subtle interaction hints.
    
*   **Negative space is the core design element.** The clock must float in generous empty space.
    
*   **Typography:** At most two font families – one crisp monospace (for digital) and one elegant sans‑serif (for analog numerals). System font stack preferred for instant load.
    
*   **Motion:** Real‑time second hand movement (smooth sweep or tick, depending on variation). No page transitions other than an instant, clean cross‑fade when switching mode.
    
*   **Color:** Each variation consists of a background color, foreground (hands/digits) color, and an optional subtle accent. All themes are tested for WCAG AA contrast.
    
*   **Responsive but minimal:** The clock scales to fill the viewport gracefully, but never adds layout elements.**Additional Design Variations (Glassmorphism, Claymorphism, Neumorphism, Brutalism)**
    
*   Four new visual languages are added to the existing catalog. Each works as a distinct variation for both analog and digital modes, bringing the total to 10 analog variations and 10 digital variations (60 themes with sub‑variants).
    
*   New Analog Variations
    
*   **A7 – Glassmorphism Analog**
    
*   Face rendered as a frosted glass disc using backdrop-filter: blur() (CSS) on a semi‑transparent white/dark background with subtle border.
    
*   Hands are semi‑transparent with a soft glow; hour markers are tiny glowing dots.
    
*   Background behind the clock is a gentle gradient or a subtly animated blurred image (optional, lightweight SVG gradient for minimalism).
    
*   Sub‑variants: _Clear Glass (light)_, _Smoked Glass (dark)_, _Iridescent_ (thin rainbow edge).
    
*   **A8 – Claymorphism Analog**
    
*   Chubby, playful 3D look. Clock face is a rounded, puffy disc with inner and outer soft shadows (using layered CSS shadows), giving a raised, squishy appearance.
    
*   Hands are thick with rounded caps and soft shadows, moving with slight cushion-like animation.
    
*   Hour markers are raised pill shapes. Color palette: pastel backgrounds with soft contrasting hands.
    
*   Sub‑variants: _Pastel Mint (light)_, _Warm Clay (terracotta/beige)_, _Toy Dark (dark background with colored soft hands)_.
    
*   **A9 – Neumorphism Analog**
    
*   Extreme soft UI. The clock face sits flush against the background (same color) with subtle inset and outset shadows creating depth.
    
*   Hands are simple and thin, with no glow, matching the foreground color.
    
*   Minimal hour marks: just subtle pressed dots at 12, 3, 6, 9.
    
*   No border, just light & shadow interplay.
    
*   Sub‑variants: _Soft Light (light gray/white)_, _Dark Neumorphism (dark gray/black)_, _Monochrome Blue_.
    
*   **A10 – Brutalism Analog**
    
*   Raw, unpolished aesthetic. Clock face is a stark geometric shape (square or polygon) rather than a circle. Heavy black borders, no anti‑aliasing feel.
    
*   Hands are bold, monospaced, resembling construction beams. Hour markers are raw slashes.
    
*   Color palette: #000, #fff, highlighter yellow as accent.
    
*   The entire clock may be slightly rotated or offset. Background is solid and intentionally harsh.
    
*   Sub‑variants: _Black on White_, _White on Black_, _Concrete (greys + orange accent)_.
    
*   New Digital Variations
    
*   **D7 – Glassmorphism Digital**
    
*   Time digits appear as large, light‑weight typography over a frosted glass panel (blurred background area behind the digits).
    
*   The background panel is a pill or rounded rectangle with background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3);.
    
*   Colons are subtle glassy separators.
    
*   Sub‑variants: _Light Glass_, _Dark Glass_, _Color Wash_ (soft gradient behind glass).
    
*   **D8 – Claymorphism Digital**
    
*   Digits styled as extruded, puffy 3D text using multiple text shadows (no WebGL, just stacked CSS shadows). Rounded, playful font (e.g., "Nunito", "Baloo 2").
    
*   Each digit block is inside a softly raised pill with a drop shadow that mimics soft clay.
    
*   Gentle bounce on minute change (optional micro‑interaction).
    
*   Sub‑variants: _Marshmallow (white digits on pastel)_, _Mud Pie (dark chocolate with light digits)_, _Candy (bright colored digits on cream)_.
    
*   **D9 – Neumorphism Digital**
    
*   Digits appear as if they are pressed into the background. Using a technique of light text with multiple inset shadows (simulated via pseudo‑elements or clever background‑clip). The numbers have a concave feel.
    
*   Background and digits share the same base color, depth created only by shadow.
    
*   No borders, no glowing. Extremely subtle.
    
*   Sub‑variants: _Light Deboss_, _Dark Deboss_, _Tinted Concrete_.
    
*   **D10 – Brutalism Digital**
    
*   Bold monospaced font (system default, e.g., Courier New) with raw, unstyled look.
    
*   Digits may be broken into separate blocks with heavy, visible borders (like wireframes). Background is pure black or stark yellow.
    
*   No colons – time separated by slashes or vertical pipes.
    
*   "Glitch" effect optionally on seconds change (slight offset or chromatic aberration for 100ms).
    
*   Sub‑variants: _Black/Yellow_, _White/Black_, _Redacted (black bars with white text like classified docs)_.
    

5\. Feature Set & Variations
----------------------------

### 5.1 Core Clock Engine

*   Accurate local time using Date object, refreshed every second (or 60 fps for smooth sweep analog).
    
*   Timezone: browser’s local timezone; no timezone picker (minimalism).
    

### 5.2 Analog Mode Variations

The analog clock is a vector‑drawn face using SVG or Canvas (prefer SVG for sharp scaling). Variations:

VariationDescription**Classic Minimal**Thin line hour markers (12, 3, 6, 9 only), simple needle hands, no bezel.**Continuous Sweep**Smoothly moving second hand (sweep), hour markers reduced to tiny dots.**Dot Matrix**Hour positions indicated by small circles that fill as time advances. Hands are subtle dashed lines.**Sunburst**Radiating thin lines from center, no numerals. Only the hands move – a calm kinetic sculpture feel.**Skeleton**Only the hands visible, no face markings. Pure floating hands against background.**Typographic Analog**Hour numbers (01–12) rendered in lightweight sans‑serif at the edge, modern thin hands.

Each analog variation comes in **Light**, **Dark**, and **Sepia/Night** sub‑variants (6 × 3 = 18 analog themes).

### 5.3 Digital Mode Variations

Digital clock displayed as large, centered text. Variations:

VariationDescription**HH:MM:SS Minimal**14:08:42 – large monospace, no colons blinking (static colon).**HH:MM (Seconds as subtle fade)**Large hour:minute, seconds shown smaller below, low contrast.**Stacked Digital**Hours on top, minutes middle, seconds bottom – like an old flip clock without the flaps.**Word Clock**Displays time as text: “twenty‑three minutes past two”.**Binary / Dots**Time represented as rows of dots (like a binary clock but purely visual).**Scrolling Tape**Hours and minutes scroll vertically in a fixed window (marquee‑like, but synchronized with time).

Digital variations come in **Light**, **Dark**, and **Amber CRT** sub‑variants (6 × 3 = 18 digital themes). Amber CRT sub‑variant includes a subtle phosphor glow and scanlines.

Total base variations: 36 carefully designed, switchable themes.

### 5.4 Interaction & Controls (Invisible)

*   **Click/Tap anywhere on clock area** → toggle Analog ↔ Digital within current variation family.
    
*   **Horizontal swipe (or Left/Right arrow keys)** → cycle through variations of the current mode.
    
*   **Up/Down arrow keys** → cycle through sub‑variants (Light, Dark, Sepia/Amber).
    
*   **Double‑click** → request full‑screen (using Fullscreen API, with graceful degradation).
    
*   **’F’ key** → toggle full‑screen manually if double‑click fails.
    
*   **’R’ key** → reset to default variation (Classic Minimal Analog, Dark).
    
*   **No UI controls visible** – a discreet, semi‑transparent “?” in the bottom‑right corner fades in on hover and reveals a minimal keyboard shortcut legend.
    

6\. User Stories
----------------

IDAs a...I want to...So that...US‑01Usersee the exact time immediately when I open the pageI don’t have to wait or interactUS‑02Userswitch between analog and digital with a simple clickI can choose the representation I prefer at that momentUS‑03Userchange the style of the clock by swiping or pressing arrow keysI can match my mood or ambient light without navigating menusUS‑04Userhave my preferred mode and variation saved locallythe clock appears exactly as I left it on my next visitUS‑05Userexpand the clock to full screenI can use it as a room clock on a tablet/laptopUS‑06Night useruse a dark or amber theme that doesn’t strain my eyesI can comfortably check the time in a dark room

7\. Functional Requirements
---------------------------

### 7.1 Clock Accuracy & Performance

*   FR‑01: Display local time with ≤1 second deviation from system clock.
    
*   FR‑02: Analog second hand must update smoothly at 60 fps (requestAnimationFrame) for sweep variations; for tick variations, update exactly on the second boundary.
    
*   FR‑03: Digital time must update precisely at each second transition.
    
*   FR‑04: Handle browser tab becoming inactive – upon reactivation, instantly sync and show correct time without visible jump (catch‑up logic).
    

### 7.2 Theme & Variation Management

*   FR‑05: Pre‑define all 36 theme objects (mode, variation, sub‑variant) in a structured JSON or JS module.
    
*   FR‑06: Switching between themes must be instant (no loading flicker) – pre‑compute and cross‑fade if needed.
    
*   FR‑07: On page load, check localStorage for saved preference; if absent, default to “Classic Minimal Analog – Dark”.
    

### 7.3 Interaction

*   FR‑08: Clicks/taps on the clock area (excluding the help hint) toggle mode.
    
*   FR‑09: Keyboard arrow keys (Left/Right) cycle variations; Up/Down cycle sub‑variants. Do not scroll the page when keys are pressed (preventDefault).
    
*   FR‑10: Double‑click triggers full‑screen; if API not available, show a subtle browser‑level instruction (“Press F11…”).
    
*   FR‑11: “?” hint appears only on hover (or after 3 seconds of inactivity on touch devices) and fades out after 5 seconds.
    

### 7.4 Persistence

*   FR‑12: Save current mode, variation index, and sub‑variant index to localStorage on every change.
    
*   FR‑13: Restore state on next visit. If saved state is invalid or missing, fallback to default.
    

8\. Non‑Functional Requirements
-------------------------------

### 8.1 Performance & Size

*   NFR‑01: Page weight (HTML+CSS+JS) must be under 50 KB (uncompressed). No frameworks. Vanilla JavaScript, single SVG/Canvas element.
    
*   NFR‑02: Time to interactive < 300 ms on a 3G connection.
    
*   NFR‑03: Memory footprint must remain stable; no memory leaks during long‑running sessions (running clock for hours).
    

### 8.2 Browser & Device Support

*   NFR‑04: Work on latest 2 versions of Chrome, Firefox, Safari, Edge.
    
*   NFR‑05: Fully functional on mobile browsers (touch interactions) and responsive from 320px wide viewports up to 4K displays.
    
*   NFR‑06: Graceful degradation: if SVG not supported, fallback to Canvas; if requestAnimationFrame not available, use 1s setInterval.
    

### 8.3 Accessibility

*   NFR‑07: All color themes must meet WCAG 2.1 AA contrast ratio (minimum 4.5:1 for text, 3:1 for large clock elements).
    
*   NFR‑08: Provide an accessible hidden  element with machine‑readable ISO time for screen readers.
    
*   NFR‑09: Keyboard navigation fully functional; no trap points.
    

### 8.4 Privacy & Data

*   NFR‑10: No cookies, no analytics, no external requests. The clock runs completely offline after initial load (service worker cache optional).
    
*   NFR‑11: localStorage used only for theme preference; no personal data.
    

9\. Technical Architecture (for Antigravity Agent Implementation)
-----------------------------------------------------------------

*   **Single HTML file** containing inline CSS and JS (or a minimal bundler that outputs a single file). No build step required, but agent may use a simple bundler for minification.
    
*   **Clock rendering**:
    
    *   Analog:  element with groups for hands, face, markers. Update transform/rotation via JS.
        
    *   Digital: 
        
         with text content, styled via CSS class switching.
        
*   jsstate = { mode: 'analog' | 'digital', variationIndex: 0, subVariantIndex: 0}
    
*   **Theme Engine**:A single function applyTheme(mode, variation, subVariant) that updates CSS custom properties on :root and swaps SVG/CSS classes. All theme definitions stored in a compact array.
    
*   **Persistence**: Simple localStorage read/write on every state change, throttled to avoid excessive writes.
    
*   **Deployment**: Static hosting (Netlify, Vercel, GitHub Pages). Custom domain optional.
    

10\. Design Deliverables (Minimal)
----------------------------------

No bulky Figma files – the Antigravity Agent will use a set of **design tokens** and a **style guide** embedded in the PRD.

### 10.1 Typography

*   **Digital Default:** 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace
    
*   **Analog Numerals:** 'Inter', 'Helvetica Neue', 'Arial', sans-serif
    
*   Base font size: 16px; clock digits scale with viewport units (vw / vmin).
    

### 10.2 Color Tokens (Sample)

Sub‑variantBackgroundForegroundAccentDark#0b0c0e#eaeaea#ffd152 (subtle gold for seconds)Light#f8f8f5#1a1a1a#b23b3bSepia (Analog) / Amber CRT (Digital)#2b1b0e / #1a1008#d9b382 / #ffb000#884400

All combinations defined in a theme map.

### 10.3 Layout

*   Clock centered both vertically and horizontally using CSS Grid or Flexbox.
    
*   Analog face size: max 70vmin diameter.
    
*   Digital text size: as large as possible while fitting “00:00:00” or word clock sentence without overflow, maintaining generous padding (min 5vmin).
    

11\. Milestones & Definition of Done
------------------------------------

### Phase 1 – Core Clock (Sprint 1)

*   Clock engine running (analog + digital basic).
    
*   SVG analog with sweeping second hand.
    
*   Digital HH:MM:SS.
    
*   Single dark theme.
    
*   Deployed to staging URL.
    

### Phase 2 – All Variations (Sprint 2)

*   Implement all 36 variations as theme objects.
    
*   Click toggles mode, arrow keys cycle variations/sub‑variants.
    
*   Smooth cross‑fade transition (300ms).
    
*   Persistence in localStorage.
    

### Phase 3 – Polish & Full‑Screen (Sprint 3)

*   Double‑click full‑screen API with fallback.
    
*   “?” hint and keyboard shortcut legend.
    
*   Responsive tuning (mobile touch, 4K screens).
    
*   Accessibility audit: contrast,  element, keyboard navigation.
    
*   Performance budget check ( < 50 KB, < 300ms TTI).
    

### Phase 4 – Launch

*   Final QA on 4 browsers, 3 device sizes.
    
*   Production deployment.
    
*   PWA‑ready (manifest, service worker for offline caching – nice to have, not required).
    

12\. Future Considerations (Out of Scope v1)
--------------------------------------------

*   Alarm functionality
    
*   Timezone selection
    
*   Custom theme builder
    
*   Weather or background integration
    
*   Audio ticks
    
*   Multiple simultaneous clock instances
    

The initial release stays radically minimal. Antigravity Agent must resist feature creep with extreme prejudice.