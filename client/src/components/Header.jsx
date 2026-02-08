import { useLocation, useNavigate } from 'react-router-dom'

const searchPlaceholders = {
  '/dashboard': 'Search files, folders, or people...',
  '/drive': 'Search in My Drive...',
  '/shared': 'Search files, folders, or people...',
  '/recent': 'Search recent files...',
  '/starred': 'Search starred items...',
  '/trash': 'Search deleted files...',
  '/settings': 'Search files, folders, or people...',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  const basePath = '/' + location.pathname.split('/')[1]
  const placeholder = searchPlaceholders[basePath] || 'Search files, folders, or people...'

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark z-10">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-surface-dark border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder={placeholder}
            type="text"
          />
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 ml-4">
        <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors">
          <span className="material-symbols-outlined text-[22px] leading-none">notifications</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[22px] leading-none">settings</span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-border-dark mx-1"></div>
        <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors">
          <div
            className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-600 flex items-center justify-center text-white text-xs font-bold"
          >
            AD
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-white hidden sm:block">Alex D.</span>
          <span className="material-symbols-outlined text-slate-400 text-lg leading-none">expand_more</span>
        </button>
      </div>
    </header>
  )
}
