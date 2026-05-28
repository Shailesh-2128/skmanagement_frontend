import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { updateUser } from '../features/auth/authSlice';
import authApi from '../api/auth.api';

export interface VisualSettings {
  theme: 'light' | 'dark' | 'sepia' | 'slate-blue';
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Georgia' | 'Fira Code';
  fontSize: 'small' | 'normal' | 'large';
  fontWeight: 'regular' | 'medium' | 'bold';
  accentColor: 'blue' | 'purple' | 'emerald' | 'rose' | 'orange';
}

interface ThemeContextType {
  settings: VisualSettings;
  updateSettings: (newSettings: Partial<VisualSettings>) => void;
}

const defaultSettings: VisualSettings = {
  theme: 'light',
  fontFamily: 'Inter',
  fontSize: 'normal',
  fontWeight: 'regular',
  accentColor: 'blue',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [settings, setSettings] = useState<VisualSettings>(() => {
    const saved = localStorage.getItem('app_visual_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Sync settings when user logs in or profile changes
  useEffect(() => {
    if (user) {
      setSettings({
        theme: (user.theme as any) || 'light',
        fontFamily: (user.font_family as any) || 'Inter',
        fontSize: (user.font_size as any) || 'normal',
        fontWeight: (user.font_weight as any) || 'regular',
        accentColor: (user.accent_color as any) || 'blue',
      });
    }
  }, [
    user?.id,
    user?.theme,
    user?.font_family,
    user?.font_size,
    user?.font_weight,
    user?.accent_color
  ]);

  const updateSettings = async (newSettings: Partial<VisualSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('app_visual_settings', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        const payload: any = {};
        if (newSettings.theme) payload.theme = newSettings.theme;
        if (newSettings.fontFamily) payload.font_family = newSettings.fontFamily;
        if (newSettings.fontSize) payload.font_size = newSettings.fontSize;
        if (newSettings.fontWeight) payload.font_weight = newSettings.fontWeight;
        if (newSettings.accentColor) payload.accent_color = newSettings.accentColor;

        if (Object.keys(payload).length > 0) {
          const updatedUser = await authApi.updateMe(payload);
          dispatch(updateUser(updatedUser));
        }
      } catch (err) {
        console.error('Failed to sync settings with DB:', err);
      }
    }
  };

  useEffect(() => {
    // 1. Inject Fonts dynamically (e.g. Poppins, Roboto) if they aren't loaded
    if (settings.fontFamily === 'Poppins' && !document.getElementById('poppins-font-link')) {
      const link = document.createElement('link');
      link.id = 'poppins-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap';
      document.head.appendChild(link);
    }
    if (settings.fontFamily === 'Roboto' && !document.getElementById('roboto-font-link')) {
      const link = document.createElement('link');
      link.id = 'roboto-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
      document.head.appendChild(link);
    }

    // 2. Set custom stylesheet for font style overrides
    let styleTag = document.getElementById('custom-theme-style') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-theme-style';
      document.head.appendChild(styleTag);
    }

    // Font family mapping
    const fontStack = 
      settings.fontFamily === 'Fira Code' ? '"Fira Code", Consolas, Monaco, monospace' :
      settings.fontFamily === 'Georgia' ? 'Georgia, serif' :
      settings.fontFamily === 'Poppins' ? '"Poppins", sans-serif' :
      settings.fontFamily === 'Roboto' ? '"Roboto", sans-serif' :
      '"Inter", system-ui, -apple-system, sans-serif';

    // Font weight mapping
    const weightVal = 
      settings.fontWeight === 'bold' ? '700' :
      settings.fontWeight === 'medium' ? '500' : '400';

    // Font size multiplier mapping
    const sizeMultiplier = 
      settings.fontSize === 'small' ? '0.9rem' :
      settings.fontSize === 'large' ? '1.1rem' : '1rem';

    // Accent color theme mapping
    const primaryColors = {
      blue: { normal: '#3b82f6', hover: '#2563eb', bg: '#eff6ff', text: '#1d4ed8' },
      purple: { normal: '#8b5cf6', hover: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9' },
      emerald: { normal: '#10b981', hover: '#059669', bg: '#ecfdf5', text: '#047857' },
      rose: { normal: '#f43f5e', hover: '#e11d48', bg: '#fff1f2', text: '#be123c' },
      orange: { normal: '#f97316', hover: '#ea580c', bg: '#fff7ed', text: '#c2410c' }
    };

    const accent = primaryColors[settings.accentColor];

    // Build the dynamic CSS rules
    styleTag.innerHTML = `
      :root {
        --font-family-base: ${fontStack} !important;
        --app-font-weight: ${weightVal} !important;
        --app-font-size: ${sizeMultiplier} !important;
        --primary: ${accent.normal} !important;
        --primary-hover: ${accent.hover} !important;
      }
      
      /* Apply global accent color changes to Tailwind utilities */
      .bg-blue-600, .bg-indigo-600 {
        background-color: var(--primary) !important;
      }
      .hover\\:bg-blue-700:hover, .hover\\:bg-indigo-700:hover {
        background-color: var(--primary-hover) !important;
      }
      .text-blue-600, .text-indigo-600 {
        color: var(--primary) !important;
      }
      .border-blue-500, .border-indigo-500 {
        border-color: var(--primary) !important;
      }
      .bg-blue-50, .bg-indigo-50 {
        background-color: ${accent.bg} !important;
      }
      .text-blue-700, .text-indigo-700 {
        color: ${accent.text} !important;
      }
      .border-blue-100, .border-indigo-100 {
        border-color: ${accent.bg} !important;
      }

      /* Apply font family & weight dynamically */
      body, button, input, select, textarea, span, p, h1, h2, h3, h4, h5, h6, a, div {
        font-family: var(--font-family-base);
      }
      body {
        font-size: var(--app-font-size);
      }
    `;

    // 3. Update body element theme class
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-slate-blue');

    const themeColors = {
      dark: {
        bg: '#090d16',
        text: '#f3f4f6',
        card: '#111827',
        border: '#1f2937',
        textMuted: '#9ca3af',
        input: '#111827',
        inputBorder: '#374151',
        active: '#1f2937',
        sidebar: 'rgba(17, 24, 39, 0.95)',
        header: 'rgba(17, 24, 39, 0.8)',
        pill: '#1f2937',
        tableHeader: '#1f2937',
        tableCell: '#111827',
        tableCellYellow: '#172033',
        tableCellYellowBorder: '#2d3748',
        scrollBg: '#1f2937',
        scrollThumb: '#374151',
      },
      'slate-blue': {
        bg: '#0b132b',
        text: '#e2e8f0',
        card: '#1c2541',
        border: '#3a506b',
        textMuted: '#8da9c4',
        input: '#0b132b',
        inputBorder: '#3a506b',
        active: '#3a506b',
        sidebar: 'rgba(28, 37, 65, 0.95)',
        header: 'rgba(28, 37, 65, 0.8)',
        pill: '#3a506b',
        tableHeader: '#3a506b',
        tableCell: '#1c2541',
        tableCellYellow: '#233156',
        tableCellYellowBorder: '#485e7d',
        scrollBg: '#1c2541',
        scrollThumb: '#3a506b',
      },
      sepia: {
        bg: '#f4ecd8',
        text: '#5b4636',
        card: '#fdf6e3',
        border: '#e4dcd0',
        textMuted: '#8c7662',
        input: '#f5ecd5',
        inputBorder: '#e4dcd0',
        active: '#ebdcb9',
        sidebar: 'rgba(253, 246, 227, 0.95)',
        header: 'rgba(253, 246, 227, 0.8)',
        pill: '#ebdcb9',
        tableHeader: '#ebdcb9',
        tableCell: '#fdf6e3',
        tableCellYellow: '#f5ebd5',
        tableCellYellowBorder: '#dcd1c4',
        scrollBg: '#ebdcb9',
        scrollThumb: '#c9bfa7',
      }
    };

    if (settings.theme !== 'light') {
      const colors = themeColors[settings.theme === 'slate-blue' ? 'slate-blue' : settings.theme === 'sepia' ? 'sepia' : 'dark'];
      body.classList.add(`theme-${settings.theme}`);
      
      let themeStyleTag = document.getElementById('custom-theme-vars') as HTMLStyleElement;
      if (!themeStyleTag) {
        themeStyleTag = document.createElement('style');
        themeStyleTag.id = 'custom-theme-vars';
        document.head.appendChild(themeStyleTag);
      }

      themeStyleTag.innerHTML = `
        body {
          background-color: ${colors.bg} !important;
          color: ${colors.text} !important;
        }
        .bg-white, [class*="bg-white"] {
          background-color: ${colors.card} !important;
          color: ${colors.text} !important;
          border-color: ${colors.border} !important;
        }
        .bg-slate-50, .bg-slate-50\\/50, .bg-slate-50\\/70, .bg-slate-50\\/30, .bg-slate-100, .bg-slate-100\\/50 {
          background-color: ${colors.pill} !important;
          color: ${colors.text} !important;
          border-color: ${colors.border} !important;
        }
        .text-slate-800, .text-slate-700, .text-slate-900, .text-slate-650, .text-slate-600 {
          color: ${colors.text} !important;
        }
        .text-slate-505, .text-slate-500, .text-slate-400 {
          color: ${colors.textMuted} !important;
        }
        .border-slate-100, .border-slate-200, .border-slate-300, .border-slate-150 {
          border-color: ${colors.border} !important;
        }
        .sidebar {
          background: ${colors.sidebar} !important;
          border-right-color: ${colors.border} !important;
        }
        .nav-item:hover, .nav-item.active {
          background: ${colors.active} !important;
          color: #ffffff !important;
        }
        .brand-name {
          color: ${colors.text} !important;
        }
        header {
          background-color: ${colors.header} !important;
          border-bottom-color: ${colors.border} !important;
          backdrop-filter: blur(8px);
        }
        input, select, textarea {
          background-color: ${colors.input} !important;
          color: ${colors.text} !important;
          border-color: ${colors.inputBorder} !important;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        /* Tables */
        table, th, td {
          border-color: ${colors.border} !important;
        }
        tr {
          border-bottom-color: ${colors.border} !important;
        }
        th {
          background-color: ${colors.tableHeader} !important;
          color: ${colors.text} !important;
        }
        td {
          background-color: ${colors.tableCell} !important;
          color: ${colors.text} !important;
        }
        .print-area, .bg-yellow-50\\/30, .print-area table {
          background-color: ${colors.bg} !important;
        }
        td.bg-\\[\\#fef08a\\] {
          background-color: ${colors.tableCellYellow} !important;
          color: ${colors.text} !important;
          border-color: ${colors.tableCellYellowBorder} !important;
        }
        /* Custom modal wrapper support */
        .modal-content, [role="dialog"], [class*="modal"] {
          background-color: ${colors.card} !important;
          border-color: ${colors.border} !important;
          color: ${colors.text} !important;
        }
        /* Scrollbars */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${colors.scrollBg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${colors.scrollThumb};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `;
    } else {
      body.classList.add('theme-light');
      let themeStyleTag = document.getElementById('custom-theme-vars') as HTMLStyleElement;
      if (themeStyleTag) {
        themeStyleTag.innerHTML = '';
      }
    }

  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};
