import { useState } from 'react'
import FileContextMenu from '../components/FileContextMenu'

const starredFolders = [
  { name: "Design System V2", items: 48, size: "320 MB", icon: "folder", iconColor: "text-yellow-500" },
  { name: "Marketing 2024", items: 126, size: "2.4 GB", icon: "folder", iconColor: "text-yellow-500" },
  { name: "Financial Reports", items: 12, size: "Secure", icon: "folder_shared", iconColor: "text-indigo-500", locked: true },
  { name: "Project Resources", items: 8, size: "156 MB", icon: "folder", iconColor: "text-yellow-500" },
]

const starredFiles = [
  { name: "Q3_Financial_Summary.pdf", icon: "picture_as_pdf", iconColor: "text-red-500", iconBg: "bg-red-50 dark:bg-red-500/10", date: "Updated 2h ago", size: "1.2 MB" },
  { name: "Hero_Banner_v4.jpg", icon: "image", iconColor: "text-indigo-500", iconBg: "bg-gradient-to-br from-indigo-500/20 to-purple-500/20", date: "Updated yesterday", size: "4.8 MB" },
  { name: "Project_Proposal_Draft.docx", icon: "description", iconColor: "text-blue-500", iconBg: "bg-blue-50 dark:bg-blue-500/10", date: "Updated Oct 24", size: "840 KB" },
  { name: "Annual_Budget_2024.xlsx", icon: "table_chart", iconColor: "text-green-500", iconBg: "bg-green-50 dark:bg-green-500/10", date: "Updated Oct 20", size: "2.1 MB" },
  { name: "Office_Layout.png", icon: "image", iconColor: "text-indigo-500", iconBg: "bg-gradient-to-br from-indigo-500/20 to-purple-500/20", date: "Updated Oct 15", size: "3.4 MB" },
  { name: "Product_Demo_Final.mp4", icon: "video_file", iconColor: "text-purple-500", iconBg: "bg-purple-50 dark:bg-purple-500/10", date: "Updated Sep 28", size: "128 MB" },
]

function FolderRow({ folder }) {
  return (
    <div className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors shadow-sm group">
      <div className="relative mr-3 flex-shrink-0">
        <span className={`material-symbols-outlined text-2xl ${folder.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
        {folder.locked && (
          <span className="absolute -bottom-0.5 -right-1 material-symbols-outlined text-[10px] text-slate-400 dark:text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{folder.items} items &middot; {folder.size}</p>
      </div>
      <FileContextMenu className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
    </div>
  )
}

function FileCard({ file }) {
  return (
    <div className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
      <div className={`aspect-[4/3] ${file.iconBg} rounded-md mb-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-border-dark`}>
        <span className={`material-symbols-outlined text-3xl ${file.iconColor} opacity-80 group-hover:scale-110 transition-transform duration-300`}>{file.icon}</span>
      </div>
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{file.size} &bull; {file.date}</p>
        </div>
        <FileContextMenu className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">more_vert</span>
        </FileContextMenu>
      </div>
    </div>
  )
}

export default function Starred() {
  const [view, setView] = useState('grid')

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Starred</h2>
        </div>

        <div className="flex items-center gap-2">
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <>
          {/* Folders */}
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {starredFolders.map((folder) => (
                <FolderRow key={folder.name} folder={folder} />
              ))}
            </div>
          </section>

          {/* Files */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Files</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {starredFiles.map((file) => (
                <FileCard key={file.name} file={file} />
              ))}
            </div>
          </section>
        </>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[45%]">Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[25%] hidden md:table-cell">Last Modified</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%] hidden sm:table-cell">Size</th>
                <th className="px-5 py-3 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {starredFolders.map((folder) => (
                <tr key={folder.name} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <span className={`material-symbols-outlined text-2xl ${folder.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                        {folder.locked && (
                          <span className="absolute -bottom-0.5 -right-1 material-symbols-outlined text-[10px] text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
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
                    <span className="text-sm text-slate-500 dark:text-slate-400">{folder.size}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <FileContextMenu className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100" />
                  </td>
                </tr>
              ))}
              {starredFiles.map((file) => (
                <tr key={file.name} className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${file.iconBg} flex items-center justify-center flex-shrink-0`}>
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
    </div>
  )
}
