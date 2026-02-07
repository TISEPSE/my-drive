import { useState, useCallback, useRef, useEffect } from 'react'
import FileContextMenu from '../components/FileContextMenu'

const folders = [
  { name: 'Marketing Assets', items: 24, icon: 'folder', iconColor: 'text-yellow-500' },
  { name: 'Product Design', items: 156, icon: 'folder', iconColor: 'text-yellow-500' },
  { name: 'Financials 2024', items: 8, icon: 'folder', iconColor: 'text-yellow-500' },
  { name: 'Personal', items: 42, icon: 'folder', iconColor: 'text-yellow-500' },
  { name: 'Confidential', items: 3, icon: 'folder_shared', iconColor: 'text-indigo-500', locked: true },
  { name: 'Clients', items: 12, icon: 'folder', iconColor: 'text-yellow-500' },
]

const files = [
  { name: 'Logo_V2.fig', size: '2.4 MB', date: 'Today', icon: 'image', iconColor: 'text-indigo-500', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  { name: 'Q3_Report.pdf', size: '4.8 MB', date: 'Yesterday', icon: 'picture_as_pdf', iconColor: 'text-red-500', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-red-50 dark:bg-red-500/10' },
  { name: 'Budget_2024.xlsx', size: '1.2 MB', date: 'Oct 20', icon: 'table_chart', iconColor: 'text-green-500', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-green-50 dark:bg-green-500/10' },
  { name: 'Project_Brief.docx', size: '850 KB', date: 'Oct 18', icon: 'description', iconColor: 'text-blue-500', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-blue-50 dark:bg-blue-500/10' },
  { name: 'Q4_Strategy.pptx', size: '12.5 MB', date: 'Oct 15', icon: 'slideshow', iconColor: 'text-orange-400', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-orange-50 dark:bg-orange-500/10' },
  { name: 'Demo_Recording.mp4', size: '128 MB', date: 'Oct 12', icon: 'movie', iconColor: 'text-purple-500', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-purple-50 dark:bg-purple-500/10' },
  { name: 'config.json', size: '4 KB', date: 'Oct 10', icon: 'code', iconColor: 'text-teal-400', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-teal-50 dark:bg-teal-500/10' },
  { name: 'Archive_2023.zip', size: '450 MB', date: 'Sep 28', icon: 'folder_zip', iconColor: 'text-gray-400', iconBg: 'bg-slate-50 dark:bg-[#151e26]', typeBg: 'bg-gray-50 dark:bg-gray-500/10' },
]

const fileTypeIcons = {
  'image/': { icon: 'image', color: 'text-indigo-400' },
  'video/': { icon: 'movie', color: 'text-purple-400' },
  'audio/': { icon: 'music_note', color: 'text-pink-400' },
  'application/pdf': { icon: 'picture_as_pdf', color: 'text-red-400' },
  'application/zip': { icon: 'folder_zip', color: 'text-gray-400' },
  'text/': { icon: 'description', color: 'text-blue-400' },
  'default': { icon: 'draft', color: 'text-slate-400' },
}

function getFileIcon(type) {
  if (!type) return fileTypeIcons['default']
  for (const [key, value] of Object.entries(fileTypeIcons)) {
    if (key !== 'default' && type.startsWith(key)) return value
  }
  return fileTypeIcons['default']
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export default function MyDrive() {
  const [view, setView] = useState('grid')
  const [isDragging, setIsDragging] = useState(false)
  const [dragFileCount, setDragFileCount] = useState(0)
  const [uploadQueue, setUploadQueue] = useState([])
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const dragCounterRef = useRef(0)
  const dropZoneRef = useRef(null)

  // Simulate upload progress
  useEffect(() => {
    if (uploadQueue.length === 0) return
    const hasActive = uploadQueue.some(f => f.status === 'uploading' || f.status === 'pending')
    if (!hasActive) return

    const interval = setInterval(() => {
      setUploadQueue(prev => {
        let changed = false
        const next = prev.map(f => {
          if (f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 15 + 5, 100)
            changed = true
            if (newProgress >= 100) {
              return { ...f, progress: 100, status: 'done' }
            }
            return { ...f, progress: newProgress }
          }
          if (f.status === 'pending') {
            const anyUploading = prev.some(x => x.status === 'uploading')
            if (!anyUploading) {
              changed = true
              return { ...f, status: 'uploading', progress: Math.random() * 10 }
            }
          }
          return f
        })
        return changed ? next : prev
      })
    }, 200)

    return () => clearInterval(interval)
  }, [uploadQueue])

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

    const newUploads = droppedFiles.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: i === 0 ? 'uploading' : 'pending',
    }))

    setUploadQueue(prev => [...newUploads, ...prev])
    setShowUploadPanel(true)
  }, [])

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(f => f.status !== 'done'))
  }

  const dismissUploadPanel = () => {
    setShowUploadPanel(false)
    setTimeout(() => setUploadQueue([]), 300)
  }

  const completedCount = uploadQueue.filter(f => f.status === 'done').length
  const totalCount = uploadQueue.length
  const allDone = totalCount > 0 && completedCount === totalCount

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

      {/* Upload Progress Panel */}
      <div
        className={`fixed bottom-6 right-6 z-40 w-[380px] transition-all duration-300 ease-out ${
          showUploadPanel && uploadQueue.length > 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#1A2633] border border-[#283039] rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#283039]">
            <div className="flex items-center gap-2.5">
              {allDone ? (
                <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-green-400">check_circle</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-primary animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              <span className="text-sm font-semibold text-white">
                {allDone
                  ? `${completedCount} upload${completedCount > 1 ? 's' : ''} complete`
                  : `Uploading ${completedCount}/${totalCount}`
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              {completedCount > 0 && !allDone && (
                <button
                  onClick={clearCompleted}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
                  title="Clear completed"
                >
                  <span className="material-symbols-outlined text-[18px]">playlist_remove</span>
                </button>
              )}
              <button
                onClick={dismissUploadPanel}
                className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Overall progress bar */}
          {!allDone && totalCount > 0 && (
            <div className="h-[2px] bg-[#283039]">
              <div
                className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}

          {/* File list */}
          <div className="max-h-[240px] overflow-y-auto">
            {uploadQueue.map((file) => {
              const typeInfo = getFileIcon(file.type)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#283039]/50 last:border-b-0"
                >
                  {/* File type icon */}
                  <div className="w-8 h-8 rounded-lg bg-[#151e26] flex items-center justify-center flex-shrink-0">
                    <span className={`material-symbols-outlined text-lg ${typeInfo.color}`}>{typeInfo.icon}</span>
                  </div>

                  {/* File info + progress */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {file.status === 'uploading' && (
                        <>
                          <div className="flex-1 h-1 bg-[#283039] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-200"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 tabular-nums w-7 text-right">
                            {Math.round(file.progress)}%
                          </span>
                        </>
                      )}
                      {file.status === 'pending' && (
                        <span className="text-[10px] text-slate-500">Waiting...</span>
                      )}
                      {file.status === 'done' && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-green-400">check</span>
                          <span className="text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Panel footer - when all done */}
          {allDone && (
            <div className="px-4 py-2.5 border-t border-[#283039] bg-green-500/5">
              <p className="text-xs text-green-400/80 text-center">
                All files uploaded to My Drive
              </p>
            </div>
          )}
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
            <div key={folder.name} className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors shadow-sm group">
              <div className="relative">
                <span className={`material-symbols-outlined text-2xl ${folder.iconColor} mr-3`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                {folder.locked && (
                  <div className="absolute -top-1 right-0 bg-white dark:bg-background-dark rounded-full">
                    <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{folder.items} items</p>
              </div>
              <FileContextMenu className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}

          {/* Create New Folder */}
          <div className="flex items-center p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary group">
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
              <div key={file.name} className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div className={`aspect-[4/3] ${file.iconBg} rounded-md mb-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-border-dark`}>
                  <span className={`material-symbols-outlined text-3xl ${file.iconColor} opacity-80 group-hover:scale-110 transition-transform duration-300`}>{file.icon}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{file.size} &bull; {file.date}</p>
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
                  <tr key={folder.name} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <span className={`material-symbols-outlined text-2xl ${folder.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                          {folder.locked && (
                            <div className="absolute -top-1 -right-1 bg-white dark:bg-surface-dark rounded-full">
                              <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{folder.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{folder.items} items</p>
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
                  <tr key={file.name} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${file.typeBg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`material-symbols-outlined text-lg ${file.iconColor}`}>{file.icon}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{file.date}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{file.size}</span>
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
    </div>
  )
}
