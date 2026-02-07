import FileContextMenu from '../components/FileContextMenu'

const starredFolders = [
  {
    name: "Design System V2",
    items: 48,
    size: "320 MB",
    icon: "folder",
    iconColor: "text-yellow-500",
  },
  {
    name: "Marketing 2024",
    items: 126,
    size: "2.4 GB",
    icon: "folder",
    iconColor: "text-yellow-500",
  },
  {
    name: "Financial Reports",
    items: 12,
    size: "Secure",
    icon: "folder_shared",
    iconColor: "text-indigo-500",
    locked: true,
  },
  {
    name: "Project Resources",
    items: 8,
    size: "156 MB",
    icon: "folder",
    iconColor: "text-yellow-500",
  },
];

const starredFiles = [
  {
    name: "Q3_Financial_Summary.pdf",
    icon: "picture_as_pdf",
    iconColor: "text-red-500",
    iconBg: "bg-slate-50 dark:bg-[#151e26]",
    date: "Updated 2h ago",
    typeBadge: "PDF",
    badgeColor: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    isImage: false,
  },
  {
    name: "Hero_Banner_v4.jpg",
    icon: "image",
    iconColor: "text-indigo-500",
    iconBg: "bg-gradient-to-br from-indigo-500/30 to-purple-500/30",
    date: "Updated yesterday",
    typeBadge: "IMG",
    badgeColor:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    isImage: true,
  },
  {
    name: "Project_Proposal_Draft.docx",
    icon: "description",
    iconColor: "text-blue-500",
    iconBg: "bg-slate-50 dark:bg-[#151e26]",
    date: "Updated Oct 24",
    typeBadge: "DOC",
    badgeColor:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    isImage: false,
  },
  {
    name: "Annual_Budget_2024.xlsx",
    icon: "table_chart",
    iconColor: "text-green-500",
    iconBg: "bg-slate-50 dark:bg-[#151e26]",
    date: "Updated Oct 20",
    typeBadge: "XLS",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    isImage: false,
  },
  {
    name: "Office_Layout.png",
    icon: "image",
    iconColor: "text-indigo-500",
    iconBg: "bg-gradient-to-br from-indigo-500/30 to-purple-500/30",
    date: "Updated Oct 15",
    typeBadge: "IMG",
    badgeColor:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    isImage: true,
  },
  {
    name: "Product_Demo_Final.mp4",
    icon: "video_file",
    iconColor: "text-purple-500",
    iconBg: "bg-slate-50 dark:bg-[#151e26]",
    date: "Updated Sep 28",
    typeBadge: "MP4",
    badgeColor:
      "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    isImage: false,
  },
];

export default function Starred() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <style>{`.material-symbols-filled { font-variation-settings: 'FILL' 1; }`}</style>

      {/* Title row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
            <span className="material-symbols-outlined material-symbols-filled text-xl text-amber-500">
              star
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Starred
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort by button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              swap_vert
            </span>
            Sort by
          </button>

          {/* Grid toggle button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              grid_view
            </span>
          </button>
        </div>
      </div>

      {/* Folders section */}
      <section className="mb-10">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Folders
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {starredFolders.map((folder) => (
            <div
              key={folder.name}
              className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark hover:border-primary/50 hover:shadow-lg cursor-pointer transition-all"
            >
              {/* Star badge */}
              <div className="absolute top-4 right-4">
                <span className="material-symbols-outlined material-symbols-filled text-[18px] text-amber-500">
                  star
                </span>
              </div>

              {/* Folder icon */}
              <div className="relative mb-3">
                <span
                  className={`material-symbols-outlined text-[36px] ${folder.iconColor}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {folder.icon}
                </span>
                {folder.locked && (
                  <span className="material-symbols-outlined absolute -bottom-1 left-7 text-[12px] text-indigo-500 bg-white dark:bg-surface-dark rounded-full p-0.5">
                    lock
                  </span>
                )}
              </div>

              {/* Folder info */}
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {folder.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {folder.items} items &middot; {folder.size}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Files section */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Files
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {starredFiles.map((file) => (
            <div
              key={file.name}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark hover:border-primary/50 hover:shadow-lg cursor-pointer transition-all overflow-hidden"
            >
              {/* Preview area */}
              <div
                className={`h-32 flex items-center justify-center relative ${
                  file.isImage
                    ? file.iconBg
                    : file.iconBg
                }`}
              >
                {!file.isImage && (
                  <span
                    className={`material-symbols-outlined text-[48px] ${file.iconColor}`}
                  >
                    {file.icon}
                  </span>
                )}

                {/* Star badge */}
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined material-symbols-filled text-[16px] text-amber-500">
                    star
                  </span>
                </div>
              </div>

              {/* File info */}
              <div className="p-3">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${file.badgeColor} mb-1.5`}
                >
                  {file.typeBadge}
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {file.date}
                </p>
              </div>

              {/* More button on hover */}
              <FileContextMenu className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500">
                  more_vert
                </span>
              </FileContextMenu>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
