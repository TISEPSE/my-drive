import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import FileContextMenu from '../components/FileContextMenu'
import { useUpload } from '../contexts/UploadContext'
import { apiFetch, getAccessToken } from '../lib/api'

function FilePreviewModal({ file, onClose }) {
  const [textContent, setTextContent] = useState(null)
  const [textLoading, setTextLoading] = useState(false)

  useEffect(() => {
    if (!file) { setTextContent(null); return }
    const mime = file.mime_type || ''
    const isText = file.has_content && (mime === 'text/plain' || mime === 'text/csv' || mime === 'text/markdown')
    if (!isText) { setTextContent(null); return }

    setTextLoading(true)
    apiFetch(`/api/files/${file.id}/download?inline=true`)
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(t => setTextContent(t))
      .catch(() => setTextContent(null))
      .finally(() => setTextLoading(false))
  }, [file])

  if (!file) return null

  const token = getAccessToken()
  const downloadUrl = `/api/files/${file.id}/download?token=${token}`
  const inlineUrl = `/api/files/${file.id}/download?inline=true&token=${token}`
  const mime = file.mime_type || ''
  const canServe = file.has_content

  const isImage = canServe && mime.startsWith('image/')
  const isPdf = canServe && mime === 'application/pdf'
  const isVideo = canServe && mime.startsWith('video/')
  const isAudio = canServe && mime.startsWith('audio/')
  const isText = canServe && (mime === 'text/plain' || mime === 'text/csv' || mime === 'text/markdown')
  const canPreview = isImage || isPdf || isVideo || isAudio || isText

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 h-14 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${file.icon_bg} flex items-center justify-center flex-shrink-0`}>
            <span className={`material-symbols-outlined text-lg ${file.icon_color}`}>{file.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{file.formatted_size}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canServe && (
            <a
              href={downloadUrl}
              download
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Download"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-[1] flex-1 flex items-center justify-center px-5 pb-5 min-h-0" onClick={(e) => e.stopPropagation()}>
        {isImage && (
          <img src={inlineUrl} alt={file.name} className="max-w-full max-h-full rounded-lg object-contain" />
        )}
        {isPdf && (
          <iframe src={inlineUrl} title={file.name} className="w-[80vw] h-full rounded-lg bg-white" />
        )}
        {isVideo && (
          <video src={inlineUrl} controls autoPlay className="max-w-full max-h-full rounded-lg" />
        )}
        {isAudio && (
          <div className="bg-[#1A2633] rounded-2xl p-10 flex flex-col items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl ${file.icon_bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-4xl ${file.icon_color}`}>{file.icon}</span>
            </div>
            <p className="text-white font-medium">{file.name}</p>
            <audio src={inlineUrl} controls autoPlay className="w-80" />
          </div>
        )}
        {isText && (
          <div className="w-[80vw] h-[85vh] bg-[#1A2633] rounded-xl border border-[#283039] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#283039] flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-blue-400">description</span>
              <span className="text-xs text-slate-400 font-mono">{file.name}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {textLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </div>
              ) : (
                <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed">{textContent}</pre>
              )}
            </div>
          </div>
        )}
        {!canPreview && (
          <div className="bg-[#1A2633] rounded-2xl p-10 flex flex-col items-center gap-5 border border-slate-700">
            <div className={`w-20 h-20 rounded-2xl ${file.icon_bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-4xl ${file.icon_color}`}>{file.icon}</span>
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">{file.name}</p>
              <p className="text-sm text-slate-400">{file.formatted_size}</p>
            </div>
            {canServe ? (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Download
              </a>
            ) : (
              <p className="text-xs text-slate-500">No preview available (seed data)</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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

function ConfirmTrashModal({ file, onClose, onConfirm }) {
  if (!file) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xl shadow-black/20 w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-xl text-red-500">delete</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Move to Trash?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{file.name}</span> will be moved to the trash. You can restore it within 30 days.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-border-dark rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyDrive() {
  const navigate = useNavigate()
  const { folderId } = useParams()
  const [view, setView] = useState(() => localStorage.getItem('cloudspace-view-mode') || 'grid')
  const [isDragging, setIsDragging] = useState(false)
  const [dragFileCount, setDragFileCount] = useState(0)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }])
  const [ready, setReady] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [trashTarget, setTrashTarget] = useState(null)
  const dragCounterRef = useRef(0)
  const dropZoneRef = useRef(null)
  const fileInputRef = useRef(null)
  const { uploadFiles, queue } = useUpload()

  const fetchContents = useCallback(async () => {
    try {
      const url = folderId ? `/api/drive/contents?parent_id=${folderId}` : '/api/drive/contents'
      const res = await apiFetch(url)
      const data = await res.json()
      setFolders(data.folders || [])
      setFiles(data.files || [])
      setBreadcrumbs(data.breadcrumbs || [{ id: null, name: 'My Drive' }])
    } catch (err) {
      console.error('Failed to fetch drive contents:', err)
    } finally {
      setReady(true)
    }
  }, [folderId])

  // Show skeleton only if loading takes more than 150ms (avoids flash)
  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => setShowSkeleton(true), 150)
    return () => clearTimeout(timer)
  }, [ready])

  useEffect(() => {
    setReady(false)
    setShowSkeleton(false)
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
      const res = await apiFetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id: folderId || null }),
      })
      if (res.ok) {
        fetchContents()
      }
    } catch {
      // silently fail
    }
  }

  const handleFolderClick = useCallback((folder) => {
    navigate(`/drive/folder/${folder.id}`)
  }, [navigate])

  const handleFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) uploadFiles(files)
    e.target.value = ''
  }, [uploadFiles])

  const handleFileAction = useCallback((actionId, file) => {
    switch (actionId) {
      case 'preview':
        setPreviewFile(file)
        break
      case 'trash':
        setTrashTarget(file)
        break
      case 'download':
        window.open(`/api/files/${file.id}/download?token=${getAccessToken()}`, '_blank')
        break
    }
  }, [])

  const confirmTrash = useCallback(async () => {
    if (!trashTarget) return
    try {
      const res = await apiFetch(`/api/files/${trashTarget.id}`, { method: 'DELETE' })
      if (res.ok) fetchContents()
    } catch { /* silently fail */ }
    setTrashTarget(null)
  }, [trashTarget, fetchContents])

  if (!ready && showSkeleton) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-24 h-4 bg-slate-200 dark:bg-border-dark rounded" />
            <div className="w-4 h-4 bg-slate-200 dark:bg-border-dark rounded" />
            <div className="w-16 h-4 bg-slate-200 dark:bg-border-dark rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-8 bg-slate-200 dark:bg-border-dark rounded-lg" />
            <div className="w-20 h-8 bg-slate-200 dark:bg-border-dark rounded-lg" />
          </div>
        </div>
        <div className="mb-8">
          <div className="w-16 h-3 bg-slate-200 dark:bg-border-dark rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg">
                <div className="w-7 h-7 bg-slate-200 dark:bg-border-dark rounded mr-3 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-28 h-3.5 bg-slate-200 dark:bg-border-dark rounded" />
                  <div className="w-14 h-2.5 bg-slate-100 dark:bg-border-dark/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="w-12 h-3 bg-slate-200 dark:bg-border-dark rounded mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2">
                <div className="aspect-[4/3] bg-slate-100 dark:bg-border-dark/50 rounded-md mb-2" />
                <div className="space-y-1.5">
                  <div className="w-3/4 h-3 bg-slate-200 dark:bg-border-dark rounded" />
                  <div className="w-1/2 h-2.5 bg-slate-100 dark:bg-border-dark/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!ready) return null

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
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#101922]/80 backdrop-blur-sm" />

          {/* Drop zone card */}
          <div className="relative z-10">
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
      )}

      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-6">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-0.5">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              if (crumb.id === null) {
                return (
                  <li key="root" className="inline-flex items-center">
                    {isLast ? (
                      <span className="inline-flex items-center text-sm font-bold text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-xl mr-1.5">cloud</span>
                        My Drive
                      </span>
                    ) : (
                      <Link to="/drive" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl mr-1.5">cloud</span>
                        My Drive
                      </Link>
                    )}
                  </li>
                )
              }
              return (
                <li key={crumb.id} className="inline-flex items-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl mx-0.5">chevron_right</span>
                  {isLast ? (
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{crumb.name}</span>
                  ) : (
                    <Link to={`/drive/folder/${crumb.id}`} className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors">{crumb.name}</Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          {/* New folder button */}
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            New folder
          </button>

          {/* Upload button (discreet icon) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload files"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-border-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            <button
              onClick={() => { setView('grid'); localStorage.setItem('cloudspace-view-mode', 'grid') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'grid' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => { setView('list'); localStorage.setItem('cloudspace-view-mode', 'list') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
              List
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
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
            <div key={folder.id} onClick={() => handleFolderClick(folder)} className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors shadow-sm group">
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
              <FileContextMenu className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
            </div>
          ))}

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
              <div key={file.id} onClick={() => setPreviewFile(file)} className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <div className={`aspect-[4/3] ${file.icon_bg} rounded-md mb-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-border-dark`}>
                  {file.has_content && file.mime_type?.startsWith('image/') ? (
                    <img src={`/api/files/${file.id}/download?inline=true&token=${getAccessToken()}`} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className={`material-symbols-outlined text-3xl ${file.icon_color} opacity-80 group-hover:scale-110 transition-transform duration-300`}>{file.icon}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{file.formatted_size} &bull; {file.formatted_date}</p>
                  </div>
                  <FileContextMenu onAction={(actionId) => handleFileAction(actionId, file)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
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
                  <tr key={folder.id} onClick={() => handleFolderClick(folder)} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
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
                  <tr key={file.id} onClick={() => setPreviewFile(file)} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
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
                      <FileContextMenu onAction={(actionId) => handleFileAction(actionId, file)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100" />
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

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {/* Confirm Trash Modal */}
      <ConfirmTrashModal
        file={trashTarget}
        onClose={() => setTrashTarget(null)}
        onConfirm={confirmTrash}
      />
    </div>
  )
}
