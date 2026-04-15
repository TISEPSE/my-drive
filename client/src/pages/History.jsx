const historyData = [
  {
    date: "Aujourd'hui",
    events: [
      { time: '11:42', action: 'Vous avez modifié', target: 'Project_Brief_v3.docx', icon: 'edit_document', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10' },
      { time: '10:15', action: 'Vous avez importé', target: 'Hero_Banner_v4.jpg', icon: 'upload_file', iconColor: 'text-green-500', iconBg: 'bg-green-500/10' },
      { time: '09:30', action: 'Sarah M. a partagé', target: 'Q4_Kickoff_Deck.pptx', icon: 'share', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
      { time: '08:45', action: 'Vous avez renommé', target: 'Logo_V2.fig (était Logo_Draft.fig)', icon: 'drive_file_rename_outline', iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
    ],
  },
  {
    date: 'Hier',
    events: [
      { time: '17:20', action: 'Vous avez mis à la corbeille', target: 'Old_Project_Archive_v1.zip', icon: 'delete', iconColor: 'text-red-500', iconBg: 'bg-red-500/10' },
      { time: '15:10', action: 'Mike R. a commenté', target: 'Budget_2024.xlsx', icon: 'comment', iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10' },
      { time: '13:45', action: 'Vous avez téléchargé', target: 'Contract_Signed.pdf', icon: 'download', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
      { time: '11:00', action: 'Vous avez créé le dossier', target: 'Clients', icon: 'create_new_folder', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' },
    ],
  },
  {
    date: '25 octobre 2024',
    events: [
      { time: '16:30', action: 'Jessica P. a retiré le partage de', target: 'Internal_Memo.pdf', icon: 'person_remove', iconColor: 'text-red-400', iconBg: 'bg-red-400/10' },
      { time: '14:15', action: 'Vous avez restauré depuis la corbeille', target: 'Demo_Recording.mp4', icon: 'restore_from_trash', iconColor: 'text-green-500', iconBg: 'bg-green-500/10' },
      { time: '10:00', action: 'Vous avez verrouillé', target: 'Confidential/NDA_2024.pdf', icon: 'lock', iconColor: 'text-slate-500', iconBg: 'bg-slate-500/10' },
    ],
  },
  {
    date: '22 octobre 2024',
    events: [
      { time: '18:00', action: 'Vous avez copié', target: 'Q3_Report.pdf', icon: 'content_copy', iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10' },
      { time: '11:30', action: 'David K. a partagé', target: 'Marketing Assets (dossier)', icon: 'folder_shared', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10' },
    ],
  },
]

export default function History() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">history</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Historique</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Journal de toutes les actions de votre espace</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-border-dark transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
          Filtrer
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
                    <span className={`material-symbols-outlined text-[16px] ${event.iconColor}`}>{event.icon}</span>
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
          Charger plus d'historique...
        </button>
      </div>
    </div>
  )
}
