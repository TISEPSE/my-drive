import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const LANG_COLORS = {
  JavaScript: 'bg-yellow-400', TypeScript: 'bg-blue-500', Python: 'bg-blue-400',
  Java: 'bg-orange-500', 'C++': 'bg-pink-500', 'C#': 'bg-purple-500',
  Go: 'bg-cyan-400', Rust: 'bg-orange-600', PHP: 'bg-indigo-400',
  Ruby: 'bg-red-500', Swift: 'bg-orange-400', Kotlin: 'bg-purple-400',
  HTML: 'bg-orange-400', CSS: 'bg-blue-300', Shell: 'bg-green-500',
  Vue: 'bg-emerald-500', Dart: 'bg-cyan-500', Scala: 'bg-red-600',
  'Jupyter Notebook': 'bg-orange-400', R: 'bg-blue-600', Lua: 'bg-blue-700',
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function RepoCard({ repo }) {
  const langColor = LANG_COLORS[repo.language] || 'bg-slate-400'

  return (
    <div className="group flex flex-col gap-3 p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl hover:border-primary/40 dark:hover:border-primary/40 hover:shadow-md transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-slate-400 flex-shrink-0">
            {repo.fork ? 'fork_right' : 'folder_code'}
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            {repo.name}
          </span>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          repo.private
            ? 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10'
            : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-border-dark'
        }`}>
          {repo.private ? 'Private' : 'Public'}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1">
        {repo.description || <span className="italic">No description</span>}
      </p>

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 4).map(t => (
            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {t}
            </span>
          ))}
          {repo.topics.length > 4 && (
            <span className="text-[10px] text-slate-400">+{repo.topics.length - 4}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4">
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${langColor}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{repo.language}</span>
          </div>
        )}
        {repo.stargazers_count > 0 && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">star</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{repo.stargazers_count.toLocaleString()}</span>
          </div>
        )}
        {repo.forks_count > 0 && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400">fork_right</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{repo.forks_count.toLocaleString()}</span>
          </div>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0">
          {relativeTime(repo.updated_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-border-dark">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">open_in_new</span>
            Website
          </a>
        )}
      </div>
    </div>
  )
}

function NotConnected({ onConnect, loading }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-slate-700 dark:fill-slate-200">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Connect your GitHub account
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Link your GitHub account to browse all your repositories — public and private — directly from CloudSpace.
        </p>
        <button
          onClick={onConnect}
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
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
          Connect with GitHub
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
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/github')
    }
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

  const languages = useMemo(() => {
    const langs = [...new Set(repos.map(r => r.language).filter(Boolean))].sort()
    return langs
  }, [repos])

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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Browse and manage your repositories</p>
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
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">GitHub</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Browse and manage your repositories</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status.avatar_url && (
              <img src={status.avatar_url} alt={status.username} className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-border-dark" />
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">@{status.username}</p>
              {status.name && <p className="text-xs text-slate-500 dark:text-slate-400">{status.name}</p>}
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-border-dark hover:border-red-300 dark:hover:border-red-500/40 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">link_off</span>
              Disconnect
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[16px]">error</span>{error}
          </div>
        )}

        {/* Stats row */}
        {repos.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {[
              { label: 'Repos', value: stats.total, filter: 'all' },
              { label: 'Public', value: stats.public, filter: 'public' },
              { label: 'Private', value: stats.private, filter: 'private' },
              { label: 'Forks', value: stats.forks, filter: 'forks' },
            ].map(s => (
              <button
                key={s.filter}
                onClick={() => setTypeFilter(s.filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === s.filter
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-border-dark'
                }`}
              >
                <span className="font-bold">{s.value}</span> {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-slate-400">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search repositories…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All languages</option>
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="updated">Last updated</option>
            <option value="stars">Most stars</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <span className={`material-symbols-outlined text-[18px] leading-none ${loadingRepos ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        {/* Repos grid */}
        {loadingRepos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-100 dark:bg-surface-dark animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3">folder_off</span>
            <p className="text-sm">{repos.length === 0 ? 'No repositories found' : 'No results match your filters'}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              {filtered.length} {filtered.length === 1 ? 'repository' : 'repositories'}
              {filtered.length !== repos.length && ` (filtered from ${repos.length})`}
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
