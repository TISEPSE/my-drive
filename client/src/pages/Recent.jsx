import FileContextMenu from '../components/FileContextMenu'

const todayFiles = [
  { name: 'Project_Brief_v3.docx', icon: 'description', iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40', owner: 'You', activity: 'Edited 10:42 AM' },
  { name: 'Q4_Kickoff_Deck.pptx', icon: 'slideshow', iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', owner: 'Sarah M.', activity: 'Viewed 9:15 AM' },
  { name: 'Marketing_Budget.xlsx', icon: 'table_chart', iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40', owner: 'Mike R.', activity: 'Uploaded 8:30 AM' },
]

const yesterdayFiles = [
  { name: 'Logo_Redesign_Final.fig', icon: 'image', iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40', owner: 'Design Team', activity: 'Edited 4:20 PM' },
  { name: 'Contract_Signed.pdf', icon: 'picture_as_pdf', iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/40', owner: 'Legal', activity: 'Modified 2:10 PM' },
]

const lastWeekFiles = [
  { name: 'Campaign_Assets_2024', icon: 'folder', iconColor: 'text-yellow-600 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40', owner: 'Marketing', activity: 'Edited Oct 24' },
  { name: 'Source_Code_Backup.zip', icon: 'folder_zip', iconColor: 'text-gray-600 dark:text-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-800', owner: 'You', activity: 'Uploaded Oct 22' },
  { name: 'Team_Offsite_Photo.jpg', icon: 'image', iconColor: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40', owner: 'Sarah M.', activity: 'Viewed Oct 20' },
]

function FileRow({ file }) {
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
      <td className="px-6 py-4 w-[45%]">
        <div className="flex items-center gap-4">
          <div className={`relative w-10 h-10 flex-shrink-0 flex items-center justify-center ${file.iconBg} rounded-lg`}>
            <span className={`material-symbols-outlined text-2xl ${file.iconColor}`}>{file.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden">{file.activity}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 w-[20%] hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-white">
              {file.owner.split(' ').map(w => w[0]).join('')}
            </span>
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-300">{file.owner}</span>
        </div>
      </td>
      <td className="px-6 py-4 w-[25%] hidden md:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{file.activity}</span>
      </td>
      <td className="px-6 py-4 w-[10%] text-right">
        <FileContextMenu className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </FileContextMenu>
      </td>
    </tr>
  )
}

function TimeSection({ icon, iconColor, title, files }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 ml-2">
        <span className={`material-symbols-outlined text-sm ${iconColor}`}>{icon}</span>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
            {files.map((file) => (
              <FileRow key={file.name} file={file} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Recent() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-lg">tune</span>
            Properties
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-6 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div className="w-[45%]">Name</div>
        <div className="w-[20%] hidden sm:block">Owner</div>
        <div className="w-[25%] hidden md:block">Activity</div>
        <div className="w-[10%]"></div>
      </div>

      {/* Time sections */}
      <TimeSection icon="calendar_today" iconColor="text-primary" title="Today" files={todayFiles} />
      <TimeSection icon="history" iconColor="text-slate-400" title="Yesterday" files={yesterdayFiles} />
      <TimeSection icon="date_range" iconColor="text-slate-400" title="Last Week" files={lastWeekFiles} />

      {/* Load more */}
      <div className="mt-8 flex justify-center pb-8">
        <button className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors font-medium">
          Load more history...
        </button>
      </div>
    </div>
  )
}
