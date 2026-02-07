import { useState } from "react";

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
    active: true,
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
    active: false,
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
    active: false,
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
    active: false,
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
    active: false,
    preview: {
      bg: '#1a1019',
      sidebar: '#140c13',
      header: '#241520',
      accent: '#f97316',
      cards: ['#241520', '#241520', '#241520'],
    },
  },
  {
    id: 'system',
    name: 'System',
    desc: 'Match your OS setting',
    active: false,
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

const backupProviders = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M4.433 22l-1.6-2.773L8.77 8.66l3.2 5.541H22.4L20.8 17H11.97" fill="#4285F4"/>
        <path d="M15.233 2L8.77 8.66l1.6 2.773L22.4 14.2 20.8 17l-8.83-2.8L15.233 2" fill="#FBBC04"/>
        <path d="M2.833 19.227L8.77 8.66h6.463l-3.2-5.541L8.77 2H2.233L.633 4.773l2.2 14.454z" fill="#34A853"/>
        <path d="M8.77 8.66l3.2 5.54-6.537.027L2.833 19.227" fill="#188038"/>
        <path d="M15.233 2l-3.263 5.66L8.77 8.66" fill="#EA4335"/>
        <path d="M11.97 14.2H22.4l-1.6 2.8H10.37" fill="#1967D2"/>
      </svg>
    ),
    connected: true,
    lastSync: '2 hours ago',
    storage: '4.2 GB synced',
    color: 'border-blue-500/30 bg-blue-500/5',
    dotColor: 'bg-green-500',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0061FF">
        <path d="M6 2l6 3.75L6 9.5 0 5.75zM18 2l6 3.75-6 3.75-6-3.75zM0 13.25L6 9.5l6 3.75L6 17zM18 9.5l6 3.75L18 17l-6-3.75zM6 18.25l6-3.75 6 3.75-6 3.75z"/>
      </svg>
    ),
    connected: true,
    lastSync: 'Yesterday',
    storage: '1.8 GB synced',
    color: 'border-blue-600/30 bg-blue-600/5',
    dotColor: 'bg-green-500',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M14.5 18h5.1a3.4 3.4 0 0 0 .9-6.7A5.5 5.5 0 0 0 10.1 9a4.5 4.5 0 0 0-6.6 3.3A3.5 3.5 0 0 0 4 19h10.5z" fill="#0078D4"/>
        <path d="M10.1 9a5.5 5.5 0 0 1 10.4 2.3h.1a3.4 3.4 0 0 1 2.6 1.5A4 4 0 0 0 20 8a4 4 0 0 0-3.8-2.8A5 5 0 0 0 10.1 9z" fill="#50D9FF" opacity="0.7"/>
      </svg>
    ),
    connected: false,
    lastSync: null,
    storage: null,
    color: 'border-slate-200 dark:border-border-dark bg-transparent',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#FF9900" opacity="0.2"/>
        <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#FF9900"/>
        <path d="M3 7v10l9 5V12L3 7z" fill="#FF9900" opacity="0.7"/>
        <path d="M21 7v10l-9 5V12l9-5z" fill="#FF9900" opacity="0.5"/>
      </svg>
    ),
    connected: false,
    lastSync: null,
    storage: null,
    color: 'border-slate-200 dark:border-border-dark bg-transparent',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'local',
    name: 'Local Server',
    icon: (
      <span className="material-symbols-outlined text-2xl text-slate-400">dns</span>
    ),
    connected: false,
    lastSync: null,
    storage: null,
    color: 'border-slate-200 dark:border-border-dark bg-transparent',
    dotColor: 'bg-slate-400',
  },
];

const backupHistory = [
  { id: 1, type: 'auto', target: 'Google Drive', date: 'Today, 08:00 AM', size: '4.2 GB', status: 'success' },
  { id: 2, type: 'auto', target: 'Dropbox', date: 'Yesterday, 08:00 AM', size: '1.8 GB', status: 'success' },
  { id: 3, type: 'manual', target: 'Google Drive', date: 'Oct 24, 2024', size: '3.9 GB', status: 'success' },
  { id: 4, type: 'auto', target: 'Dropbox', date: 'Oct 23, 2024', size: '1.6 GB', status: 'failed' },
  { id: 5, type: 'manual', target: 'Google Drive', date: 'Oct 20, 2024', size: '3.7 GB', status: 'success' },
];

function ThemePreview({ theme }) {
  const p = theme.preview
  return (
    <div
      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
        theme.active
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-slate-200 dark:border-border-dark hover:border-slate-300 dark:hover:border-slate-600'
      }`}
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
          {theme.active && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">check</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

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

        {/* Profile Information Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Update your photo and personal details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button className="bg-primary text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">
                Save Changes
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center text-white text-xl font-bold">
              AD
            </div>
            <button className="text-sm font-medium text-primary hover:text-blue-600 transition-colors">
              Change Photo
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                <input type="text" defaultValue="Alex" className="w-full bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                <input type="text" defaultValue="Davidson" className="w-full bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                </div>
                <input type="email" defaultValue="alex.davidson@cloudspace.com" className="w-full bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
              <textarea rows={3} defaultValue="Lead Designer at CloudSpace. Loves minimalism and clean code." className="w-full bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
          </div>
        </div>

        {/* Theme Selection Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 mb-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Choose a theme for your workspace. This affects all of CloudSpace.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <ThemePreview key={theme.id} theme={theme} />
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-border-dark space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Font Size</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Adjust the interface text size</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
                <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-border-dark transition-colors">Small</button>
                <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-border-dark text-slate-900 dark:text-white rounded-md shadow-sm">Medium</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-border-dark transition-colors">Large</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Compact Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reduce spacing and padding across the UI</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-slate-300 dark:bg-slate-600">
                <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Sidebar Position</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose which side the navigation appears</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
                <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-border-dark text-slate-900 dark:text-white rounded-md shadow-sm">Left</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-border-dark transition-colors">Right</button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Sync Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Backup & Sync</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Connect remote storage to backup or restore your data.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">
              <span className="material-symbols-outlined text-[18px]">backup</span>
              Backup Now
            </button>
          </div>

          {/* Auto-backup toggle + schedule */}
          <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-border-dark mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-primary">schedule</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Automatic Backup</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Backup your data on a schedule to connected services</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {autoBackup && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
                  <button className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-border-dark text-slate-900 dark:text-white rounded-md shadow-sm">Daily</button>
                  <button className="px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-border-dark transition-colors">Weekly</button>
                  <button className="px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 rounded-md hover:bg-white dark:hover:bg-border-dark transition-colors">Monthly</button>
                </div>
              )}
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoBackup ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${autoBackup ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Provider Cards */}
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Remote Storage Providers</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {backupProviders.map((provider) => (
              <div
                key={provider.id}
                className={`relative rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${provider.color} ${
                  provider.connected ? 'dark:border-green-500/20 dark:bg-green-500/5' : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark flex items-center justify-center flex-shrink-0">
                      {provider.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{provider.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${provider.dotColor}`}></div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {provider.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {provider.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Last sync</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{provider.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Data</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{provider.storage}</span>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/50 dark:border-border-dark">
                      <button className="flex-1 text-xs font-medium text-primary hover:text-blue-600 py-1.5 rounded-md hover:bg-primary/5 transition-colors">
                        Sync Now
                      </button>
                      <button className="flex-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 py-1.5 rounded-md hover:bg-red-500/5 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Restore section */}
          <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-amber-500">restore</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Restore from Backup</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recover your files from a previous backup snapshot</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select className="flex-1 bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                <option>Google Drive - Today, 08:00 AM (4.2 GB)</option>
                <option>Dropbox - Yesterday, 08:00 AM (1.8 GB)</option>
                <option>Google Drive - Oct 24, 2024 (3.9 GB)</option>
                <option>Google Drive - Oct 20, 2024 (3.7 GB)</option>
              </select>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">restore</span>
                Restore
              </button>
            </div>
          </div>

          {/* Backup History */}
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Backup History</p>
          <div className="rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                {backupHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.type === 'auto'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        <span className="material-symbols-outlined text-[12px]">{entry.type === 'auto' ? 'schedule' : 'touch_app'}</span>
                        {entry.type === 'auto' ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{entry.target}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{entry.date}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell tabular-nums">{entry.size}</td>
                    <td className="px-4 py-2.5 text-right">
                      {entry.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Security Card */}
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
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                twoFactorEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${twoFactorEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
