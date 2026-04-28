import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const LANG_META = {
  JavaScript:       { color: 'bg-yellow-400',   text: 'text-yellow-400',   glow: 'shadow-yellow-500/20',  bar: '#facc15' },
  TypeScript:       { color: 'bg-blue-500',      text: 'text-blue-400',     glow: 'shadow-blue-500/20',    bar: '#3b82f6' },
  Python:           { color: 'bg-blue-400',       text: 'text-blue-300',     glow: 'shadow-blue-400/20',    bar: '#60a5fa' },
  Java:             { color: 'bg-orange-500',     text: 'text-orange-400',   glow: 'shadow-orange-500/20',  bar: '#f97316' },
  'C++':            { color: 'bg-pink-500',       text: 'text-pink-400',     glow: 'shadow-pink-500/20',    bar: '#ec4899' },
  'C#':             { color: 'bg-purple-500',     text: 'text-purple-400',   glow: 'shadow-purple-500/20',  bar: '#a855f7' },
  Go:               { color: 'bg-cyan-400',       text: 'text-cyan-400',     glow: 'shadow-cyan-400/20',    bar: '#22d3ee' },
  Rust:             { color: 'bg-orange-600',     text: 'text-orange-400',   glow: 'shadow-orange-600/20',  bar: '#ea580c' },
  PHP:              { color: 'bg-indigo-400',     text: 'text-indigo-400',   glow: 'shadow-indigo-400/20',  bar: '#818cf8' },
  Ruby:             { color: 'bg-red-500',        text: 'text-red-400',      glow: 'shadow-red-500/20',     bar: '#ef4444' },
  Swift:            { color: 'bg-orange-400',     text: 'text-orange-300',   glow: 'shadow-orange-400/20',  bar: '#fb923c' },
  Kotlin:           { color: 'bg-purple-400',     text: 'text-purple-300',   glow: 'shadow-purple-400/20',  bar: '#c084fc' },
  HTML:             { color: 'bg-orange-400',     text: 'text-orange-400',   glow: 'shadow-orange-400/20',  bar: '#fb923c' },
  CSS:              { color: 'bg-blue-300',       text: 'text-blue-300',     glow: 'shadow-blue-300/20',    bar: '#93c5fd' },
  Shell:            { color: 'bg-green-500',      text: 'text-green-400',    glow: 'shadow-green-500/20',   bar: '#22c55e' },
  Vue:              { color: 'bg-emerald-500',    text: 'text-emerald-400',  glow: 'shadow-emerald-500/20', bar: '#10b981' },
  Dart:             { color: 'bg-cyan-500',       text: 'text-cyan-400',     glow: 'shadow-cyan-500/20',    bar: '#06b6d4' },
  'Jupyter Notebook': { color: 'bg-orange-400',  text: 'text-orange-400',   glow: 'shadow-orange-400/20',  bar: '#fb923c' },
  R:                { color: 'bg-blue-600',       text: 'text-blue-400',     glow: 'shadow-blue-600/20',    bar: '#2563eb' },
}
const DEFAULT_LANG = { color: 'bg-slate-400', text: 'text-slate-400', glow: 'shadow-slate-400/10', bar: '#94a3b8' }

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'aujourd\'hui'
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months}mois`
  return `il y a ${Math.floor(months / 12)}an`
}

function isRecent(dateStr) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < 7 * 86400000
}

function RepoCard({ repo }) {
  const lang = LANG_META[repo.language] || DEFAULT_LANG
  const recent = isRecent(repo.updated_at)

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col rounded-2xl overflow-hidden border border-white/5 dark:border-white/5 bg-[#161b22] hover:bg-[#1c2330] hover:shadow-2xl ${lang.glow} hover:-translate-y-1 transition-all duration-200 cursor-pointer`}
    >
      {/* Language accent bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: lang.bar }} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/20 transition-colors">
              {repo.fork ? (
                <span className="material-symbols-outlined text-[18px] text-slate-400">fork_right</span>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-400">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                {repo.name}
              </p>
              {repo.fork && (
                <p className="text-[10px] text-slate-500 mt-0.5">forked</p>
              )}
            </div>
          </div>

          <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
            repo.private
              ? 'text-slate-400 bg-white/5 border border-white/10'
              : 'text-slate-500 bg-white/5 border border-white/5'
          }`}>
            {repo.private && (
              <span className="material-symbols-outlined text-[9px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            )}
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1 min-h-[2.5rem]">
          {repo.description || <span className="italic text-slate-600">Aucune description</span>}
        </p>

        {/* Topics */}
        {repo.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 3).map(t => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-blue-400 bg-blue-500/10 border border-blue-500/20"
              >
                {t}
              </span>
            ))}
            {repo.topics.length > 3 && (
              <span className="text-[10px] text-slate-600">+{repo.topics.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/5 flex-wrap">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${lang.color} ring-2 ring-white/10`} />
              <span className={`text-xs font-medium ${lang.text}`}>{repo.language}</span>
            </div>
          )}

          {repo.stargazers_count > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <span className="material-symbols-outlined text-[13px] text-yellow-500/70" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xs">{repo.stargazers_count.toLocaleString()}</span>
            </div>
          )}

          {repo.forks_count > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <span className="material-symbols-outlined text-[13px]">fork_right</span>
              <span className="text-xs">{repo.forks_count.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {recent && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Mis à jour récemment" />
            )}
            <span className="text-[11px] text-slate-600">{relativeTime(repo.updated_at)}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

function NotConnected({ onConnect, loading }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-[#0d1117] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/40">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white/80">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connecter GitHub</h3>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Reliez votre compte GitHub pour parcourir tous vos dépôts — publics et privés — directement depuis CloudSpace.
        </p>
        <button
          onClick={onConnect}
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-white bg-[#0d1117] border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-2xl transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          )}
          Connecter avec GitHub
        </button>
      </div>
    </div>
  )
}

export default function GitHub() {
  const location = useLocation()
  const [status, setStatus] = useState(null)
  const [repos, setRepos] = useState([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/github/status')
      const data = await res.json()
      setStatus(data)
      if (data.connected) fetchRepos()
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }

  const fetchRepos = async () => {
    setLoadingRepos(true)
    setError(null)
    try {
      const res = await apiFetch('/api/github/repos')
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setRepos(data.repos || [])
    } catch {
      setError('Failed to load repositories')
    } finally {
      setLoadingRepos(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('connected') === 'true') window.history.replaceState({}, '', '/github')
    if (params.get('error')) {
      setError('GitHub connection failed. Please try again.')
      window.history.replaceState({}, '', '/github')
    }
    fetchStatus()
  }, [])

  const handleConnect = async () => {
    setConnectLoading(true)
    try {
      const res = await apiFetch('/api/github/auth-url')
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      window.location.href = data.url
    } catch {
      setError('Failed to initiate GitHub connection')
      setConnectLoading(false)
    }
  }

  const handleDisconnect = async () => {
    await apiFetch('/api/github/disconnect', { method: 'DELETE' })
    setStatus({ connected: false })
    setRepos([])
  }

  const languages = useMemo(() => (
    [...new Set(repos.map(r => r.language).filter(Boolean))].sort()
  ), [repos])

  const filtered = useMemo(() => {
    let list = [...repos]
    if (typeFilter === 'public') list = list.filter(r => !r.private)
    if (typeFilter === 'private') list = list.filter(r => r.private)
    if (typeFilter === 'forks') list = list.filter(r => r.fork)
    if (langFilter !== 'all') list = list.filter(r => r.language === langFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.topics?.some(t => t.includes(q))
      )
    }
    if (sortBy === 'stars') list.sort((a, b) => b.stargazers_count - a.stargazers_count)
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return list
  }, [repos, search, langFilter, sortBy, typeFilter])

  const stats = useMemo(() => ({
    total: repos.length,
    public: repos.filter(r => !r.private).length,
    private: repos.filter(r => r.private).length,
    forks: repos.filter(r => r.fork).length,
  }), [repos])

  if (loadingStatus) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">GitHub</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Parcourez et gérez vos dépôts</p>
          </div>
        </div>
        {error && (
          <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[16px]">error</span>{error}
          </div>
        )}
        <NotConnected onConnect={handleConnect} loading={connectLoading} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">GitHub</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Parcourez et gérez vos dépôts</p>
          </div>
          <div className="flex items-center gap-3">
            {status.avatar_url && (
              <img src={status.avatar_url} alt={status.username} className="w-9 h-9 rounded-full ring-2 ring-white/20" />
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">@{status.username}</p>
              {status.name && <p className="text-xs text-slate-500 dark:text-slate-400">{status.name}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[16px]">error</span>{error}
          </div>
        )}

        {/* Stats pills */}
        {repos.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {[
              { label: 'Dépôts', value: stats.total, filter: 'all' },
              { label: 'Publics', value: stats.public, filter: 'public' },
              { label: 'Privés', value: stats.private, filter: 'private' },
              { label: 'Forks', value: stats.forks, filter: 'forks' },
            ].map(s => (
              <button
                key={s.filter}
                onClick={() => setTypeFilter(s.filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  typeFilter === s.filter
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-border-dark border border-transparent'
                }`}
              >
                <span className="font-bold">{s.value}</span> {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-slate-400">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un dépôt…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
            />
          </div>
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">Tous les langages</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="updated">Dernière activité</option>
            <option value="stars">Plus d'étoiles</option>
            <option value="name">Nom A→Z</option>
          </select>
          <button
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-200 border border-slate-200 dark:border-border-dark rounded-xl hover:bg-slate-50 dark:hover:bg-border-dark transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <span className={`material-symbols-outlined text-[18px] leading-none ${loadingRepos ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        {/* Repo grid */}
        {loadingRepos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-surface-dark animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 opacity-40">folder_off</span>
            <p className="text-sm">{repos.length === 0 ? 'Aucun dépôt trouvé' : 'Aucun résultat'}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              {filtered.length} {filtered.length === 1 ? 'dépôt' : 'dépôts'}
              {filtered.length !== repos.length && ` (filtré sur ${repos.length})`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(repo => <RepoCard key={repo.id} repo={repo} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
