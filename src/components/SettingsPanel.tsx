import React from 'react';
import Modal from './ui/Modal';
import { useTheme, VisualSettings } from './ThemeManager';
import { useAuth } from '../hooks/useAuth';
import { Shield, Paintbrush, Type, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useTheme();
  const { user } = useAuth();

  const themes: { value: VisualSettings['theme']; label: string; class: string }[] = [
    { value: 'light', label: 'Light Mode', class: 'bg-white border-slate-200 text-slate-800' },
    { value: 'dark', label: 'Dark Mode', class: 'bg-[#0f172a] border-[#1e293b] text-white' },
    { value: 'sepia', label: 'Sepia Mode', class: 'bg-[#f4ecd8] border-[#e4dcd0] text-[#5b4636]' },
    { value: 'slate-blue', label: 'Slate Blue', class: 'bg-[#0f1e2d] border-[#1f3c59] text-slate-200' },
  ];

  const fonts: { value: VisualSettings['fontFamily']; label: string }[] = [
    { value: 'Inter', label: 'Inter (Sans)' },
    { value: 'Roboto', label: 'Roboto (Modern)' },
    { value: 'Poppins', label: 'Poppins (Round)' },
    { value: 'Georgia', label: 'Georgia (Serif)' },
    { value: 'Fira Code', label: 'Fira Code (Mono)' },
  ];

  const sizes: { value: VisualSettings['fontSize']; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
  ];

  const weights: { value: VisualSettings['fontWeight']; label: string }[] = [
    { value: 'regular', label: 'Regular' },
    { value: 'medium', label: 'Medium' },
    { value: 'bold', label: 'Bold' },
  ];

  const accents: { value: VisualSettings['accentColor']; color: string; label: string }[] = [
    { value: 'blue', color: 'bg-blue-500', label: 'Blue' },
    { value: 'purple', color: 'bg-purple-500', label: 'Purple' },
    { value: 'emerald', color: 'bg-emerald-500', label: 'Emerald' },
    { value: 'rose', color: 'bg-rose-500', label: 'Rose' },
    { value: 'orange', color: 'bg-orange-500', label: 'Orange' },
  ];

  // Subscription Info
  const isSaasAccount = user?.role === 'SAAS_OWNER' || !user?.tenant;
  const daysLeft = user?.tenant_days_remaining ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="App Settings & Customization">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Subscription Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-blue-500" /> Subscription Status
          </h4>
          {isSaasAccount ? (
            <div>
              <p className="font-bold text-slate-800 text-sm">SaaS Owner / Developer Portal</p>
              <p className="text-xs text-slate-500 mt-0.5">Unlimited system access</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">Store: {user.tenant_name || 'My Store'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Active Client Subscription</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  daysLeft <= 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {daysLeft} Days Left
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Themes customizer */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Paintbrush className="h-4 w-4 text-purple-500" /> Choose Theme
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => updateSettings({ theme: t.value })}
                className={`p-3 rounded-xl border-2 text-center text-xs font-bold cursor-pointer transition duration-150 flex flex-col items-center justify-center gap-1 ${t.class} ${
                  settings.theme === t.value ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02]' : 'border-transparent hover:scale-[1.01]'
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent color swatches */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" /> Accent Color
          </h4>
          <div className="flex items-center gap-3">
            {accents.map((acc) => (
              <button
                key={acc.value}
                onClick={() => updateSettings({ accentColor: acc.value })}
                className={`h-9 w-9 rounded-full ${acc.color} cursor-pointer transition relative flex items-center justify-center shadow-sm hover:scale-110 ${
                  settings.accentColor === acc.value ? 'ring-4 ring-offset-2 ring-slate-300 scale-105' : ''
                }`}
                title={acc.label}
              >
                {settings.accentColor === acc.value && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family selector */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="h-4 w-4 text-emerald-500" /> Typography & Fonts
          </h4>
          <div className="space-y-3">
            {/* Font stack */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font sizing and weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Font Size</label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
                  {sizes.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateSettings({ fontSize: s.value })}
                      className={`flex-1 py-1 rounded-md text-center cursor-pointer transition ${
                        settings.fontSize === s.value ? 'bg-white text-blue-600 shadow-sm' : 'hover:bg-white/40'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Font Weight</label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
                  {weights.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => updateSettings({ fontWeight: w.value })}
                      className={`flex-1 py-1 rounded-md text-center cursor-pointer transition ${
                        settings.fontWeight === w.value ? 'bg-white text-blue-600 shadow-sm' : 'hover:bg-white/40'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 cursor-pointer transition"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsPanel;
