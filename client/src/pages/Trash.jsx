import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/api'

export default function Trash() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [emptyingAll, setEmptyingAll] = useState(false)

  const fetchTrash = useCallback(() => {
    setLoading(true)
    apiFetch('/api/trash')
      .then(r => r.json())
      .then(data => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  const handleRestore = (id) => {
    apiFetch(`/api/trash/${id}/restore`, { method: 'POST' })
      .then(r => {
        if (r.ok) setItems(prev => prev.filter(i => i.id !== id))
      })
      .catch(() => {})
  }

  const handleDeletePermanently = (id) => {
    apiFetch(`/api/trash/${id}`, { method: 'DELETE' })
      .then(r => {
        if (r.ok) setItems(prev => prev.filter(i => i.id !== id))
      })
      .catch(() => {})
  }

  const handleEmptyTrash = () => {
    if (items.length === 0) return
    setEmptyingAll(true)
    apiFetch('/api/trash', { method: 'DELETE' })
      .then(r => {
        if (r.ok) setItems([])
      })
      .catch(() => {})
      .finally(() => setEmptyingAll(false))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Trash
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Items in trash are deleted forever after 30 days.
          </p>
        </div>

        <button
          onClick={handleEmptyTrash}
          disabled={items.length === 0 || emptyingAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            delete_forever
          </span>
          {emptyingAll ? 'Emptying...' : 'Empty Trash'}
        </button>
      </div>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-surface-dark flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl text-slate-400">delete_sweep</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Trash is empty</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Items you delete will appear here for 30 days before being permanently removed.
          </p>
        </div>
      )}

      {/* Table card */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
                <th className="w-[40%] text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="hidden sm:table-cell w-[25%] text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Original Location
                </th>
                <th className="hidden md:table-cell w-[15%] text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date Deleted
                </th>
                <th className="hidden lg:table-cell w-[10%] text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="w-[10%] text-right px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors"
                >
                  {/* Name */}
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${item.icon_bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${item.icon_color}`}
                          style={
                            item.is_folder
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          {item.icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Original Location */}
                  <td className="hidden sm:table-cell px-5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500">
                        folder
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {item.original_location}
                      </span>
                    </div>
                  </td>

                  {/* Date Deleted */}
                  <td className="hidden md:table-cell px-5 py-2.5">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item.trashed_relative}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="hidden lg:table-cell px-5 py-2.5">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item.formatted_size}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                        title="Restore"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">restore_from_trash</span>
                      </button>
                      <button
                        onClick={() => handleDeletePermanently(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete permanently"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">delete_forever</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Item count */}
      {items.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 px-1">
          {items.length} item{items.length > 1 ? 's' : ''} in trash
        </p>
      )}
    </div>
  );
}
