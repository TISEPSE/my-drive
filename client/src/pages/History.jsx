const historyData = [
  {
    date: 'Today',
    events: [
      { time: '11:42 AM', action: 'You edited', target: 'Project_Brief_v3.docx', icon: 'edit_document', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10' },
      { time: '10:15 AM', action: 'You uploaded', target: 'Hero_Banner_v4.jpg', icon: 'upload_file', iconColor: 'text-green-500', iconBg: 'bg-green-500/10' },
      { time: '09:30 AM', action: 'Sarah M. shared', target: 'Q4_Kickoff_Deck.pptx', icon: 'share', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
      { time: '08:45 AM', action: 'You renamed', target: 'Logo_V2.fig (was Logo_Draft.fig)', icon: 'drive_file_rename_outline', iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
    ],
  },
  {
    date: 'Yesterday',
    events: [
      { time: '05:20 PM', action: 'You moved to trash', target: 'Old_Project_Archive_v1.zip', icon: 'delete', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' },
      { time: '03:10 PM', action: 'Mike R. commented on', target: 'Budget_2024.xlsx', icon: 'comment', iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10' },
      { time: '01:45 PM', action: 'You downloaded', target: 'Contract_Signed.pdf', icon: 'download', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
      { time: '11:00 AM', action: 'You created folder', target: 'Clients', icon: 'create_new_folder', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' },
    ],
  },
  {
    date: 'October 25, 2024',
    events: [
      { time: '04:30 PM', action: 'Jessica P. removed sharing on', target: 'Internal_Memo.pdf', icon: 'person_remove', iconColor: 'text-red-400', iconBg: 'bg-red-400/10' },
      { time: '02:15 PM', action: 'You restored from trash', target: 'Demo_Recording.mp4', icon: 'restore_from_trash', iconColor: 'text-green-500', iconBg: 'bg-green-500/10' },
      { time: '10:00 AM', action: 'You locked', target: 'Confidential/NDA_2024.pdf', icon: 'lock', iconColor: 'text-slate-500', iconBg: 'bg-slate-500/10' },
    ],
  },
  {
    date: 'October 22, 2024',
    events: [
      { time: '06:00 PM', action: 'You made a copy of', target: 'Q3_Report.pdf', icon: 'content_copy', iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10' },
      { time: '11:30 AM', action: 'David K. shared', target: 'Marketing Assets (folder)', icon: 'folder_shared', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' },
    ],
  },
]

export default function History() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">history</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">History</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">A log of all actions across your workspace</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {historyData.map((group) => (
          <div key={group.date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.date}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-border-dark"></div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{group.events.length} actions</span>
            </div>

            {/* Events */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
              {group.events.map((event, idx) => (
                <div
                  key={`${event.time}-${event.target}`}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors ${
                    idx < group.events.length - 1 ? 'border-b border-slate-100 dark:border-border-dark' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg ${event.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-lg ${event.iconColor}`}>{event.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{event.action}</span>
                      {' '}
                      <span className="font-medium text-primary">{event.target}</span>
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="mt-8 flex justify-center pb-8">
        <button className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors font-medium">
          Load more history...
        </button>
      </div>
    </div>
  )
}
