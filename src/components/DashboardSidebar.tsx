'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, BarChart2, MessageSquare,
  FileText, TrendingUp, HelpCircle, LogOut, Zap
} from 'lucide-react'

const FREELANCER_NAV = [
  { label: 'Dashboard',  href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Job Board',  href: '/dashboard/jobs',    icon: Briefcase },
  { label: 'ATS Score',  href: '/dashboard/ats',     icon: BarChart2 },
  { label: 'Messages',   href: '/chat',              icon: MessageSquare },
  { label: 'Community',  href: '/feed',              icon: TrendingUp },
]

export default function DashboardSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { profile, user } = useAuth()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-50">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Opportrix</p>
            <p className="text-[9px] text-slate-400 font-medium tracking-wider mt-0.5">MANAGEMENT SUITE</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {FREELANCER_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'nav-item',
              pathname === href || pathname.startsWith(href + '/') ? 'nav-item-active' : ''
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-semibold text-slate-300 px-3 mb-2 tracking-wider">FILTERS</p>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-50 space-y-0.5">
        <Link href="/dashboard/profile" className="nav-item">
          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
            {getInitials(profile?.fullName || user?.displayName || 'U')}
          </div>
          <span className="truncate">{profile?.fullName || 'My Profile'}</span>
        </Link>
        <a href="#" className="nav-item"><HelpCircle className="w-4 h-4" />Help Center</a>
        <button onClick={handleSignOut} className="nav-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />Sign Out
        </button>
      </div>
    </aside>
  )
}
