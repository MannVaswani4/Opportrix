'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Bell, Settings, LogOut, Code } from 'lucide-react'
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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-8 h-20 shrink-0">
      <div className="flex-1 max-w-xl relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-medium transition-all outline-none"
          placeholder="Search opportunities, talent, or skills..."
        />
      </div>

      <div className="ml-auto flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-slate-200"></div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {getInitials(profile?.fullName || user?.displayName || 'U')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-none">{profile?.fullName || 'User'}</p>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mt-1">{profile?.role || 'Guest'}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in p-2">
              <div className="px-4 py-3 border-b border-slate-50 mb-2">
                <p className="text-sm font-bold text-slate-900">{profile?.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={() => router.push('/profile')} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-xl flex items-center gap-3 transition-colors">
                <Code className="w-4 h-4" /> My Profile
              </button>
              <button className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-600 rounded-xl flex items-center gap-3 transition-colors">
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <div className="my-2 border-t border-slate-50"></div>
              <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
