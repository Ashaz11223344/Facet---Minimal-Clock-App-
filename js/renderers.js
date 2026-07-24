/**
 * FACET — Advanced Morphism Clock Renderers
 * SVG & DOM rendering engines for Glassmorphism, Claymorphism, Neumorphism, and Brutalism.
 */

window.ClockRenderers = (function() {

  // Helper: Number to English Words for Word Clock (D4)
  function timeToWords(hours, minutes) {
    const numbers = [
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
      "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine", "thirty"
    ];

    let h = hours % 12;
    if (h === 0) h = 12;

    if (minutes === 0) {
      return `${numbers[h]} o'clock`;
    } else if (minutes === 15) {
      return `quarter past ${numbers[h]}`;
    } else if (minutes === 30) {
      return `half past ${numbers[h]}`;
    } else if (minutes === 45) {
      const nextH = (h % 12) + 1;
      return `quarter to ${numbers[nextH]}`;
    } else if (minutes < 30) {
      return `${numbers[minutes]} minutes past ${numbers[h]}`;
    } else {
      const remaining = 60 - minutes;
      const nextH = (h % 12) + 1;
      return `${numbers[remaining]} minutes to ${numbers[nextH]}`;
    }
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  // Track previous minute and second to trigger micro-animations
  let prevMin = -1;
  let prevSec = -1;

  // --------------------------------------------------------------------------
  // ANALOG SVG RENDERER (A1 - A10)
  // --------------------------------------------------------------------------
  function renderAnalog(date, variation, palette) {
    const ms = date.getMilliseconds();
    const sec = date.getSeconds();
    const min = date.getMinutes();
    const hr = date.getHours();

    const secAngle = variation.id === 'a2' // Continuous sweep
      ? (sec + ms / 1000) * 6
      : sec * 6;
    const minAngle = (min + sec / 60) * 6;
    const hrAngle = ((hr % 12) + min / 60) * 30;

    const viewBoxSize = 400;
    const center = 200;
    const radius = 170;

    let svgDefs = `
      <defs>
        <filter id="hand-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>`;

    let svgInner = svgDefs;

    switch (variation.id) {
      case 'a1': // Classic Minimal
        svgInner += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--subtle)" stroke-width="1.5" opacity="0.3" />`;
        [0, 90, 180, 270].forEach(deg => {
          const rad = (deg - 90) * (Math.PI / 180);
          const x1 = center + (radius - 16) * Math.cos(rad);
          const y1 = center + (radius - 16) * Math.sin(rad);
          const x2 = center + radius * Math.cos(rad);
          const y2 = center + radius * Math.sin(rad);
          svgInner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--fg)" stroke-width="3" stroke-linecap="round" />`;
        });
        break;

      case 'a2': // Continuous Sweep
        svgInner += `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--card-border)" stroke-width="1" />`;
        for (let i = 0; i < 60; i++) {
          const rad = (i * 6 - 90) * (Math.PI / 180);
          const rPos = radius - 8;
          const cx = center + rPos * Math.cos(rad);
          const cy = center + rPos * Math.sin(rad);
          const isHour = i % 5 === 0;
          svgInner += `<circle cx="${cx}" cy="${cy}" r="${isHour ? 3 : 1.5}" fill="${isHour ? 'var(--fg)' : 'var(--subtle)'}" />`;
        }
        break;

      case 'a3': // Dot Matrix
        for (let i = 1; i <= 12; i++) {
          const rad = (i * 30 - 90) * (Math.PI / 180);
          const cx = center + (radius - 10) * Math.cos(rad);
          const cy = center + (radius - 10) * Math.sin(rad);
          const isPassed = i <= (hr % 12 || 12);
          svgInner += `<circle cx="${cx}" cy="${cy}" r="9" fill="${isPassed ? 'var(--accent)' : 'var(--card-bg)'}" stroke="var(--card-border)" stroke-width="2" />`;
        }
        break;

      case 'a4': // Sunburst
        for (let i = 0; i < 60; i++) {
          const rad = (i * 6 - 90) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const innerR = isHour ? radius - 35 : radius - 15;
          const x1 = center + innerR * Math.cos(rad);
          const y1 = center + innerR * Math.sin(rad);
          const x2 = center + radius * Math.cos(rad);
          const y2 = center + radius * Math.sin(rad);
          svgInner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--subtle)" stroke-width="${isHour ? 2 : 1}" opacity="${isHour ? 0.9 : 0.4}" />`;
        }
        break;

      case 'a5': // Skeleton
        break;

      case 'a6': // Typographic Analog
        for (let i = 1; i <= 12; i++) {
          const rad = (i * 30 - 90) * (Math.PI / 180);
          const tx = center + (radius - 20) * Math.cos(rad);
          const ty = center + (radius - 20) * Math.sin(rad) + 6;
          svgInner += `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="18" font-weight="400" fill="var(--fg)" font-family="var(--font-sans)">${pad(i)}</text>`;
        }
        break;

      case 'a7': // Glassmorphism Analog
        const isIridescent = palette.cardBorder === 'rainbow';
        svgInner += `
          <circle cx="${center}" cy="${center}" r="${radius}" fill="var(--card-bg)" stroke="${isIridescent ? '#f43f5e' : 'var(--card-border)'}" stroke-width="${isIridescent ? 3 : 1.5}" class="analog-glass-disc ${isIridescent ? 'iridescent-border' : ''}" />
          <circle cx="${center}" cy="${center}" r="${radius - 24}" fill="none" stroke="var(--subtle)" stroke-width="1" stroke-dasharray="3 6" opacity="0.4" />
        `;
        // Tiny glowing dots for 12 hours
        for (let i = 0; i < 12; i++) {
          const rad = (i * 30 - 90) * (Math.PI / 180);
          const cx = center + (radius - 12) * Math.cos(rad);
          const cy = center + (radius - 12) * Math.sin(rad);
          const isMain = i % 3 === 0;
          svgInner += `<circle cx="${cx}" cy="${cy}" r="${isMain ? 4 : 2}" fill="var(--accent)" filter="url(#dot-glow)" />`;
        }
        break;

      case 'a8': // Claymorphism Analog
        svgInner += `
          <circle cx="${center}" cy="${center}" r="${radius}" fill="var(--bg)" stroke="rgba(255,255,255,0.4)" stroke-width="3" />
        `;
        // Raised pill hour markers
        for (let i = 0; i < 12; i++) {
          const rad = (i * 30 - 90) * (Math.PI / 180);
          const cx = center + (radius - 20) * Math.cos(rad);
          const cy = center + (radius - 20) * Math.sin(rad);
          svgInner += `<rect x="${cx - 7}" y="${cy - 7}" width="14" height="14" rx="7" fill="var(--card-bg)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />`;
        }
        break;

      case 'a9': // Neumorphism Analog
        svgInner += `
          <circle cx="${center}" cy="${center}" r="${radius}" fill="var(--bg)" />
        `;
        // Pressed dots at 12, 3, 6, 9
        [0, 90, 180, 270].forEach(deg => {
          const rad = (deg - 90) * (Math.PI / 180);
          const cx = center + (radius - 20) * Math.cos(rad);
          const cy = center + (radius - 20) * Math.sin(rad);
          svgInner += `<circle cx="${cx}" cy="${cy}" r="6" fill="var(--bg)" stroke="var(--shadow-outer-dark)" stroke-width="1.5" />`;
        });
        break;

      case 'a10': // Brutalism Analog
        svgInner += `
          <g class="brutal-rotate">
            <rect x="${center - radius}" y="${center - radius}" width="${radius * 2}" height="${radius * 2}" fill="var(--bg)" stroke="var(--card-border)" stroke-width="6" />
            <line x1="${center - radius}" y1="${center}" x2="${center - radius + 22}" y2="${center}" stroke="var(--card-border)" stroke-width="8" />
            <line x1="${center + radius - 22}" y1="${center}" x2="${center + radius}" y2="${center}" stroke="var(--card-border)" stroke-width="8" />
            <line x1="${center}" y1="${center - radius}" x2="${center}" y2="${center - radius + 22}" stroke="var(--card-border)" stroke-width="8" />
            <line x1="${center}" y1="${center + radius - 22}" x2="${center}" y2="${center + radius}" stroke="var(--card-border)" stroke-width="8" />
          </g>
        `;
        break;
    }

    // Hands Rendering
    const isBrutal = variation.id === 'a10';
    const isClay = variation.id === 'a8';
    const isGlass = variation.id === 'a7';

    // Hour Hand
    const hrLen = radius * 0.48;
    const hrRad = (hrAngle - 90) * (Math.PI / 180);
    const hrX = center + hrLen * Math.cos(hrRad);
    const hrY = center + hrLen * Math.sin(hrRad);
    svgInner += `<line x1="${center}" y1="${center}" x2="${hrX}" y2="${hrY}" stroke="var(--fg)" stroke-width="${isBrutal ? 12 : (isClay ? 10 : (isGlass ? 4.5 : 5))}" stroke-linecap="${isBrutal ? 'square' : 'round'}" opacity="${isGlass ? 0.85 : 1}" ${isGlass ? 'filter="url(#hand-glow)"' : ''} class="${isClay ? 'clay-cushion' : ''}" />`;

    // Minute Hand
    const minLen = radius * 0.72;
    const minRad = (minAngle - 90) * (Math.PI / 180);
    const minX = center + minLen * Math.cos(minRad);
    const minY = center + minLen * Math.sin(minRad);
    svgInner += `<line x1="${center}" y1="${center}" x2="${minX}" y2="${minY}" stroke="var(--fg)" stroke-width="${isBrutal ? 8 : (isClay ? 7 : (isGlass ? 3 : 3.5))}" stroke-linecap="${isBrutal ? 'square' : 'round'}" opacity="${isGlass ? 0.85 : 1}" ${isGlass ? 'filter="url(#hand-glow)"' : ''} class="${isClay ? 'clay-cushion' : ''}" />`;

    // Second Hand
    const secLen = radius * 0.85;
    const secRad = (secAngle - 90) * (Math.PI / 180);
    const secX = center + secLen * Math.cos(secRad);
    const secY = center + secLen * Math.sin(secRad);
    svgInner += `<line x1="${center}" y1="${center}" x2="${secX}" y2="${secY}" stroke="var(--accent)" stroke-width="${isBrutal ? 5 : 2}" stroke-linecap="${isBrutal ? 'square' : 'round'}" ${isGlass ? 'filter="url(#hand-glow)"' : ''} />`;

    // Center Pin
    svgInner += `<circle cx="${center}" cy="${center}" r="${isBrutal ? 9 : 5.5}" fill="var(--accent)" />`;

    return `<svg class="analog-clock-svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">${svgInner}</svg>`;
  }

  // --------------------------------------------------------------------------
  // DIGITAL DOM RENDERER (D1 - D10)
  // --------------------------------------------------------------------------
  function renderDigital(date, variation, palette) {
    const sec = date.getSeconds();
    const min = date.getMinutes();
    const hr = date.getHours();

    const hh = pad(hr);
    const mm = pad(min);
    const ss = pad(sec);

    // Micro-animation triggers
    const minChanged = min !== prevMin && prevMin !== -1;
    const secChanged = sec !== prevSec && prevSec !== -1;
    prevMin = min;
    prevSec = sec;

    // Mini Widget Mode: Vertical 3-line Stacked Layout (HH / MM / SEC)
    if (document.body.classList.contains('is-mini-widget')) {
      return `
        <div class="digital-clock-display mini-stacked-digital">
          <div class="mini-digit-line mini-hh">${hh}</div>
          <div class="mini-digit-line mini-mm">${mm}</div>
          <div class="mini-digit-line mini-ss">${ss}</div>
        </div>`;
    }

    let html = `<div class="digital-clock-display">`;

    switch (variation.id) {
      case 'd1':
        html += `<div class="digital-d1">${hh}:${mm}:${ss}</div>`;
        break;

      case 'd2':
        html += `
          <div class="digital-d2">
            <div class="d2-main">${hh}:${mm}</div>
            <div class="d2-sec">${ss}</div>
          </div>`;
        break;

      case 'd3':
        html += `
          <div class="digital-d3">
            <div class="d3-line">${hh}</div>
            <div class="d3-line">${mm}</div>
            <div class="d3-line" style="color: var(--accent);">${ss}</div>
          </div>`;
        break;

      case 'd4':
        html += `<div class="digital-d4">${timeToWords(hr, min)}</div>`;
        break;

      case 'd5':
        const toBinary = (val) => pad(val.toString(2)).padStart(6, '0');
        const renderDotsRow = (label, bStr) => `
          <div class="d5-row">
            <span class="d5-label">${label}</span>
            <div class="d5-dots">
              ${bStr.split('').map(bit => `<div class="d5-dot ${bit === '1' ? 'active' : ''}"></div>`).join('')}
            </div>
          </div>`;
        html += `
          <div class="digital-d5">
            ${renderDotsRow('HRS', toBinary(hr))}
            ${renderDotsRow('MIN', toBinary(min))}
            ${renderDotsRow('SEC', toBinary(sec))}
          </div>`;
        break;

      case 'd6':
        html += `
          <div class="digital-d6">
            <div class="d6-block">${hh}</div>
            <span>:</span>
            <div class="d6-block">${mm}</div>
            <span>:</span>
            <div class="d6-block" style="color: var(--accent);">${ss}</div>
          </div>`;
        break;

      case 'd7': // Glassmorphism Digital
        html += `<div class="digital-d7">${hh}:${mm}:${ss}</div>`;
        break;

      case 'd8': // Claymorphism Digital (Nunito 3D Extruded)
        html += `
          <div class="digital-d8">
            <div class="d8-pill">${hh}</div>
            <div class="d8-pill ${minChanged ? 'bounce-tick' : ''}">${mm}</div>
            <div class="d8-pill" style="color: var(--accent);">${ss}</div>
          </div>`;
        break;

      case 'd9': // Neumorphism Digital (Debossed Concave Text)
        html += `<div class="digital-d9">${hh}:${mm}:${ss}</div>`;
        break;

      case 'd10': // Brutalism Digital (Space Mono + Slashes + Redacted option)
        const isRedacted = palette.name === 'Redacted';
        const boxClass = isRedacted ? 'd10-box d10-redacted' : 'd10-box';
        html += `
          <div class="digital-d10 ${secChanged ? 'glitch-tick' : ''}">
            <div class="${boxClass}">${hh}</div>
            <div class="d10-sep">/</div>
            <div class="${boxClass}">${mm}</div>
            <div class="d10-sep">/</div>
            <div class="${boxClass}" style="background: var(--accent); color: var(--bg);">${ss}</div>
          </div>`;
        break;
    }

    html += `</div>`;
    return html;
  }

  return {
    renderAnalog,
    renderDigital
  };
})();
