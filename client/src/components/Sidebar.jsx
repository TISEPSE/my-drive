import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useUpload } from '../contexts/UploadContext'
import { apiFetch } from '../lib/api'
import { useLocalPref } from '../hooks/useLocalPref'

const navItems = [
  { path: '/dashboard', icon: 'dashboard',     label: 'Tableau de bord' },
  { path: '/gallery',   icon: 'photo_library', label: 'Galerie' },
  { path: '/github',    icon: 'github',         label: 'GitHub' },
  { path: '/shared',    icon: 'group',          label: 'Partagés avec moi' },
  { path: '/recent',    icon: 'schedule',       label: 'Récents' },
  { path: '/starred',   icon: 'star',           label: 'Favoris' },
  { path: '/history',   icon: 'history',        label: 'Historique' },
  { path: '/trash',     icon: 'delete',         label: 'Corbeille' },
]

const GITHUB_SVG = (collapsed) => (
  <svg viewBox="0 0 24 24" className={`flex-shrink-0 fill-current ${collapsed ? 'w-5 h-5' : 'w-5 h-5'}`}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

function FolderNode({ folder, depth = 0, collapsed }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  if (collapsed) return null

  const handleToggle = async (e) => {
    e.stopPropagation()
    if (!open && !loaded) {
      try {
        const res = await apiFetch(`/api/drive/contents?parent_id=${folder.id}`)
        const data = await res.json()
        setChildren(data.folders || [])
      } catch (_) {}
      setLoaded(true)
    }
    setOpen(o => !o)
  }

  return (
    <div>
      <div
        className="flex items-center rounded-md text-[12px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-border-dark transition-colors"
        style={{ paddingLeft: `${depth * 10}px` }}
      >
        <button onClick={handleToggle} className="w-5 h-6 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <span className={`material-symbols-outlined text-[13px] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}>chevron_right</span>
        </button>
        <button onClick={() => navigate(`/drive/folder/${folder.id}`)} className="flex items-center gap-1.5 flex-1 py-0.5 pr-1.5 text-left truncate">
          <span className="material-symbols-outlined text-[15px] text-amber-500 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
          <span className="truncate">{folder.name}</span>
        </button>
      </div>
      {open && children.map(child => <FolderNode key={child.id} folder={child} depth={depth + 1} collapsed={false} />)}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { uploadFiles } = useUpload()
  const [storage, setStorage] = useState({ percentage: 0, formatted_used: '0 B', formatted_limit: '20 GB' })
  const [driveOpen, setDriveOpen] = useState(false)
  const [topFolders, setTopFolders] = useState([])
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [hoverExpand] = useLocalPref('cloudspace_sidebar_hover', false)
  const [isHovered, setIsHovered] = useState(false)

  const collapsed = hoverExpand && !isHovered

  useEffect(() => {
    apiFetch('/api/user/storage').then(r => r.json()).then(data => setStorage({
      percentage: data.percentage,
      formatted_used: data.formatted_used,
      formatted_limit: data.formatted_limit,
    })).catch(() => {})
  }, [])

  const handleFileSelected = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) uploadFiles(files)
    e.target.value = ''
  }

  const handleDriveToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!collapsed) {
      if (!driveOpen && !foldersLoaded) {
        try {
          const res = await apiFetch('/api/drive/contents')
          const data = await res.json()
          setTopFolders(data.folders || [])
        } catch (_) {}
        setFoldersLoaded(true)
      }
      setDriveOpen(o => !o)
    }
  }

  const isDriveActive = location.pathname === '/drive' || location.pathname.startsWith('/drive/')

  return (
    <aside
      onMouseEnter={() => hoverExpand && setIsHovered(true)}
      onMouseLeave={() => hoverExpand && setIsHovered(false)}
      className={`
        flex-shrink-0 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark
        flex flex-col z-20 overflow-hidden
        transition-[width] duration-200 ease-in-out
        ${collapsed ? 'w-[56px]' : 'w-60'}
        ${hoverExpand && isHovered ? 'shadow-xl shadow-black/10 dark:shadow-black/30' : ''}
      `}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3.5 border-b border-slate-200 dark:border-border-dark flex-shrink-0">
        <div className="flex items-center gap-2.5 text-primary overflow-hidden">
          <span className="material-symbols-outlined text-xl flex-shrink-0">cloud_circle</span>
          <h1 className={`text-slate-900 dark:text-white text-[13px] font-bold tracking-tight whitespace-nowrap transition-opacity duration-150 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            CloudSpace
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-0.5" style={{ padding: collapsed ? '16px 6px' : '16px 10px' }}>
        {/* Upload button */}
        <div className="mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            title={collapsed ? 'Importer' : undefined}
            className={`w-full flex items-center justify-center gap-1 bg-primary hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-sm ${collapsed ? 'px-0' : 'px-3'}`}
          >
            <span className="material-symbols-outlined text-[18px] leading-none flex-shrink-0">add</span>
            {!collapsed && <span>Importer</span>}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelected} />
        </div>

        <div className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 mt-1 whitespace-nowrap">
              Stockage
            </p>
          )}

          {/* Mon Drive */}
          <div>
            <div
              className={`flex items-center rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'} ${
                isDriveActive
                  ? 'bg-slate-100 dark:bg-surface-dark text-primary dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-border-dark'
              }`}
              onClick={() => navigate('/drive')}
              title={collapsed ? 'Mon Drive' : undefined}
            >
              <span className={`material-symbols-outlined flex-shrink-0 ${isDriveActive ? 'fill-current' : ''}`}>folder</span>
              {!collapsed && <span className="whitespace-nowrap">Mon Drive</span>}
            </div>
            {!collapsed && driveOpen && (
              <div className="mt-0.5 ml-3 pl-1.5 border-l border-slate-200 dark:border-border-dark">
                {topFolders.length === 0
                  ? <p className="text-[11px] text-slate-400 dark:text-slate-500 py-1 px-2">Aucun dossier</p>
                  : topFolders.map(f => <FolderNode key={f.id} folder={f} depth={0} collapsed={false} />)
                }
              </div>
            )}
          </div>

          {/* Nav items */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg text-[13px] font-medium transition-colors ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'} ${
                  isActive
                    ? 'bg-slate-100 dark:bg-surface-dark text-primary dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-border-dark'
                }`}
              >
                {item.icon === 'github'
                  ? GITHUB_SVG(collapsed)
                  : <span className={`material-symbols-outlined flex-shrink-0 ${isActive ? 'fill-current' : ''} ${item.path === '/starred' && isActive ? 'text-amber-500' : ''}`}>{item.icon}</span>
                }
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Storage bar */}
      <div className={`border-t border-slate-200 dark:border-border-dark transition-all duration-200 ${collapsed ? 'p-3 flex justify-center' : 'p-3.5'}`}>
        {collapsed ? (
          <span className="material-symbols-outlined text-[18px] text-slate-400" title={`${storage.formatted_used} / ${storage.formatted_limit}`}>cloud</span>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Stockage</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{storage.percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-border-dark rounded-full h-1.5 mb-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${storage.percentage}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">{storage.formatted_used} sur {storage.formatted_limit}</p>
            <button className="mt-2.5 w-full py-1.5 text-[11px] font-medium text-primary border border-primary/30 rounded hover:bg-primary/5 transition-colors">
              Améliorer le plan
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
