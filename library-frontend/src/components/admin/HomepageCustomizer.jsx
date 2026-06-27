import React, { useEffect, useMemo, useState } from 'react';
import { SparklesIcon, EyeIcon, EyeSlashIcon, MoonIcon, SunIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import settingsService from '../../api/settingsService';

const defaultSections = [
  { key: 'hero', label: 'Hero / Welcome Banner', description: 'Main landing intro and spotlight area' },
  { key: 'search', label: 'Search Strip', description: 'Search, filters, and discovery tools' },
  { key: 'featured', label: 'Featured Books', description: 'Curated recommended titles' },
  { key: 'catalog', label: 'Library Catalog', description: 'Main book browsing grid' },
  { key: 'posts', label: 'Announcements', description: 'News and latest updates' },
  { key: 'donation', label: 'Donation Panel', description: 'Support and donation block' },
];

const HomepageCustomizer = () => {
  const [settings, setSettings] = useState({
    theme: 'aurora',
    sections: {},
    layout: {},
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsService.getHomepageSettings();
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  const sectionEntries = useMemo(() => {
    return defaultSections.map((section) => ({
      ...section,
      enabled: Boolean(settings.sections?.[section.key]?.enabled),
      title: settings.sections?.[section.key]?.title || section.label,
    }));
  }, [settings.sections]);

  const toggleSection = (key) => {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: {
          ...(prev.sections?.[key] || {}),
          enabled: !Boolean(prev.sections?.[key]?.enabled),
        },
      },
    }));
  };

  const updateTheme = (theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await settingsService.updateHomepageSettings(settings);
      setMessage('Homepage settings saved successfully.');
    } catch (error) {
      setMessage('Unable to save settings right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Homepage Control Center</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Customize the landing experience</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Choose which homepage sections appear, switch the visual theme, and decide how prominent the discovery experience should be.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          <SparklesIcon className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <PaintBrushIcon className="h-5 w-5 text-cyan-600" />
              Visual Theme
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {['day', 'night', 'aurora'].map((theme) => {
                const isActive = settings.theme === theme;
                return (
                  <button
                    key={theme}
                    onClick={() => updateTheme(theme)}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${isActive ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'night' ? <MoonIcon className="h-4 w-4" /> : theme === 'day' ? <SunIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                      <span className="capitalize">{theme}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <EyeIcon className="h-5 w-5 text-violet-600" />
              Section Visibility
            </div>
            <div className="mt-4 space-y-3">
              {sectionEntries.map((section) => (
                <div key={section.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{section.label}</p>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${section.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {section.enabled ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                    {section.enabled ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Preview</p>
          <h3 className="mt-3 text-2xl font-bold">{settings.sections?.hero?.title || 'Welcome to the future of the library'}</h3>
          <p className="mt-3 text-sm text-slate-300">This preview shows how the homepage will appear when your chosen theme and sections are applied.</p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-sm font-semibold">Theme: <span className="capitalize">{settings.theme}</span></p>
            </div>
            {sectionEntries.filter((section) => section.enabled).map((section) => (
              <div key={section.key} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm">
                {section.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageCustomizer;
