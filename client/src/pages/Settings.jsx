import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

const tabs = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "security", label: "Account Security", icon: "shield" },
  { id: "appearance", label: "Appearance", icon: "palette" },
  { id: "backup", label: "Backup & Sync", icon: "backup" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "storage", label: "Storage", icon: "cloud" },
];

const themes = [
  {
    id: 'dark',
    name: 'Dark',
    desc: 'Easy on the eyes',
    preview: {
      bg: '#101922',
      sidebar: '#0d1219',
      header: '#1A2633',
      accent: '#258cf4',
      cards: ['#1A2633', '#1A2633', '#1A2633'],
    },
  },
  {
    id: 'light',
    name: 'Light',
    desc: 'Classic bright look',
    preview: {
      bg: '#f5f7f8',
      sidebar: '#ffffff',
      header: '#ffffff',
      accent: '#258cf4',
      cards: ['#ffffff', '#ffffff', '#ffffff'],
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Deep dark blue',
    preview: {
      bg: '#0a0e1a',
      sidebar: '#070b14',
      header: '#111827',
      accent: '#6366f1',
      cards: ['#111827', '#111827', '#111827'],
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    desc: 'Arctic inspired palette',
    preview: {
      bg: '#2e3440',
      sidebar: '#272c36',
      header: '#3b4252',
      accent: '#88c0d0',
      cards: ['#3b4252', '#3b4252', '#3b4252'],
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    desc: 'Warm orange tones',
    preview: {
      bg: '#1a1019',
      sidebar: '#140c13',
      header: '#241520',
      accent: '#f97316',
      cards: ['#241520', '#241520', '#241520'],
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    desc: 'Deep woodland greens',
    preview: {
      bg: '#0f1a14',
      sidebar: '#0a1410',
      header: '#162b1e',
      accent: '#34d399',
      cards: ['#162b1e', '#162b1e', '#162b1e'],
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    desc: 'Deep sea blues & teals',
    preview: {
      bg: '#0a1628',
      sidebar: '#071020',
      header: '#0f2340',
      accent: '#06b6d4',
      cards: ['#0f2340', '#0f2340', '#0f2340'],
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    desc: 'Warm pink elegance',
    preview: {
      bg: '#1a0f16',
      sidebar: '#140a11',
      header: '#2a1524',
      accent: '#f472b6',
      cards: ['#2a1524', '#2a1524', '#2a1524'],
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    desc: 'Classic dark purple',
    preview: {
      bg: '#1a1029',
      sidebar: '#130b20',
      header: '#251740',
      accent: '#bd93f9',
      cards: ['#251740', '#251740', '#251740'],
    },
  },
  {
    id: 'system',
    name: 'System',
    desc: 'Match your OS setting',
    isSystem: true,
    preview: {
      bg: '#101922',
      sidebar: '#0d1219',
      header: '#1A2633',
      accent: '#258cf4',
      cards: ['#1A2633', '#1A2633', '#1A2633'],
    },
  },
];

const notificationSettings = [
  { id: 'file_shared', label: 'File shared with me', desc: 'When someone shares a file or folder with you', email: true, push: true },
  { id: 'comment', label: 'New comment', desc: 'When someone comments on your file', email: true, push: true },
  { id: 'mention', label: 'Mentions', desc: 'When someone mentions you in a comment', email: true, push: true },
  { id: 'upload_complete', label: 'Upload complete', desc: 'When a large file finishes uploading', email: false, push: true },
  { id: 'storage_warning', label: 'Storage warning', desc: 'When you approach your storage limit', email: true, push: true },
  { id: 'trash_reminder', label: 'Trash reminder', desc: 'Before items are permanently deleted from trash', email: true, push: false },
  { id: 'security_alert', label: 'Security alerts', desc: 'Suspicious login attempts or password changes', email: true, push: true },
  { id: 'weekly_summary', label: 'Weekly summary', desc: 'A digest of file activity from the past week', email: true, push: false },
];


function ThemePreview({ theme, isActive, onSelect }) {
  const p = theme.preview;
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
        isActive
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-slate-200 dark:border-border-dark hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      style={{ background: p.sidebar }}
    >
      <div className="aspect-[16/10] flex" style={{ background: p.bg }}>
        <div className="w-[22%] flex flex-col gap-[3px] p-[5px]" style={{ background: p.sidebar }}>
          <div className="h-[6px] w-[60%] rounded-sm" style={{ background: p.accent, opacity: 0.8 }}></div>
          <div className="h-[4px] w-[80%] rounded-sm mt-[4px]" style={{ background: p.header }}></div>
          <div className="h-[4px] w-[70%] rounded-sm" style={{ background: p.header }}></div>
          <div className="h-[4px] w-[75%] rounded-sm" style={{ background: p.header }}></div>
          <div className="h-[4px] w-[65%] rounded-sm" style={{ background: p.header }}></div>
        </div>
        <div className="flex-1 p-[6px] flex flex-col gap-[4px]">
          <div className="h-[6px] rounded-sm" style={{ background: p.header }}></div>
          <div className="flex-1 flex gap-[3px] mt-[3px]">
            {p.cards.map((c, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ background: c }}>
                <div className="h-[3px] w-[60%] rounded-sm m-[3px]" style={{ background: p.accent, opacity: 0.4 }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2.5" style={{ background: p.sidebar }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              {theme.isSystem && <span className="material-symbols-outlined text-[14px] text-slate-400">computer</span>}
              {theme.name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{theme.desc}</p>
          </div>
          {isActive && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">check</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/* ─── Tab Content Components ─── */

function ProfileTab() {
  const inputClass = "w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Update your photo and personal details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
              Cancel
            </button>
            <button className="bg-primary text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-border-dark">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Alex Davidson</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">alex.davidson@cloudspace.com</p>
            <button className="mt-2 text-xs font-medium text-primary hover:text-blue-600 transition-colors">
              Change Photo
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">First Name</label>
              <input type="text" defaultValue="Alex" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Last Name</label>
              <input type="text" defaultValue="Davidson" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[18px]">mail</span>
              </div>
              <input type="email" defaultValue="alex.davidson@cloudspace.com" className={`${inputClass} pl-11`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Bio</label>
            <textarea rows={3} defaultValue="Lead Designer at CloudSpace. Loves minimalism and clean code." className={`${inputClass} resize-none`} />
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-red-200 dark:border-red-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-red-500">person_remove</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Account Security</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your password and 2-step verification settings.
          </p>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-border-dark">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Password</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Last changed 3 months ago</p>
          </div>
          <button className="text-sm font-medium text-primary hover:text-blue-600 transition-colors">
            Change Password
          </button>
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add an extra layer of security to your account.</p>
          </div>
          <Toggle enabled={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Sessions</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Devices currently logged into your account.</p>
        </div>
        <div className="space-y-3">
          {[
            { device: 'Chrome on macOS', location: 'Paris, France', current: true, time: 'Now' },
            { device: 'Firefox on Windows', location: 'Lyon, France', current: false, time: '2 hours ago' },
            { device: 'CloudSpace iOS App', location: 'Paris, France', current: false, time: 'Yesterday' },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-border-dark last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-background-dark flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-slate-500 dark:text-slate-400">
                    {s.device.includes('iOS') ? 'phone_iphone' : 'computer'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    {s.device}
                    {s.current && <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15 px-1.5 py-0.5 rounded-full">Current</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.location} &middot; {s.time}</p>
                </div>
              </div>
              {!s.current && (
                <button className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function AppearanceTab() {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarPos, setSidebarPos] = useState('left');

  useEffect(() => {
    apiFetch('/api/settings/appearance')
      .then(r => r.json())
      .then(data => {
        if (data.theme) setActiveTheme(data.theme);
        if (data.font_size) setFontSize(data.font_size);
        if (data.compact_mode !== undefined) setCompactMode(data.compact_mode);
        if (data.sidebar_position) setSidebarPos(data.sidebar_position);
      })
      .catch(() => {});
  }, []);

  const saveSettings = useCallback((updates) => {
    apiFetch('/api/settings/appearance', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  const handleTheme = (id) => {
    setActiveTheme(id);
    saveSettings({ theme: id });
  };
  const handleFontSize = (s) => {
    setFontSize(s);
    saveSettings({ font_size: s });
  };
  const handleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    saveSettings({ compact_mode: next });
  };
  const handleSidebar = (s) => {
    setSidebarPos(s);
    saveSettings({ sidebar_position: s });
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Choose a theme for your workspace. This affects all of CloudSpace.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <ThemePreview
            key={theme.id}
            theme={theme}
            isActive={activeTheme === theme.id}
            onSelect={() => handleTheme(theme.id)}
          />
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-border-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Font Size</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Adjust the interface text size</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
            {['small', 'medium', 'large'].map((s) => (
              <button
                key={s}
                onClick={() => handleFontSize(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  fontSize === s
                    ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-border-dark'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Compact Mode</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reduce spacing and padding across the UI</p>
          </div>
          <Toggle enabled={compactMode} onChange={handleCompact} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Sidebar Position</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose which side the navigation appears</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
            {['left', 'right'].map((s) => (
              <button
                key={s}
                onClick={() => handleSidebar(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  sidebarPos === s
                    ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-border-dark'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackupTab() {
  const [autoBackup, setAutoBackup] = useState(true);

  const services = [
    { id: 'google-drive', name: 'Google Drive', logo: '/google-drive.svg', desc: 'Sync files with your Google account', connected: true, lastSync: '2 hours ago' },
    { id: 'dropbox', name: 'Dropbox', logo: '/dropbox.svg', desc: 'Connect your Dropbox storage', connected: true, lastSync: 'Yesterday' },
    { id: 'onedrive', name: 'OneDrive', logo: '/microsoft-onedrive.svg', desc: 'Sync with Microsoft OneDrive', connected: false },
  ];

  return (
    <div className="space-y-6">
      {/* Integrations */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Integrations</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your cloud storage connections.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark flex items-center justify-center flex-shrink-0">
                <img src={service.logo} alt={service.name} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{service.name}</p>
                  {service.connected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {service.connected ? `Last synced ${service.lastSync}` : service.desc}
                </p>
              </div>
              {service.connected ? (
                <button className="text-[13px] font-medium text-slate-600 dark:text-slate-300 px-3.5 py-[6px] rounded-lg border border-slate-200 dark:border-border-dark hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all">
                  Disconnect
                </button>
              ) : (
                <button className="text-[13px] font-medium text-white bg-primary px-4 py-[6px] rounded-lg hover:bg-blue-600 shadow-sm transition-colors">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-backup */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Automatic Backup</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Runs daily across all connected services</p>
          </div>
          <Toggle enabled={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Last backup: <span className="text-slate-700 dark:text-slate-300 font-medium">Today, 08:00 AM</span>
          </div>
          <button className="text-[13px] font-medium text-primary hover:text-blue-600 px-3.5 py-[6px] rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors">
            Backup Now
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState(notificationSettings);

  const toggleSetting = (id, channel) => {
    setSettings(prev => prev.map(s =>
      s.id === id ? { ...s, [channel]: !s[channel] } : s
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Choose how and when you want to be notified.
          </p>
        </div>

        {/* Column headers */}
        <div className="flex items-center justify-end gap-8 mb-3 pr-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12 justify-center">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            Email
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12 justify-center">
            <span className="material-symbols-outlined text-[14px]">smartphone</span>
            Push
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {settings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between py-3.5">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{setting.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{setting.desc}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-12 flex justify-center">
                  <Toggle enabled={setting.email} onChange={() => toggleSetting(setting.id, 'email')} />
                </div>
                <div className="w-12 flex justify-center">
                  <Toggle enabled={setting.push} onChange={() => toggleSetting(setting.id, 'push')} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-indigo-400">do_not_disturb_on</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Quiet Hours</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pause all notifications between 10:00 PM - 7:00 AM</p>
            </div>
          </div>
          <Toggle enabled={true} onChange={() => {}} />
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#22c55e', '#64748b'];
const CHART_BG_CLASSES = ['bg-indigo-500/10', 'bg-purple-500/10', 'bg-blue-500/10', 'bg-green-500/10', 'bg-slate-500/10'];
const CHART_TEXT_CLASSES = ['text-indigo-400', 'text-purple-400', 'text-blue-400', 'text-green-400', 'text-slate-400'];

function BreakdownList({ breakdown }) {
  return (
    <div className="space-y-1.5">
      {breakdown.map((item, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={item.type} className="flex items-center gap-3 py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-background-dark/50">
            <div className={`w-7 h-7 rounded-lg ${CHART_BG_CLASSES[i % CHART_BG_CLASSES.length]} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined text-base ${CHART_TEXT_CLASSES[i % CHART_TEXT_CLASSES.length]}`}>{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{item.formatted || item.size}</span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums w-8 text-right">{item.percent}%</span>
                </div>
              </div>
              <div className="h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percent}%`, background: color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StorageTab() {
  const [storageData, setStorageData] = useState({
    used: 0, limit: 1, percentage: 0,
    formatted_used: '0 GB', formatted_limit: '20 GB',
    breakdown: [],
  });

  useEffect(() => {
    apiFetch('/api/user/storage')
      .then(r => r.json())
      .then(data => setStorageData(data))
      .catch(() => {});
  }, []);

  const { formatted_used, formatted_limit, percentage, breakdown } = storageData;
  const remaining = storageData.limit
    ? ((storageData.limit - storageData.used) / (1024 ** 3)).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Overview + Breakdown */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Storage Overview</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your storage space and see what&apos;s using the most room.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{formatted_used}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">of {formatted_limit} used</span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${percentage >= 80 ? 'text-amber-500' : 'text-primary'}`}>{percentage}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-background-dark rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${percentage >= 90 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {remaining} GB remaining{percentage >= 80 ? ' \u2014 consider freeing up some space.' : '.'}
          </p>
        </div>

        {/* Breakdown list */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Storage Breakdown</p>
        <BreakdownList breakdown={breakdown} />
      </div>

      {/* Cleanup */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-red-400">delete_sweep</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Free Up Space</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Remove large files, duplicates, and empty trash to free storage.</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
            Clean Up
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Settings Component ─── */

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      {/* Sub-header */}
      <div className="h-12 flex items-center px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Settings</h3>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your profile information and account security
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-border-dark mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic tab content */}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'backup' && <BackupTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'storage' && <StorageTab />}
      </div>
    </>
  );
}
