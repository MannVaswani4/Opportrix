'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, BarChart2, MessageSquare,
  TrendingUp, HelpCircle, Zap, PlusCircle, Users
} from 'lucide-react'

// Unified navigation logic dynamically switching by role
export default function MainSidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const isRecruiter = profile?.role === 'recruiter'

  const navItems = isRecruiter ? [
    { label: 'Talent Pool', href: '/recruiter',            icon: Users },
    { label: 'Job Board',   href: '/jobs',                 icon: Briefcase },
    { label: 'Messages',    href: '/chat',                 icon: MessageSquare },
    { label: 'Community',   href: '/feed',                 icon: TrendingUp },
  ] : [
    { label: 'Dashboard',  href: '/dashboard',         icon: LayoutDashboard },
    { label: 'Job Board',  href: '/jobs',              icon: Briefcase },
    { label: 'ATS Score',  href: '/ats',               icon: BarChart2 },
    { label: 'Messages',   href: '/chat',              icon: MessageSquare },
    { label: 'Community',  href: '/feed',              icon: TrendingUp },
  ]

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0 shrink-0 shadow-xl overflow-y-auto z-40">
      {/* Brand */}
      <div className="px-6 py-6" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)' }}>
        <Link href={isRecruiter ? '/recruiter' : '/dashboard'} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center transform group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white tracking-tight leading-none group-hover:text-brand-400 transition-colors">Opportrix</p>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] mt-1">{isRecruiter ? 'HIRING SUITE' : 'FREELANCE'}</p>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          // Special exact match for router paths if needed
          const isActive = pathname === href || (href !== '/recruiter' && href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group',
                isActive 
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700/50' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
              {label}
            </Link>
          )
        })}

        {isRecruiter && (
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <Link href="/jobs"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20">
              <PlusCircle className="w-4 h-4" /> Post a Job
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom Nav / Settings Stub */}
      <div className="p-4 mt-auto">
        <Link href="/profile" 
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group mb-2',
            pathname === '/profile' ? 'bg-slate-800 text-white border border-slate-700/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          )}>
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-600">
            {getInitials(profile?.fullName || 'U')}
          </div>
          My Profile
        </Link>
        <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          Help Center
        </a>
      </div>
    </aside>
  )
}
