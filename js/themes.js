/**
 * FACET — Advanced Morphism Theme Catalog Registry
 * Stores definitions for 10 Analog and 10 Digital Variations,
 * each with 3 specific, curated sub-variants -> Total 60 distinct theme configurations.
 */

window.THEME_CATALOG = {
  // Standard Default Palettes
  defaultPalettes: {
    light: {
      name: 'Light',
      bg: '#f8f9fa',
      fg: '#1a1d20',
      accent: '#d9381e',
      subtle: 'rgba(26, 29, 32, 0.4)',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      cardBorder: 'rgba(0, 0, 0, 0.08)',
      shadowOuterDark: '#d1d5db',
      shadowOuterLight: '#ffffff',
      shadowInnerDark: '#e5e7eb',
      shadowInnerLight: '#ffffff',
      glow: 'transparent',
      mesh: 'none',
      crt: false
    },
    dark: {
      name: 'Dark',
      bg: '#0b0c0e',
      fg: '#eaeaea',
      accent: '#ffd152',
      subtle: 'rgba(234, 234, 234, 0.4)',
      cardBg: 'rgba(255, 255, 255, 0.06)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
      shadowOuterDark: '#050607',
      shadowOuterLight: '#181b20',
      shadowInnerDark: '#040506',
      shadowInnerLight: '#14171c',
      glow: 'transparent',
      mesh: 'none',
      crt: false
    },
    sepia: {
      name: 'Sepia',
      bg: '#2b1b0e',
      fg: '#d9b382',
      accent: '#e67e22',
      subtle: 'rgba(217, 179, 130, 0.4)',
      cardBg: 'rgba(217, 179, 130, 0.08)',
      cardBorder: 'rgba(217, 179, 130, 0.15)',
      shadowOuterDark: '#191008',
      shadowOuterLight: '#3d2614',
      shadowInnerDark: '#140c06',
      shadowInnerLight: '#342011',
      glow: 'transparent',
      mesh: 'none',
      crt: false
    },
    crt: {
      name: 'Amber CRT',
      bg: '#120d04',
      fg: '#ffb000',
      accent: '#ff8000',
      subtle: 'rgba(255, 176, 0, 0.4)',
      cardBg: 'rgba(255, 176, 0, 0.05)',
      cardBorder: 'rgba(255, 176, 0, 0.2)',
      shadowOuterDark: '#0a0702',
      shadowOuterLight: '#211808',
      shadowInnerDark: '#050301',
      shadowInnerLight: '#1c1406',
      glow: 'rgba(255, 176, 0, 0.4)',
      mesh: 'none',
      crt: true
    }
  },

  // 10 Analog Variations with custom sub-variants
  analog: [
    { id: 'a1', name: 'Classic Minimal' },
    { id: 'a2', name: 'Continuous Sweep' },
    { id: 'a3', name: 'Dot Matrix' },
    { id: 'a4', name: 'Sunburst' },
    { id: 'a5', name: 'Skeleton' },
    { id: 'a6', name: 'Typographic Analog' },

    // A7 - Glassmorphism Analog
    {
      id: 'a7',
      name: 'Glassmorphism Analog',
      subVariants: [
        {
          name: 'Clear Glass',
          bg: '#eef2f5',
          fg: '#1e293b',
          accent: '#3b82f6',
          subtle: 'rgba(30, 41, 59, 0.3)',
          cardBg: 'rgba(255, 255, 255, 0.45)',
          cardBorder: 'rgba(255, 255, 255, 0.7)',
          glow: 'rgba(59, 130, 246, 0.3)',
          mesh: 'radial-gradient(at 0% 0%, #c084fc 0px, transparent 50%), radial-gradient(at 100% 100%, #60a5fa 0px, transparent 50%)'
        },
        {
          name: 'Smoked Glass',
          bg: '#0f172a',
          fg: '#f8fafc',
          accent: '#38bdf8',
          subtle: 'rgba(248, 250, 252, 0.3)',
          cardBg: 'rgba(30, 41, 59, 0.5)',
          cardBorder: 'rgba(255, 255, 255, 0.15)',
          glow: 'rgba(56, 189, 248, 0.4)',
          mesh: 'radial-gradient(at 100% 0%, #1e1b4b 0px, transparent 50%), radial-gradient(at 0% 100%, #0369a1 0px, transparent 50%)'
        },
        {
          name: 'Iridescent',
          bg: '#111827',
          fg: '#ffffff',
          accent: '#f43f5e',
          subtle: 'rgba(255, 255, 255, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.12)',
          cardBorder: 'rainbow', // Handled specially in CSS/SVG
          glow: 'rgba(244, 63, 94, 0.5)',
          mesh: 'radial-gradient(at 50% 0%, #ec4899 0px, transparent 50%), radial-gradient(at 0% 100%, #8b5cf6 0px, transparent 50%), radial-gradient(at 100% 100%, #06b6d4 0px, transparent 50%)'
        }
      ]
    },

    // A8 - Claymorphism Analog
    {
      id: 'a8',
      name: 'Claymorphism Analog',
      subVariants: [
        {
          name: 'Pastel Mint',
          bg: '#e6f4f1',
          fg: '#2d5a52',
          accent: '#ff7b72',
          subtle: 'rgba(45, 90, 82, 0.4)',
          cardBg: '#e6f4f1',
          cardBorder: 'transparent',
          shadowOuterDark: '#b8dad3',
          shadowOuterLight: '#ffffff',
          shadowInnerDark: '#cae7e1',
          shadowInnerLight: '#ffffff'
        },
        {
          name: 'Warm Clay',
          bg: '#f4ece1',
          fg: '#5c4033',
          accent: '#d97706',
          subtle: 'rgba(92, 64, 51, 0.4)',
          cardBg: '#f4ece1',
          cardBorder: 'transparent',
          shadowOuterDark: '#d9c9b5',
          shadowOuterLight: '#ffffff',
          shadowInnerDark: '#e5d7c4',
          shadowInnerLight: '#ffffff'
        },
        {
          name: 'Toy Dark',
          bg: '#1e1e2e',
          fg: '#f5e0dc',
          accent: '#cba6f7',
          subtle: 'rgba(245, 224, 220, 0.4)',
          cardBg: '#1e1e2e',
          cardBorder: 'transparent',
          shadowOuterDark: '#11111b',
          shadowOuterLight: '#2a2a3e',
          shadowInnerDark: '#161623',
          shadowInnerLight: '#262639'
        }
      ]
    },

    // A9 - Neumorphism Analog
    {
      id: 'a9',
      name: 'Neumorphism Analog',
      subVariants: [
        {
          name: 'Soft Light',
          bg: '#e0e5ec',
          fg: '#4a5568',
          accent: '#4a5568',
          subtle: 'rgba(74, 85, 104, 0.4)',
          cardBg: '#e0e5ec',
          cardBorder: 'transparent',
          shadowOuterDark: '#a3b1c6',
          shadowOuterLight: '#ffffff',
          shadowInnerDark: '#b8c5d6',
          shadowInnerLight: '#ffffff'
        },
        {
          name: 'Dark Neumorphism',
          bg: '#18191c',
          fg: '#94a3b8',
          accent: '#94a3b8',
          subtle: 'rgba(148, 163, 184, 0.4)',
          cardBg: '#18191c',
          cardBorder: 'transparent',
          shadowOuterDark: '#0e0f11',
          shadowOuterLight: '#222327',
          shadowInnerDark: '#101114',
          shadowInnerLight: '#202124'
        },
        {
          name: 'Monochrome Blue',
          bg: '#1e293b',
          fg: '#64748b',
          accent: '#38bdf8',
          subtle: 'rgba(100, 116, 139, 0.4)',
          cardBg: '#1e293b',
          cardBorder: 'transparent',
          shadowOuterDark: '#0f172a',
          shadowOuterLight: '#2d3d52',
          shadowInnerDark: '#141e2e',
          shadowInnerLight: '#283648'
        }
      ]
    },

    // A10 - Brutalism Analog
    {
      id: 'a10',
      name: 'Brutalism Analog',
      subVariants: [
        {
          name: 'Black on White',
          bg: '#ffffff',
          fg: '#000000',
          accent: '#ffe600', // Highlighter yellow
          subtle: 'rgba(0, 0, 0, 0.6)',
          cardBg: '#ffffff',
          cardBorder: '#000000'
        },
        {
          name: 'White on Black',
          bg: '#000000',
          fg: '#ffffff',
          accent: '#ffe600',
          subtle: 'rgba(255, 255, 255, 0.6)',
          cardBg: '#000000',
          cardBorder: '#ffffff'
        },
        {
          name: 'Concrete',
          bg: '#94a3b8',
          fg: '#0f172a',
          accent: '#ff5722', // Orange accent
          subtle: 'rgba(15, 23, 42, 0.6)',
          cardBg: '#94a3b8',
          cardBorder: '#0f172a'
        }
      ]
    }
  ],

  // 10 Digital Variations with custom sub-variants
  digital: [
    { id: 'd1', name: 'HH:MM:SS Minimal' },
    { id: 'd2', name: 'HH:MM (Seconds Fade)' },
    { id: 'd3', name: 'Stacked Digital' },
    { id: 'd4', name: 'Word Clock' },
    { id: 'd5', name: 'Binary / Dots' },
    { id: 'd6', name: 'Scrolling Tape' },

    // D7 - Glassmorphism Digital
    {
      id: 'd7',
      name: 'Glassmorphism Digital',
      subVariants: [
        {
          name: 'Light Glass',
          bg: '#f1f5f9',
          fg: '#0f172a',
          accent: '#2563eb',
          subtle: 'rgba(15, 23, 42, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.5)',
          cardBorder: 'rgba(255, 255, 255, 0.8)',
          mesh: 'radial-gradient(at 0% 100%, #93c5fd 0px, transparent 50%), radial-gradient(at 100% 0%, #c084fc 0px, transparent 50%)'
        },
        {
          name: 'Dark Glass',
          bg: '#090d16',
          fg: '#f8fafc',
          accent: '#38bdf8',
          subtle: 'rgba(248, 250, 252, 0.4)',
          cardBg: 'rgba(255, 255, 255, 0.1)',
          cardBorder: 'rgba(255, 255, 255, 0.2)',
          mesh: 'radial-gradient(at 0% 0%, #1e293b 0px, transparent 50%), radial-gradient(at 100% 100%, #0f172a 0px, transparent 50%)'
        },
        {
          name: 'Color Wash',
          bg: '#0f172a',
          fg: '#ffffff',
          accent: '#f43f5e',
          subtle: 'rgba(255, 255, 255, 0.5)',
          cardBg: 'rgba(255, 255, 255, 0.15)',
          cardBorder: 'rgba(255, 255, 255, 0.3)',
          mesh: 'radial-gradient(at 0% 0%, #f43f5e 0px, transparent 50%), radial-gradient(at 100% 0%, #8b5cf6 0px, transparent 50%), radial-gradient(at 50% 100%, #06b6d4 0px, transparent 50%)'
        }
      ]
    },

    // D8 - Claymorphism Digital
    {
      id: 'd8',
      name: 'Claymorphism Digital',
      subVariants: [
        {
          name: 'Marshmallow',
          bg: '#f0fdf4',
          fg: '#166534',
          accent: '#22c55e',
          subtle: 'rgba(22, 101, 52, 0.4)',
          cardBg: '#ffffff',
          cardBorder: 'transparent',
          shadowOuterDark: '#dcfce7',
          shadowOuterLight: '#ffffff'
        },
        {
          name: 'Mud Pie',
          bg: '#271c19',
          fg: '#f5f5f4',
          accent: '#fdba74',
          subtle: 'rgba(245, 245, 244, 0.4)',
          cardBg: '#382823',
          cardBorder: 'transparent',
          shadowOuterDark: '#191210',
          shadowOuterLight: '#46322c'
        },
        {
          name: 'Candy',
          bg: '#fff1f2',
          fg: '#e11d48',
          accent: '#fb7185',
          subtle: 'rgba(225, 29, 72, 0.4)',
          cardBg: '#ffe4e6',
          cardBorder: 'transparent',
          shadowOuterDark: '#fecdd3',
          shadowOuterLight: '#ffffff'
        }
      ]
    },

    // D9 - Neumorphism Digital
    {
      id: 'd9',
      name: 'Neumorphism Digital',
      subVariants: [
        {
          name: 'Light Deboss',
          bg: '#e2e8f0',
          fg: '#475569',
          accent: '#475569',
          subtle: 'rgba(71, 85, 105, 0.4)',
          cardBg: '#e2e8f0',
          shadowOuterDark: '#cbd5e1',
          shadowOuterLight: '#ffffff'
        },
        {
          name: 'Dark Deboss',
          bg: '#1e293b',
          fg: '#94a3b8',
          accent: '#94a3b8',
          subtle: 'rgba(148, 163, 184, 0.4)',
          cardBg: '#1e293b',
          shadowOuterDark: '#0f172a',
          shadowOuterLight: '#2d3d52'
        },
        {
          name: 'Tinted Concrete',
          bg: '#334155',
          fg: '#cbd5e1',
          accent: '#38bdf8',
          subtle: 'rgba(203, 213, 225, 0.4)',
          cardBg: '#334155',
          shadowOuterDark: '#1e293b',
          shadowOuterLight: '#475569'
        }
      ]
    },

    // D10 - Brutalism Digital
    {
      id: 'd10',
      name: 'Brutalism Digital',
      subVariants: [
        {
          name: 'Black/Yellow',
          bg: '#ffe600',
          fg: '#000000',
          accent: '#000000',
          subtle: 'rgba(0, 0, 0, 0.7)',
          cardBg: '#ffe600',
          cardBorder: '#000000'
        },
        {
          name: 'White/Black',
          bg: '#000000',
          fg: '#ffffff',
          accent: '#ffffff',
          subtle: 'rgba(255, 255, 255, 0.7)',
          cardBg: '#000000',
          cardBorder: '#ffffff'
        },
        {
          name: 'Redacted',
          bg: '#18181b',
          fg: '#ffffff',
          accent: '#ef4444',
          subtle: 'rgba(255, 255, 255, 0.7)',
          cardBg: '#000000',
          cardBorder: '#ef4444'
        }
      ]
    }
  ]
};
