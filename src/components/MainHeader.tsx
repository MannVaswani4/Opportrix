'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Settings, LogOut, User } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function MainHeader() {
  const { profile, user } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)

  async function handleSignOut() {
    await signOut(auth)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-8 h-16 shrink-0">
      {/* Right side — no search bar (search is page-specific, lives on Dashboard) */}
      <div className="ml-auto flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-7 bg-slate-200"></div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {getInitials(profile?.fullName || user?.displayName || 'U')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-none">{profile?.fullName || 'User'}</p>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mt-0.5">{profile?.role || 'Guest'}</p>
            </div>
          </button>

          {showDropdown && (
            <>
              {/* Click outside to close */}
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden z-20 p-2">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{profile?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { router.push('/profile'); setShowDropdown(false) }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
                <button
                  onClick={() => { router.push('/profile'); setShowDropdown(false) }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </button>
                <div className="my-1.5 border-t border-slate-100"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
