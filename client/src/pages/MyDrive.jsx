import { useState, useCallback, useRef, useEffect } from 'react'
import FileContextMenu from '../components/FileContextMenu'
import { useUpload } from '../contexts/UploadContext'

function CreateFolderModal({ open, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onConfirm(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xl shadow-black/20 w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-primary">create_new_folder</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Folder</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-[20px] text-slate-400">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Folder name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Folder"
            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-border-dark rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MyDrive() {
  const [view, setView] = useState('grid')
  const [isDragging, setIsDragging] = useState(false)
  const [dragFileCount, setDragFileCount] = useState(0)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const dragCounterRef = useRef(0)
  const dropZoneRef = useRef(null)
  const { uploadFiles, queue } = useUpload()

  const fetchContents = useCallback(async () => {
    try {
      const res = await fetch('/api/drive/contents')
      const data = await res.json()
      setFolders(data.folders || [])
      setFiles(data.files || [])
    } catch (err) {
      console.error('Failed to fetch drive contents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  // Refresh drive when uploads complete
  const prevDoneCount = useRef(0)
  useEffect(() => {
    const doneCount = queue.filter(f => f.status === 'done').length
    if (doneCount > prevDoneCount.current && doneCount > 0) {
      fetchContents()
    }
    prevDoneCount.current = doneCount
  }, [queue, fetchContents])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
      setDragFileCount(e.dataTransfer.items.length)
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
      setDragFileCount(0)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragFileCount(0)
    dragCounterRef.current = 0

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return
    uploadFiles(droppedFiles)
  }, [uploadFiles])

  const handleCreateFolder = async (name) => {
    setShowCreateFolder(false)
    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id: null }),
      })
      if (res.ok) {
        fetchContents()
      }
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={dropZoneRef}
      className="flex-1 overflow-y-auto p-6 md:p-8 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop Zone Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 pointer-events-none ${
          isDragging ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: isDragging ? 'auto' : 'none' }}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-[#101922]/80 backdrop-blur-sm transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`} />

        {/* Drop zone card */}
        <div className={`relative z-10 transition-all duration-300 ease-out ${isDragging ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="relative">
            {/* Animated border ring */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-blue-400 to-cyan-400 opacity-80 animate-pulse" />

            <div className="relative bg-[#1A2633] rounded-2xl p-12 min-w-[420px] border border-primary/20">
              {/* Floating particles */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }} />
                <div className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-cyan-400/40 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.2s' }} />
                <div className="absolute bottom-10 left-16 w-1 h-1 rounded-full bg-blue-300/40 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }} />
                <div className="absolute bottom-16 right-8 w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '2.4s' }} />
              </div>

              <div className="flex flex-col items-center text-center relative z-10">
                {/* Upload icon with glow */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
                  <div className="relative w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary animate-bounce" style={{ animationDuration: '1.5s' }}>
                      cloud_upload
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1.5">
                  Drop to upload
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  Files will be added to <span className="text-primary font-medium">My Drive</span>
                </p>

                {dragFileCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <span className="material-symbols-outlined text-sm text-primary">draft</span>
                    <span className="text-xs font-medium text-primary">
                      {dragFileCount} {dragFileCount === 1 ? 'file' : 'files'} selected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-6">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <a className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" href="#">
                <span className="material-symbols-outlined text-xl mr-1.5">cloud</span>
                CloudSpace
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 text-xl mx-1">chevron_right</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">My Drive</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'grid' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
              List
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {/* Folders - only in grid view */}
      {view === 'grid' && <section className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Folders</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors shadow-sm group">
              <div className="relative mr-3 flex-shrink-0">
                <span className={`material-symbols-outlined text-2xl ${folder.icon_color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                {folder.is_locked && (
                  <span className="absolute -bottom-0.5 -right-1 material-symbols-outlined text-[10px] text-slate-400 dark:text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{folder.items_count} items</p>
              </div>
              <FileContextMenu className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}

          {/* Create New Folder */}
          <div
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center mr-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
              <span className="material-symbols-outlined text-xl">add</span>
            </div>
            <span className="text-sm font-medium">Create New Folder</span>
          </div>
        </div>
      </section>}

      {/* Files */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          {view === 'grid' ? 'Files' : 'All items'}
        </h3>

        {view === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((file) => (
              <div key={file.id} className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div className={`aspect-[4/3] ${file.icon_bg} rounded-md mb-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-border-dark`}>
                  <span className={`material-symbols-outlined text-3xl ${file.icon_color} opacity-80 group-hover:scale-110 transition-transform duration-300`}>{file.icon}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{file.formatted_size} &bull; {file.formatted_date}</p>
                  </div>
                  <FileContextMenu className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">more_vert</span>
                  </FileContextMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[40%]">Name</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%] hidden md:table-cell">Last Modified</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%] hidden sm:table-cell">Size</th>
                  <th className="px-5 py-3 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                {/* Folder rows */}
                {folders.map((folder) => (
                  <tr key={folder.id} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <span className={`material-symbols-outlined text-2xl ${folder.icon_color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                          {folder.is_locked && (
                            <span className="absolute -bottom-0.5 -right-1 material-symbols-outlined text-[10px] text-slate-400 dark:text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{folder.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{folder.items_count} items</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">-</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">-</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <FileContextMenu className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
                {/* File rows */}
                {files.map((file) => (
                  <tr key={file.id} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${file.icon_bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`material-symbols-outlined text-lg ${file.icon_color}`}>{file.icon}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{file.formatted_date}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{file.formatted_size}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <FileContextMenu className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={handleCreateFolder}
      />
    </div>
  )
}
