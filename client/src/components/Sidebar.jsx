import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useUpload } from '../contexts/UploadContext'

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/drive', icon: 'folder', label: 'My Drive' },
  { path: '/shared', icon: 'group', label: 'Shared with me' },
  { path: '/recent', icon: 'schedule', label: 'Recent' },
  { path: '/starred', icon: 'star', label: 'Starred' },
  { path: '/gallery', icon: 'photo_library', label: 'Gallery' },
  { path: '/history', icon: 'history', label: 'History' },
  { path: '/trash', icon: 'delete', label: 'Trash' },
]

export default function Sidebar() {
  const location = useLocation()
  const fileInputRef = useRef(null)
  const { uploadFiles } = useUpload()
  const [storage, setStorage] = useState({ percentage: 75, formatted_used: '15 GB', formatted_limit: '20 GB' })

  useEffect(() => {
    fetch('/api/user/storage')
      .then(r => r.json())
      .then(data => setStorage({
        percentage: data.percentage,
        formatted_used: data.formatted_used,
        formatted_limit: data.formatted_limit,
      }))
      .catch(() => {})
  }, [])

  const handleFileSelected = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) uploadFiles(files)
    e.target.value = ''
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark flex flex-col z-20">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-200 dark:border-border-dark">
        <div className="flex items-center gap-2.5 text-primary">
          <span className="material-symbols-outlined text-2xl">cloud_circle</span>
          <h1 className="text-slate-900 dark:text-white text-base font-bold tracking-tight">CloudSpace</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col gap-0.5">
        {/* New Upload Button */}
        <div className="mb-4 px-0.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="px-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 mt-1">Storage</p>
          {navItems.map((item) => {
            const isActive = item.path === '/drive'
              ? location.pathname === '/drive' || location.pathname.startsWith('/drive/')
              : location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-surface-dark text-primary dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-border-dark'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-current' : ''} ${item.path === '/starred' && isActive ? 'text-amber-500' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Storage Status */}
      <div className="p-3.5 border-t border-slate-200 dark:border-border-dark">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Storage</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{storage.percentage}% used</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-border-dark rounded-full h-1.5 mb-1.5">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${storage.percentage}%` }}></div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-500">{storage.formatted_used} of {storage.formatted_limit} used</p>
        <button className="mt-2.5 w-full py-1.5 text-[11px] font-medium text-primary border border-primary/30 rounded hover:bg-primary/5 transition-colors">
          Upgrade Plan
        </button>
      </div>
    </aside>
  )
}
