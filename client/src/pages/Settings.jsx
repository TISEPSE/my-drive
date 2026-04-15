import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";

/* ─── Données ─── */

const sections = [
  { id: "profil",        label: "Profil",         icon: "person" },
  { id: "securite",      label: "Sécurité",        icon: "shield" },
  { id: "apparence",     label: "Apparence",       icon: "palette" },
  { id: "notifications", label: "Notifications",   icon: "notifications" },
  { id: "stockage",      label: "Stockage",        icon: "cloud" },
  { id: "integrations",  label: "Intégrations",    icon: "sync" },
];

const themes = [
  { id: 'dark',     name: 'Sombre',   desc: 'Reposant pour les yeux',     preview: { bg: '#101922', sidebar: '#0d1219', header: '#1A2633', accent: '#258cf4' } },
  { id: 'light',    name: 'Clair',    desc: 'Interface lumineuse classique', preview: { bg: '#f5f7f8', sidebar: '#ffffff', header: '#ffffff', accent: '#258cf4' } },
  { id: 'midnight', name: 'Minuit',   desc: 'Bleu nuit profond',           preview: { bg: '#0a0e1a', sidebar: '#070b14', header: '#111827', accent: '#6366f1' } },
  { id: 'nord',     name: 'Nord',     desc: 'Palette arctique',            preview: { bg: '#2e3440', sidebar: '#272c36', header: '#3b4252', accent: '#88c0d0' } },
  { id: 'sunset',   name: 'Coucher',  desc: 'Tons orangés chaleureux',     preview: { bg: '#1a1019', sidebar: '#140c13', header: '#241520', accent: '#f97316' } },
  { id: 'forest',   name: 'Forêt',   desc: 'Verts boisés profonds',       preview: { bg: '#0f1a14', sidebar: '#0a1410', header: '#162b1e', accent: '#34d399' } },
  { id: 'ocean',    name: 'Océan',   desc: 'Bleus et teintes marines',    preview: { bg: '#0a1628', sidebar: '#071020', header: '#0f2340', accent: '#06b6d4' } },
  { id: 'rose',     name: 'Rose',     desc: 'Élégance rose chaleureuse',   preview: { bg: '#1a0f16', sidebar: '#140a11', header: '#2a1524', accent: '#f472b6' } },
  { id: 'dracula',  name: 'Dracula',  desc: 'Violet sombre classique',     preview: { bg: '#1a1029', sidebar: '#130b20', header: '#251740', accent: '#bd93f9' } },
  { id: 'system',   name: 'Système', desc: 'Suit le thème de l\'OS',       isSystem: true, preview: { bg: '#101922', sidebar: '#0d1219', header: '#1A2633', accent: '#258cf4' } },
];

const notifSettings = [
  { id: 'file_shared',     label: 'Fichier partagé',       desc: 'Quand quelqu\'un partage un fichier avec vous',       email: true,  push: true },
  { id: 'comment',         label: 'Nouveau commentaire',   desc: 'Quand quelqu\'un commente un de vos fichiers',         email: true,  push: true },
  { id: 'mention',         label: 'Mentions',              desc: 'Quand quelqu\'un vous mentionne dans un commentaire', email: true,  push: true },
  { id: 'upload_complete', label: 'Upload terminé',        desc: 'Quand un fichier volumineux finit de s\'envoyer',     email: false, push: true },
  { id: 'storage_warning', label: 'Alerte stockage',       desc: 'Quand vous approchez de la limite de stockage',       email: true,  push: true },
  { id: 'trash_reminder',  label: 'Rappel corbeille',      desc: 'Avant la suppression définitive des fichiers',        email: true,  push: false },
  { id: 'security_alert',  label: 'Alerte sécurité',       desc: 'Tentatives suspectes ou changements de mot de passe', email: true,  push: true },
  { id: 'weekly_summary',  label: 'Résumé hebdomadaire',   desc: 'Un récapitulatif des activités de la semaine',        email: true,  push: false },
];

const CHART_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#22c55e', '#64748b'];

/* ─── Petits composants réutilisables ─── */

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

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {desc && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-border-dark last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {desc && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SegmentControl({ value, options, onChange }) {
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-background-dark rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Sections ─── */

function ProfilSection() {
  const inputClass = "w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors";

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Informations personnelles" desc="Mettez à jour votre photo et vos informations." />

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-border-dark">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20 flex-shrink-0">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Alex Davidson</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">alex.davidson@cloudspace.com</p>
            <button className="mt-2 text-xs font-medium text-primary hover:text-blue-600 transition-colors">
              Changer la photo
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Prénom</label>
              <input type="text" defaultValue="Alex" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nom</label>
              <input type="text" defaultValue="Davidson" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Adresse e-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">mail</span>
              <input type="email" defaultValue="alex.davidson@cloudspace.com" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Biographie</label>
            <textarea rows={3} defaultValue="Lead Designer at CloudSpace." className={`${inputClass} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
              Annuler
            </button>
            <button
              disabled
              title="Bientôt disponible — l'API profil est en cours d'implémentation"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg opacity-50 cursor-not-allowed"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Card>

      {/* Suppression */}
      <Card className="border-red-200 dark:border-red-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-500">person_remove</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Supprimer le compte</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Action irréversible — toutes vos données seront perdues.</p>
            </div>
          </div>
          <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
            <span className="material-symbols-outlined">delete_forever</span>
            Supprimer
          </button>
        </div>
      </Card>
    </div>
  );
}

function SecuriteSection() {
  const [twoFactor, setTwoFactor] = useState(false);

  const sessions = [
    { device: 'Chrome sur macOS',    location: 'Paris, France',  current: true,  time: 'Maintenant' },
    { device: 'Firefox sur Windows', location: 'Lyon, France',   current: false, time: 'Il y a 2h' },
    { device: 'App iOS CloudSpace',  location: 'Paris, France',  current: false, time: 'Hier' },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Mot de passe et authentification" desc="Gérez votre mot de passe et la double authentification." />
        <Row label="Mot de passe" desc="Dernière modification il y a 3 mois">
          <button className="text-sm font-medium text-primary hover:text-blue-600 transition-colors">Modifier</button>
        </Row>
        <Row label="Double authentification (2FA)" desc="Bientôt disponible — fonctionnalité en cours d'implémentation.">
          <span title="Bientôt disponible">
            <Toggle enabled={false} onChange={() => {}} />
          </span>
        </Row>
      </Card>

      <Card>
        <SectionTitle title="Sessions actives" desc="Appareils actuellement connectés à votre compte." />
        <div className="space-y-1">
          {sessions.map(s => (
            <div key={s.device} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-border-dark last:border-b-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-background-dark flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                  {s.device.includes('iOS') ? 'phone_iphone' : 'computer'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  {s.device}
                  {s.current && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                      Actuelle
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Révoquer</button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ThemeCard({ theme, isActive, onSelect }) {
  const p = theme.preview;
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col rounded-xl overflow-hidden border-2 transition-all text-left w-full h-full ${
        isActive
          ? 'border-primary shadow-lg shadow-primary/20'
          : 'border-slate-200 dark:border-border-dark hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Miniature */}
      <div className="flex-1 flex" style={{ background: p.bg }}>
        <div className="w-[22%] flex flex-col gap-[3px] p-[5px]" style={{ background: p.sidebar }}>
          <div className="h-[5px] w-[60%] rounded-sm" style={{ background: p.accent, opacity: 0.8 }} />
          <div className="h-[3px] w-[80%] rounded-sm mt-[3px]" style={{ background: p.header }} />
          <div className="h-[3px] w-[70%] rounded-sm" style={{ background: p.header }} />
          <div className="h-[3px] w-[75%] rounded-sm" style={{ background: p.header }} />
        </div>
        <div className="flex-1 p-[5px] flex flex-col gap-[3px]">
          <div className="h-[5px] rounded-sm" style={{ background: p.header }} />
          <div className="flex-1 flex gap-[3px] mt-[2px]">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 rounded-sm" style={{ background: p.header }}>
                <div className="h-[2px] w-[60%] rounded-sm m-[2px]" style={{ background: p.accent, opacity: 0.4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ background: p.sidebar }}>
        <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
          {theme.isSystem && <span className="material-symbols-outlined text-[13px] text-slate-400">computer</span>}
          {theme.name}
        </p>
        {isActive && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[13px]">check</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ApparenceSection() {
  const { theme: activeTheme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarPos, setSidebarPos] = useState('left');

  useEffect(() => {
    apiFetch('/api/settings/appearance')
      .then(r => r.json())
      .then(data => {
        if (data.theme) setTheme(data.theme);
        if (data.font_size) setFontSize(data.font_size);
        if (data.compact_mode !== undefined) setCompactMode(data.compact_mode);
        if (data.sidebar_position) setSidebarPos(data.sidebar_position);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback((updates) => {
    apiFetch('/api/settings/appearance', { method: 'PUT', body: JSON.stringify(updates) }).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Thème" desc="Choisissez l'apparence de votre espace de travail." />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {themes.map(t => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={activeTheme === t.id}
              onSelect={() => { setTheme(t.id); save({ theme: t.id }); }}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Interface" desc="Ajustez les préférences d'affichage." />
        <Row
          label="Taille du texte"
          desc="Ajustez la taille de l'interface"
        >
          <SegmentControl
            value={fontSize}
            options={[{ value: 'small', label: 'Petit' }, { value: 'medium', label: 'Moyen' }, { value: 'large', label: 'Grand' }]}
            onChange={v => { setFontSize(v); save({ font_size: v }); }}
          />
        </Row>
        <Row
          label="Mode compact"
          desc="Réduit les espacements dans l'interface"
        >
          <Toggle enabled={compactMode} onChange={() => { const next = !compactMode; setCompactMode(next); save({ compact_mode: next }); }} />
        </Row>
        <Row
          label="Position de la barre latérale"
          desc="Côté d'affichage de la navigation"
        >
          <SegmentControl
            value={sidebarPos}
            options={[{ value: 'left', label: 'Gauche' }, { value: 'right', label: 'Droite' }]}
            onChange={v => { setSidebarPos(v); save({ sidebar_position: v }); }}
          />
        </Row>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useState(notifSettings);
  const [quietHours, setQuietHours] = useState(true);

  const toggle = (id, channel) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s));
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Préférences de notification" desc="Choisissez comment et quand être notifié." />

        {/* En-têtes colonnes */}
        <div className="flex items-center justify-end gap-8 mb-2 pr-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12 justify-center">
            <span className="material-symbols-outlined text-[13px]">mail</span>
            Email
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12 justify-center">
            <span className="material-symbols-outlined text-[13px]">smartphone</span>
            Push
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {settings.map(s => (
            <div key={s.id} className="flex items-center justify-between py-3.5">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-12 flex justify-center"><Toggle enabled={s.email} onChange={() => toggle(s.id, 'email')} /></div>
                <div className="w-12 flex justify-center"><Toggle enabled={s.push} onChange={() => toggle(s.id, 'push')} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Row
          label="Heures silencieuses"
          desc="Suspendre toutes les notifications de 22h à 7h"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-indigo-400">do_not_disturb_on</span>
            </div>
            <Toggle enabled={quietHours} onChange={() => setQuietHours(v => !v)} />
          </div>
        </Row>
      </Card>
    </div>
  );
}

function StockageSection() {
  const [data, setData] = useState({ used: 0, limit: 1, percentage: 0, formatted_used: '0 Go', formatted_limit: '20 Go', breakdown: [] });

  useEffect(() => {
    apiFetch('/api/user/storage').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const { formatted_used, formatted_limit, percentage, breakdown } = data;
  const remaining = data.limit ? ((data.limit - data.used) / 1024 ** 3).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Vue d'ensemble du stockage" desc="Gérez votre espace et identifiez ce qui occupe le plus de place." />

        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{formatted_used}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">sur {formatted_limit} utilisés</span>
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
            {remaining} Go restants{percentage >= 80 ? ' — pensez à libérer de l\'espace.' : '.'}
          </p>
        </div>

        {breakdown.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Répartition</p>
            <div className="space-y-2">
              {breakdown.map((item, i) => (
                <div key={item.type} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-background-dark/50">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] + '20' }}>
                    <span className="material-symbols-outlined text-base" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{item.formatted || item.size}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{item.percent}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percent}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="border-red-200 dark:border-red-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-red-400">delete_sweep</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Libérer de l'espace</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Supprimez les gros fichiers et videz la corbeille.</p>
            </div>
          </div>
          <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/5 transition-colors">
            <span className="material-symbols-outlined">cleaning_services</span>
            Nettoyer
          </button>
        </div>
      </Card>
    </div>
  );
}

function IntegrationsSection() {
  const [autoBackup, setAutoBackup] = useState(true);

  const services = [
    { id: 'google-drive', name: 'Google Drive', logo: '/google-drive.svg',         desc: 'Synchroniser avec votre compte Google', connected: true,  lastSync: 'Il y a 2h' },
    { id: 'dropbox',      name: 'Dropbox',      logo: '/dropbox.svg',              desc: 'Connecter votre stockage Dropbox',      connected: true,  lastSync: 'Hier' },
    { id: 'onedrive',     name: 'OneDrive',     logo: '/microsoft-onedrive.svg',   desc: 'Synchroniser avec Microsoft OneDrive',  connected: false },
    { id: 'github',       name: 'GitHub',       logo: '/github.svg',               desc: 'Accéder et sauvegarder vos dépôts',     connected: false },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle title="Services connectés" desc="Gérez vos connexions aux services de stockage cloud." />
        <div className="divide-y divide-slate-100 dark:divide-border-dark">
          {services.map(s => (
            <div key={s.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-border-dark flex items-center justify-center flex-shrink-0">
                <img src={s.logo} alt={s.name} className={`w-6 h-6 ${s.id === 'github' ? 'dark:invert' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                  {s.connected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Connecté
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {s.connected ? `Dernière sync : ${s.lastSync}` : s.desc}
                </p>
              </div>
              {s.connected ? (
                <button className="text-[13px] font-medium text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-border-dark hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all">
                  Déconnecter
                </button>
              ) : (
                <button className="text-[13px] font-medium text-white bg-primary px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                  Connecter
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Row label="Sauvegarde automatique" desc="S'exécute chaque jour sur tous les services connectés">
          <Toggle enabled={autoBackup} onChange={() => setAutoBackup(v => !v)} />
        </Row>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 dark:border-border-dark">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Dernière sauvegarde : <span className="font-medium text-slate-700 dark:text-slate-300 ml-1">Aujourd'hui, 08:00</span>
          </div>
          <button className="text-[13px] font-medium text-primary px-3.5 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors">
            Sauvegarder maintenant
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Composant principal ─── */

export default function Settings() {
  const [active, setActive] = useState("profil");
  const current = sections.find(s => s.id === active);

  return (
    <div className="flex-1 flex overflow-hidden bg-background-light dark:bg-background-dark">

      {/* Navigation verticale */}
      <aside className="w-56 flex-shrink-0 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col py-6 px-3">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Paramètres</p>
        <nav className="flex flex-col gap-0.5">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                active === s.id
                  ? 'bg-primary/10 text-primary dark:text-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-border-dark hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined ${active === s.id ? 'fill-current' : ''}`}>
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{current.label}</h2>
          </div>

          {active === 'profil'        && <ProfilSection />}
          {active === 'securite'      && <SecuriteSection />}
          {active === 'apparence'     && <ApparenceSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'stockage'      && <StockageSection />}
          {active === 'integrations'  && <IntegrationsSection />}
        </div>
      </main>
    </div>
  );
}
