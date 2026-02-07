import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const menuActions = [
  { id: 'preview', label: 'Preview', icon: 'visibility', shortcut: 'Space' },
  { id: 'share', label: 'Share', icon: 'share', shortcut: 'Ctrl+S' },
  { id: 'rename', label: 'Rename', icon: 'edit', shortcut: 'F2' },
  { type: 'divider' },
  { id: 'move', label: 'Move to...', icon: 'drive_file_move' },
  { id: 'copy', label: 'Make a copy', icon: 'content_copy', shortcut: 'Ctrl+C' },
  { id: 'lock', label: 'Lock', icon: 'lock' },
  { id: 'download', label: 'Download', icon: 'download', shortcut: 'Ctrl+D' },
  { type: 'divider' },
  { id: 'trash', label: 'Move to Trash', icon: 'delete', danger: true, shortcut: 'Del' },
]

function MenuDropdown({ anchorRect, onClose, onAction }) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!anchorRect || !menuRef.current) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth

    let top = anchorRect.bottom + 4
    let left = anchorRect.right - menuRect.width

    // Flip up if overflowing bottom
    if (top + menuRect.height > viewportH - 12) {
      top = anchorRect.top - menuRect.height - 4
    }

    // Keep within left/right bounds
    if (left < 12) left = 12
    if (left + menuRect.width > viewportW - 12) {
      left = viewportW - menuRect.width - 12
    }

    setPosition({ top, left })

    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true))
  }, [anchorRect])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleClose()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 150)
  }

  function handleAction(actionId) {
    onAction?.(actionId)
    handleClose()
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <div
        className={`
          w-56 py-1.5 rounded-xl
          bg-white dark:bg-[#1e2a36]
          border border-slate-200 dark:border-[#2d3b47]
          shadow-xl shadow-black/15 dark:shadow-black/40
          origin-top-right transition-all duration-150 ease-out
          ${visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1'
          }
        `}
      >
        {menuActions.map((action, index) => {
          if (action.type === 'divider') {
            return (
              <div
                key={`div-${index}`}
                className="my-1.5 mx-3 h-px bg-slate-150 dark:bg-[#2d3b47]"
              />
            )
          }

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2 text-left
                transition-colors duration-75 group/item
                ${action.danger
                  ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              <span
                className={`
                  material-symbols-outlined text-[20px] flex-shrink-0
                  ${action.danger
                    ? 'text-red-400 dark:text-red-400'
                    : 'text-slate-400 dark:text-slate-400 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-200'
                  }
                `}
              >
                {action.icon}
              </span>
              <span className="flex-1 text-[13px] font-medium">{action.label}</span>
              {action.shortcut && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-tight">
                  {action.shortcut}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

export default function FileContextMenu({ children, className, onAction }) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const btnRef = useRef(null)

  const handleToggle = useCallback((e) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
    } else {
      const rect = btnRef.current.getBoundingClientRect()
      setAnchorRect(rect)
      setOpen(true)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={className || 'p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-md transition-colors'}
      >
        {children || (
          <span className="material-symbols-outlined text-[18px]">more_vert</span>
        )}
      </button>

      {open && (
        <MenuDropdown
          anchorRect={anchorRect}
          onClose={() => setOpen(false)}
          onAction={onAction}
        />
      )}
    </>
  )
}
