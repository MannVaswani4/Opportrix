'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, Users, MessageSquare,
  FileText, TrendingUp, HelpCircle, LogOut, Zap, PlusCircle
} from 'lucide-react'

const RECRUITER_NAV = [
  { label: 'Dashboard',   href: '/recruiter',            icon: LayoutDashboard },
  { label: 'Job Board',   href: '/recruiter/jobs',       icon: Briefcase },
  { label: 'Talent Pool', href: '/recruiter',            icon: Users },
  { label: 'Messages',    href: '/chat',                 icon: MessageSquare },
  { label: 'Community',   href: '/feed',                 icon: TrendingUp },
]

export default function RecruiterSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { profile, user } = useAuth()

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 shrink-0">
      <div className="px-5 py-5 border-b border-slate-50">
        <Link href="/recruiter" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">Opportrix</p>
            <p className="text-[9px] text-slate-400 font-medium tracking-wider mt-0.5">MANAGEMENT SUITE</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {RECRUITER_NAV.map(({ label, href, icon: Icon }) => (
          <Link key={`${label}-${href}`} href={href}
            className={cn('nav-item', pathname === href ? 'nav-item-active' : '')}>
            <Icon className="w-4 h-4" />{label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 space-y-2">
        <Link href="/recruiter/jobs/new"
          className="btn-primary w-full justify-center text-sm py-2.5">
          <PlusCircle className="w-4 h-4" /> Post a Job
        </Link>
        <div className="pt-2 border-t border-slate-50 space-y-0.5">
          <a href="#" className="nav-item"><HelpCircle className="w-4 h-4" />Help Center</a>
          <button onClick={handleSignOut} className="nav-item w-full text-left text-red-500 hover:bg-red-50">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
