import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Files', value: '-', change: '', icon: 'description', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', changeColor: 'text-green-500' },
    { label: 'Storage Used', value: '-', change: '', icon: 'cloud', iconColor: 'text-primary', iconBg: 'bg-primary/10', changeColor: 'text-slate-500' },
    { label: 'Shared Files', value: '-', change: '', icon: 'group', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', changeColor: 'text-green-500' },
    { label: 'Trash Items', value: '-', change: '', icon: 'delete', iconColor: 'text-red-400', iconBg: 'bg-red-400/10', changeColor: 'text-slate-500' },
  ])
  const [storageByType, setStorageByType] = useState([])
  const [storageTotal, setStorageTotal] = useState({ used: '0 GB', limit: '20 GB' })
  const [activityFeed, setActivityFeed] = useState([])
  const [quickAccessFiles, setQuickAccessFiles] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Fetch all dashboard data in parallel
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/user/storage').then(r => r.json()),
      fetch('/api/dashboard/activity?limit=6').then(r => r.json()),
      fetch('/api/dashboard/quick-access?limit=4').then(r => r.json()),
      fetch('/api/dashboard/team').then(r => r.json()),
    ]).then(([statsData, storageData, activityData, quickData, teamData]) => {
      setStats([
        { label: 'Total Files', value: statsData.total_files.toLocaleString(), change: statsData.total_files_change, icon: 'description', iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', changeColor: 'text-green-500' },
        { label: 'Storage Used', value: statsData.storage_used, change: `${statsData.storage_percentage}% of ${storageData.formatted_limit}`, icon: 'cloud', iconColor: 'text-primary', iconBg: 'bg-primary/10', changeColor: 'text-slate-500' },
        { label: 'Shared Files', value: statsData.shared_files.toString(), change: statsData.shared_files_change, icon: 'group', iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', changeColor: 'text-green-500' },
        { label: 'Trash Items', value: statsData.trash_items.toString(), change: `Auto-delete in ${statsData.trash_auto_delete}`, icon: 'delete', iconColor: 'text-red-400', iconBg: 'bg-red-400/10', changeColor: 'text-slate-500' },
      ])

      const colorMap = {
        'Images': 'bg-indigo-500',
        'Videos': 'bg-purple-500',
        'Documents': 'bg-blue-500',
        'Spreadsheets': 'bg-green-500',
        'Other': 'bg-slate-400',
      }
      setStorageByType(storageData.breakdown.map(item => ({
        type: item.type,
        size: item.formatted,
        percent: item.percent,
        color: colorMap[item.type] || 'bg-slate-400',
        icon: item.icon,
      })))
      setStorageTotal({ used: storageData.formatted_used, limit: storageData.formatted_limit })

      setActivityFeed(activityData.activities.map(a => ({
        user: a.user.name,
        initials: a.user.initials,
        color: a.user.color,
        action: a.action,
        target: a.target,
        time: a.time,
      })))

      setQuickAccessFiles(quickData.files.map(f => ({
        name: f.name,
        icon: f.icon,
        iconColor: f.icon_color,
        iconBg: f.icon_bg,
        subtitle: f.subtitle,
        badge: f.is_owner ? null : 'Shared',
      })))

      setTeamMembers(teamData.members.map(m => ({
        name: m.name,
        initials: m.initials,
        color: m.color,
        role: m.role,
        files: m.files_count,
        online: m.is_online,
      })))
      setOnlineCount(teamData.online_count)
    }).catch(err => console.error('Dashboard fetch error:', err))
  }, [])

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
            <span className="text-sm font-bold text-slate-900 dark:text-white">{storageTotal.used} / {storageTotal.limit}</span>
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
            <span className="text-xs text-slate-400 dark:text-slate-500">{onlineCount} online</span>
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
