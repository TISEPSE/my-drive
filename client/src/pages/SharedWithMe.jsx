import FileContextMenu from '../components/FileContextMenu'

const sharedFiles = [
  {
    name: "Website_Mockups_V3.fig",
    type: "Figma Design File",
    icon: "image",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    sharedBy: "Sarah Miller",
    avatar: "https://i.pravatar.cc/32?img=1",
    date: "Today, 10:23 AM",
    size: "45 MB",
  },
  {
    name: "Q4_Financial_Report.pdf",
    type: "PDF Document",
    icon: "picture_as_pdf",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    sharedBy: "Mike Ross",
    avatar: "https://i.pravatar.cc/32?img=12",
    date: "Yesterday",
    size: "2.4 MB",
  },
  {
    name: "Project_Timeline_2024.xlsx",
    type: "Spreadsheet",
    icon: "table_chart",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    iconColor: "text-green-600 dark:text-green-400",
    sharedBy: "Jessica Pearson",
    avatar: "https://i.pravatar.cc/32?img=5",
    date: "Oct 24, 2023",
    size: "856 KB",
  },
  {
    name: "Marketing Assets",
    type: "Folder, 24 items",
    icon: "folder",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    isFolder: true,
    sharedBy: "David Kim",
    avatar: "https://i.pravatar.cc/32?img=8",
    date: "Oct 20, 2023",
    size: "--",
  },
  {
    name: "Meeting_Notes_Oct.docx",
    type: "Word Document",
    icon: "description",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    sharedBy: "Emily Chen",
    avatar: "https://i.pravatar.cc/32?img=9",
    date: "Oct 18, 2023",
    size: "124 KB",
  },
  {
    name: "Product_Demo_Final.mp4",
    type: "Video File",
    icon: "play_circle",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    iconColor: "text-pink-600 dark:text-pink-400",
    sharedBy: "Sarah Miller",
    avatar: "https://i.pravatar.cc/32?img=1",
    date: "Oct 15, 2023",
    size: "128 MB",
  },
];

export default function SharedWithMe() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Shared with me
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Files and folders others have shared with you
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List / Grid toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 dark:bg-primary/10">
              <span className="material-symbols-outlined text-[18px]">
                view_list
              </span>
              List
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                grid_view
              </span>
              Grid
            </button>
          </div>

          {/* Filter button */}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              filter_list
            </span>
            Filter
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="w-[40%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                File Name
              </th>
              <th className="hidden sm:table-cell w-[25%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Shared by
              </th>
              <th className="hidden md:table-cell w-[20%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date Shared
              </th>
              <th className="hidden lg:table-cell w-[10%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Size
              </th>
              <th className="w-[5%] text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {sharedFiles.map((file) => (
              <tr
                key={file.name}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* File Name */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* Icon with shared badge */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${file.iconBg} flex items-center justify-center`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${file.iconColor} ${file.isFolder ? "fill-current" : ""}`}
                          style={file.isFolder ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {file.icon}
                        </span>
                      </div>
                      {/* Shared badge */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-blue-500 text-[11px]">
                          group
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {file.type}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Shared by */}
                <td className="hidden sm:table-cell px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${file.avatar})` }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {file.sharedBy}
                    </span>
                  </div>
                </td>

                {/* Date Shared */}
                <td className="hidden md:table-cell px-5 py-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {file.date}
                  </span>
                </td>

                {/* Size */}
                <td className="hidden lg:table-cell px-5 py-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {file.size}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-3 text-right">
                  <FileContextMenu className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">
                      more_vert
                    </span>
                  </FileContextMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
