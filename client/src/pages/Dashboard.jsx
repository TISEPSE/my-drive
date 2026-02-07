import { Link } from 'react-router-dom'

const stats = [
  { label: 'Total Files', value: '1,284', change: '+24 this week', icon: 'description', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', changeColor: 'text-green-500' },
  { label: 'Storage Used', value: '15.2 GB', change: '75% of 20 GB', icon: 'cloud', iconColor: 'text-primary', iconBg: 'bg-primary/10', changeColor: 'text-slate-500' },
  { label: 'Shared Files', value: '342', change: '+8 this week', icon: 'group', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', changeColor: 'text-green-500' },
  { label: 'Trash Items', value: '5', change: 'Auto-delete in 28d', icon: 'delete', iconColor: 'text-red-400', iconBg: 'bg-red-400/10', changeColor: 'text-slate-500' },
]

const storageByType = [
  { type: 'Images', size: '5.4 GB', percent: 36, color: 'bg-indigo-500', icon: 'image' },
  { type: 'Videos', size: '4.1 GB', percent: 27, color: 'bg-purple-500', icon: 'movie' },
  { type: 'Documents', size: '3.2 GB', percent: 21, color: 'bg-blue-500', icon: 'description' },
  { type: 'Spreadsheets', size: '1.5 GB', percent: 10, color: 'bg-green-500', icon: 'table_chart' },
  { type: 'Other', size: '1.0 GB', percent: 6, color: 'bg-slate-400', icon: 'folder_zip' },
]

const activityFeed = [
  { user: 'Sarah M.', initials: 'SM', color: 'bg-pink-500', action: 'uploaded', target: 'Hero_Banner_v4.jpg', time: '10 min ago' },
  { user: 'Mike R.', initials: 'MR', color: 'bg-teal-500', action: 'commented on', target: 'Budget_2024.xlsx', time: '25 min ago' },
  { user: 'You', initials: 'AD', color: 'bg-slate-600', action: 'edited', target: 'Project_Brief_v3.docx', time: '1h ago' },
  { user: 'Jessica P.', initials: 'JP', color: 'bg-violet-500', action: 'shared', target: 'Q4_Financial_Report.pdf', time: '2h ago' },
  { user: 'David K.', initials: 'DK', color: 'bg-amber-500', action: 'moved', target: 'Campaign_Assets_2024', time: '3h ago' },
  { user: 'Emily C.', initials: 'EC', color: 'bg-cyan-500', action: 'downloaded', target: 'Meeting_Notes_Oct.docx', time: '5h ago' },
]

const quickAccessFiles = [
  { name: 'Project_Brief_v3.docx', icon: 'description', iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10', subtitle: 'Edited 10m ago', badge: null },
  { name: 'Q3_Report.pdf', icon: 'picture_as_pdf', iconColor: 'text-red-400', iconBg: 'bg-red-500/10', subtitle: 'Opened yesterday', badge: 'You' },
  { name: 'Budget_2024.xlsx', icon: 'table_chart', iconColor: 'text-green-400', iconBg: 'bg-green-500/10', subtitle: 'Edited Oct 20', badge: null },
  { name: 'Logo_V2.fig', icon: 'image', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10', subtitle: 'Edited 2m ago', badge: null },
]

const teamMembers = [
  { name: 'Sarah Miller', initials: 'SM', color: 'bg-pink-500', role: 'Designer', files: 156, online: true },
  { name: 'Mike Ross', initials: 'MR', color: 'bg-teal-500', role: 'Finance', files: 42, online: true },
  { name: 'Jessica Pearson', initials: 'JP', color: 'bg-violet-500', role: 'Manager', files: 89, online: false },
  { name: 'David Kim', initials: 'DK', color: 'bg-amber-500', role: 'Marketing', files: 234, online: true },
]

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, Alex</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's what's happening in your workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Last 7 days
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-xl ${stat.iconColor}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`text-[11px] font-medium ${stat.changeColor}`}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Storage + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Storage Breakdown */}
        <div className="lg:col-span-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Storage Breakdown</h3>
            <Link to="/settings" className="text-xs text-primary hover:text-blue-600 font-medium transition-colors">Manage</Link>
          </div>

          {/* Usage bar */}
          <div className="flex rounded-full h-3 overflow-hidden mb-5">
            {storageByType.map((item) => (
              <div
                key={item.type}
                className={`${item.color} transition-all`}
                style={{ width: `${item.percent}%` }}
                title={`${item.type}: ${item.size}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {storageByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">{item.size}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right tabular-nums">{item.percent}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total used</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">15.2 GB / 20 GB</span>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <Link to="/recent" className="text-xs text-primary hover:text-blue-600 font-medium transition-colors">View all</Link>
          </div>

          <div className="space-y-0">
            {activityFeed.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 py-3 ${
                  index < activityFeed.length - 1 ? 'border-b border-slate-100 dark:border-border-dark' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[10px] font-bold text-white">{item.initials}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    <span className="font-medium text-slate-900 dark:text-white">{item.user}</span>
                    {' '}{item.action}{' '}
                    <span className="font-medium text-primary">{item.target}</span>
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Access + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Access */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Access</h3>
            <Link to="/drive" className="text-xs text-primary hover:text-blue-600 font-medium transition-colors">My Drive</Link>
          </div>

          <div className="space-y-0">
            {quickAccessFiles.map((file, index) => (
              <div
                key={file.name}
                className={`flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1f2d3d] -mx-2 px-2 rounded-lg transition-colors ${
                  index < quickAccessFiles.length - 1 ? 'border-b border-slate-100 dark:border-border-dark' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg ${file.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined text-lg ${file.iconColor}`}>{file.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{file.subtitle}</p>
                </div>
                {file.badge && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{file.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Team Members</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">{teamMembers.filter(m => m.online).length} online</span>
          </div>

          <div className="space-y-0">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className={`flex items-center gap-3 py-2.5 ${
                  index < teamMembers.length - 1 ? 'border-b border-slate-100 dark:border-border-dark' : ''
                }`}
              >
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full ${member.color} flex items-center justify-center`}>
                    <span className="text-[11px] font-bold text-white">{member.initials}</span>
                  </div>
                  {member.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-surface-dark"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                </div>

                {/* Files count */}
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">{member.files}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">files</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
