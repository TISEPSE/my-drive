import FileContextMenu from '../components/FileContextMenu'

const trashedItems = [
  {
    name: "Old_Project_Archive_v1.zip",
    icon: "folder_zip",
    iconBg: "bg-gray-100 dark:bg-gray-900/40",
    iconColor: "text-gray-600 dark:text-gray-400",
    originalLocation: "My Drive/Projects",
    dateDeleted: "Today, 10:23 AM",
  },
  {
    name: "Draft_Contract_Deprecated.pdf",
    icon: "picture_as_pdf",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    originalLocation: "My Drive/Contracts",
    dateDeleted: "Yesterday, 4:15 PM",
  },
  {
    name: "Screenshot_2023-10-24.png",
    icon: "image",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    originalLocation: "My Drive/Screenshots",
    dateDeleted: "Oct 24, 2023",
  },
  {
    name: "Untitled Folder",
    icon: "folder",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    isFolder: true,
    originalLocation: "My Drive",
    dateDeleted: "Oct 22, 2023",
  },
  {
    name: "Q2_Notes_Rough.docx",
    icon: "description",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    originalLocation: "Shared/Marketing",
    dateDeleted: "Oct 18, 2023",
  },
];

export default function Trash() {
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

        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-lg">
            delete_forever
          </span>
          Empty Trash
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-slate-700">
              <th className="w-[40%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th className="hidden sm:table-cell w-[30%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Original Location
              </th>
              <th className="hidden md:table-cell w-[25%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date Deleted
              </th>
              <th className="w-[5%] text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {trashedItems.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Name */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl ${item.iconColor}`}
                        style={
                          item.isFolder
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
                <td className="hidden sm:table-cell px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500">
                      folder
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item.originalLocation}
                    </span>
                  </div>
                </td>

                {/* Date Deleted */}
                <td className="hidden md:table-cell px-5 py-3.5">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {item.dateDeleted}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 text-right">
                  <FileContextMenu className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-xl">
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
